/**
 * Admin router — profile management, broadcast notifications,
 * user management, subscription CRUD, and in-app popup notifications.
 * All admin-only procedures require role = 'admin'.
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAdminProfile,
  upsertAdminProfile,
  createBroadcast,
  listBroadcasts,
  getAllLicensedCustomerEmails,
  listAccessCodes,
  getDb,
} from "../db";
import {
  subscriptions,
  users,
  adminNotifications,
  notificationReads,
} from "../../drizzle/schema";
import { desc, eq, and, notInArray, isNull, or, inArray, gte, lt } from "drizzle-orm";
import { sendBroadcastEmail } from "../_core/email";
import { storagePut } from "../storage";

// Helper — throws FORBIDDEN if caller is not admin
function requireAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
  }
}

export const adminRouter = router({
  // ── Profile ──────────────────────────────────────────────────────────────
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    return getAdminProfile();
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().max(255).optional(),
        phone: z.string().max(64).optional(),
        email: z.string().email().max(320).optional().or(z.literal("")),
        photoUrl: z.string().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      await upsertAdminProfile({
        name: input.name ?? null,
        phone: input.phone ?? null,
        email: input.email || null,
        photoUrl: input.photoUrl || null,
      });
      return { success: true };
    }),

  uploadPhoto: protectedProcedure
    .input(
      z.object({
        base64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const base64Data = input.base64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const ext = input.mimeType.split("/")[1] ?? "jpg";
      const key = `admin-profile/photo-${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),

  // ── Stats ─────────────────────────────────────────────────────────────────
  getStats: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const codes = await listAccessCodes();
    const broadcasts = await listBroadcasts(1000);
    const total = codes.length;
    const active = codes.filter((c) => c.isActive).length;
    const inactive = total - active;
    const totalBroadcasts = broadcasts.length;
    const totalRecipients = broadcasts.reduce((s, b) => s + b.recipientCount, 0);

    // Count registered users
    const db = await getDb();
    let totalUsers = 0;
    let activeSubscribers = 0;
    if (db) {
      const allUsers = await db.select({ id: users.id }).from(users);
      totalUsers = allUsers.length;
      const activeSubs = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active"));
      activeSubscribers = activeSubs.length;
    }

    return { total, active, inactive, totalBroadcasts, totalRecipients, totalUsers, activeSubscribers };
  }),

  // ── Broadcasts (legacy email-only) ────────────────────────────────────────
  listBroadcasts: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    return listBroadcasts();
  }),

  sendToOne: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        subject: z.string().min(1).max(512),
        body: z.string().min(1),
        type: z.enum(["update", "news", "offer", "reminder", "other"]).default("other"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const ok = await sendBroadcastEmail({
        to: input.email,
        customerName: null,
        subject: input.subject,
        body: input.body,
      });
      if (!ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send email" });
      await createBroadcast({
        subject: `[To: ${input.email}] ${input.subject}`,
        body: input.body,
        type: input.type,
        recipientCount: 1,
        sentBy: ctx.user.name ?? ctx.user.openId,
      });
      return { success: true };
    }),

  sendBroadcast: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1).max(512),
        body: z.string().min(1),
        type: z.enum(["update", "news", "offer", "reminder", "other"]).default("news"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const recipients = await getAllLicensedCustomerEmails();
      if (recipients.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No licensed customers with email addresses found." });
      }

      let sent = 0;
      for (const { email, name } of recipients) {
        const ok = await sendBroadcastEmail({
          to: email,
          customerName: name,
          subject: input.subject,
          body: input.body,
        });
        if (ok) sent++;
        await new Promise((r) => setTimeout(r, 150));
      }

      await createBroadcast({
        subject: input.subject,
        body: input.body,
        type: input.type,
        recipientCount: sent,
        sentBy: ctx.user.name ?? ctx.user.openId,
      });

      return { success: true, sent, total: recipients.length };
    }),

  // ── Subscriptions ─────────────────────────────────────────────────────────
  listSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const database = await getDb();
    if (!database) return [];
    const rows = await database
      .select()
      .from(subscriptions)
      .orderBy(desc(subscriptions.createdAt))
      .limit(200);
    return rows;
  }),

  // ── User Management ───────────────────────────────────────────────────────
  listUsers: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return [];

    const allUsers = await db
      .select({
        id: users.id,
        openId: users.openId,
        name: users.name,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        authProvider: users.authProvider,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(500);

    // Fetch subscriptions for all users
    const allSubs = await db
      .select()
      .from(subscriptions)
      .limit(500);

    const subMap = new Map<string, typeof allSubs[0]>();
    for (const sub of allSubs) {
      subMap.set(sub.userId, sub);
    }

    return allUsers.map((u) => ({
      ...u,
      subscription: subMap.get(u.openId) ?? null,
    }));
  }),

  updateUserSubscription: protectedProcedure
    .input(
      z.object({
        userOpenId: z.string(),
        plan: z.enum(["free", "prime_plus", "prime_pro"]),
        status: z.enum(["active", "expired", "cancelled", "trialing", "pending"]),
        period: z.enum(["monthly", "yearly", "lifetime", "free_trial"]).default("monthly"),
        expiresAt: z.string().optional().nullable(), // ISO date string or null
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

      // Upsert subscription for this user
      await db
        .insert(subscriptions)
        .values({
          userId: input.userOpenId,
          plan: input.plan,
          status: input.status,
          period: input.period,
          expiresAt: expiresAt ?? undefined,
          paymentStatus: "free",
          paymentProvider: "manual",
          sentBy: ctx.user.name ?? ctx.user.openId,
        } as any)
        .onDuplicateKeyUpdate({
          set: {
            plan: input.plan,
            status: input.status,
            period: input.period,
            expiresAt: expiresAt ?? undefined,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  deleteUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      // Delete user (cascades handled manually for safety)
      await db.delete(users).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ── Admin Notifications (in-app popup + email) ────────────────────────────
  sendAdminNotification: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        titleAr: z.string().max(255).optional(),
        message: z.string().min(1),
        messageAr: z.string().optional(),
        imageUrl: z.string().url().optional().or(z.literal("")),
        ctaText: z.string().max(128).optional(),
        ctaTextAr: z.string().max(128).optional(),
        ctaLink: z.string().url().optional().or(z.literal("")),
        channel: z.enum(["inapp", "email", "both"]).default("inapp"),
        target: z.enum(["all", "active_subscribers", "new_subscribers", "specific"]).default("all"),
        targetEmail: z.string().email().optional(),
        type: z.enum(["update", "news", "offer", "reminder", "other"]).default("other"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      // Determine recipients for email channel
      let emailRecipients: { email: string; name: string | null }[] = [];
      let recipientCount = 0;

      if (input.channel === "email" || input.channel === "both") {
        if (input.target === "specific" && input.targetEmail) {
          // Find user by email
          const targetUser = await db
            .select({ email: users.email, name: users.fullName })
            .from(users)
            .where(eq(users.email, input.targetEmail))
            .limit(1);
          if (targetUser[0]?.email) {
            emailRecipients = [{ email: targetUser[0].email, name: targetUser[0].name }];
          }
        } else if (input.target === "active_subscribers") {
          const activeSubs = await db
            .select({ userId: subscriptions.userId })
            .from(subscriptions)
            .where(eq(subscriptions.status, "active"));
          const openIds = activeSubs.map((s) => s.userId);
          if (openIds.length > 0) {
            const subUsers = await db
              .select({ email: users.email, name: users.fullName })
              .from(users)
              .where(inArray(users.openId, openIds));
            emailRecipients = subUsers.filter((u) => u.email) as { email: string; name: string | null }[];
          }
        } else {
          // all users with email
          const allWithEmail = await db
            .select({ email: users.email, name: users.fullName })
            .from(users);
          emailRecipients = allWithEmail.filter((u) => u.email) as { email: string; name: string | null }[];
        }

        // Send emails
        let sent = 0;
        for (const { email, name } of emailRecipients) {
          const ok = await sendBroadcastEmail({
            to: email,
            customerName: name,
            subject: input.title,
            body: input.message,
          });
          if (ok) sent++;
          await new Promise((r) => setTimeout(r, 100));
        }
        recipientCount = sent;
      }

      // For in-app channel, count = all users (reads are tracked lazily)
      if (input.channel === "inapp") {
        const allUsers = await db.select({ id: users.id }).from(users);
        recipientCount = allUsers.length;
      }

      // Save the notification record
      await db.insert(adminNotifications).values({
        title: input.title,
        titleAr: input.titleAr ?? null,
        message: input.message,
        messageAr: input.messageAr ?? null,
        imageUrl: input.imageUrl || null,
        ctaText: input.ctaText ?? null,
        ctaTextAr: input.ctaTextAr ?? null,
        ctaLink: input.ctaLink || null,
        channel: input.channel,
        target: input.target,
        targetEmail: input.targetEmail ?? null,
        type: input.type,
        sentBy: ctx.user.name ?? ctx.user.openId,
        recipientCount,
      });

      return { success: true, recipientCount };
    }),

  listAdminNotifications: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(adminNotifications)
      .orderBy(desc(adminNotifications.createdAt))
      .limit(100);
  }),

  deleteAdminNotification: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      await db.delete(adminNotifications).where(eq(adminNotifications.id, input.id));
      return { success: true };
    }),

  // ── User-facing: get unread in-app notifications ──────────────────────────
  getUnreadNotifications: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    // Get all in-app notifications (inapp or both channels)
    const allInApp = await db
      .select()
      .from(adminNotifications)
      .where(
        or(
          eq(adminNotifications.channel, "inapp"),
          eq(adminNotifications.channel, "both")
        )
      )
      .orderBy(desc(adminNotifications.createdAt))
      .limit(20);

    if (allInApp.length === 0) return [];

    // Get which ones this user has already read
    const notifIds = allInApp.map((n) => n.id);
    const reads = await db
      .select({ notificationId: notificationReads.notificationId })
      .from(notificationReads)
      .where(
        and(
          eq(notificationReads.userId, ctx.user.id),
          inArray(notificationReads.notificationId, notifIds)
        )
      );

    const readIds = new Set(reads.map((r) => r.notificationId));

    // Filter to unread, also check targeting
    return allInApp.filter((n) => {
      if (readIds.has(n.id)) return false;
      // Check targeting
      if (n.target === "specific") {
        return n.targetEmail === ctx.user.email;
      }
      return true; // 'all', 'active_subscribers', 'new_subscribers' — show to everyone for now
    });
  }),

  markNotificationRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      // Insert read record (ignore duplicate)
      try {
        await db.insert(notificationReads).values({
          notificationId: input.notificationId,
          userId: ctx.user.id,
        });
      } catch {
        // Duplicate — already read, ignore
      }
      return { success: true };
    }),
});
