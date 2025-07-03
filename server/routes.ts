import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { storage } from "./storage";
import { SmsGateway, getDefaultGatewayConfig } from "./services/sms-gateway";
import { MessageScheduler } from "./services/message-scheduler";
import { CsvProcessor } from "./services/csv-processor";
import {
  csvUploadSchema,
  quickSendSchema,
  scheduleMessageSchema,
  insertContactListSchema,
  insertContactSchema,
} from "@shared/schema";

// Initialize SMS Gateway and Scheduler with auto-detection
let smsGateway: SmsGateway;
let messageScheduler: MessageScheduler;

async function initializeGateway() {
  try {
    const config = await getDefaultGatewayConfig();
    console.log(`Initializing SMS Gateway with port: ${config.port}`);
    smsGateway = new SmsGateway(config);
    messageScheduler = new MessageScheduler(smsGateway);
    
    // Try to connect to the gateway
    const connected = await smsGateway.connect();
    if (connected) {
      console.log("SMS Gateway connected successfully");
      messageScheduler.start();
    } else {
      console.log("SMS Gateway connection failed");
    }
  } catch (error) {
    console.log(`Failed to initialize SMS Gateway: ${error}`);
  }
}

// Initialize immediately
initializeGateway();

// WebSocket connections
const wsConnections = new Set<WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    wsConnections.add(ws);
    
    ws.on('close', () => {
      wsConnections.delete(ws);
    });

    // Send initial gateway status
    smsGateway.getStatus().then(status => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'gatewayStatus', data: status }));
      }
    });
  });

  // Broadcast to all connected clients
  function broadcast(message: any): void {
    const data = JSON.stringify(message);
    wsConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  // SMS Gateway event handlers
  smsGateway.on('connected', () => {
    broadcast({ type: 'gatewayStatus', data: { connected: true } });
    storage.updateSmsGatewayStatus({ connected: true });
  });

  smsGateway.on('disconnected', () => {
    broadcast({ type: 'gatewayStatus', data: { connected: false } });
    storage.updateSmsGatewayStatus({ connected: false });
  });

  smsGateway.on('messageProcessed', async (result) => {
    // Update delivery status
    const deliveries = await storage.getMessageDeliveries(parseInt(result.id || '0'));
    const delivery = deliveries.find(d => d.phone === result.phone);
    
    if (delivery) {
      await storage.updateMessageDelivery(delivery.id, {
        status: result.status,
        sentAt: result.status === 'sent' ? new Date() : null,
        failureReason: result.error,
      });

      // Update message counts
      const message = await storage.getMessage(delivery.messageId!);
      if (message) {
        const currentCounts = {
          sentCount: message.sentCount || 0,
          deliveredCount: message.deliveredCount || 0,
          failedCount: message.failedCount || 0,
        };

        if (result.status === 'sent') {
          currentCounts.sentCount++;
        } else if (result.status === 'delivered') {
          currentCounts.deliveredCount++;
        } else if (result.status === 'failed') {
          currentCounts.failedCount++;
        }

        // Check if campaign is complete
        const isComplete = (currentCounts.sentCount + currentCounts.failedCount) >= (message.totalRecipients || 0);
        
        await storage.updateMessage(delivery.messageId!, {
          ...currentCounts,
          status: isComplete ? 'completed' : 'sending',
          completedAt: isComplete ? new Date() : null,
        });
      }
    }

    broadcast({ type: 'deliveryUpdate', data: result });
  });

  smsGateway.on('optOut', async (phone) => {
    const contacts = await storage.getContacts();
    const contact = contacts.find(c => c.phone === phone);
    if (contact) {
      await storage.blacklistContact(contact.id);
      broadcast({ type: 'optOut', data: { phone, contactId: contact.id } });
    }
  });

  // Initialize SMS Gateway
  try {
    await smsGateway.connect();
    messageScheduler.start();
  } catch (error) {
    console.error('Failed to initialize SMS Gateway:', error);
  }

  // API Routes

  // Dashboard stats
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // SMS Gateway status
  app.get('/api/gateway/status', async (req, res) => {
    try {
      const status = await smsGateway.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch gateway status' });
    }
  });

  // Contact Lists
  app.get('/api/contact-lists', async (req, res) => {
    try {
      const lists = await storage.getContactLists();
      res.json(lists);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch contact lists' });
    }
  });

  app.post('/api/contact-lists', async (req, res) => {
    try {
      const data = insertContactListSchema.parse(req.body);
      const list = await storage.createContactList(data);
      res.json(list);
    } catch (error) {
      res.status(400).json({ message: 'Invalid contact list data' });
    }
  });

  app.delete('/api/contact-lists/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContactList(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Contact list not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete contact list' });
    }
  });

  // Contacts
  app.get('/api/contacts', async (req, res) => {
    try {
      const listId = req.query.listId ? parseInt(req.query.listId as string) : undefined;
      const contacts = await storage.getContacts(listId);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  });

  app.post('/api/contacts', async (req, res) => {
    try {
      const data = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(data);
      res.json(contact);
    } catch (error) {
      res.status(400).json({ message: 'Invalid contact data' });
    }
  });

  app.delete('/api/contacts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContact(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Contact not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete contact' });
    }
  });

  app.post('/api/contacts/:id/blacklist', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.blacklistContact(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Contact not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to blacklist contact' });
    }
  });

  // CSV Upload
  app.post('/api/contacts/upload-csv', async (req, res) => {
    try {
      const { csvData, listId, listName } = req.body;
      
      if (!csvData) {
        return res.status(400).json({ message: 'CSV data is required' });
      }

      const result = await CsvProcessor.processContactsCsv(csvData, listId);
      
      if (result.errors.length > 0) {
        return res.status(400).json({ 
          message: 'CSV processing errors',
          errors: result.errors,
          duplicates: result.duplicates 
        });
      }

      let targetListId = listId;
      
      // Create new list if listName is provided
      if (listName && !listId) {
        const newList = await storage.createContactList({
          name: listName,
          description: `Imported from CSV on ${new Date().toLocaleDateString()}`,
        });
        targetListId = newList.id;
      }

      // Insert contacts
      const contactsToInsert = result.contacts.map(contact => ({
        ...contact,
        listId: targetListId,
        optedIn: true,
        blacklisted: false,
        consentDate: new Date(),
      }));

      const insertedContacts = await storage.createContacts(contactsToInsert);

      res.json({
        success: true,
        contactsImported: insertedContacts.length,
        listId: targetListId,
        duplicates: result.duplicates,
      });

    } catch (error) {
      res.status(500).json({ message: 'Failed to process CSV upload' });
    }
  });

  // Export contacts
  app.get('/api/contacts/export/:listId', async (req, res) => {
    try {
      const listId = parseInt(req.params.listId);
      const contacts = await storage.getContacts(listId);
      const csv = CsvProcessor.exportContactsToCsv(contacts);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="contacts-${listId}.csv"`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: 'Failed to export contacts' });
    }
  });

  // Messages
  app.get('/api/messages', async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.get('/api/messages/scheduled', async (req, res) => {
    try {
      const messages = await storage.getScheduledMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch scheduled messages' });
    }
  });

  // Quick send message
  app.post('/api/messages/quick-send', async (req, res) => {
    try {
      const data = quickSendSchema.parse(req.body);
      
      // Create message
      const message = await storage.createMessage({
        ...data,
        status: 'pending',
      });

      // Get contacts
      const contacts = await storage.getOptedInContacts(data.listId);
      
      // Create deliveries
      const deliveries = contacts.map(contact => ({
        messageId: message.id,
        contactId: contact.id,
        phone: contact.phone,
        personalizedContent: data.content.replace(/{name}/g, contact.name),
        status: 'pending' as const,
      }));

      for (const delivery of deliveries) {
        await storage.createMessageDelivery(delivery);
      }

      // Update message with recipient count
      await storage.updateMessage(message.id, {
        status: 'sending',
        totalRecipients: contacts.length,
      });

      // Queue messages for sending
      deliveries.forEach(delivery => {
        smsGateway.queueMessage({
          phone: delivery.phone,
          message: delivery.personalizedContent,
          id: delivery.messageId?.toString(),
        });
      });

      res.json({ success: true, messageId: message.id, recipientCount: contacts.length });

    } catch (error) {
      res.status(400).json({ message: 'Invalid message data' });
    }
  });

  // Schedule message
  app.post('/api/messages/schedule', async (req, res) => {
    try {
      const data = scheduleMessageSchema.parse(req.body);
      
      // Create message
      const message = await storage.createMessage({
        ...data,
        status: 'scheduled',
      });

      // Schedule the message
      messageScheduler.scheduleMessage(message.id, data.scheduledAt);

      res.json({ success: true, messageId: message.id });

    } catch (error) {
      res.status(400).json({ message: 'Invalid schedule data' });
    }
  });

  // Cancel scheduled message
  app.delete('/api/messages/scheduled/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = messageScheduler.cancelScheduledMessage(id);
      
      if (success) {
        await storage.updateMessage(id, { status: 'cancelled' });
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Scheduled message not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to cancel scheduled message' });
    }
  });

  // Message deliveries
  app.get('/api/messages/:id/deliveries', async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const deliveries = await storage.getMessageDeliveries(messageId);
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch message deliveries' });
    }
  });

  // CSV template download
  app.get('/api/csv-template', (req, res) => {
    try {
      const template = CsvProcessor.generateCsvTemplate();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="contacts-template.csv"');
      res.send(template);
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate CSV template' });
    }
  });

  return httpServer;
}
