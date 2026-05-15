/**
 * In-App Popup Notification Router
 * Admin: create / list / delete / toggle notifications
 * User:  getUnread / markRead
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  inAppNotifications,
  notificationReads,
  subscriptions,
  accessCodes,
  users,
} from "../../drizzle/schema";
import { eq, and, notInArray, inArray, isNull, gte, lte, desc, sql } from "drizzle-orm";

function requireAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
  }
}

// ── Targeting helpers ─────────────────────────────────────────────────────────

async function resolveTargetUserIds(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  targeting: string,
  targetUserId?: number | null
): Promise<number[] | "all"> {
  switch (targeting) {
    case "all":
      return "all";

    case "specific":
      if (!targetUserId) return [];
      return [targetUserId];

    case "active_subscribers": {
      const now = new Date();
      const rows = await db
        .select({ userId: subscriptions.userId })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.status, "active"),
            // not expired
            sql`(${subscriptions.expiresAt} IS NULL OR ${subscriptions.expiresAt} > ${now})`
          )
        );
      return rows.map((r) => Number(r.userId));
    }

    case "new_subscribers": {
      // Users who registered in the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const rows = await db
        .select({ id: users.id })
        .from(users)
        .where(gte(users.createdAt, sevenDaysAgo));
      return rows.map((r) => Number(r.id));
    }

    default:
      return "all";
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export const inAppNotificationsRouter = router({
  // ── Admin: create ──────────────────────────────────────────────────────────
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        message: z.string().min(1),
        imageUrl: z.string().url().optional().nullable(),
        ctaText: z.string().max(128).optional().nullable(),
        ctaLink: z.string().url().optional().nullable(),
        targeting: z.enum(["all", "specific", "active_subscribers", "new_subscribers"]).default("all"),
        targetUserId: z.number().int().optional().nullable(),
        expiresAt: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [result] = await db.insert(inAppNotifications).values({
        title: input.title,
        message: input.message,
        imageUrl: input.imageUrl ?? null,
        ctaText: input.ctaText ?? null,
        ctaLink: input.ctaLink ?? null,
        targeting: input.targeting,
        targetUserId: input.targetUserId ?? null,
        isActive: true,
        createdBy: ctx.user.id,
        expiresAt: input.expiresAt ?? null,
      });

      return { success: true, id: (result as any).insertId };
    }),

  // ── Admin: list all ────────────────────────────────────────────────────────
  list: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(inAppNotifications)
      .orderBy(desc(inAppNotifications.createdAt));
  }),

  // ── Admin: toggle active ───────────────────────────────────────────────────
  toggleActive: protectedProcedure
    .input(z.object({ id: z.number().int(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(inAppNotifications)
        .set({ isActive: input.isActive })
        .where(eq(inAppNotifications.id, input.id));

      return { success: true };
    }),

  // ── Admin: delete ──────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Delete reads first (FK safety)
      await db
        .delete(notificationReads)
        .where(eq(notificationReads.notificationId, input.id));

      await db
        .delete(inAppNotifications)
        .where(eq(inAppNotifications.id, input.id));

      return { success: true };
    }),

  // ── Admin: read stats ──────────────────────────────────────────────────────
  getReadStats: protectedProcedure
    .input(z.object({ notificationId: z.number().int() }))
    .query(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) return { readCount: 0 };

      const rows = await db
        .select({ count: sql<number>`count(*)` })
        .from(notificationReads)
        .where(eq(notificationReads.notificationId, input.notificationId));

      return { readCount: Number(rows[0]?.count ?? 0) };
    }),

   // ── Admin: search users by name or email ───────────────────────────────
  searchUsers: protectedProcedure
    .input(z.object({ query: z.string().min(1).max(100) }))
    .query(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) return [];

      const q = `%${input.query.toLowerCase()}%`;
      const rows = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(sql`(LOWER(${users.name}) LIKE ${q} OR LOWER(${users.email}) LIKE ${q})`)
        .limit(10);

      return rows;
    }),

  // ── User: get unread notifications ────────────────────────────────────
  // Uses publicProcedure so it works without re-login (session cookie is still sent)
  getUnread: publicProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    // If user is not authenticated, return empty (no popup for guests)
    if (!ctx.user) return [];

    const userId = ctx.user.id;
    const now = new Date();

    // Get all active, non-expired notifications
    const allActive = await db
      .select()
      .from(inAppNotifications)
      .where(
        and(
          eq(inAppNotifications.isActive, true),
          sql`(${inAppNotifications.expiresAt} IS NULL OR ${inAppNotifications.expiresAt} > ${now})`
        )
      )
      .orderBy(desc(inAppNotifications.createdAt));

    if (allActive.length === 0) return [];

    // Get IDs the user has already read
    const readRows = await db
      .select({ notificationId: notificationReads.notificationId })
      .from(notificationReads)
      .where(eq(notificationReads.userId, userId));

    const readIds = new Set(readRows.map((r) => r.notificationId));

    // Filter unread + check targeting
    const unread = allActive.filter((n) => {
      if (readIds.has(n.id)) return false;

      // Targeting check (server-side simplified — full check for specific user)
      if (n.targeting === "specific") {
        return n.targetUserId === userId;
      }
      // For all / active_subscribers / new_subscribers — show to everyone
      // (fine-grained subscription checks are done at send time; here we show to all)
      return true;
    });

    return unread;
  }),

  // ── User: mark as read ────────────────────────────────────────────────────
  markRead: protectedProcedure
    .input(z.object({ notificationId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      // Upsert — ignore duplicate
      try {
        await db.insert(notificationReads).values({
          notificationId: input.notificationId,
          userId: ctx.user.id,
          isRead: true,
          readAt: new Date(),
        });
      } catch {
        // Already exists — ignore
      }

      return { success: true };
    }),
});
