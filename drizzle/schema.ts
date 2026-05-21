import { boolean, decimal, double, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  /** Full name for standalone auth accounts */
  fullName: varchar("fullName", { length: 255 }),
  email: varchar("email", { length: 320 }).unique(),
  /** Hashed password for email/password auth (null for OAuth users) */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** Auth provider: manus | email | google */
  authProvider: mysqlEnum("authProvider", ["manus", "email", "google"]).default("manus").notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  /** Token for password reset flow */
  resetToken: varchar("resetToken", { length: 128 }),
  resetTokenExpiresAt: timestamp("resetTokenExpiresAt"),
  /** Token for email verification */
  emailVerified: boolean("emailVerified").default(false).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  age: int("age"),
  height: int("height"),
  currentWeight: decimal("currentWeight", { precision: 5, scale: 2 }),
  targetWeight: decimal("targetWeight", { precision: 5, scale: 2 }),
  gender: mysqlEnum("gender", ["male", "female"]),
  /** Active device ID for single-device enforcement */
  activeDeviceId: varchar("activeDeviceId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  isBanned: boolean("isBanned").default(false).notNull(),
  bannedAt: timestamp("bannedAt"),
  banReason: text("banReason"),
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
  orderId: int("orderId").unique(),   // WooCommerce order ID — prevents duplicate codes
  expiresAt: timestamp("expiresAt"),   // null = never expires
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
  communityNotifs: boolean("communityNotifs").default(true).notNull(),
  appUpdatesNotifs: boolean("appUpdatesNotifs").default(true).notNull(),
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
  isPinned: boolean("isPinned").default(false).notNull(),
  isHidden: boolean("isHidden").default(false).notNull(),
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

// Social notifications — per-user inbox for likes, comments, follows, DMs, replies
export const socialNotifications = mysqlTable("social_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),        // recipient
  actorId: int("actorId").notNull(),       // who triggered it
  type: mysqlEnum("type", ["like", "cheer", "fire", "comment", "achievement", "mention", "follow", "reply", "message"]).notNull(),
  postId: int("postId"),                   // related post (if any)
  commentId: int("commentId"),             // related comment (if any)
  messageId: int("messageId"),             // related DM (if any)
  replyId: int("replyId"),                 // related reply (if any)
  actorName: varchar("actorName", { length: 255 }), // cached actor name
  actorAvatar: text("actorAvatar"),        // cached actor avatar URL
  message: text("message").notNull(),
  messageEn: text("messageEn"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialNotification = typeof socialNotifications.$inferSelect;
export type InsertSocialNotification = typeof socialNotifications.$inferInsert;

// User privacy settings — controls DM, follow, mention permissions + notification prefs
export const userPrivacySettings = mysqlTable("user_privacy_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  allowDMs: boolean("allowDMs").default(true).notNull(),
  allowFollows: boolean("allowFollows").default(true).notNull(),
  allowMentions: boolean("allowMentions").default(true).notNull(),
  privateAccount: boolean("privateAccount").default(false).notNull(),
  notifyLikes: boolean("notifyLikes").default(true).notNull(),
  notifyComments: boolean("notifyComments").default(true).notNull(),
  notifyMentions: boolean("notifyMentions").default(true).notNull(),
  notifyFollows: boolean("notifyFollows").default(true).notNull(),
  notifyMessages: boolean("notifyMessages").default(true).notNull(),
  notifyReplies: boolean("notifyReplies").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPrivacySettings = typeof userPrivacySettings.$inferSelect;
export type InsertUserPrivacySettings = typeof userPrivacySettings.$inferInsert;

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

// Admin profile — stores admin contact info and profile image
export const adminProfile = mysqlTable("admin_profile", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 320 }),
  photoUrl: text("photoUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminProfile = typeof adminProfile.$inferSelect;
export type InsertAdminProfile = typeof adminProfile.$inferInsert;

// Broadcast notifications — emails sent to all licensed customers
export const broadcastNotifications = mysqlTable("broadcast_notifications", {
  id: int("id").autoincrement().primaryKey(),
  subject: varchar("subject", { length: 512 }).notNull(),
  body: text("body").notNull(),
  type: mysqlEnum("type", ["update", "news", "offer", "reminder", "other"]).default("news").notNull(),
  recipientCount: int("recipientCount").default(0).notNull(),
  sentBy: varchar("sentBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BroadcastNotification = typeof broadcastNotifications.$inferSelect;
export type InsertBroadcastNotification = typeof broadcastNotifications.$inferInsert;

// ── MyFatoorah Subscriptions ──────────────────────────────────────────────────
// One row per user — current subscription state
export const subscriptions = mysqlTable("subscriptions", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      varchar("userId", { length: 255 }).notNull().unique(),
  plan:        mysqlEnum("plan", ["free", "prime_plus", "prime_pro"]).default("free").notNull(),
  status:      mysqlEnum("status", ["active", "expired", "cancelled", "trialing", "pending"]).default("active").notNull(),
  period:      mysqlEnum("period", ["monthly", "yearly", "lifetime", "free_trial"]).default("monthly").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  startsAt:    timestamp("startsAt").defaultNow().notNull(),
  expiresAt:   timestamp("expiresAt"),  // null = never expires (lifetime)
  invoiceId:   varchar("invoiceId", { length: 255 }),
  licenseKey:  varchar("licenseKey", { length: 128 }),  // linked PRIME-XXXX-XXXX key
  /** Email of the subscriber (denormalized for admin queries) */
  email:           varchar("email", { length: 320 }),
  /** ID of the access_code used to activate this subscription */
  activationCodeId: int("activationCodeId"),
  /** Payment status: paid | pending | failed | refunded */
  paymentStatus:   mysqlEnum("paymentStatus", ["paid", "pending", "failed", "refunded", "free"]).default("free").notNull(),
  /** Payment provider: myfatoorah | manual | free */
  paymentProvider: mysqlEnum("paymentProvider", ["myfatoorah", "manual", "free"]).default("free").notNull(),
  /** Payment transaction / invoice reference */
  transactionId:   varchar("transactionId", { length: 255 }),
  /** Whether to auto-renew on expiry */
  autoRenew:       boolean("autoRenew").default(false).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// One row per payment attempt
export const billingHistory = mysqlTable("billing_history", {
  id:         int("id").autoincrement().primaryKey(),
  userId:     varchar("userId", { length: 255 }).notNull(),
  plan:       mysqlEnum("plan", ["free", "prime_plus", "prime_pro"]).notNull(),
  period:     mysqlEnum("period", ["monthly", "yearly"]).notNull(),
  amount:     varchar("amount", { length: 32 }).notNull(),
  currency:   varchar("currency", { length: 8 }).default("KWD").notNull(),
  status:     mysqlEnum("status", ["paid", "failed", "refunded", "pending"]).notNull(),
  invoiceId:  varchar("invoiceId", { length: 255 }).notNull(),
  paymentRef: varchar("paymentRef", { length: 255 }),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
});
export type BillingHistory = typeof billingHistory.$inferSelect;
export type InsertBillingHistory = typeof billingHistory.$inferInsert;

// ── Post Mentions ─────────────────────────────────────────────────────────────
// Tracks every @mention in a post or comment so we can send notifications
export const postMentions = mysqlTable("post_mentions", {
  id:          int("id").autoincrement().primaryKey(),
  mentionedId: int("mentionedId").notNull(),   // user who was mentioned
  actorId:     int("actorId").notNull(),        // user who wrote the post/comment
  postId:      int("postId").notNull(),         // the post (or the post containing the comment)
  commentId:   int("commentId"),               // null if mention is in the post body
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type PostMention = typeof postMentions.$inferSelect;
export type InsertPostMention = typeof postMentions.$inferInsert;

// ── Spin Wheel System ─────────────────────────────────────────────────────────

// Reward catalog with probabilities (admin-configurable)
export const rewardProbabilities = mysqlTable("reward_probabilities", {
  id:          int("id").autoincrement().primaryKey(),
  name:        varchar("name", { length: 128 }).notNull(),
  nameAr:      varchar("nameAr", { length: 128 }).notNull(),
  type:        mysqlEnum("type", ["premium_days", "xp_bonus", "badge", "ai_boost", "streak_protection", "workout_unlock", "ai_insights", "upgrade"]).notNull(),
  rarity:      mysqlEnum("rarity", ["common", "uncommon", "rare", "jackpot"]).notNull(),
  weight:      int("weight").notNull().default(100),
  value:       int("value").default(0),
  icon:        varchar("icon", { length: 64 }).default("🎁"),
  color:       varchar("color", { length: 16 }).default("#7BB8D4"),
  isEnabled:   boolean("isEnabled").default(true).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RewardProbability = typeof rewardProbabilities.$inferSelect;
export type InsertRewardProbability = typeof rewardProbabilities.$inferInsert;

// One spin record per challenge completion
export const rewardSpins = mysqlTable("reward_spins", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  challengeId: int("challengeId").notNull(),
  rewardId:    int("rewardId"),
  status:      mysqlEnum("status", ["pending", "spun", "claimed"]).default("pending").notNull(),
  spinToken:   varchar("spinToken", { length: 64 }).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  spunAt:      timestamp("spunAt"),
  claimedAt:   timestamp("claimedAt"),
});
export type RewardSpin = typeof rewardSpins.$inferSelect;
export type InsertRewardSpin = typeof rewardSpins.$inferInsert;

// Full history of all rewards granted
export const rewardHistory = mysqlTable("reward_history", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  spinId:      int("spinId").notNull(),
  rewardId:    int("rewardId").notNull(),
  rewardName:  varchar("rewardName", { length: 128 }).notNull(),
  rarity:      mysqlEnum("rarity", ["common", "uncommon", "rare", "jackpot"]).notNull(),
  value:       int("value").default(0),
  appliedAt:   timestamp("appliedAt").defaultNow().notNull(),
});
export type RewardHistory = typeof rewardHistory.$inferSelect;
export type InsertRewardHistory = typeof rewardHistory.$inferInsert;

// Challenge-specific reward overrides
export const challengeRewards = mysqlTable("challenge_rewards", {
  id:             int("id").autoincrement().primaryKey(),
  challengeId:    int("challengeId").notNull(),
  rewardId:       int("rewardId").notNull(),
  weightOverride: int("weightOverride"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
});
export type ChallengeReward = typeof challengeRewards.$inferSelect;

// Jackpot winners log
export const jackpotWinners = mysqlTable("jackpot_winners", {
  id:             int("id").autoincrement().primaryKey(),
  userId:         int("userId").notNull(),
  spinId:         int("spinId").notNull(),
  rewardId:       int("rewardId").notNull(),
  rewardName:     varchar("rewardName", { length: 128 }).notNull(),
  wonAt:          timestamp("wonAt").defaultNow().notNull(),
  notifiedAdmin:  boolean("notifiedAdmin").default(false).notNull(),
});
export type JackpotWinner = typeof jackpotWinners.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════════════
// ── AI NUTRITION SYSTEM ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Per-user daily nutrition goals (calories, macros, water)
export const nutritionGoals = mysqlTable("nutrition_goals", {
  id:             int("id").autoincrement().primaryKey(),
  userId:         int("userId").notNull().unique(),
  calories:       int("calories").notNull().default(2000),
  proteinG:       int("proteinG").notNull().default(150),   // grams
  carbsG:         int("carbsG").notNull().default(200),
  fatG:           int("fatG").notNull().default(65),
  waterMl:        int("waterMl").notNull().default(2500),   // ml
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type InsertNutritionGoal = typeof nutritionGoals.$inferInsert;

// Individual meal entries (each food item logged)
export const mealEntries = mysqlTable("meal_entries", {
  id:             int("id").autoincrement().primaryKey(),
  userId:         int("userId").notNull(),
  date:           varchar("date", { length: 10 }).notNull(),   // YYYY-MM-DD
  mealType:       mysqlEnum("mealType", ["breakfast", "lunch", "dinner", "snack"]).notNull(),
  foodName:       varchar("foodName", { length: 255 }).notNull(),
  foodNameAr:     varchar("foodNameAr", { length: 255 }),
  calories:       int("calories").notNull().default(0),
  proteinG:       double("proteinG").notNull().default(0),
  carbsG:         double("carbsG").notNull().default(0),
  fatG:           double("fatG").notNull().default(0),
  servingSize:    varchar("servingSize", { length: 64 }),      // e.g. "100g", "1 cup"
  imageUrl:       varchar("imageUrl", { length: 512 }),        // AI scan image
  addedByAI:      boolean("addedByAI").default(false).notNull(),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
});
export type MealEntry = typeof mealEntries.$inferSelect;
export type InsertMealEntry = typeof mealEntries.$inferInsert;

// Daily water intake log (each glass/bottle logged)
export const waterLogs = mysqlTable("water_logs", {
  id:             int("id").autoincrement().primaryKey(),
  userId:         int("userId").notNull(),
  date:           varchar("date", { length: 10 }).notNull(),   // YYYY-MM-DD
  amountMl:       int("amountMl").notNull().default(250),
  loggedAt:       timestamp("loggedAt").defaultNow().notNull(),
});
export type WaterLog = typeof waterLogs.$inferSelect;
export type InsertWaterLog = typeof waterLogs.$inferInsert;

// AI-generated nutrition insights (stored per user, refreshed daily)
export const nutritionInsights = mysqlTable("nutrition_insights", {
  id:             int("id").autoincrement().primaryKey(),
  userId:         int("userId").notNull(),
  type:           mysqlEnum("type", ["protein", "hydration", "calories", "macros", "recovery", "general"]).notNull(),
  content:        text("content").notNull(),
  contentAr:      text("contentAr"),
  priority:       mysqlEnum("priority", ["high", "medium", "low"]).notNull().default("medium"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
});
export type NutritionInsight = typeof nutritionInsights.$inferSelect;
export type InsertNutritionInsight = typeof nutritionInsights.$inferInsert;

// ── Nutrition v2: Meal Logs (one row per meal scan/save) ──────────────────────
export const mealLogs = mysqlTable("meal_logs", {
  id:             int("id").autoincrement().primaryKey(),
  userId:         int("userId").notNull(),
  mealType:       mysqlEnum("mealType", ["breakfast", "lunch", "dinner", "snack"]).notNull(),
  loggedAt:       timestamp("loggedAt").defaultNow().notNull(),
  imageUrl:       varchar("imageUrl", { length: 512 }),
  notes:          text("notes"),
  insightAr:      text("insightAr"),
  insightEn:      text("insightEn"),
  totalCalories:  double("totalCalories").notNull().default(0),
  totalProtein:   double("totalProtein").notNull().default(0),
  totalCarbs:     double("totalCarbs").notNull().default(0),
  totalFat:       double("totalFat").notNull().default(0),
  totalFiber:     double("totalFiber").notNull().default(0),
  totalSugar:     double("totalSugar").notNull().default(0),
  totalSodium:    double("totalSodium").notNull().default(0),
});
export type MealLog = typeof mealLogs.$inferSelect;
export type InsertMealLog = typeof mealLogs.$inferInsert;

// Individual food items within a meal log
export const mealLogItems = mysqlTable("meal_log_items", {
  id:              int("id").autoincrement().primaryKey(),
  mealLogId:       int("mealLogId").notNull(),
  name:            varchar("name", { length: 255 }).notNull(),
  nameAr:          varchar("nameAr", { length: 255 }),
  estimatedGrams:  double("estimatedGrams").notNull().default(100),
  portionDesc:     varchar("portionDesc", { length: 255 }),
  portionDescAr:   varchar("portionDescAr", { length: 255 }),
  fdcId:           int("fdcId"),
  confidence:      mysqlEnum("confidence", ["high", "medium", "low"]).notNull().default("high"),
  calories:        double("calories").notNull().default(0),
  protein:         double("protein").notNull().default(0),
  carbs:           double("carbs").notNull().default(0),
  fat:             double("fat").notNull().default(0),
  fiber:           double("fiber").notNull().default(0),
  sugar:           double("sugar").notNull().default(0),
  sodium:          double("sodium").notNull().default(0),
  per100gCalories: double("per100gCalories").notNull().default(0),
  per100gProtein:  double("per100gProtein").notNull().default(0),
  per100gCarbs:    double("per100gCarbs").notNull().default(0),
  per100gFat:      double("per100gFat").notNull().default(0),
});
export type MealLogItem = typeof mealLogItems.$inferSelect;
export type InsertMealLogItem = typeof mealLogItems.$inferInsert;

// ── Health Reports & AI Medical Analysis ────────────────────────────────────
export const healthReports = mysqlTable("health_reports", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  fileUrl:     varchar("fileUrl", { length: 512 }).notNull(),
  fileKey:     varchar("fileKey", { length: 512 }).notNull(),
  fileName:    varchar("fileName", { length: 255 }).notNull(),
  fileType:    varchar("fileType", { length: 50 }).notNull(),
  reportType:  varchar("reportType", { length: 100 }),
  notes:       text("notes"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type HealthReport = typeof healthReports.$inferSelect;
export type InsertHealthReport = typeof healthReports.$inferInsert;

export const aiHealthAnalysis = mysqlTable("ai_health_analysis", {
  id:               int("id").autoincrement().primaryKey(),
  userId:           int("userId").notNull(),
  reportId:         int("reportId"),
  summaryEn:        text("summaryEn").notNull(),
  summaryAr:        text("summaryAr").notNull(),
  conditionsFound:  text("conditionsFound"),
  restrictions:     text("restrictions"),
  safeExercises:    text("safeExercises"),
  warningExercises: text("warningExercises"),
  recoveryTips:     text("recoveryTips"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type AiHealthAnalysis = typeof aiHealthAnalysis.$inferSelect;
export type InsertAiHealthAnalysis = typeof aiHealthAnalysis.$inferInsert;

export const personalizedPrograms = mysqlTable("personalized_programs", {
  id:            int("id").autoincrement().primaryKey(),
  userId:        int("userId").notNull(),
  analysisId:    int("analysisId"),
  titleEn:       varchar("titleEn", { length: 255 }).notNull(),
  titleAr:       varchar("titleAr", { length: 255 }).notNull(),
  descriptionEn: text("descriptionEn").notNull(),
  descriptionAr: text("descriptionAr").notNull(),
  weeklyPlan:    text("weeklyPlan").notNull(),
  cardioGuidance:text("cardioGuidance"),
  stretchingPlan:text("stretchingPlan"),
  isActive:      boolean("isActive").default(true).notNull(),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});
export type PersonalizedProgram = typeof personalizedPrograms.$inferSelect;
export type InsertPersonalizedProgram = typeof personalizedPrograms.$inferInsert;

// ── Workout Sessions (cross-device sync) ────────────────────────────────────
// Stores all gym sessions for each user, synced from localStorage gym_tracker_v3
export const gymSessions = mysqlTable("gym_sessions", {
  id:            int("id").autoincrement().primaryKey(),
  userId:        int("userId").notNull(),
  clientId:      varchar("clientId", { length: 64 }).notNull(),  // original localStorage ID
  date:          varchar("date", { length: 10 }).notNull(),       // "2025-05-08"
  checkInTime:   varchar("checkInTime", { length: 8 }).notNull(), // "09:35"
  checkOutTime:  varchar("checkOutTime", { length: 8 }),
  sessionType:   varchar("sessionType", { length: 64 }).notNull(),
  exercises:     text("exercises").notNull(),   // JSON array of ExerciseLog
  cardio:        text("cardio"),               // JSON CardioLog or null
  aqua:          text("aqua"),                 // JSON AquaLog or null
  sauna:         text("sauna"),                // JSON SaunaLog or null
  mood:          varchar("mood", { length: 4 }),
  energyLevel:   int("energyLevel"),
  notes:         text("notes"),
  bodyWeight:    decimal("bodyWeight", { precision: 5, scale: 2 }),
  caloriesBurned: int("caloriesBurned"),
  isActive:      boolean("isActive").default(false).notNull(),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GymSession = typeof gymSessions.$inferSelect;
export type InsertGymSession = typeof gymSessions.$inferInsert;

// ── Weight Logs (cross-device sync) ─────────────────────────────────────────
export const weightLogs = mysqlTable("weight_logs", {
  id:        int("id").autoincrement().primaryKey(),
  userId:    int("userId").notNull(),
  date:      varchar("date", { length: 10 }).notNull(),  // "2025-05-08"
  weight:    decimal("weight", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeightLog = typeof weightLogs.$inferSelect;
export type InsertWeightLog = typeof weightLogs.$inferInsert;


// ── Admin Broadcast Notifications (in-app popup + email) ────────────────────
export const adminNotifications = mysqlTable("admin_notifications", {
  id:           int("id").autoincrement().primaryKey(),
  title:        varchar("title", { length: 255 }).notNull(),
  titleAr:      varchar("titleAr", { length: 255 }),
  message:      text("message").notNull(),
  messageAr:    text("messageAr"),
  imageUrl:     varchar("imageUrl", { length: 512 }),
  ctaText:      varchar("ctaText", { length: 128 }),
  ctaTextAr:    varchar("ctaTextAr", { length: 128 }),
  ctaLink:      varchar("ctaLink", { length: 512 }),
  /** Delivery channels: inapp | email | both */
  channel:      mysqlEnum("channel", ["inapp", "email", "both"]).default("inapp").notNull(),
  /** Targeting: all | active_subscribers | new_subscribers | specific */
  target:       mysqlEnum("target", ["all", "active_subscribers", "new_subscribers", "specific"]).default("all").notNull(),
  targetEmail:  varchar("targetEmail", { length: 320 }),  // used when target = 'specific'
  type:         mysqlEnum("type", ["update", "news", "offer", "reminder", "other"]).default("other").notNull(),
  sentBy:       varchar("sentBy", { length: 255 }),
  recipientCount: int("recipientCount").default(0).notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

// Tracks which users have read/dismissed each admin notification
export const notificationReads = mysqlTable("notification_reads", {
  id:             int("id").autoincrement().primaryKey(),
  notificationId: int("notificationId").notNull(),
  userId:         int("userId").notNull(),
  readAt:         timestamp("readAt").defaultNow().notNull(),
});
export type NotificationRead = typeof notificationReads.$inferSelect;
export type InsertNotificationRead = typeof notificationReads.$inferInsert;

// ── Device Sessions (single-device enforcement) ──────────────────────────────
export const deviceSessions = mysqlTable("device_sessions", {
  id:           int("id").autoincrement().primaryKey(),
  userId:       int("userId").notNull(),
  deviceId:     varchar("deviceId", { length: 128 }).notNull(),
  userAgent:    text("userAgent"),
  ipAddress:    varchar("ipAddress", { length: 64 }),
  revoked:      boolean("revoked").default(false).notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  expiresAt:    timestamp("expiresAt").notNull(),
});
export type DeviceSession = typeof deviceSessions.$inferSelect;
export type InsertDeviceSession = typeof deviceSessions.$inferInsert;

// ── Meal Favorites (quick-add saved meals) ───────────────────────────────────
export const mealFavorites = mysqlTable("meal_favorites", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  name:        varchar("name", { length: 255 }).notNull(),
  nameAr:      varchar("nameAr", { length: 255 }),
  calories:    int("calories").notNull().default(0),
  proteinG:    double("proteinG").notNull().default(0),
  carbsG:      double("carbsG").notNull().default(0),
  fatG:        double("fatG").notNull().default(0),
  mealType:    mysqlEnum("mealType", ["breakfast", "lunch", "dinner", "snack", "drink", "coffee", "protein_shake"]).notNull().default("snack"),
  servingSize: varchar("servingSize", { length: 64 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type MealFavorite = typeof mealFavorites.$inferSelect;
export type InsertMealFavorite = typeof mealFavorites.$inferInsert;

// ── User Follows ──────────────────────────────────────────────────────────────
export const userFollows = mysqlTable("user_follows", {
  id:          int("id").autoincrement().primaryKey(),
  followerId:  int("followerId").notNull(),   // the user who follows
  followingId: int("followingId").notNull(),  // the user being followed
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;

// ── Direct Messages ───────────────────────────────────────────────────────────
export const directMessages = mysqlTable("direct_messages", {
  id:         int("id").autoincrement().primaryKey(),
  senderId:   int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  content:    text("content").notNull(),
  isRead:     boolean("isRead").default(false).notNull(),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
});
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = typeof directMessages.$inferInsert;

// ── Community Post Bookmarks ──────────────────────────────────────────────────
export const communityBookmarks = mysqlTable("community_bookmarks", {
  id:        int("id").autoincrement().primaryKey(),
  userId:    int("userId").notNull(),
  postId:    int("postId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CommunityBookmark = typeof communityBookmarks.$inferSelect;
export type InsertCommunityBookmark = typeof communityBookmarks.$inferInsert;

// ── Community Post Reports (moderation) ──────────────────────────────────────
export const communityReportPosts = mysqlTable("community_report_posts", {
  id:         int("id").autoincrement().primaryKey(),
  postId:     int("postId").notNull(),
  reporterId: int("reporterId").notNull(),
  reason:     varchar("reason", { length: 255 }).notNull(),
  status:     mysqlEnum("status", ["pending", "resolved", "dismissed"]).default("pending").notNull(),
  adminNote:  text("adminNote"),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});
export type CommunityReportPost = typeof communityReportPosts.$inferSelect;
export type InsertCommunityReportPost = typeof communityReportPosts.$inferInsert;

// ── Exercise Favorites ────────────────────────────────────────────────────────
// Stores user-favorited exercises. exerciseId is the string key from exercises.ts
// (e.g. "squat_db", "bicep_curl"). Does NOT affect workout plans or sessions.
export const exerciseFavorites = mysqlTable("exercise_favorites", {
  id:         int("id").autoincrement().primaryKey(),
  userId:     int("userId").notNull(),
  exerciseId: varchar("exerciseId", { length: 128 }).notNull(),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
});
export type ExerciseFavorite = typeof exerciseFavorites.$inferSelect;
export type InsertExerciseFavorite = typeof exerciseFavorites.$inferInsert;

// ── Gym Classes System ────────────────────────────────────────────────────────

// Gyms — each gym has a name, optional logo, and brand color
export const gyms = mysqlTable("gyms", {
  id:         int("id").autoincrement().primaryKey(),
  name:       varchar("name", { length: 255 }).notNull(),
  logoUrl:    text("logoUrl"),
  brandColor: varchar("brandColor", { length: 7 }).default("#1B2E5E"),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
  updatedAt:  timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Gym = typeof gyms.$inferSelect;
export type InsertGym = typeof gyms.$inferInsert;

// Branches — each branch belongs to a gym
export const gymBranches = mysqlTable("gym_branches", {
  id:        int("id").autoincrement().primaryKey(),
  gymId:     int("gymId").notNull(),
  name:      varchar("name", { length: 255 }).notNull(),
  location:  varchar("location", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GymBranch = typeof gymBranches.$inferSelect;
export type InsertGymBranch = typeof gymBranches.$inferInsert;

// Gym Classes — one row per class per weekday
export const gymClasses = mysqlTable("gym_classes", {
  id:               int("id").autoincrement().primaryKey(),
  gymId:            int("gymId").notNull(),
  branchId:         int("branchId").notNull(),
  className:        varchar("className", { length: 255 }).notNull(),
  coach:            varchar("coach", { length: 255 }).notNull(),
  day:              mysqlEnum("day", ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]).notNull(),
  time:             varchar("time", { length: 20 }).notNull(),   // e.g. "07:00 PM"
  durationMin:      int("durationMin").notNull().default(60),
  intensity:        mysqlEnum("intensity", ["Beginner","Intermediate","Advanced"]).notNull().default("Beginner"),
  caloriesOverride: int("caloriesOverride"),                     // null = auto-estimate
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GymClass = typeof gymClasses.$inferSelect;
export type InsertGymClass = typeof gymClasses.$inferInsert;

// Joined Classes — tracks when a user presses Join on a class card
export const joinedClasses = mysqlTable("joined_classes", {
  id:             int("id").autoincrement().primaryKey(),
  userId:         int("userId").notNull(),
  classId:        int("classId").notNull(),
  joinedAt:       timestamp("joinedAt").defaultNow().notNull(),
  caloriesBurned: int("caloriesBurned").notNull().default(0),
  xpAwarded:      int("xpAwarded").notNull().default(0),
  sessionId:      int("sessionId"),  // linked gym_sessions row (null if not yet synced)
});
export type JoinedClass = typeof joinedClasses.$inferSelect;
export type InsertJoinedClass = typeof joinedClasses.$inferInsert;

// ── CMS: Site Appearance ─────────────────────────────────────────────────────
// One row (id=1) stores global site appearance settings
export const siteAppearance = mysqlTable("site_appearance", {
  id:              int("id").autoincrement().primaryKey(),
  primaryColor:    varchar("primaryColor", { length: 32 }).default("#1B2E5E").notNull(),
  accentColor:     varchar("accentColor", { length: 32 }).default("#7BB8D4").notNull(),
  bgColor:         varchar("bgColor", { length: 32 }).default("#F0F4F8").notNull(),
  textColor:       varchar("textColor", { length: 32 }).default("#1B2E5E").notNull(),
  fontFamily:      varchar("fontFamily", { length: 128 }).default("Inter").notNull(),
  logoUrl:         text("logoUrl"),
  logoKey:         text("logoKey"),
  bannerUrl:       text("bannerUrl"),
  bannerKey:       text("bannerKey"),
  footerText:      text("footerText"),
  footerLinks:     text("footerLinks"),   // JSON array: [{label, url}]
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SiteAppearance = typeof siteAppearance.$inferSelect;
export type InsertSiteAppearance = typeof siteAppearance.$inferInsert;

// ── CMS: Exercise Overrides ───────────────────────────────────────────────────
// One row per exercise ID — overrides the hardcoded exerciseData.ts values
export const exerciseOverrides = mysqlTable("exercise_overrides", {
  id:          int("id").autoincrement().primaryKey(),
  exerciseId:  varchar("exerciseId", { length: 64 }).notNull().unique(),
  name:        varchar("name", { length: 255 }),
  nameAr:      varchar("nameAr", { length: 255 }),
  sets:        varchar("sets", { length: 32 }),
  reps:        varchar("reps", { length: 32 }),
  rest:        varchar("rest", { length: 32 }),
  notes:       text("notes"),
  notesAr:     text("notesAr"),
  imageUrl:    text("imageUrl"),
  imageKey:    text("imageKey"),
  youtubeUrl:  text("youtubeUrl"),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ExerciseOverride = typeof exerciseOverrides.$inferSelect;
export type InsertExerciseOverride = typeof exerciseOverrides.$inferInsert;

// ── CMS: Session Icon Overrides ───────────────────────────────────────────────
// One row per session type — overrides the default workout card icon
export const sessionIconOverrides = mysqlTable("session_icon_overrides", {
  id:          int("id").autoincrement().primaryKey(),
  sessionType: varchar("sessionType", { length: 64 }).notNull().unique(),
  iconUrl:     text("iconUrl").notNull(),
  iconKey:     text("iconKey"),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SessionIconOverride = typeof sessionIconOverrides.$inferSelect;
export type InsertSessionIconOverride = typeof sessionIconOverrides.$inferInsert;

// ── CMS: App Error Logs ───────────────────────────────────────────────────────
// Stores client-side and server-side errors reported from the app
export const appErrorLogs = mysqlTable("app_error_logs", {
  id:          int("id").autoincrement().primaryKey(),
  severity:    mysqlEnum("severity", ["error", "warning", "info"]).default("error").notNull(),
  source:      mysqlEnum("source", ["client", "server"]).default("client").notNull(),
  message:     text("message").notNull(),
  stack:       text("stack"),
  url:         text("url"),
  userId:      int("userId"),
  userEmail:   varchar("userEmail", { length: 320 }),
  resolved:    boolean("resolved").default(false).notNull(),
  resolvedAt:  timestamp("resolvedAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type AppErrorLog = typeof appErrorLogs.$inferSelect;
export type InsertAppErrorLog = typeof appErrorLogs.$inferInsert;
