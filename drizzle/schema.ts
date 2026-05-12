import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Access codes table — manual license keys for Prime Fit
export const accessCodes = mysqlTable("access_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 128 }).notNull().unique(),
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  note: text("note"),
  isActive: boolean("isActive").default(true).notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccessCode = typeof accessCodes.$inferSelect;
export type InsertAccessCode = typeof accessCodes.$inferInsert;

// Push subscriptions — Web Push API endpoint + keys per user
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: varchar("auth", { length: 512 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// Notification settings — per-user reminder preferences
export const notificationSettings = mysqlTable("notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  enabled: boolean("enabled").default(false).notNull(),
  reminderTime: varchar("reminderTime", { length: 5 }).default("09:00").notNull(), // HH:MM UTC
  days: varchar("days", { length: 64 }).default("1,2,3,4,5").notNull(), // comma-separated 0=Sun..6=Sat
  language: varchar("language", { length: 8 }).default("ar").notNull(), // ar | en
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;

// ── My Coach ─────────────────────────────────────────────────────────────────

// AI coach chat history — one row per message
export const coachChatHistory = mysqlTable("coach_chat_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachChatMessage = typeof coachChatHistory.$inferSelect;
export type InsertCoachChatMessage = typeof coachChatHistory.$inferInsert;

// Daily check-ins — mood/energy/sleep + AI response
export const coachCheckins = mysqlTable("coach_checkins", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  feeling: int("feeling").notNull(),   // 1-5
  energy: int("energy").notNull(),     // 1-5
  sleep: int("sleep").notNull(),       // 1-5
  aiResponse: text("aiResponse"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachCheckin = typeof coachCheckins.$inferSelect;
export type InsertCoachCheckin = typeof coachCheckins.$inferInsert;

// AI-generated insights — coaching feedback cards
export const coachInsights = mysqlTable("coach_insights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 32 }).notNull(), // 'progress'|'warning'|'motivation'|'recommendation'
  content: text("content").notNull(),
  contentEn: text("contentEn"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachInsight = typeof coachInsights.$inferSelect;
export type InsertCoachInsight = typeof coachInsights.$inferInsert;

// Coach memory — one row per user, stores serialized fitness context
export const coachMemory = mysqlTable("coach_memory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  goalWeight: int("goalWeight"),
  currentWeight: int("currentWeight"),
  preferredLanguage: varchar("preferredLanguage", { length: 8 }).default("ar"),
  notes: text("notes"), // JSON blob for extra context
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoachMemory = typeof coachMemory.$inferSelect;
export type InsertCoachMemory = typeof coachMemory.$inferInsert;
