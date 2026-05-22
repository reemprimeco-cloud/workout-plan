/**
 * CMS Router — Full admin content management system
 * Covers: site appearance, exercise overrides, session icon overrides, error logs
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  siteAppearance,
  exerciseOverrides,
  sessionIconOverrides,
  appErrorLogs,
} from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { storagePut } from "../storage";

function requireAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateAppearance() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db.select().from(siteAppearance).limit(1);
  if (rows.length > 0) return rows[0];
  // Create default row
  await db.insert(siteAppearance).values({
    primaryColor: "#1B2E5E",
    accentColor: "#7BB8D4",
    bgColor: "#F0F4F8",
    textColor: "#1B2E5E",
    fontFamily: "Inter",
  });
  const created = await db.select().from(siteAppearance).limit(1);
  return created[0];
}

// ── Router ───────────────────────────────────────────────────────────────────

export const cmsRouter = router({

  // ── APPEARANCE ──────────────────────────────────────────────────────────────

  getAppearance: publicProcedure.query(async () => {
    return getOrCreateAppearance();
  }),

  updateAppearance: protectedProcedure
    .input(z.object({
      primaryColor: z.string().max(32).optional(),
      accentColor:  z.string().max(32).optional(),
      bgColor:      z.string().max(32).optional(),
      textColor:    z.string().max(32).optional(),
      fontFamily:   z.string().max(128).optional(),
      footerText:   z.string().max(1000).optional().nullable(),
      footerLinks:  z.string().max(2000).optional().nullable(), // JSON string
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const existing = await getOrCreateAppearance();
      await db.update(siteAppearance)
        .set({
          ...(input.primaryColor !== undefined && { primaryColor: input.primaryColor }),
          ...(input.accentColor  !== undefined && { accentColor:  input.accentColor }),
          ...(input.bgColor      !== undefined && { bgColor:      input.bgColor }),
          ...(input.textColor    !== undefined && { textColor:    input.textColor }),
          ...(input.fontFamily   !== undefined && { fontFamily:   input.fontFamily }),
          ...(input.footerText   !== undefined && { footerText:   input.footerText }),
          ...(input.footerLinks  !== undefined && { footerLinks:  input.footerLinks }),
        })
        .where(eq(siteAppearance.id, existing.id));
      return { success: true };
    }),

  uploadAppearanceImage: protectedProcedure
    .input(z.object({
      type:        z.enum(["logo", "banner"]),
      base64:      z.string(),
      contentType: z.string().max(64).default("image/jpeg"),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const existing = await getOrCreateAppearance();
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.contentType.split("/")[1] ?? "jpg";
      const filePath = `cms/${input.type}_${Date.now()}.${ext}`;
      console.log("[CMS] uploadAppearanceImage: uploading", filePath, "contentType:", input.contentType);
      const { key, url } = await storagePut(filePath, buffer, input.contentType);
      console.log("[CMS] UPLOAD RESULT key:", key, "url:", url);
      const updateData = input.type === "logo"
        ? { logoUrl: url, logoKey: key }
        : { bannerUrl: url, bannerKey: key };
      const dbResult = await db.update(siteAppearance).set(updateData).where(eq(siteAppearance.id, existing.id));
      console.log("[CMS] DB UPDATE appearance:", JSON.stringify(dbResult));
      return { url, key };
    }),

  // ── EXERCISE OVERRIDES ───────────────────────────────────────────────────────

  listExerciseOverrides: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    return db.select().from(exerciseOverrides).orderBy(exerciseOverrides.exerciseId);
  }),

  upsertExerciseOverride: protectedProcedure
    .input(z.object({
      exerciseId: z.string().max(64),
      name:       z.string().max(255).optional().nullable(),
      nameAr:     z.string().max(255).optional().nullable(),
      sets:       z.string().max(32).optional().nullable(),
      reps:       z.string().max(32).optional().nullable(),
      rest:       z.string().max(32).optional().nullable(),
      notes:      z.string().max(2000).optional().nullable(),
      notesAr:    z.string().max(2000).optional().nullable(),
      youtubeUrl: z.string().max(500).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const existing = await db.select().from(exerciseOverrides)
        .where(eq(exerciseOverrides.exerciseId, input.exerciseId)).limit(1);
      if (existing.length > 0) {
        await db.update(exerciseOverrides)
          .set({
            nameEn:     input.name       ?? existing[0].nameEn,
            nameAr:     input.nameAr     ?? existing[0].nameAr,
            sets:       typeof (input.sets ?? existing[0].sets) === 'string' ? parseInt(input.sets ?? String(existing[0].sets) ?? '0') : (input.sets as number | null) ?? existing[0].sets,
            reps:       typeof (input.reps ?? existing[0].reps) === 'string' ? parseInt(input.reps ?? String(existing[0].reps) ?? '0') : (input.reps as number | null) ?? existing[0].reps,
            restSec:    typeof (input.rest ?? existing[0].restSec) === 'string' ? parseInt(input.rest ?? String(existing[0].restSec) ?? '0') : (input.rest as number | null) ?? existing[0].restSec,
            notes:      input.notes      ?? existing[0].notes,
            youtubeUrl: input.youtubeUrl ?? existing[0].youtubeUrl,
          })
          .where(eq(exerciseOverrides.exerciseId, input.exerciseId));
      } else {
        await db.insert(exerciseOverrides).values({
          exerciseId: input.exerciseId,
          nameEn:     input.name       ?? null,
          nameAr:     input.nameAr     ?? null,
          sets:       input.sets       ? parseInt(input.sets) : null,
          reps:       input.reps       ? parseInt(input.reps) : null,
          restSec:    input.rest       ? parseInt(input.rest) : null,
          notes:      input.notes      ?? null,
          youtubeUrl: input.youtubeUrl ?? null,
        });
      }
      return { success: true };
    }),

  uploadExerciseImage: protectedProcedure
    .input(z.object({
      exerciseId:  z.string().max(64),
      base64:      z.string(),
      contentType: z.string().max(64).default("image/jpeg"),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.contentType.split("/")[1] ?? "jpg";
      const filePath = `cms/exercises/${input.exerciseId}_${Date.now()}.${ext}`;
      console.log("[CMS] uploadExerciseImage: exerciseId:", input.exerciseId, "path:", filePath);
      const { key, url } = await storagePut(filePath, buffer, input.contentType);
      console.log("[CMS] UPLOAD RESULT key:", key, "PUBLIC URL:", url);
      const existing = await db.select().from(exerciseOverrides)
        .where(eq(exerciseOverrides.exerciseId, input.exerciseId)).limit(1);
      let dbResult;
      if (existing.length > 0) {
        dbResult = await db.update(exerciseOverrides)
          .set({ imageUrl: url })
          .where(eq(exerciseOverrides.exerciseId, input.exerciseId));
      } else {
        dbResult = await db.insert(exerciseOverrides).values({
          exerciseId: input.exerciseId,
          imageUrl: url,
        });
      }
      console.log("[CMS] DB UPDATE exerciseOverrides:", JSON.stringify(dbResult), "imageUrl:", url);
      return { url, key };
    }),

  // ── SESSION ICON OVERRIDES ───────────────────────────────────────────────────

  listSessionIcons: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    return db.select().from(sessionIconOverrides);
  }),

  uploadSessionIcon: protectedProcedure
    .input(z.object({
      sessionType: z.string().max(64),
      base64:      z.string(),
      contentType: z.string().max(64).default("image/jpeg"),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.contentType.split("/")[1] ?? "jpg";
      const filePath = `cms/session-icons/${input.sessionType}_${Date.now()}.${ext}`;
      console.log("[CMS] uploadSessionIcon: sessionType:", input.sessionType, "path:", filePath);
      const { key, url } = await storagePut(filePath, buffer, input.contentType);
      console.log("[CMS] UPLOAD RESULT key:", key, "PUBLIC URL:", url);
      const existing = await db.select().from(sessionIconOverrides)
        .where(eq(sessionIconOverrides.sessionType, input.sessionType)).limit(1);
      let dbResult;
      if (existing.length > 0) {
        dbResult = await db.update(sessionIconOverrides)
          .set({ iconUrl: url })
          .where(eq(sessionIconOverrides.sessionType, input.sessionType));
      } else {
        dbResult = await db.insert(sessionIconOverrides).values({
          sessionType: input.sessionType,
          iconUrl: url,
        });
      }
      console.log("[CMS] DB UPDATE sessionIconOverrides:", JSON.stringify(dbResult), "sessionType:", input.sessionType, "iconUrl:", url);
      return { url, key };
    }),

  deleteSessionIcon: protectedProcedure
    .input(z.object({ sessionType: z.string().max(64) }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(sessionIconOverrides)
        .where(eq(sessionIconOverrides.sessionType, input.sessionType));
      console.log("[CMS] deleteSessionIcon: removed sessionType:", input.sessionType);
      return { success: true };
    }),

  // ── PUBLIC CONTENT (for all users) ────────────────────────────────────────────

  getPublicSessionIcons: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(sessionIconOverrides);
    // Filter out any rows with null/empty iconUrl to prevent null src
    return rows.filter(r => r.iconUrl && r.iconUrl.trim() !== '');
  }),

  getPublicExerciseOverrides: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(exerciseOverrides);
    return rows;
  }),

  // ── ERROR LOGS ───────────────────────────────────────────────────────────────

  reportError: publicProcedure
    .input(z.object({
      severity: z.enum(["error", "warning", "info"]).default("error"),
      source:   z.enum(["client", "server"]).default("client"),
      message:  z.string().max(2000),
      stack:    z.string().max(5000).optional().nullable(),
      url:      z.string().max(500).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.insert(appErrorLogs).values({
        severity:  input.severity,
        message:   input.message,
        stack:     input.stack ?? null,
        url:       input.url ?? null,
      });
      return { success: true };
    }),

  listErrorLogs: protectedProcedure
    .input(z.object({
      limit:    z.number().min(1).max(200).default(50),
      resolved: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const conditions = [];
      if (input?.resolved !== undefined) {
        conditions.push(eq(appErrorLogs.resolved, input.resolved));
      }
      const query = db.select().from(appErrorLogs)
        .orderBy(desc(appErrorLogs.createdAt))
        .limit(input?.limit ?? 50);
      if (conditions.length > 0) {
        return query.where(and(...conditions));
      }
      return query;
    }),

  resolveError: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(appErrorLogs).set({ resolved: true }).where(eq(appErrorLogs.id, input.id));
      return { success: true };
    }),

  resolveAllErrors: protectedProcedure.mutation(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    await db.update(appErrorLogs).set({ resolved: true }).where(eq(appErrorLogs.resolved, false));
    return { success: true };
  }),

  clearResolvedErrors: protectedProcedure.mutation(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    await db.delete(appErrorLogs).where(eq(appErrorLogs.resolved, true));
    return { success: true };
  }),

  countUnresolvedErrors: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return 0;
    const rows = await db.select().from(appErrorLogs).where(eq(appErrorLogs.resolved, false));
    return rows.length;
  }),
});
