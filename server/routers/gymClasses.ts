/**
 * Gym Classes router — gym management, branch management, class schedule management,
 * Excel/CSV import, today's classes display, and user join tracking.
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  gyms,
  gymBranches,
  gymClasses,
  joinedClasses,
  gymSessions,
} from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { storagePut } from "../storage";
import * as XLSX from "xlsx";

// Helper — throws FORBIDDEN if caller is not admin
function requireAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
  }
}

// Helper — throws if DB unavailable
function dbRequired(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  return db;
}

// XP per intensity
const XP_MAP: Record<string, number> = {
  Beginner: 20,
  Intermediate: 40,
  Advanced: 70,
};

// Mid-range calorie estimates per intensity
const CALORIE_MAP: Record<string, number> = {
  Beginner: 225,
  Intermediate: 425,
  Advanced: 700,
};

// Get current weekday name (Monday, Tuesday, …)
function todayWeekday(): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

export const gymClassesRouter = router({

  // ─────────────────────────────────────────────────────────────────────────
  // GYMS
  // ─────────────────────────────────────────────────────────────────────────

  getGyms: publicProcedure.query(async () => {
    const db = dbRequired(await getDb());
    return db.select().from(gyms).orderBy(gyms.name);
  }),

  createGym: protectedProcedure
    .input(z.object({
      name:       z.string().min(1).max(255),
      logoUrl:    z.string().optional(),
      brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = dbRequired(await getDb());
      const [result] = await db.insert(gyms).values({
        name:       input.name,
        logoUrl:    input.logoUrl ?? null,
        brandColor: input.brandColor ?? "#1B2E5E",
      });
      return { id: (result as any).insertId as number };
    }),

  updateGym: protectedProcedure
    .input(z.object({
      id:         z.number().int().positive(),
      name:       z.string().min(1).max(255).optional(),
      logoUrl:    z.string().optional().nullable(),
      brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = dbRequired(await getDb());
      const { id, ...fields } = input;
      await db.update(gyms).set(fields).where(eq(gyms.id, id));
      return { success: true };
    }),

  deleteGym: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = dbRequired(await getDb());
      const branches = await db.select({ id: gymBranches.id }).from(gymBranches).where(eq(gymBranches.gymId, input.id));
      const branchIds = branches.map((b: { id: number }) => b.id);
      if (branchIds.length > 0) {
        await db.delete(gymClasses).where(inArray(gymClasses.branchId, branchIds));
      }
      await db.delete(gymBranches).where(eq(gymBranches.gymId, input.id));
      await db.delete(gyms).where(eq(gyms.id, input.id));
      return { success: true };
    }),

  uploadGymLogo: protectedProcedure
    .input(z.object({
      base64:   z.string(),
      mimeType: z.string(),
      gymId:    z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] || "png";
      const key = `gym-logos/gym_${input.gymId}_${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      const db = dbRequired(await getDb());
      await db.update(gyms).set({ logoUrl: url }).where(eq(gyms.id, input.gymId));
      return { url };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // BRANCHES
  // ─────────────────────────────────────────────────────────────────────────

  getBranches: publicProcedure
    .input(z.object({ gymId: z.number().int().positive().optional() }))
    .query(async ({ input }) => {
      const db = dbRequired(await getDb());
      if (input.gymId) {
        return db.select().from(gymBranches).where(eq(gymBranches.gymId, input.gymId)).orderBy(gymBranches.name);
      }
      return db.select().from(gymBranches).orderBy(gymBranches.name);
    }),

  createBranch: protectedProcedure
    .input(z.object({
      gymId:    z.number().int().positive(),
      name:     z.string().min(1).max(255),
      location: z.string().max(512).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = dbRequired(await getDb());
      const [result] = await db.insert(gymBranches).values({
        gymId:    input.gymId,
        name:     input.name,
        location: input.location ?? null,
      });
      return { id: (result as any).insertId as number };
    }),

  updateBranch: protectedProcedure
    .input(z.object({
      id:       z.number().int().positive(),
      name:     z.string().min(1).max(255).optional(),
      location: z.string().max(512).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = dbRequired(await getDb());
      const { id, ...fields } = input;
      await db.update(gymBranches).set(fields).where(eq(gymBranches.id, id));
      return { success: true };
    }),

  deleteBranch: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = dbRequired(await getDb());
      await db.delete(gymClasses).where(eq(gymClasses.branchId, input.id));
      await db.delete(gymBranches).where(eq(gymBranches.id, input.id));
      return { success: true };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // CLASSES
  // ─────────────────────────────────────────────────────────────────────────

  getClasses: protectedProcedure
    .input(z.object({
      gymId:    z.number().int().positive().optional(),
      branchId: z.number().int().positive().optional(),
      day:      z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = dbRequired(await getDb());
      const conditions = [];
      if (input.gymId)    conditions.push(eq(gymClasses.gymId, input.gymId));
      if (input.branchId) conditions.push(eq(gymClasses.branchId, input.branchId));
      if (input.day)      conditions.push(eq(gymClasses.day, input.day as "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday"));
      if (conditions.length > 0) {
        return db.select().from(gymClasses).where(and(...conditions)).orderBy(gymClasses.day, gymClasses.time);
      }
      return db.select().from(gymClasses).orderBy(gymClasses.day, gymClasses.time);
    }),

  createClass: protectedProcedure
    .input(z.object({
      gymId:            z.number().int().positive(),
      branchId:         z.number().int().positive(),
      className:        z.string().min(1).max(255),
      coach:            z.string().min(1).max(255),
      day:              z.enum(["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]),
      time:             z.string().min(1).max(20),
      durationMin:      z.number().int().min(15).max(300).default(60),
      intensity:        z.enum(["Beginner","Intermediate","Advanced"]).default("Beginner"),
      caloriesOverride: z.number().int().positive().optional().nullable(),
      notes:            z.string().max(1000).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = dbRequired(await getDb());
      const [result] = await db.insert(gymClasses).values(input);
      return { id: (result as any).insertId as number };
    }),

  updateClass: protectedProcedure
    .input(z.object({
      id:               z.number().int().positive(),
      className:        z.string().min(1).max(255).optional(),
      coach:            z.string().min(1).max(255).optional(),
      day:              z.enum(["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]).optional(),
      time:             z.string().min(1).max(20).optional(),
      durationMin:      z.number().int().min(15).max(300).optional(),
      intensity:        z.enum(["Beginner","Intermediate","Advanced"]).optional(),
      caloriesOverride: z.number().int().positive().optional().nullable(),
      notes:            z.string().max(1000).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = dbRequired(await getDb());
      const { id, ...fields } = input;
      await db.update(gymClasses).set(fields).where(eq(gymClasses.id, id));
      return { success: true };
    }),

  deleteClass: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = dbRequired(await getDb());
      await db.delete(gymClasses).where(eq(gymClasses.id, input.id));
      return { success: true };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // EXCEL IMPORT
  // ─────────────────────────────────────────────────────────────────────────

  importSchedule: protectedProcedure
    .input(z.object({
      base64:   z.string(),
      filename: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = dbRequired(await getDb());

      const buffer = Buffer.from(input.base64, "base64");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames.find((n: string) => n.toLowerCase() === "schedule") ?? workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (rows.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No data rows found in the file." });
      }

      const normalize = (obj: Record<string, string>) => {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(obj)) {
          out[k.trim().toLowerCase()] = String(v).trim();
        }
        return out;
      };

      const VALID_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      const VALID_INTENSITY = ["Beginner","Intermediate","Advanced"];

      const gymCache: Record<string, number> = {};
      const branchCache: Record<string, number> = {};

      const getOrCreateGym = async (name: string): Promise<number> => {
        if (gymCache[name]) return gymCache[name];
        const existing = await db.select({ id: gyms.id }).from(gyms).where(eq(gyms.name, name));
        if (existing.length > 0) {
          gymCache[name] = existing[0].id;
          return existing[0].id;
        }
        const [r] = await db.insert(gyms).values({ name });
        const id = (r as any).insertId as number;
        gymCache[name] = id;
        return id;
      };

      const getOrCreateBranch = async (gymId: number, branchName: string): Promise<number> => {
        const key = `${gymId}::${branchName}`;
        if (branchCache[key]) return branchCache[key];
        const existing = await db.select({ id: gymBranches.id }).from(gymBranches)
          .where(and(eq(gymBranches.gymId, gymId), eq(gymBranches.name, branchName)));
        if (existing.length > 0) {
          branchCache[key] = existing[0].id;
          return existing[0].id;
        }
        const [r] = await db.insert(gymBranches).values({ gymId, name: branchName });
        const id = (r as any).insertId as number;
        branchCache[key] = id;
        return id;
      };

      const affectedPairs = new Set<string>();
      const toInsert: {
        gymId: number; branchId: number; className: string; coach: string;
        day: "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday";
        time: string; durationMin: number;
        intensity: "Beginner" | "Intermediate" | "Advanced";
        caloriesOverride: number | null; notes: string | null;
      }[] = [];

      let skipped = 0;
      for (const rawRow of rows) {
        const row = normalize(rawRow);
        const gymName    = row["gym name"] || row["gym"] || "";
        const branchName = row["branch"] || "";
        const day        = row["day"] || "";
        const time       = row["time"] || "";
        const className  = row["class name"] || row["class"] || "";
        const coach      = row["coach"] || "";
        const duration   = parseInt(row["duration (min)"] || row["duration"] || "60") || 60;
        const rawInt     = row["intensity"] || "Beginner";
        const intensity  = VALID_INTENSITY.includes(rawInt) ? rawInt as "Beginner"|"Intermediate"|"Advanced" : "Beginner";
        const calories   = row["calories"] ? parseInt(row["calories"]) || null : null;
        const notes      = row["notes"] || null;

        if (!gymName || !branchName || !day || !time || !className || !coach) {
          skipped++;
          continue;
        }
        const normalizedDay = VALID_DAYS.find(d => d.toLowerCase() === day.toLowerCase()) as
          "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday" | undefined;
        if (!normalizedDay) { skipped++; continue; }

        const gymId    = await getOrCreateGym(gymName);
        const branchId = await getOrCreateBranch(gymId, branchName);

        affectedPairs.add(`${gymId}::${branchId}`);
        toInsert.push({ gymId, branchId, className, coach, day: normalizedDay, time, durationMin: duration, intensity, caloriesOverride: calories, notes });
      }

      for (const pair of Array.from(affectedPairs)) {
        const [gId, bId] = pair.split("::").map(Number);
        await db.delete(gymClasses).where(and(eq(gymClasses.gymId, gId), eq(gymClasses.branchId, bId)));
      }

      if (toInsert.length > 0) {
        await db.insert(gymClasses).values(toInsert);
      }

      return {
        imported: toInsert.length,
        skipped,
        gyms: Object.keys(gymCache).length,
        branches: Object.keys(branchCache).length,
      };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // TODAY'S CLASSES (public — shown on Home page)
  // ─────────────────────────────────────────────────────────────────────────

  getTodayClasses: publicProcedure.query(async () => {
    const db = dbRequired(await getDb());
    const day = todayWeekday() as "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday";

    const rows = await db
      .select({
        id:               gymClasses.id,
        className:        gymClasses.className,
        coach:            gymClasses.coach,
        day:              gymClasses.day,
        time:             gymClasses.time,
        durationMin:      gymClasses.durationMin,
        intensity:        gymClasses.intensity,
        caloriesOverride: gymClasses.caloriesOverride,
        notes:            gymClasses.notes,
        gymId:            gyms.id,
        gymName:          gyms.name,
        gymLogoUrl:       gyms.logoUrl,
        gymBrandColor:    gyms.brandColor,
        branchId:         gymBranches.id,
        branchName:       gymBranches.name,
        branchLocation:   gymBranches.location,
      })
      .from(gymClasses)
      .innerJoin(gyms, eq(gymClasses.gymId, gyms.id))
      .innerJoin(gymBranches, eq(gymClasses.branchId, gymBranches.id))
      .where(eq(gymClasses.day, day))
      .orderBy(gymClasses.time);

    return rows.map(r => ({
      ...r,
      estimatedCalories: r.caloriesOverride ?? CALORIE_MAP[r.intensity ?? "Beginner"] ?? 300,
      xp: XP_MAP[r.intensity ?? "Beginner"] ?? 20,
    }));
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // JOIN A CLASS
  // ─────────────────────────────────────────────────────────────────────────

  joinClass: protectedProcedure
    .input(z.object({ classId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = dbRequired(await getDb());
      const userId = ctx.user.id;

      const [cls] = await db.select().from(gymClasses).where(eq(gymClasses.id, input.classId));
      if (!cls) throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });

      const caloriesBurned = cls.caloriesOverride ?? CALORIE_MAP[cls.intensity ?? "Beginner"] ?? 300;
      const xpAwarded = XP_MAP[cls.intensity ?? "Beginner"] ?? 20;

      // Create a linked gym session so the class appears in History & Stats
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const timeStr = cls.time ?? now.toTimeString().slice(0, 5); // HH:MM
      const sessionClientId = `gym-class-${input.classId}-${userId}-${Date.now()}`;

      const [sessionResult] = await db.insert(gymSessions).values({
        userId,
        clientId: sessionClientId,
        date: dateStr,
        checkInTime: timeStr,
        checkOutTime: timeStr, // same — class time is fixed
        sessionType: `gym_class:${cls.className}`,
        exercises: JSON.stringify([]),
        notes: `Gym class: ${cls.className} — Coach: ${cls.coach}`,
        caloriesBurned,
        isActive: false,
      });
      const sessionId = (sessionResult as any).insertId as number;

      await db.insert(joinedClasses).values({
        userId,
        classId: input.classId,
        caloriesBurned,
        xpAwarded,
        sessionId,
      });

      return { caloriesBurned, xpAwarded, sessionId };
    }),

  // Undo a class join — removes the join record and deletes the linked session
  leaveClass: protectedProcedure
    .input(z.object({ classId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = dbRequired(await getDb());
      const userId = ctx.user.id;

      // Find today's join record for this class
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMs = today.getTime();
      const tomorrowMs = todayMs + 86400000;

      const joins = await db
        .select()
        .from(joinedClasses)
        .where(and(eq(joinedClasses.userId, userId), eq(joinedClasses.classId, input.classId)));

      const todayJoin = joins.find((j: typeof joins[0]) => {
        if (!j.joinedAt) return false;
        const t = new Date(j.joinedAt).getTime();
        return t >= todayMs && t < tomorrowMs;
      });

      if (!todayJoin) throw new TRPCError({ code: "NOT_FOUND", message: "No join record found for today" });

      // Delete the linked gym session if it exists
      if (todayJoin.sessionId) {
        await db.delete(gymSessions).where(
          and(eq(gymSessions.id, todayJoin.sessionId), eq(gymSessions.userId, userId))
        );
      }

      // Delete the join record
      await db.delete(joinedClasses).where(eq(joinedClasses.id, todayJoin.id));

      return { success: true };
    }),

  // Get today's joined class IDs for the current user
  getTodayJoinedClassIds: protectedProcedure.query(async ({ ctx }) => {
    const db = dbRequired(await getDb());

    // joinedAt is stored as a timestamp; filter to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const tomorrowMs = todayMs + 86400000;

    const rows = await db
      .select({ classId: joinedClasses.classId, joinedAt: joinedClasses.joinedAt })
      .from(joinedClasses)
      .where(eq(joinedClasses.userId, ctx.user.id));

    return rows
      .filter((r: { classId: number; joinedAt: Date | null }) => {
        if (!r.joinedAt) return false;
        const t = new Date(r.joinedAt).getTime();
        return t >= todayMs && t < tomorrowMs;
      })
      .map((r: { classId: number; joinedAt: Date | null }) => r.classId);
  }),
});
