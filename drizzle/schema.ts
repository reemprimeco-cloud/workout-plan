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

// ── Community ─────────────────────────────────────────────────────────────────

// Community posts — text, image, achievement, auto-generated
export const communityPosts = mysqlTable("community_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["text", "image", "achievement", "transformation", "auto"]).default("text").notNull(),
  content: text("content").notNull(),
  contentEn: text("contentEn"),
  imageUrl: text("imageUrl"),
  imageKey: text("imageKey"),
  visibility: mysqlEnum("visibility", ["public", "friends", "private"]).default("public").notNull(),
  xpAwarded: int("xpAwarded").default(0).notNull(),
  likesCount: int("likesCount").default(0).notNull(),
  commentsCount: int("commentsCount").default(0).notNull(),
  isTrending: boolean("isTrending").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;

// Post reactions — like, cheer, fire
export const communityReactions = mysqlTable("community_reactions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["like", "cheer", "fire"]).default("like").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityReaction = typeof communityReactions.$inferSelect;
export type InsertCommunityReaction = typeof communityReactions.$inferInsert;

// Post comments
export const communityComments = mysqlTable("community_comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = typeof communityComments.$inferInsert;

// Stories — 24h streak/achievement stories
export const communityStories = mysqlTable("community_stories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["streak", "achievement", "workout", "progress"]).default("workout").notNull(),
  content: text("content").notNull(),
  contentEn: text("contentEn"),
  imageUrl: text("imageUrl"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityStory = typeof communityStories.$inferSelect;
export type InsertCommunityStory = typeof communityStories.$inferInsert;

// Challenges
export const communityChallenges = mysqlTable("community_challenges", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }).notNull(),
  description: text("description").notNull(),
  descriptionAr: text("descriptionAr").notNull(),
  type: mysqlEnum("type", ["streak", "sessions", "cardio", "weight", "custom"]).default("sessions").notNull(),
  targetValue: int("targetValue").default(7).notNull(),
  xpReward: int("xpReward").default(100).notNull(),
  startDate: varchar("startDate", { length: 10 }).notNull(), // YYYY-MM-DD
  endDate: varchar("endDate", { length: 10 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  participantsCount: int("participantsCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityChallenge = typeof communityChallenges.$inferSelect;
export type InsertCommunityChallenge = typeof communityChallenges.$inferInsert;

// Challenge participants
export const challengeParticipants = mysqlTable("challenge_participants", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  progress: int("progress").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = typeof challengeParticipants.$inferInsert;

// XP log — tracks all XP-earning events
export const communityXpLog = mysqlTable("community_xp_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  event: varchar("event", { length: 64 }).notNull(), // 'post','workout','streak','like','comment','challenge'
  points: int("points").notNull(),
  refId: int("refId"), // optional reference to related record
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityXpLog = typeof communityXpLog.$inferSelect;
export type InsertCommunityXpLog = typeof communityXpLog.$inferInsert;
