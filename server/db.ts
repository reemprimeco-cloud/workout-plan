import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, accessCodes, InsertAccessCode,
  pushSubscriptions, InsertPushSubscription,
  notificationSettings, InsertNotificationSettings,
  coachChatHistory, InsertCoachChatMessage,
  coachCheckins, InsertCoachCheckin,
  coachInsights, InsertCoachInsight,
  coachMemory, InsertCoachMemory,
  socialNotifications, InsertSocialNotification,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ── Access Codes ───────────────────────────────────────────────────────────

export async function verifyAccessCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(accessCodes)
    .where(eq(accessCodes.code, code.trim()))
    .limit(1);
  if (result.length === 0) return null;
  const row = result[0];
  if (!row.isActive) return null;
  // Mark as used if first time
  if (!row.usedAt) {
    await db.update(accessCodes)
      .set({ usedAt: new Date() })
      .where(eq(accessCodes.id, row.id));
  }
  return row;
}

export async function listAccessCodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessCodes).orderBy(accessCodes.createdAt);
}

export async function createAccessCode(data: InsertAccessCode) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.insert(accessCodes).values(data);
}

export async function getAccessCodeByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(accessCodes)
    .where(eq(accessCodes.orderId, orderId))
    .limit(1);
  return rows[0] ?? null;
}

export async function toggleAccessCode(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.update(accessCodes).set({ isActive }).where(eq(accessCodes.id, id));
}

export async function deleteAccessCode(id: number) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.delete(accessCodes).where(eq(accessCodes.id, id));
}

// ── Push Subscriptions ─────────────────────────────────────────────────────

export async function upsertPushSubscription(data: InsertPushSubscription) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  // Delete any existing subscription for this user before inserting new one
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, data.userId));
  await db.insert(pushSubscriptions).values(data);
}

export async function deletePushSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
}

export async function getPushSubscriptionByUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getAllActiveSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  // Join with notification_settings to get only users with notifications enabled
  const settings = await db.select().from(notificationSettings)
    .where(eq(notificationSettings.enabled, true));
  if (settings.length === 0) return [];
  const userIds = settings.map(s => s.userId);
  const subs = await db.select().from(pushSubscriptions);
  return subs.filter(s => userIds.includes(s.userId));
}

// ── Notification Settings ──────────────────────────────────────────────────

export async function getNotificationSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationSettings)
    .where(eq(notificationSettings.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertNotificationSettings(data: InsertNotificationSettings) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.insert(notificationSettings).values(data).onDuplicateKeyUpdate({
    set: {
      enabled: data.enabled,
      reminderTime: data.reminderTime,
      days: data.days,
      language: data.language,
      scheduleCronTaskUid: data.scheduleCronTaskUid,
    },
  });
}

export async function updateNotificationTaskUid(userId: number, taskUid: string | null) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.update(notificationSettings)
    .set({ scheduleCronTaskUid: taskUid })
    .where(eq(notificationSettings.userId, userId));
}

// ── Coach Chat History ────────────────────────────────────────────────────────────────────

export async function getChatHistory(userId: number, limit = 40) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(coachChatHistory)
    .where(eq(coachChatHistory.userId, userId))
    .orderBy(desc(coachChatHistory.createdAt))
    .limit(limit);
  return rows.reverse();
}

export async function saveChatMessage(data: InsertCoachChatMessage) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.insert(coachChatHistory).values(data);
}

export async function clearChatHistory(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.delete(coachChatHistory).where(eq(coachChatHistory.userId, userId));
}

// ── Coach Check-ins ────────────────────────────────────────────────────────────────────

export async function getTodayCheckin(userId: number, date: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(coachCheckins)
    .where(eq(coachCheckins.userId, userId))
    .limit(30);
  return result.find(r => r.date === date) ?? null;
}

export async function saveCheckin(data: InsertCoachCheckin) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.insert(coachCheckins).values(data);
}

export async function getRecentCheckins(userId: number, limit = 7) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachCheckins)
    .where(eq(coachCheckins.userId, userId))
    .orderBy(desc(coachCheckins.createdAt))
    .limit(limit);
}

// ── Coach Insights ────────────────────────────────────────────────────────────────────

export async function getInsights(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachInsights)
    .where(eq(coachInsights.userId, userId))
    .orderBy(desc(coachInsights.createdAt))
    .limit(limit);
}

export async function saveInsight(data: InsertCoachInsight) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.insert(coachInsights).values(data);
}

// ── Coach Memory ────────────────────────────────────────────────────────────────────

export async function getCoachMemory(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(coachMemory)
    .where(eq(coachMemory.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertCoachMemory(data: InsertCoachMemory) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.insert(coachMemory).values(data).onDuplicateKeyUpdate({
    set: {
      goalWeight: data.goalWeight,
      currentWeight: data.currentWeight,
      preferredLanguage: data.preferredLanguage,
      notes: data.notes,
    },
  });
}

// ── Community ─────────────────────────────────────────────────────────────────

import {
  communityPosts, InsertCommunityPost,
  communityReactions, InsertCommunityReaction,
  communityComments, InsertCommunityComment,
  communityStories,
  communityChallenges,
  challengeParticipants, InsertChallengeParticipant,
  communityXpLog, InsertCommunityXpLog,
} from "../drizzle/schema";
import { and, sql, sum, gte, lte } from "drizzle-orm";

// ── Posts ──────────────────────────────────────────────────────────────────────

export async function getCommunityFeed(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityPosts)
    .where(eq(communityPosts.visibility, "public"))
    .orderBy(desc(communityPosts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getTrendingPosts(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityPosts)
    .where(and(eq(communityPosts.visibility, "public"), eq(communityPosts.isTrending, true)))
    .orderBy(desc(communityPosts.likesCount))
    .limit(limit);
}

export async function createCommunityPost(data: InsertCommunityPost) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(communityPosts).values(data);
  // Return the newly inserted row
  const rows = await db.select().from(communityPosts)
    .where(eq(communityPosts.userId, data.userId))
    .orderBy(desc(communityPosts.createdAt)).limit(1);
  return rows[0] ?? null;
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(communityPosts).where(eq(communityPosts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function incrementPostLikes(postId: number, delta: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(communityPosts)
    .set({ likesCount: sql`${communityPosts.likesCount} + ${delta}` })
    .where(eq(communityPosts.id, postId));
}

export async function incrementPostComments(postId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(communityPosts)
    .set({ commentsCount: sql`${communityPosts.commentsCount} + 1` })
    .where(eq(communityPosts.id, postId));
}

// ── Reactions ──────────────────────────────────────────────────────────────────

export async function getReaction(postId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(communityReactions)
    .where(and(eq(communityReactions.postId, postId), eq(communityReactions.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function addReaction(data: InsertCommunityReaction) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(communityReactions).values(data);
}

export async function removeReaction(postId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(communityReactions)
    .where(and(eq(communityReactions.postId, postId), eq(communityReactions.userId, userId)));
}

export async function getReactionsByPost(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityReactions).where(eq(communityReactions.postId, postId));
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function getCommentsByPost(postId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityComments)
    .where(eq(communityComments.postId, postId))
    .orderBy(communityComments.createdAt)
    .limit(limit);
}

export async function addComment(data: InsertCommunityComment) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(communityComments).values(data);
}

// ── Stories ──────────────────────────────────────────────────────────────────

export async function getActiveStories() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(communityStories)
    .where(gte(communityStories.expiresAt, now))
    .orderBy(desc(communityStories.createdAt))
    .limit(30);
}

export async function createStory(data: typeof communityStories.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(communityStories).values(data);
}

// ── Challenges ──────────────────────────────────────────────────────────────────

export async function getActiveChallenges() {
  const db = await getDb();
  if (!db) return [];
  const today = new Date().toISOString().slice(0, 10);
  return db.select().from(communityChallenges)
    .where(and(
      eq(communityChallenges.isActive, true),
      lte(communityChallenges.startDate, today),
      gte(communityChallenges.endDate, today),
    ))
    .orderBy(desc(communityChallenges.createdAt));
}

export async function joinChallenge(data: InsertChallengeParticipant) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Check if already joined
  const existing = await db.select().from(challengeParticipants)
    .where(and(
      eq(challengeParticipants.challengeId, data.challengeId),
      eq(challengeParticipants.userId, data.userId),
    )).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(challengeParticipants).values(data);
  // Increment participants count
  await db.update(communityChallenges)
    .set({ participantsCount: sql`${communityChallenges.participantsCount} + 1` })
    .where(eq(communityChallenges.id, data.challengeId));
  return data;
}

export async function getUserChallenges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challengeParticipants)
    .where(eq(challengeParticipants.userId, userId));
}

export async function seedDefaultChallenges() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(communityChallenges).limit(1);
  if (existing.length > 0) return; // already seeded
  const today = new Date().toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await db.insert(communityChallenges).values([
    {
      title: "7-Day Consistency Challenge",
      titleAr: "تحدي الاتساق 7 أيام",
      description: "Complete 7 workouts in 7 days to earn 200 XP",
      descriptionAr: "أكمل 7 تمارين في 7 أيام واحصل على 200 نقطة",
      type: "sessions",
      targetValue: 7,
      xpReward: 200,
      startDate: today,
      endDate,
      isActive: true,
      participantsCount: 0,
    },
    {
      title: "14-Day Fat Burn Challenge",
      titleAr: "تحدي حرق الدهون 14 يوم",
      description: "Complete 14 cardio sessions in 14 days",
      descriptionAr: "أكمل 14 جلسة كارديو في 14 يوماً",
      type: "cardio",
      targetValue: 14,
      xpReward: 350,
      startDate: today,
      endDate,
      isActive: true,
      participantsCount: 0,
    },
    {
      title: "Core Strength Challenge",
      titleAr: "تحدي قوة الجذع",
      description: "Complete 10 core & cardio sessions this month",
      descriptionAr: "أكمل 10 جلسات جذع وكارديو هذا الشهر",
      type: "sessions",
      targetValue: 10,
      xpReward: 250,
      startDate: today,
      endDate,
      isActive: true,
      participantsCount: 0,
    },
  ]);
}

// ── XP & Levels ──────────────────────────────────────────────────────────────────

export async function addXp(data: InsertCommunityXpLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(communityXpLog).values(data);
}

export async function getUserTotalXp(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ total: sum(communityXpLog.points) })
    .from(communityXpLog)
    .where(eq(communityXpLog.userId, userId));
  return Number(result[0]?.total ?? 0);
}

export async function getWeeklyLeaderboard(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await db.select({
    userId: communityXpLog.userId,
    weeklyXp: sum(communityXpLog.points),
  })
    .from(communityXpLog)
    .where(gte(communityXpLog.createdAt, weekAgo))
    .groupBy(communityXpLog.userId)
    .orderBy(desc(sum(communityXpLog.points)))
    .limit(limit);
  return rows.map(r => ({ userId: r.userId, weeklyXp: Number(r.weeklyXp ?? 0) }));
}

export async function getUserWeeklyXp(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await db.select({ total: sum(communityXpLog.points) })
    .from(communityXpLog)
    .where(and(eq(communityXpLog.userId, userId), gte(communityXpLog.createdAt, weekAgo)));
  return Number(result[0]?.total ?? 0);
}

// ── Social Notifications ──────────────────────────────────────────────────────

export async function createSocialNotification(data: InsertSocialNotification) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(socialNotifications).values(data);
}

export async function getSocialNotifications(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(socialNotifications)
    .where(eq(socialNotifications.userId, userId))
    .orderBy(desc(socialNotifications.createdAt))
    .limit(limit);
}

export async function markNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(socialNotifications)
    .set({ isRead: true })
    .where(eq(socialNotifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select()
    .from(socialNotifications)
    .where(eq(socialNotifications.userId, userId));
  return rows.filter(r => !r.isRead).length;
}
