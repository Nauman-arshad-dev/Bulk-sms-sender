import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contactLists = pgTable("contact_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  contactCount: integer("contact_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").references(() => contactLists.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  optedIn: boolean("opted_in").default(true),
  blacklisted: boolean("blacklisted").default(false),
  consentDate: timestamp("consent_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  campaignName: text("campaign_name").notNull(),
  content: text("content").notNull(),
  listId: integer("list_id").references(() => contactLists.id),
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  failedCount: integer("failed_count").default(0),
  status: text("status").notNull().default("pending"), // pending, sending, completed, failed, scheduled
  scheduledAt: timestamp("scheduled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const messageDeliveries = pgTable("message_deliveries", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id),
  contactId: integer("contact_id").references(() => contacts.id),
  phone: text("phone").notNull(),
  personalizedContent: text("personalized_content").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, delivered, failed
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const smsGatewayStatus = pgTable("sms_gateway_status", {
  id: serial("id").primaryKey(),
  connected: boolean("connected").default(false),
  simProvider: text("sim_provider"),
  signalStrength: integer("signal_strength"),
  lastChecked: timestamp("last_checked").defaultNow(),
});

// Insert schemas
export const insertContactListSchema = createInsertSchema(contactLists).omit({
  id: true,
  contactCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentCount: true,
  deliveredCount: true,
  failedCount: true,
  createdAt: true,
  completedAt: true,
});

export const insertMessageDeliverySchema = createInsertSchema(messageDeliveries).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  createdAt: true,
});

// Types
export type ContactList = typeof contactLists.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type MessageDelivery = typeof messageDeliveries.$inferSelect;
export type SmsGatewayStatus = typeof smsGatewayStatus.$inferSelect;

export type InsertContactList = z.infer<typeof insertContactListSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertMessageDelivery = z.infer<typeof insertMessageDeliverySchema>;

// Additional schemas for API operations
export const csvUploadSchema = z.object({
  listId: z.number().optional(),
  listName: z.string().optional(),
  contacts: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().optional(),
  })),
});

export const quickSendSchema = z.object({
  listId: z.number(),
  content: z.string().min(1).max(160),
  campaignName: z.string(),
});

export const scheduleMessageSchema = z.object({
  listId: z.number(),
  content: z.string().min(1).max(160),
  campaignName: z.string(),
  scheduledAt: z.string().transform((str) => new Date(str)),
});

export type CsvUpload = z.infer<typeof csvUploadSchema>;
export type QuickSend = z.infer<typeof quickSendSchema>;
export type ScheduleMessage = z.infer<typeof scheduleMessageSchema>;
