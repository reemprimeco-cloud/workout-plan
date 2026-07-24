/**
 * Scheduled reminder cron: GET /api/cron/workout-reminders
 *
 * Replaces the former per-user Manus Heartbeat jobs with a single central cron
 * (e.g. Vercel Cron, hourly). Each run: authenticate via CRON_SECRET, find all
 * users whose reminder is due this hour (reminderTime hour == current UTC hour
 * and today's weekday is in their `days`), and send a web-push reminder.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends this) or
 * `?secret=<CRON_SECRET>`.
 */
import type { Request, Response } from "express";
import { ENV } from "../_core/env";
import {
  getEnabledReminderSettings,
  getPushSubscriptionByUser,
  deletePushSubscription,
} from "../db";
import { sendPushToSubscription } from "../routers/notifications";

const WORKOUT_MESSAGES = {
  ar: { title: "🏋️ وقت التمرين!", body: "حان وقت تمرينك اليومي في Prime Fit. لا تتأخري — جسمك يستحق! 💪" },
  en: { title: "🏋️ Workout Time!", body: "Time for your daily workout in Prime Fit. Don't skip it — your body deserves it! 💪" },
};

function isAuthorized(req: Request): boolean {
  if (!ENV.cronSecret) return false;
  const auth = req.headers.authorization;
  if (auth === `Bearer ${ENV.cronSecret}`) return true;
  const q = req.query.secret;
  return typeof q === "string" && q === ENV.cronSecret;
}

export async function workoutReminderHandler(req: Request, res: Response) {
  if (!ENV.cronSecret) {
    return res.status(503).json({ error: "cron-not-configured" });
  }
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay = now.getUTCDay(); // 0=Sun..6=Sat

    const settings = await getEnabledReminderSettings();
    let sent = 0;
    let skipped = 0;

    for (const s of settings) {
      const reminderHour = parseInt((s.reminderTime ?? "09:00").split(":")[0], 10);
      const days = (s.days ?? "0,1,2,3,4,5,6").split(",").map((d) => d.trim());
      if (reminderHour !== currentHour || !days.includes(String(currentDay))) {
        skipped++;
        continue;
      }

      const sub = await getPushSubscriptionByUser(s.userId);
      if (!sub) { skipped++; continue; }

      const lang = (s.language ?? "ar") as "ar" | "en";
      const msg = WORKOUT_MESSAGES[lang] ?? WORKOUT_MESSAGES.ar;
      const result = await sendPushToSubscription(sub.endpoint, sub.p256dh, sub.auth, {
        title: msg.title,
        body: msg.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        url: "/",
        tag: "workout-reminder",
        renotify: true,
      });

      if (result === "expired") {
        await deletePushSubscription(s.userId);
        skipped++;
      } else if (result === "error") {
        skipped++;
      } else {
        sent++;
      }
    }

    return res.json({ ok: true, sent, skipped, hour: currentHour, day: currentDay });
  } catch (err: unknown) {
    console.error("[Cron] workout-reminders failed:", err);
    return res.status(500).json({ error: "internal-error" });
  }
}
