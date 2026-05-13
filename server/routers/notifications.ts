/**
 * Notifications Router — Web Push subscription management + reminder scheduling
 *
 * Procedures:
 *  - getVapidPublicKey  (public)  — returns VAPID public key for browser subscription
 *  - subscribe          (protected) — save push subscription + create/update heartbeat cron
 *  - unsubscribe        (protected) — delete push subscription + delete heartbeat cron
 *  - getSettings        (protected) — get current notification settings
 *  - updateSettings     (protected) — update reminder time / days / language + reschedule cron
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { parse as parseCookie } from "cookie";
import webpush from "web-push";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { COOKIE_NAME } from "@shared/const";
import {
  upsertPushSubscription,
  deletePushSubscription,
  getPushSubscriptionByUser,
  getNotificationSettings,
  upsertNotificationSettings,
  updateNotificationTaskUid,
  getDb,
} from "../db";
import { eq } from "drizzle-orm";
import {
  createHeartbeatJob,
  updateHeartbeatJob,
  deleteHeartbeatJob,
} from "../_core/heartbeat";

// Configure web-push with VAPID keys (lazy — only when keys are available)
function getWebPush() {
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Push notifications not configured (missing VAPID keys)",
    });
  }
  webpush.setVapidDetails(
    "mailto:admin@primefit.app",
    ENV.vapidPublicKey,
    ENV.vapidPrivateKey,
  );
  return webpush;
}

/**
 * Build a 6-field cron expression (sec min hour * * days)
 * reminderTime: "HH:MM" in UTC
 * days: comma-separated 0=Sun..6=Sat
 */
function buildCron(reminderTime: string, days: string): string {
  const [h, m] = reminderTime.split(":").map(Number);
  // Convert JS day numbers (0=Sun..6=Sat) to cron dow field
  const cronDays = days || "1,2,3,4,5";
  return `0 ${m} ${h} * * ${cronDays}`;
}

export const notificationsRouter = router({
  /** Returns the VAPID public key so the browser can create a PushSubscription */
  getVapidPublicKey: publicProcedure.query(() => {
    if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
      console.error("[Notifications] ❌ VAPID keys not set! Run: node -e \"const wp=require('web-push'); const keys=wp.generateVAPIDKeys(); console.log(JSON.stringify(keys))\" and add VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY to .env");
    }
    return { publicKey: ENV.vapidPublicKey, configured: !!ENV.vapidPublicKey };
  }),

  /** Save a browser PushSubscription and enable reminder cron */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string(),
        auth: z.string(),
        reminderTime: z.string().regex(/^\d{2}:\d{2}$/).default("09:00"),
        days: z.string().default("0,1,2,3,4,5,6"),
        language: z.enum(["ar", "en"]).default("ar"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // 1. Save push subscription
      await upsertPushSubscription({
        userId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
      });

      // 2. Get existing settings to check for existing cron
      const existing = await getNotificationSettings(userId);

      // 3. Create or update heartbeat cron
      const sessionToken =
        parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const cron = buildCron(input.reminderTime, input.days);

      let taskUid: string | null = existing?.scheduleCronTaskUid ?? null;

      if (taskUid) {
        // Update existing cron
        await updateHeartbeatJob(
          taskUid,
          {
            cron,
            path: "/api/scheduled/workoutReminder",
            payload: { userId },
          },
          sessionToken,
        );
      } else {
        // Create new cron
        const job = await createHeartbeatJob(
          {
            name: `workout-reminder-${userId}`,
            cron,
            path: "/api/scheduled/workoutReminder",
            payload: { userId },
            description: `Workout reminder for user ${userId}`,
          },
          sessionToken,
        );
        taskUid = job.taskUid;
      }

      // 4. Save notification settings
      await upsertNotificationSettings({
        userId,
        enabled: true,
        reminderTime: input.reminderTime,
        days: input.days,
        language: input.language,
        scheduleCronTaskUid: taskUid,
      });

      return { success: true, taskUid };
    }),

  /** Remove push subscription and disable reminder cron */
  unsubscribe: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get existing settings to find cron task UID
    const settings = await getNotificationSettings(userId);

    if (settings?.scheduleCronTaskUid) {
      const sessionToken =
        parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      try {
        await deleteHeartbeatJob(settings.scheduleCronTaskUid, sessionToken);
      } catch {
        // Cron may already be deleted — not fatal
      }
      await updateNotificationTaskUid(userId, null);
    }

    // Disable in settings
    await upsertNotificationSettings({
      userId,
      enabled: false,
      reminderTime: settings?.reminderTime ?? "09:00",
      days: settings?.days ?? "0,1,2,3,4,5,6",
      language: settings?.language ?? "ar",
      scheduleCronTaskUid: null,
    });

    // Delete push subscription
    await deletePushSubscription(userId);

    return { success: true };
  }),

  /** Get current notification settings + subscription status */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const settings = await getNotificationSettings(userId);
    const subscription = await getPushSubscriptionByUser(userId);
    return {
      enabled:          settings?.enabled ?? false,
      reminderTime:     settings?.reminderTime ?? "09:00",
      days:             settings?.days ?? "0,1,2,3,4,5,6",
      language:         settings?.language ?? "ar",
      hasSubscription:  !!subscription,
      communityNotifs:  settings?.communityNotifs  ?? true,
      appUpdatesNotifs: settings?.appUpdatesNotifs ?? true,
    };
  }),

  /** Update reminder time / days / notification preferences */
  updateSettings: protectedProcedure
    .input(
      z.object({
        reminderTime:     z.string().regex(/^\d{2}:\d{2}$/),
        days:             z.string(),
        language:         z.enum(["ar", "en"]),
        communityNotifs:  z.boolean().optional(),
        appUpdatesNotifs: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const settings = await getNotificationSettings(userId);

      // Allow saving preferences even without an active subscription
      if (settings && (!settings.enabled || !settings.scheduleCronTaskUid)) {
        await upsertNotificationSettings({
          userId,
          enabled: settings.enabled,
          reminderTime: input.reminderTime,
          days: input.days,
          language: input.language,
          scheduleCronTaskUid: settings.scheduleCronTaskUid ?? null,
          communityNotifs:  input.communityNotifs  ?? settings.communityNotifs  ?? true,
          appUpdatesNotifs: input.appUpdatesNotifs ?? settings.appUpdatesNotifs ?? true,
        });
        return { success: true };
      }

      if (!settings?.enabled || !settings?.scheduleCronTaskUid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription to update" });
      }

      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const cron = buildCron(input.reminderTime, input.days);

      await updateHeartbeatJob(
        settings.scheduleCronTaskUid,
        { cron, path: "/api/scheduled/workoutReminder", payload: { userId } },
        sessionToken,
      );

      await upsertNotificationSettings({
        userId,
        enabled: true,
        reminderTime: input.reminderTime,
        days: input.days,
        language: input.language,
        scheduleCronTaskUid: settings.scheduleCronTaskUid,
        communityNotifs:  input.communityNotifs  ?? settings.communityNotifs  ?? true,
        appUpdatesNotifs: input.appUpdatesNotifs ?? settings.appUpdatesNotifs ?? true,
      });

      return { success: true };
    }),

  /** Update only notification preferences (community / app updates) — no subscription required */
  updatePreferences: protectedProcedure
    .input(z.object({
      communityNotifs:  z.boolean().optional(),
      appUpdatesNotifs: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const settings = await getNotificationSettings(userId);
      await upsertNotificationSettings({
        userId,
        enabled:              settings?.enabled ?? false,
        reminderTime:         settings?.reminderTime ?? "09:00",
        days:                 settings?.days ?? "0,1,2,3,4,5,6",
        language:             settings?.language ?? "ar",
        scheduleCronTaskUid:  settings?.scheduleCronTaskUid ?? null,
        communityNotifs:      input.communityNotifs  ?? settings?.communityNotifs  ?? true,
        appUpdatesNotifs:     input.appUpdatesNotifs ?? settings?.appUpdatesNotifs ?? true,
      });
      return { success: true };
    }),

  /** Send a test push notification to the current user */
  sendTest: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const sub = await getPushSubscriptionByUser(userId);
    if (!sub) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No push subscription found. Please enable notifications first.",
      });
    }

    const wp = getWebPush();
    const settings = await getNotificationSettings(userId);
    const lang = settings?.language ?? "ar";

    const payload = JSON.stringify({
      title: lang === "ar" ? "🏋️ Prime Fit" : "🏋️ Prime Fit",
      body:
        lang === "ar"
          ? "هذا إشعار تجريبي — تذكيراتك تعمل بشكل صحيح! 💪"
          : "This is a test notification — your reminders are working! 💪",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      url: "/",
    });

    try {
      await wp.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      );
      return { success: true };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      if (error?.statusCode === 410 || error?.statusCode === 404) {
        await deletePushSubscription(userId);
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to send test notification: ${error?.message ?? "unknown error"}`,
      });
    }
  }),

  /** Admin: get all users who have push subscriptions */
  adminGetSubscribedUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];
    const { pushSubscriptions } = await import("../../drizzle/schema");
    const { users } = await import("../../drizzle/schema");
    const rows = await db
      .select({
        userId: pushSubscriptions.userId,
        name:   users.name,
        email:  users.email,
      })
      .from(pushSubscriptions)
      .leftJoin(users, eq(users.id, pushSubscriptions.userId));
    return rows;
  }),

  /** Admin: send a custom push notification to a specific user */
  adminSendPush: protectedProcedure
    .input(z.object({
      userId:  z.number(),
      title:   z.string().min(1).max(100),
      body:    z.string().min(1).max(300),
      url:     z.string().default("/"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const sub = await getPushSubscriptionByUser(input.userId);
      if (!sub) throw new TRPCError({ code: "NOT_FOUND", message: "User has no push subscription" });

      const result = await sendPushToSubscription(sub.endpoint, sub.p256dh, sub.auth, {
        title: input.title,
        body:  input.body,
        icon:  "/icons/icon-192.png",
        url:   input.url,
      });

      if (result === "error") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Push failed" });
      if (result === "expired") {
        await deletePushSubscription(input.userId);
        throw new TRPCError({ code: "NOT_FOUND", message: "Subscription expired — user must re-enable notifications" });
      }
      return { success: true };
    }),

  /** Admin: broadcast a push to ALL subscribed users */
  adminBroadcastPush: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(100),
      body:  z.string().min(1).max(300),
      url:   z.string().default("/"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const { pushSubscriptions } = await import("../../drizzle/schema");
      const subs = await db.select().from(pushSubscriptions);

      let sent = 0, failed = 0;
      for (const sub of subs) {
        const result = await sendPushToSubscription(sub.endpoint, sub.p256dh, sub.auth, {
          title: input.title,
          body:  input.body,
          icon:  "/icons/icon-192.png",
          url:   input.url,
        });
        if (result === "ok") sent++;
        else { failed++; if (result === "expired") await deletePushSubscription(sub.userId); }
      }
      return { sent, failed, total: subs.length };
    }),
});

/** Send a push notification to a single subscription (used by the scheduled handler) */
export async function sendPushToSubscription(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: object,
): Promise<"ok" | "expired" | "error"> {
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) return "error";

  webpush.setVapidDetails(
    "mailto:admin@primefit.app",
    ENV.vapidPublicKey,
    ENV.vapidPrivateKey,
  );

  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify(payload),
    );
    return "ok";
  } catch (err: unknown) {
    const error = err as { statusCode?: number };
    if (error?.statusCode === 410 || error?.statusCode === 404) return "expired";
    return "error";
  }
}
