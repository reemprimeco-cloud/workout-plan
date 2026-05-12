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
