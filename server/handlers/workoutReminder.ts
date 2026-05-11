/**
 * Scheduled handler: POST /api/scheduled/workoutReminder
 *
 * Triggered by a per-user Heartbeat cron at the user's chosen reminder time.
 * Looks up the user's push subscription by taskUid, sends a workout reminder.
 *
 * Auth: sdk.authenticateRequest — user.isCron === true, user.taskUid set.
 */

import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import {
  getNotificationSettings,
  getPushSubscriptionByUser,
  deletePushSubscription,
  updateNotificationTaskUid,
} from "../db";
import { sendPushToSubscription } from "../routers/notifications";

const WORKOUT_MESSAGES = {
  ar: {
    title: "🏋️ وقت التمرين!",
    body: "حان وقت تمرينك اليومي في Prime Fit. لا تتأخري — جسمك يستحق! 💪",
  },
  en: {
    title: "🏋️ Workout Time!",
    body: "Time for your daily workout in Prime Fit. Don't skip it — your body deserves it! 💪",
  },
};

export async function workoutReminderHandler(req: Request, res: Response) {
  try {
    // Authenticate as cron request
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    // Look up notification settings by taskUid
    // We need to find which user owns this cron — look up by taskUid in settings
    const { getDb } = await import("../db");
    const { notificationSettings } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "db-unavailable" });
    }

    const settingsRows = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.scheduleCronTaskUid, user.taskUid))
      .limit(1);

    if (!settingsRows.length) {
      // Orphaned cron — return 2xx so forge stops retrying
      return res.json({ ok: true, skipped: "orphan" });
    }

    const settings = settingsRows[0];

    if (!settings.enabled) {
      return res.json({ ok: true, skipped: "disabled" });
    }

    // Get push subscription
    const sub = await getPushSubscriptionByUser(settings.userId);
    if (!sub) {
      return res.json({ ok: true, skipped: "no-subscription" });
    }

    const lang = (settings.language ?? "ar") as "ar" | "en";
    const msg = WORKOUT_MESSAGES[lang] ?? WORKOUT_MESSAGES.ar;

    const payload = {
      title: msg.title,
      body: msg.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      url: "/",
      tag: "workout-reminder",
      renotify: true,
    };

    const result = await sendPushToSubscription(
      sub.endpoint,
      sub.p256dh,
      sub.auth,
      payload,
    );

    if (result === "expired") {
      // Clean up expired subscription
      await deletePushSubscription(settings.userId);
      await updateNotificationTaskUid(settings.userId, null);
      return res.json({ ok: true, skipped: "subscription-expired" });
    }

    if (result === "error") {
      return res.status(500).json({
        error: "push-failed",
        context: { taskUid: user.taskUid },
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({ ok: true, userId: settings.userId, lang });
  } catch (err: unknown) {
    const error = err as Error;
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: { url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}
