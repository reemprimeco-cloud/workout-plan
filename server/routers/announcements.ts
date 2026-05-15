/**
 * Announcements Router
 * Public: getActive — no auth, shown to everyone on app open
 * Admin: create, update, delete, list
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getActiveAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getDb,
} from "../db";
import { appAnnouncements } from "../../drizzle/schema";

export const announcementsRouter = router({

  /** Get all currently active announcements — PUBLIC, no auth needed */
  getActive: publicProcedure.query(async () => {
    return getActiveAnnouncements();
  }),

  /** Admin: list all announcements including inactive */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];
    const { desc } = await import("drizzle-orm");
    return db.select().from(appAnnouncements).orderBy(desc(appAnnouncements.createdAt)).limit(50);
  }),

  /** Admin: create a new announcement */
  create: protectedProcedure
    .input(z.object({
      titleAr:    z.string().min(1).max(200),
      titleEn:    z.string().min(1).max(200),
      bodyAr:     z.string().min(1),
      bodyEn:     z.string().min(1),
      emoji:      z.string().default("📢"),
      ctaLabelAr: z.string().optional(),
      ctaLabelEn: z.string().optional(),
      ctaUrl:     z.string().url().optional().or(z.literal("")),
      isActive:   z.boolean().default(true),
      endsAt:     z.string().optional(), // ISO date string
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await createAnnouncement({
        titleAr:    input.titleAr,
        titleEn:    input.titleEn,
        bodyAr:     input.bodyAr,
        bodyEn:     input.bodyEn,
        emoji:      input.emoji || "📢",
        ctaLabelAr: input.ctaLabelAr || null,
        ctaLabelEn: input.ctaLabelEn || null,
        ctaUrl:     input.ctaUrl     || null,
        isActive:   input.isActive,
        endsAt:     input.endsAt ? new Date(input.endsAt) : null,
      });
      return { success: true };
    }),

  /** Admin: toggle active/inactive */
  toggle: protectedProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await updateAnnouncement(input.id, { isActive: input.isActive });
      return { success: true };
    }),

  /** Admin: delete */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await deleteAnnouncement(input.id);
      return { success: true };
    }),
});
