import {
  contactLists,
  contacts,
  messages,
  messageDeliveries,
  smsGatewayStatus,
  type ContactList,
  type Contact,
  type Message,
  type MessageDelivery,
  type SmsGatewayStatus,
  type InsertContactList,
  type InsertContact,
  type InsertMessage,
  type InsertMessageDelivery,
} from "@shared/schema";

export interface IStorage {
  // Contact Lists
  getContactLists(): Promise<ContactList[]>;
  getContactList(id: number): Promise<ContactList | undefined>;
  createContactList(list: InsertContactList): Promise<ContactList>;
  updateContactList(id: number, updates: Partial<ContactList>): Promise<ContactList | undefined>;
  deleteContactList(id: number): Promise<boolean>;

  // Contacts
  getContacts(listId?: number): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  createContacts(contacts: InsertContact[]): Promise<Contact[]>;
  updateContact(id: number, updates: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  getOptedInContacts(listId: number): Promise<Contact[]>;
  blacklistContact(id: number): Promise<boolean>;

  // Messages
  getMessages(): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, updates: Partial<Message>): Promise<Message | undefined>;
  getScheduledMessages(): Promise<Message[]>;
  getPendingMessages(): Promise<Message[]>;

  // Message Deliveries
  getMessageDeliveries(messageId: number): Promise<MessageDelivery[]>;
  createMessageDelivery(delivery: InsertMessageDelivery): Promise<MessageDelivery>;
  updateMessageDelivery(id: number, updates: Partial<MessageDelivery>): Promise<MessageDelivery | undefined>;
  
  // SMS Gateway Status
  getSmsGatewayStatus(): Promise<SmsGatewayStatus | undefined>;
  updateSmsGatewayStatus(status: Partial<SmsGatewayStatus>): Promise<SmsGatewayStatus>;

  // Statistics
  getStats(): Promise<{
    totalContacts: number;
    sentToday: number;
    deliveryRate: number;
    scheduled: number;
    optedIn: number;
    blacklisted: number;
    pending: number;
  }>;
}

export class MemStorage implements IStorage {
  private contactLists: Map<number, ContactList> = new Map();
  private contacts: Map<number, Contact> = new Map();
  private messages: Map<number, Message> = new Map();
  private messageDeliveries: Map<number, MessageDelivery> = new Map();
  private smsGatewayStatus: SmsGatewayStatus | undefined;
  
  private currentContactListId = 1;
  private currentContactId = 1;
  private currentMessageId = 1;
  private currentMessageDeliveryId = 1;

  constructor() {
    // Initialize with default SMS gateway status
    this.smsGatewayStatus = {
      id: 1,
      connected: false,
      simProvider: "Not Connected",
      signalStrength: 0,
      lastChecked: new Date(),
    };
  }

  async getContactLists(): Promise<ContactList[]> {
    return Array.from(this.contactLists.values());
  }

  async getContactList(id: number): Promise<ContactList | undefined> {
    return this.contactLists.get(id);
  }

  async createContactList(list: InsertContactList): Promise<ContactList> {
    const contactList: ContactList = {
      ...list,
      id: this.currentContactListId++,
      contactCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contactLists.set(contactList.id, contactList);
    return contactList;
  }

  async updateContactList(id: number, updates: Partial<ContactList>): Promise<ContactList | undefined> {
    const existing = this.contactLists.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.contactLists.set(id, updated);
    return updated;
  }

  async deleteContactList(id: number): Promise<boolean> {
    return this.contactLists.delete(id);
  }

  async getContacts(listId?: number): Promise<Contact[]> {
    const contacts = Array.from(this.contacts.values());
    return listId ? contacts.filter(c => c.listId === listId) : contacts;
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const newContact: Contact = {
      ...contact,
      id: this.currentContactId++,
      createdAt: new Date(),
    };
    this.contacts.set(newContact.id, newContact);
    
    // Update contact list count
    if (contact.listId) {
      const list = this.contactLists.get(contact.listId);
      if (list) {
        await this.updateContactList(contact.listId, { contactCount: (list.contactCount || 0) + 1 });
      }
    }
    
    return newContact;
  }

  async createContacts(contacts: InsertContact[]): Promise<Contact[]> {
    const newContacts: Contact[] = [];
    for (const contact of contacts) {
      const newContact = await this.createContact(contact);
      newContacts.push(newContact);
    }
    return newContacts;
  }

  async updateContact(id: number, updates: Partial<Contact>): Promise<Contact | undefined> {
    const existing = this.contacts.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.contacts.set(id, updated);
    return updated;
  }

  async deleteContact(id: number): Promise<boolean> {
    const contact = this.contacts.get(id);
    if (!contact) return false;
    
    // Update contact list count
    if (contact.listId) {
      const list = this.contactLists.get(contact.listId);
      if (list) {
        await this.updateContactList(contact.listId, { contactCount: Math.max(0, (list.contactCount || 0) - 1) });
      }
    }
    
    return this.contacts.delete(id);
  }

  async getOptedInContacts(listId: number): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(
      c => c.listId === listId && c.optedIn && !c.blacklisted
    );
  }

  async blacklistContact(id: number): Promise<boolean> {
    const contact = this.contacts.get(id);
    if (!contact) return false;
    
    const updated = { ...contact, blacklisted: true, optedIn: false };
    this.contacts.set(id, updated);
    return true;
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: this.currentMessageId++,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      createdAt: new Date(),
      completedAt: null,
    };
    this.messages.set(newMessage.id, newMessage);
    return newMessage;
  }

  async updateMessage(id: number, updates: Partial<Message>): Promise<Message | undefined> {
    const existing = this.messages.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.messages.set(id, updated);
    return updated;
  }

  async getScheduledMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(m => m.status === "scheduled");
  }

  async getPendingMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(m => m.status === "pending");
  }

  async getMessageDeliveries(messageId: number): Promise<MessageDelivery[]> {
    return Array.from(this.messageDeliveries.values()).filter(d => d.messageId === messageId);
  }

  async createMessageDelivery(delivery: InsertMessageDelivery): Promise<MessageDelivery> {
    const newDelivery: MessageDelivery = {
      ...delivery,
      id: this.currentMessageDeliveryId++,
      sentAt: null,
      deliveredAt: null,
      createdAt: new Date(),
    };
    this.messageDeliveries.set(newDelivery.id, newDelivery);
    return newDelivery;
  }

  async updateMessageDelivery(id: number, updates: Partial<MessageDelivery>): Promise<MessageDelivery | undefined> {
    const existing = this.messageDeliveries.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.messageDeliveries.set(id, updated);
    return updated;
  }

  async getSmsGatewayStatus(): Promise<SmsGatewayStatus | undefined> {
    return this.smsGatewayStatus;
  }

  async updateSmsGatewayStatus(status: Partial<SmsGatewayStatus>): Promise<SmsGatewayStatus> {
    this.smsGatewayStatus = {
      ...this.smsGatewayStatus!,
      ...status,
      lastChecked: new Date(),
    };
    return this.smsGatewayStatus;
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalContacts = this.contacts.size;
    const sentToday = Array.from(this.messageDeliveries.values()).filter(
      d => d.sentAt && d.sentAt >= today
    ).length;
    
    const deliveredCount = Array.from(this.messageDeliveries.values()).filter(
      d => d.status === "delivered"
    ).length;
    const totalSent = Array.from(this.messageDeliveries.values()).filter(
      d => d.status !== "pending"
    ).length;
    
    const deliveryRate = totalSent > 0 ? (deliveredCount / totalSent) * 100 : 0;
    
    const scheduled = Array.from(this.messages.values()).filter(
      m => m.status === "scheduled"
    ).length;
    
    const optedIn = Array.from(this.contacts.values()).filter(
      c => c.optedIn && !c.blacklisted
    ).length;
    
    const blacklisted = Array.from(this.contacts.values()).filter(
      c => c.blacklisted
    ).length;
    
    const pending = Array.from(this.contacts.values()).filter(
      c => !c.optedIn && !c.blacklisted
    ).length;

    return {
      totalContacts,
      sentToday,
      deliveryRate: Math.round(deliveryRate * 10) / 10,
      scheduled,
      optedIn,
      blacklisted,
      pending,
    };
  }
}

export const storage = new MemStorage();
