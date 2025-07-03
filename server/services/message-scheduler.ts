import { EventEmitter } from "events";
import { storage } from "../storage";
import { SmsGateway } from "./sms-gateway";

export class MessageScheduler extends EventEmitter {
  private scheduledJobs: Map<number, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor(private smsGateway: SmsGateway) {
    super();
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.loadScheduledMessages();
    
    // Check for scheduled messages every minute
    const checkInterval = setInterval(() => {
      this.loadScheduledMessages();
    }, 60000);

    this.on('stop', () => {
      clearInterval(checkInterval);
      this.clearAllJobs();
    });
  }

  stop(): void {
    this.isRunning = false;
    this.emit('stop');
  }

  private async loadScheduledMessages(): Promise<void> {
    try {
      const scheduledMessages = await storage.getScheduledMessages();
      
      for (const message of scheduledMessages) {
        if (!message.scheduledAt || this.scheduledJobs.has(message.id)) {
          continue;
        }

        const delay = message.scheduledAt.getTime() - Date.now();
        
        if (delay <= 0) {
          // Message should be sent immediately
          this.executeScheduledMessage(message.id);
        } else if (delay <= 24 * 60 * 60 * 1000) { // Within 24 hours
          // Schedule the message
          const timeout = setTimeout(() => {
            this.executeScheduledMessage(message.id);
          }, delay);
          
          this.scheduledJobs.set(message.id, timeout);
        }
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  private async executeScheduledMessage(messageId: number): Promise<void> {
    try {
      const message = await storage.getMessage(messageId);
      if (!message || message.status !== 'scheduled') {
        return;
      }

      // Update message status to pending
      await storage.updateMessage(messageId, { status: 'pending' });

      // Get contacts for the message
      const contacts = await storage.getOptedInContacts(message.listId!);
      
      // Create message deliveries
      const deliveries = contacts.map(contact => ({
        messageId: message.id,
        contactId: contact.id,
        phone: contact.phone,
        personalizedContent: this.personalizeMessage(message.content, contact.name),
        status: 'pending' as const,
      }));

      // Save deliveries to storage
      for (const delivery of deliveries) {
        await storage.createMessageDelivery(delivery);
      }

      // Update message with recipient count
      await storage.updateMessage(messageId, {
        status: 'sending',
        totalRecipients: contacts.length,
      });

      // Queue messages for sending
      deliveries.forEach(delivery => {
        this.smsGateway.queueMessage({
          phone: delivery.phone,
          message: delivery.personalizedContent,
          id: delivery.messageId?.toString(),
        });
      });

      // Remove from scheduled jobs
      this.scheduledJobs.delete(messageId);
      
      this.emit('messageExecuted', { messageId, recipientCount: contacts.length });

    } catch (error) {
      this.emit('error', error);
      
      // Update message status to failed
      await storage.updateMessage(messageId, { 
        status: 'failed',
        completedAt: new Date(),
      });
    }
  }

  private personalizeMessage(template: string, name: string): string {
    return template.replace(/{name}/g, name);
  }

  scheduleMessage(messageId: number, scheduledAt: Date): void {
    const delay = scheduledAt.getTime() - Date.now();
    
    if (delay <= 0) {
      // Execute immediately
      this.executeScheduledMessage(messageId);
      return;
    }

    // Clear existing job if any
    if (this.scheduledJobs.has(messageId)) {
      clearTimeout(this.scheduledJobs.get(messageId)!);
    }

    // Schedule the message
    const timeout = setTimeout(() => {
      this.executeScheduledMessage(messageId);
    }, delay);
    
    this.scheduledJobs.set(messageId, timeout);
  }

  cancelScheduledMessage(messageId: number): boolean {
    if (this.scheduledJobs.has(messageId)) {
      clearTimeout(this.scheduledJobs.get(messageId)!);
      this.scheduledJobs.delete(messageId);
      return true;
    }
    return false;
  }

  private clearAllJobs(): void {
    for (const timeout of this.scheduledJobs.values()) {
      clearTimeout(timeout);
    }
    this.scheduledJobs.clear();
  }

  getScheduledJobCount(): number {
    return this.scheduledJobs.size;
  }
}
