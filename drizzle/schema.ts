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

// Social notifications — per-user inbox for likes, comments, etc.
export const socialNotifications = mysqlTable("social_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),        // recipient
  actorId: int("actorId").notNull(),       // who triggered it
  type: mysqlEnum("type", ["like", "cheer", "fire", "comment", "achievement", "mention"]).notNull(),
  postId: int("postId"),                   // related post (if any)
  message: text("message").notNull(),
  messageEn: text("messageEn"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialNotification = typeof socialNotifications.$inferSelect;
export type InsertSocialNotification = typeof socialNotifications.$inferInsert;

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
