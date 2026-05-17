/**
 * Workout Router — cross-device sync for gym sessions and weight logs
 * Replaces localStorage gym_tracker_v3 with server-side persistence
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { gymSessions, weightLogs } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const ExerciseLogSchema = z.object({
  exerciseId: z.string(),
  nameAr: z.string(),
  nameEn: z.string().optional(),
  sets: z.number(),
  reps: z.string(),
  weight: z.string(),
  restSeconds: z.number(),
  completed: z.boolean(),
  notes: z.string(),
});

const CardioLogSchema = z.object({
  cardioId: z.string(),
  nameAr: z.string(),
  nameEn: z.string().optional(),
  duration: z.number(),
  speed: z.string(),
  incline: z.string(),
  distanceKm: z.string(),
  caloriesBurned: z.string(),
  pace: z.string().optional(),
  completed: z.boolean(),
}).nullable().optional();

const AquaLogSchema = z.object({
  duration: z.number(),
  intensity: z.enum(["خفيف", "متوسط", "مكثف"]),
  notes: z.string(),
  completed: z.boolean(),
}).nullable().optional();

const SaunaLogSchema = z.object({
  totalMinutes: z.number(),
  rounds: z.number(),
  notes: z.string(),
  completed: z.boolean(),
}).nullable().optional();

const GymSessionInputSchema = z.object({
  clientId: z.string(),
  date: z.string(),
  checkInTime: z.string(),
  checkOutTime: z.string().optional(),
  sessionType: z.string(),
  exercises: z.array(ExerciseLogSchema),
  cardio: CardioLogSchema,
  aqua: AquaLogSchema,
  sauna: SaunaLogSchema,
  mood: z.string().optional(),
  energyLevel: z.number().optional(),
  notes: z.string().optional(),
  bodyWeight: z.number().optional(),
  caloriesBurned: z.number().optional(),
  isActive: z.boolean().default(false),
});

// ── Router ───────────────────────────────────────────────────────────────────

export const workoutRouter = router({
  // Get all sessions for the current user
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(gymSessions)
      .where(eq(gymSessions.userId, ctx.user.id))
      .orderBy(desc(gymSessions.date), desc(gymSessions.checkInTime));
    return rows.map(r => ({
      ...r,
      exercises: JSON.parse(r.exercises || "[]"),
      cardio: r.cardio ? JSON.parse(r.cardio) : null,
      aqua: r.aqua ? JSON.parse(r.aqua) : null,
      sauna: r.sauna ? JSON.parse(r.sauna) : null,
      bodyWeight: r.bodyWeight ? parseFloat(String(r.bodyWeight)) : undefined,
    }));
  }),

  // Get active session (isActive = true)
  getActiveSession: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(gymSessions)
      .where(and(eq(gymSessions.userId, ctx.user.id), eq(gymSessions.isActive, true)))
      .limit(1);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      ...r,
      exercises: JSON.parse(r.exercises || "[]"),
      cardio: r.cardio ? JSON.parse(r.cardio) : null,
      aqua: r.aqua ? JSON.parse(r.aqua) : null,
      sauna: r.sauna ? JSON.parse(r.sauna) : null,
      bodyWeight: r.bodyWeight ? parseFloat(String(r.bodyWeight)) : undefined,
    };
  }),

  // Upsert a session (create or update by clientId)
  upsertSession: protectedProcedure
    .input(GymSessionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const values = {
        userId: ctx.user.id,
        clientId: input.clientId,
        date: input.date,
        checkInTime: input.checkInTime,
        checkOutTime: input.checkOutTime ?? null,
        sessionType: input.sessionType,
        exercises: JSON.stringify(input.exercises),
        cardio: input.cardio ? JSON.stringify(input.cardio) : null,
        aqua: input.aqua ? JSON.stringify(input.aqua) : null,
        sauna: input.sauna ? JSON.stringify(input.sauna) : null,
        mood: input.mood ?? null,
        energyLevel: input.energyLevel ?? null,
        notes: input.notes ?? null,
        bodyWeight: input.bodyWeight ? String(input.bodyWeight) : null,
        caloriesBurned: input.caloriesBurned ?? null,
        isActive: input.isActive,
      };

      // Check if session with this clientId already exists for this user
      const existing = await db
        .select({ id: gymSessions.id })
        .from(gymSessions)
        .where(and(eq(gymSessions.userId, ctx.user.id), eq(gymSessions.clientId, input.clientId)))
        .limit(1);

      if (existing.length > 0) {
        await db.update(gymSessions).set(values).where(eq(gymSessions.id, existing[0].id));
        return { id: existing[0].id, action: "updated" };
      } else {
        const result = await db.insert(gymSessions).values(values);
        return { id: (result as any)[0]?.insertId, action: "created" };
      }
    }),

  // Bulk import sessions (for localStorage migration)
  bulkImportSessions: protectedProcedure
    .input(z.array(GymSessionInputSchema))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let created = 0;
      let skipped = 0;

      for (const session of input) {
        const existing = await db
          .select({ id: gymSessions.id })
          .from(gymSessions)
          .where(and(eq(gymSessions.userId, ctx.user.id), eq(gymSessions.clientId, session.clientId)))
          .limit(1);

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        await db.insert(gymSessions).values({
          userId: ctx.user.id,
          clientId: session.clientId,
          date: session.date,
          checkInTime: session.checkInTime,
          checkOutTime: session.checkOutTime ?? null,
          sessionType: session.sessionType,
          exercises: JSON.stringify(session.exercises),
          cardio: session.cardio ? JSON.stringify(session.cardio) : null,
          aqua: session.aqua ? JSON.stringify(session.aqua) : null,
          sauna: session.sauna ? JSON.stringify(session.sauna) : null,
          mood: session.mood ?? null,
          energyLevel: session.energyLevel ?? null,
          notes: session.notes ?? null,
          bodyWeight: session.bodyWeight ? String(session.bodyWeight) : null,
          caloriesBurned: session.caloriesBurned ?? null,
          isActive: false, // imported sessions are never active
        });
        created++;
      }

      return { created, skipped };
    }),

  // Delete a session by clientId
  deleteSession: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .delete(gymSessions)
        .where(and(eq(gymSessions.userId, ctx.user.id), eq(gymSessions.clientId, input.clientId)));
      return { success: true };
    }),

  // Clear active session (end workout)
  clearActiveSession: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db
      .update(gymSessions)
      .set({ isActive: false })
      .where(and(eq(gymSessions.userId, ctx.user.id), eq(gymSessions.isActive, true)));
    return { success: true };
  }),

  // Reset all data for current user
  resetAllData: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(gymSessions).where(eq(gymSessions.userId, ctx.user.id));
    await db.delete(weightLogs).where(eq(weightLogs.userId, ctx.user.id));
    return { success: true };
  }),

  // ── Weight Logs ────────────────────────────────────────────────────────────

  getWeightLog: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, ctx.user.id))
      .orderBy(desc(weightLogs.date));
    return rows.map(r => ({
      date: r.date,
      weight: parseFloat(String(r.weight)),
    }));
  }),

  logWeight: protectedProcedure
    .input(z.object({ date: z.string(), weight: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Upsert: one entry per date per user
      const existing = await db
        .select({ id: weightLogs.id })
        .from(weightLogs)
        .where(and(eq(weightLogs.userId, ctx.user.id), eq(weightLogs.date, input.date)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(weightLogs)
          .set({ weight: String(input.weight) })
          .where(eq(weightLogs.id, existing[0].id));
      } else {
        await db.insert(weightLogs).values({
          userId: ctx.user.id,
          date: input.date,
          weight: String(input.weight),
        });
      }
      return { success: true };
    }),

  // Bulk import weight logs (for localStorage migration)
  bulkImportWeightLog: protectedProcedure
    .input(z.array(z.object({ date: z.string(), weight: z.number() })))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let created = 0;
      let skipped = 0;

      for (const entry of input) {
        const existing = await db
          .select({ id: weightLogs.id })
          .from(weightLogs)
          .where(and(eq(weightLogs.userId, ctx.user.id), eq(weightLogs.date, entry.date)))
          .limit(1);

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        await db.insert(weightLogs).values({
          userId: ctx.user.id,
          date: entry.date,
          weight: String(entry.weight),
        });
        created++;
      }

      return { created, skipped };
    }),
});
