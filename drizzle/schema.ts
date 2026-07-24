import {
  boolean,
  doublePrecision,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * PostgreSQL schema (ported from MySQL/TiDB during the standalone migration).
 *
 * Notes for maintainers:
 * - Every enum is a distinct pgEnum with a unique Postgres type name
 *   (<table>_<column>). Postgres enum type names must be globally unique.
 * - MySQL's `.onUpdateNow()` has no Postgres equivalent, so `updatedAt` columns
 *   default to now() on insert only; callers set `updatedAt: new Date()` on
 *   update where freshness matters.
 * - `numeric` (was `decimal`) is returned as a string by the driver, same as
 *   mysql2, so application code is unaffected.
 */

// ── Enum types ────────────────────────────────────────────────────────────────
export const usersAuthProviderEnum = pgEnum("users_auth_provider", ["manus", "email", "google"]);
export const usersRoleEnum = pgEnum("users_role", ["user", "admin"]);
export const usersGenderEnum = pgEnum("users_gender", ["male", "female"]);
export const coachChatRoleEnum = pgEnum("coach_chat_role", ["user", "assistant"]);
export const communityPostsTypeEnum = pgEnum("community_posts_type", ["text", "image", "achievement", "transformation", "auto"]);
export const communityPostsVisibilityEnum = pgEnum("community_posts_visibility", ["public", "friends", "private"]);
export const communityReactionsTypeEnum = pgEnum("community_reactions_type", ["like", "cheer", "fire"]);
export const communityStoriesTypeEnum = pgEnum("community_stories_type", ["streak", "achievement", "workout", "progress"]);
export const communityChallengesTypeEnum = pgEnum("community_challenges_type", ["streak", "sessions", "cardio", "weight", "custom"]);
export const socialNotificationsTypeEnum = pgEnum("social_notifications_type", ["like", "cheer", "fire", "comment", "achievement", "mention", "follow", "reply", "message"]);
export const broadcastNotificationsTypeEnum = pgEnum("broadcast_notifications_type", ["update", "news", "offer", "reminder", "other"]);
export const subscriptionsPlanEnum = pgEnum("subscriptions_plan", ["free", "prime_plus", "prime_pro"]);
export const subscriptionsStatusEnum = pgEnum("subscriptions_status", ["active", "expired", "cancelled", "trialing", "pending"]);
export const subscriptionsPeriodEnum = pgEnum("subscriptions_period", ["monthly", "yearly", "lifetime", "free_trial"]);
export const subscriptionsPaymentStatusEnum = pgEnum("subscriptions_payment_status", ["paid", "pending", "failed", "refunded", "free"]);
export const subscriptionsPaymentProviderEnum = pgEnum("subscriptions_payment_provider", ["myfatoorah", "manual", "free"]);
export const billingHistoryPlanEnum = pgEnum("billing_history_plan", ["free", "prime_plus", "prime_pro"]);
export const billingHistoryPeriodEnum = pgEnum("billing_history_period", ["monthly", "yearly"]);
export const billingHistoryStatusEnum = pgEnum("billing_history_status", ["paid", "failed", "refunded", "pending"]);
export const rewardProbabilitiesTypeEnum = pgEnum("reward_probabilities_type", ["premium_days", "xp_bonus", "badge", "ai_boost", "streak_protection", "workout_unlock", "ai_insights", "upgrade"]);
export const rewardRarityEnum = pgEnum("reward_rarity", ["common", "uncommon", "rare", "jackpot"]);
export const rewardSpinsStatusEnum = pgEnum("reward_spins_status", ["pending", "spun", "claimed"]);
export const rewardHistoryRarityEnum = pgEnum("reward_history_rarity", ["common", "uncommon", "rare", "jackpot"]);
export const mealTypeEnum = pgEnum("meal_type", ["breakfast", "lunch", "dinner", "snack"]);
export const mealLogsMealTypeEnum = pgEnum("meal_logs_meal_type", ["breakfast", "lunch", "dinner", "snack"]);
export const mealFavoritesMealTypeEnum = pgEnum("meal_favorites_meal_type", ["breakfast", "lunch", "dinner", "snack", "drink", "coffee", "protein_shake"]);
export const nutritionInsightsTypeEnum = pgEnum("nutrition_insights_type", ["protein", "hydration", "calories", "macros", "recovery", "general"]);
export const nutritionInsightsPriorityEnum = pgEnum("nutrition_insights_priority", ["high", "medium", "low"]);
export const mealLogItemsConfidenceEnum = pgEnum("meal_log_items_confidence", ["high", "medium", "low"]);
export const adminNotificationsChannelEnum = pgEnum("admin_notifications_channel", ["inapp", "email", "both"]);
export const adminNotificationsTargetEnum = pgEnum("admin_notifications_target", ["all", "active_subscribers", "new_subscribers", "specific"]);
export const adminNotificationsTypeEnum = pgEnum("admin_notifications_type", ["update", "news", "offer", "reminder", "other"]);
export const communityReportStatusEnum = pgEnum("community_report_status", ["pending", "resolved", "dismissed"]);
export const gymClassesDayEnum = pgEnum("gym_classes_day", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
export const gymClassesIntensityEnum = pgEnum("gym_classes_intensity", ["Beginner", "Intermediate", "Advanced"]);
export const appErrorSeverityEnum = pgEnum("app_error_severity", ["error", "warning", "info"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  /** OAuth/standalone identifier (openId). Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  fullName: varchar("fullName", { length: 255 }),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  authProvider: usersAuthProviderEnum("authProvider").default("manus").notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: usersRoleEnum("role").default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  resetToken: varchar("resetToken", { length: 128 }),
  resetTokenExpiresAt: timestamp("resetTokenExpiresAt"),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  age: integer("age"),
  height: integer("height"),
  currentWeight: numeric("currentWeight", { precision: 5, scale: 2 }),
  targetWeight: numeric("targetWeight", { precision: 5, scale: 2 }),
  gender: usersGenderEnum("gender"),
  activeDeviceId: varchar("activeDeviceId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  isBanned: boolean("isBanned").default(false).notNull(),
  bannedAt: timestamp("bannedAt"),
  banReason: text("banReason"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const accessCodes = pgTable("access_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 128 }).notNull().unique(),
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  note: text("note"),
  isActive: boolean("isActive").default(true).notNull(),
  usedAt: timestamp("usedAt"),
  orderId: integer("orderId").unique(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccessCode = typeof accessCodes.$inferSelect;
export type InsertAccessCode = typeof accessCodes.$inferInsert;

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: varchar("auth", { length: 512 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  enabled: boolean("enabled").default(false).notNull(),
  reminderTime: varchar("reminderTime", { length: 5 }).default("09:00").notNull(),
  days: varchar("days", { length: 64 }).default("1,2,3,4,5").notNull(),
  language: varchar("language", { length: 8 }).default("ar").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  communityNotifs: boolean("communityNotifs").default(true).notNull(),
  appUpdatesNotifs: boolean("appUpdatesNotifs").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;

// ── My Coach ─────────────────────────────────────────────────────────────────

export const coachChatHistory = pgTable("coach_chat_history", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  role: coachChatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachChatMessage = typeof coachChatHistory.$inferSelect;
export type InsertCoachChatMessage = typeof coachChatHistory.$inferInsert;

export const coachCheckins = pgTable("coach_checkins", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  feeling: integer("feeling").notNull(),
  energy: integer("energy").notNull(),
  sleep: integer("sleep").notNull(),
  aiResponse: text("aiResponse"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachCheckin = typeof coachCheckins.$inferSelect;
export type InsertCoachCheckin = typeof coachCheckins.$inferInsert;

export const coachInsights = pgTable("coach_insights", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  content: text("content").notNull(),
  contentEn: text("contentEn"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachInsight = typeof coachInsights.$inferSelect;
export type InsertCoachInsight = typeof coachInsights.$inferInsert;

export const coachMemory = pgTable("coach_memory", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  goalWeight: integer("goalWeight"),
  currentWeight: integer("currentWeight"),
  preferredLanguage: varchar("preferredLanguage", { length: 8 }).default("ar"),
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CoachMemory = typeof coachMemory.$inferSelect;
export type InsertCoachMemory = typeof coachMemory.$inferInsert;

// ── Community ─────────────────────────────────────────────────────────────────

export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: communityPostsTypeEnum("type").default("text").notNull(),
  content: text("content").notNull(),
  contentEn: text("contentEn"),
  imageUrl: text("imageUrl"),
  imageKey: text("imageKey"),
  visibility: communityPostsVisibilityEnum("visibility").default("public").notNull(),
  xpAwarded: integer("xpAwarded").default(0).notNull(),
  likesCount: integer("likesCount").default(0).notNull(),
  commentsCount: integer("commentsCount").default(0).notNull(),
  isTrending: boolean("isTrending").default(false).notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  isHidden: boolean("isHidden").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;

export const communityReactions = pgTable("community_reactions", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  type: communityReactionsTypeEnum("type").default("like").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityReaction = typeof communityReactions.$inferSelect;
export type InsertCommunityReaction = typeof communityReactions.$inferInsert;

export const communityComments = pgTable("community_comments", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = typeof communityComments.$inferInsert;

export const communityStories = pgTable("community_stories", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: communityStoriesTypeEnum("type").default("workout").notNull(),
  content: text("content").notNull(),
  contentEn: text("contentEn"),
  imageUrl: text("imageUrl"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityStory = typeof communityStories.$inferSelect;
export type InsertCommunityStory = typeof communityStories.$inferInsert;

export const communityChallenges = pgTable("community_challenges", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }).notNull(),
  description: text("description").notNull(),
  descriptionAr: text("descriptionAr").notNull(),
  type: communityChallengesTypeEnum("type").default("sessions").notNull(),
  targetValue: integer("targetValue").default(7).notNull(),
  xpReward: integer("xpReward").default(100).notNull(),
  startDate: varchar("startDate", { length: 10 }).notNull(),
  endDate: varchar("endDate", { length: 10 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  participantsCount: integer("participantsCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityChallenge = typeof communityChallenges.$inferSelect;
export type InsertCommunityChallenge = typeof communityChallenges.$inferInsert;

export const challengeParticipants = pgTable("challenge_participants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challengeId").notNull(),
  userId: integer("userId").notNull(),
  progress: integer("progress").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = typeof challengeParticipants.$inferInsert;

export const socialNotifications = pgTable("social_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  actorId: integer("actorId").notNull(),
  type: socialNotificationsTypeEnum("type").notNull(),
  postId: integer("postId"),
  commentId: integer("commentId"),
  messageId: integer("messageId"),
  replyId: integer("replyId"),
  actorName: varchar("actorName", { length: 255 }),
  actorAvatar: text("actorAvatar"),
  message: text("message").notNull(),
  messageEn: text("messageEn"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialNotification = typeof socialNotifications.$inferSelect;
export type InsertSocialNotification = typeof socialNotifications.$inferInsert;

export const userPrivacySettings = pgTable("user_privacy_settings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserPrivacySettings = typeof userPrivacySettings.$inferSelect;
export type InsertUserPrivacySettings = typeof userPrivacySettings.$inferInsert;

export const communityXpLog = pgTable("community_xp_log", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  event: varchar("event", { length: 64 }).notNull(),
  points: integer("points").notNull(),
  refId: integer("refId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityXpLog = typeof communityXpLog.$inferSelect;
export type InsertCommunityXpLog = typeof communityXpLog.$inferInsert;

export const adminProfile = pgTable("admin_profile", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 320 }),
  photoUrl: text("photoUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AdminProfile = typeof adminProfile.$inferSelect;
export type InsertAdminProfile = typeof adminProfile.$inferInsert;

export const broadcastNotifications = pgTable("broadcast_notifications", {
  id: serial("id").primaryKey(),
  subject: varchar("subject", { length: 512 }).notNull(),
  body: text("body").notNull(),
  type: broadcastNotificationsTypeEnum("type").default("news").notNull(),
  recipientCount: integer("recipientCount").default(0).notNull(),
  sentBy: varchar("sentBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BroadcastNotification = typeof broadcastNotifications.$inferSelect;
export type InsertBroadcastNotification = typeof broadcastNotifications.$inferInsert;

// ── MyFatoorah Subscriptions ──────────────────────────────────────────────────
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull().unique(),
  plan: subscriptionsPlanEnum("plan").default("free").notNull(),
  status: subscriptionsStatusEnum("status").default("active").notNull(),
  period: subscriptionsPeriodEnum("period").default("monthly").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  startsAt: timestamp("startsAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  invoiceId: varchar("invoiceId", { length: 255 }),
  licenseKey: varchar("licenseKey", { length: 128 }),
  email: varchar("email", { length: 320 }),
  activationCodeId: integer("activationCodeId"),
  paymentStatus: subscriptionsPaymentStatusEnum("paymentStatus").default("free").notNull(),
  paymentProvider: subscriptionsPaymentProviderEnum("paymentProvider").default("free").notNull(),
  transactionId: varchar("transactionId", { length: 255 }),
  autoRenew: boolean("autoRenew").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export const billingHistory = pgTable("billing_history", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  plan: billingHistoryPlanEnum("plan").notNull(),
  period: billingHistoryPeriodEnum("period").notNull(),
  amount: varchar("amount", { length: 32 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("KWD").notNull(),
  status: billingHistoryStatusEnum("status").notNull(),
  invoiceId: varchar("invoiceId", { length: 255 }).notNull(),
  paymentRef: varchar("paymentRef", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BillingHistory = typeof billingHistory.$inferSelect;
export type InsertBillingHistory = typeof billingHistory.$inferInsert;

// ── Post Mentions ─────────────────────────────────────────────────────────────
export const postMentions = pgTable("post_mentions", {
  id: serial("id").primaryKey(),
  mentionedId: integer("mentionedId").notNull(),
  actorId: integer("actorId").notNull(),
  postId: integer("postId").notNull(),
  commentId: integer("commentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PostMention = typeof postMentions.$inferSelect;
export type InsertPostMention = typeof postMentions.$inferInsert;

// ── Spin Wheel System ─────────────────────────────────────────────────────────
export const rewardProbabilities = pgTable("reward_probabilities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  nameAr: varchar("nameAr", { length: 128 }).notNull(),
  type: rewardProbabilitiesTypeEnum("type").notNull(),
  rarity: rewardRarityEnum("rarity").notNull(),
  weight: integer("weight").notNull().default(100),
  value: integer("value").default(0),
  icon: varchar("icon", { length: 64 }).default("🎁"),
  color: varchar("color", { length: 16 }).default("#7BB8D4"),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type RewardProbability = typeof rewardProbabilities.$inferSelect;
export type InsertRewardProbability = typeof rewardProbabilities.$inferInsert;

export const rewardSpins = pgTable("reward_spins", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  challengeId: integer("challengeId").notNull(),
  rewardId: integer("rewardId"),
  status: rewardSpinsStatusEnum("status").default("pending").notNull(),
  spinToken: varchar("spinToken", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  spunAt: timestamp("spunAt"),
  claimedAt: timestamp("claimedAt"),
});
export type RewardSpin = typeof rewardSpins.$inferSelect;
export type InsertRewardSpin = typeof rewardSpins.$inferInsert;

export const rewardHistory = pgTable("reward_history", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  spinId: integer("spinId").notNull(),
  rewardId: integer("rewardId").notNull(),
  rewardName: varchar("rewardName", { length: 128 }).notNull(),
  rarity: rewardHistoryRarityEnum("rarity").notNull(),
  value: integer("value").default(0),
  appliedAt: timestamp("appliedAt").defaultNow().notNull(),
});
export type RewardHistory = typeof rewardHistory.$inferSelect;
export type InsertRewardHistory = typeof rewardHistory.$inferInsert;

export const challengeRewards = pgTable("challenge_rewards", {
  id: serial("id").primaryKey(),
  challengeId: integer("challengeId").notNull(),
  rewardId: integer("rewardId").notNull(),
  weightOverride: integer("weightOverride"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ChallengeReward = typeof challengeRewards.$inferSelect;

export const jackpotWinners = pgTable("jackpot_winners", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  spinId: integer("spinId").notNull(),
  rewardId: integer("rewardId").notNull(),
  rewardName: varchar("rewardName", { length: 128 }).notNull(),
  wonAt: timestamp("wonAt").defaultNow().notNull(),
  notifiedAdmin: boolean("notifiedAdmin").default(false).notNull(),
});
export type JackpotWinner = typeof jackpotWinners.$inferSelect;

// ── AI Nutrition System ────────────────────────────────────────────────────────
export const nutritionGoals = pgTable("nutrition_goals", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  calories: integer("calories").notNull().default(2000),
  proteinG: integer("proteinG").notNull().default(150),
  carbsG: integer("carbsG").notNull().default(200),
  fatG: integer("fatG").notNull().default(65),
  waterMl: integer("waterMl").notNull().default(2500),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type InsertNutritionGoal = typeof nutritionGoals.$inferInsert;

export const mealEntries = pgTable("meal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  mealType: mealTypeEnum("mealType").notNull(),
  foodName: varchar("foodName", { length: 255 }).notNull(),
  foodNameAr: varchar("foodNameAr", { length: 255 }),
  calories: integer("calories").notNull().default(0),
  proteinG: doublePrecision("proteinG").notNull().default(0),
  carbsG: doublePrecision("carbsG").notNull().default(0),
  fatG: doublePrecision("fatG").notNull().default(0),
  servingSize: varchar("servingSize", { length: 64 }),
  imageUrl: varchar("imageUrl", { length: 512 }),
  addedByAI: boolean("addedByAI").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MealEntry = typeof mealEntries.$inferSelect;
export type InsertMealEntry = typeof mealEntries.$inferInsert;

export const waterLogs = pgTable("water_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  amountMl: integer("amountMl").notNull().default(250),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
});
export type WaterLog = typeof waterLogs.$inferSelect;
export type InsertWaterLog = typeof waterLogs.$inferInsert;

export const nutritionInsights = pgTable("nutrition_insights", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: nutritionInsightsTypeEnum("type").notNull(),
  content: text("content").notNull(),
  contentAr: text("contentAr"),
  priority: nutritionInsightsPriorityEnum("priority").notNull().default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type NutritionInsight = typeof nutritionInsights.$inferSelect;
export type InsertNutritionInsight = typeof nutritionInsights.$inferInsert;

export const mealLogs = pgTable("meal_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  mealType: mealLogsMealTypeEnum("mealType").notNull(),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }),
  notes: text("notes"),
  insightAr: text("insightAr"),
  insightEn: text("insightEn"),
  totalCalories: doublePrecision("totalCalories").notNull().default(0),
  totalProtein: doublePrecision("totalProtein").notNull().default(0),
  totalCarbs: doublePrecision("totalCarbs").notNull().default(0),
  totalFat: doublePrecision("totalFat").notNull().default(0),
  totalFiber: doublePrecision("totalFiber").notNull().default(0),
  totalSugar: doublePrecision("totalSugar").notNull().default(0),
  totalSodium: doublePrecision("totalSodium").notNull().default(0),
});
export type MealLog = typeof mealLogs.$inferSelect;
export type InsertMealLog = typeof mealLogs.$inferInsert;

export const mealLogItems = pgTable("meal_log_items", {
  id: serial("id").primaryKey(),
  mealLogId: integer("mealLogId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  estimatedGrams: doublePrecision("estimatedGrams").notNull().default(100),
  portionDesc: varchar("portionDesc", { length: 255 }),
  portionDescAr: varchar("portionDescAr", { length: 255 }),
  fdcId: integer("fdcId"),
  confidence: mealLogItemsConfidenceEnum("confidence").notNull().default("high"),
  calories: doublePrecision("calories").notNull().default(0),
  protein: doublePrecision("protein").notNull().default(0),
  carbs: doublePrecision("carbs").notNull().default(0),
  fat: doublePrecision("fat").notNull().default(0),
  fiber: doublePrecision("fiber").notNull().default(0),
  sugar: doublePrecision("sugar").notNull().default(0),
  sodium: doublePrecision("sodium").notNull().default(0),
  per100gCalories: doublePrecision("per100gCalories").notNull().default(0),
  per100gProtein: doublePrecision("per100gProtein").notNull().default(0),
  per100gCarbs: doublePrecision("per100gCarbs").notNull().default(0),
  per100gFat: doublePrecision("per100gFat").notNull().default(0),
});
export type MealLogItem = typeof mealLogItems.$inferSelect;
export type InsertMealLogItem = typeof mealLogItems.$inferInsert;

// ── Health Reports & AI Medical Analysis ────────────────────────────────────
export const healthReports = pgTable("health_reports", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(),
  reportType: varchar("reportType", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type HealthReport = typeof healthReports.$inferSelect;
export type InsertHealthReport = typeof healthReports.$inferInsert;

export const aiHealthAnalysis = pgTable("ai_health_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  reportId: integer("reportId"),
  summaryEn: text("summaryEn").notNull(),
  summaryAr: text("summaryAr").notNull(),
  conditionsFound: text("conditionsFound"),
  restrictions: text("restrictions"),
  safeExercises: text("safeExercises"),
  warningExercises: text("warningExercises"),
  recoveryTips: text("recoveryTips"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AiHealthAnalysis = typeof aiHealthAnalysis.$inferSelect;
export type InsertAiHealthAnalysis = typeof aiHealthAnalysis.$inferInsert;

export const personalizedPrograms = pgTable("personalized_programs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  analysisId: integer("analysisId"),
  titleEn: varchar("titleEn", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }).notNull(),
  descriptionEn: text("descriptionEn").notNull(),
  descriptionAr: text("descriptionAr").notNull(),
  weeklyPlan: text("weeklyPlan").notNull(),
  cardioGuidance: text("cardioGuidance"),
  stretchingPlan: text("stretchingPlan"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PersonalizedProgram = typeof personalizedPrograms.$inferSelect;
export type InsertPersonalizedProgram = typeof personalizedPrograms.$inferInsert;

// ── Workout Sessions (cross-device sync) ────────────────────────────────────
export const gymSessions = pgTable("gym_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  clientId: varchar("clientId", { length: 64 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  checkInTime: varchar("checkInTime", { length: 8 }).notNull(),
  checkOutTime: varchar("checkOutTime", { length: 8 }),
  sessionType: varchar("sessionType", { length: 64 }).notNull(),
  exercises: text("exercises").notNull(),
  cardio: text("cardio"),
  aqua: text("aqua"),
  sauna: text("sauna"),
  mood: varchar("mood", { length: 4 }),
  energyLevel: integer("energyLevel"),
  notes: text("notes"),
  bodyWeight: numeric("bodyWeight", { precision: 5, scale: 2 }),
  caloriesBurned: integer("caloriesBurned"),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GymSession = typeof gymSessions.$inferSelect;
export type InsertGymSession = typeof gymSessions.$inferInsert;

// ── Weight Logs (cross-device sync) ─────────────────────────────────────────
export const weightLogs = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  weight: numeric("weight", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeightLog = typeof weightLogs.$inferSelect;
export type InsertWeightLog = typeof weightLogs.$inferInsert;

// ── Admin Broadcast Notifications (in-app popup + email) ────────────────────
export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }),
  message: text("message").notNull(),
  messageAr: text("messageAr"),
  imageUrl: varchar("imageUrl", { length: 512 }),
  ctaText: varchar("ctaText", { length: 128 }),
  ctaTextAr: varchar("ctaTextAr", { length: 128 }),
  ctaLink: varchar("ctaLink", { length: 512 }),
  channel: adminNotificationsChannelEnum("channel").default("inapp").notNull(),
  target: adminNotificationsTargetEnum("target").default("all").notNull(),
  targetEmail: varchar("targetEmail", { length: 320 }),
  type: adminNotificationsTypeEnum("type").default("other").notNull(),
  sentBy: varchar("sentBy", { length: 255 }),
  recipientCount: integer("recipientCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

export const notificationReads = pgTable("notification_reads", {
  id: serial("id").primaryKey(),
  notificationId: integer("notificationId").notNull(),
  userId: integer("userId").notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
});
export type NotificationRead = typeof notificationReads.$inferSelect;
export type InsertNotificationRead = typeof notificationReads.$inferInsert;

// ── Device Sessions (single-device enforcement) ──────────────────────────────
export const deviceSessions = pgTable("device_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  deviceId: varchar("deviceId", { length: 128 }).notNull(),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  revoked: boolean("revoked").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});
export type DeviceSession = typeof deviceSessions.$inferSelect;
export type InsertDeviceSession = typeof deviceSessions.$inferInsert;

// ── Meal Favorites (quick-add saved meals) ───────────────────────────────────
export const mealFavorites = pgTable("meal_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  calories: integer("calories").notNull().default(0),
  proteinG: doublePrecision("proteinG").notNull().default(0),
  carbsG: doublePrecision("carbsG").notNull().default(0),
  fatG: doublePrecision("fatG").notNull().default(0),
  mealType: mealFavoritesMealTypeEnum("mealType").notNull().default("snack"),
  servingSize: varchar("servingSize", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MealFavorite = typeof mealFavorites.$inferSelect;
export type InsertMealFavorite = typeof mealFavorites.$inferInsert;

// ── User Follows ──────────────────────────────────────────────────────────────
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("followerId").notNull(),
  followingId: integer("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  // Postgres upserts (onConflictDoNothing) need this — MySQL previously relied
  // on implicit dedup. Prevents duplicate follow rows.
  uniqFollow: unique("user_follows_pair_unique").on(t.followerId, t.followingId),
}));
export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;

// ── Direct Messages ───────────────────────────────────────────────────────────
export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("senderId").notNull(),
  receiverId: integer("receiverId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = typeof directMessages.$inferInsert;

// ── Community Post Bookmarks ──────────────────────────────────────────────────
export const communityBookmarks = pgTable("community_bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  postId: integer("postId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  uniqBookmark: unique("community_bookmarks_pair_unique").on(t.userId, t.postId),
}));
export type CommunityBookmark = typeof communityBookmarks.$inferSelect;
export type InsertCommunityBookmark = typeof communityBookmarks.$inferInsert;

// ── Community Post Reports (moderation) ──────────────────────────────────────
export const communityReportPosts = pgTable("community_report_posts", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull(),
  reporterId: integer("reporterId").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  status: communityReportStatusEnum("status").default("pending").notNull(),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});
export type CommunityReportPost = typeof communityReportPosts.$inferSelect;
export type InsertCommunityReportPost = typeof communityReportPosts.$inferInsert;

// ── Exercise Favorites ────────────────────────────────────────────────────────
export const exerciseFavorites = pgTable("exercise_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  exerciseId: varchar("exerciseId", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ExerciseFavorite = typeof exerciseFavorites.$inferSelect;
export type InsertExerciseFavorite = typeof exerciseFavorites.$inferInsert;

// ── Gym Classes System ────────────────────────────────────────────────────────
export const gyms = pgTable("gyms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logoUrl"),
  brandColor: varchar("brandColor", { length: 7 }).default("#1B2E5E"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Gym = typeof gyms.$inferSelect;
export type InsertGym = typeof gyms.$inferInsert;

export const gymBranches = pgTable("gym_branches", {
  id: serial("id").primaryKey(),
  gymId: integer("gymId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type GymBranch = typeof gymBranches.$inferSelect;
export type InsertGymBranch = typeof gymBranches.$inferInsert;

export const gymClasses = pgTable("gym_classes", {
  id: serial("id").primaryKey(),
  gymId: integer("gymId").notNull(),
  branchId: integer("branchId").notNull(),
  className: varchar("className", { length: 255 }).notNull(),
  coach: varchar("coach", { length: 255 }).notNull(),
  day: gymClassesDayEnum("day").notNull(),
  time: varchar("time", { length: 20 }).notNull(),
  durationMin: integer("durationMin").notNull().default(60),
  intensity: gymClassesIntensityEnum("intensity").notNull().default("Beginner"),
  caloriesOverride: integer("caloriesOverride"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type GymClass = typeof gymClasses.$inferSelect;
export type InsertGymClass = typeof gymClasses.$inferInsert;

export const joinedClasses = pgTable("joined_classes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  classId: integer("classId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  caloriesBurned: integer("caloriesBurned").notNull().default(0),
  xpAwarded: integer("xpAwarded").notNull().default(0),
  sessionId: integer("sessionId"),
});
export type JoinedClass = typeof joinedClasses.$inferSelect;
export type InsertJoinedClass = typeof joinedClasses.$inferInsert;

// ── CMS Tables ──────────────────────────────────────────────────────────────
export const siteAppearance = pgTable("site_appearance", {
  id: serial("id").primaryKey(),
  primaryColor: varchar("primaryColor", { length: 20 }).notNull().default("#1B2E5E"),
  accentColor: varchar("accentColor", { length: 20 }).notNull().default("#7BB8D4"),
  bgColor: varchar("bgColor", { length: 20 }).notNull().default("#F0F4F8"),
  textColor: varchar("textColor", { length: 20 }).notNull().default("#1B2E5E"),
  fontFamily: varchar("fontFamily", { length: 100 }).notNull().default("Inter"),
  logoUrl: text("logoUrl"),
  bannerUrl: text("bannerUrl"),
  footerText: text("footerText"),
  footerLinks: text("footerLinks"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SiteAppearance = typeof siteAppearance.$inferSelect;

export const exerciseOverrides = pgTable("exercise_overrides", {
  id: serial("id").primaryKey(),
  exerciseId: varchar("exerciseId", { length: 100 }).notNull().unique(),
  imageUrl: text("imageUrl"),
  youtubeUrl: text("youtubeUrl"),
  nameEn: varchar("nameEn", { length: 255 }),
  nameAr: varchar("nameAr", { length: 255 }),
  sets: integer("sets"),
  reps: integer("reps"),
  restSec: integer("restSec"),
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ExerciseOverride = typeof exerciseOverrides.$inferSelect;

export const sessionIconOverrides = pgTable("session_icon_overrides", {
  id: serial("id").primaryKey(),
  sessionType: varchar("sessionType", { length: 100 }).notNull().unique(),
  iconUrl: text("iconUrl").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SessionIconOverride = typeof sessionIconOverrides.$inferSelect;

export const appErrorLogs = pgTable("app_error_logs", {
  id: serial("id").primaryKey(),
  severity: appErrorSeverityEnum("severity").notNull().default("error"),
  message: text("message").notNull(),
  stack: text("stack"),
  url: text("url"),
  userId: integer("userId"),
  userEmail: varchar("userEmail", { length: 255 }),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AppErrorLog = typeof appErrorLogs.$inferSelect;
