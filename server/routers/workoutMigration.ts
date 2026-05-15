import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { gymSessions, weightLog, fitnessProfile } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ── Schemas ────────────────────────────────────────────────────────────────────

const GymSessionSchema = z.object({
  id: z.string(),
  date: z.string(),
  checkInTime: z.string(),
  checkOutTime: z.string().optional(),
  sessionType: z.string(),
  mood: z.string().optional(),
  energyLevel: z.number().optional(),
  notes: z.string().optional(),
  bodyWeight: z.number().optional(),
  exercises: z.array(z.any()).optional(),
  cardio: z.any().optional(),
  aqua: z.any().optional(),
  sauna: z.any().optional(),
  isActive: z.boolean().optional(),
});

const WeightEntrySchema = z.object({
  date: z.string(),
  weight: z.number(),
});

const FitnessProfileSchema = z.object({
  name: z.string().optional(),
  currentWeight: z.number().optional(),
  targetWeight: z.number().optional(),
  startWeight: z.number().optional(),
  age: z.number().optional(),
  height: z.number().optional(),
  bmi: z.number().optional(),
  gender: z.string().optional(),
  startDate: z.string().optional(),
  avatarUrl: z.string().optional(),
});

// ── Router ─────────────────────────────────────────────────────────────────────

export const workoutMigrationRouter = router({
  /**
   * Import all localStorage data (sessions + weight log + profile) to the server.
   * Safe to call multiple times — uses localId deduplication for sessions.
   */
  importLocalData: protectedProcedure
    .input(
      z.object({
        sessions: z.array(GymSessionSchema),
        weightLog: z.array(WeightEntrySchema),
        profile: FitnessProfileSchema.optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = ctx.user.id;
      let importedSessions = 0;
      let importedWeightEntries = 0;

      // ── 1. Import sessions ──────────────────────────────────────────────────
      for (const session of input.sessions) {
        // Skip active sessions (not completed)
        if (session.isActive) continue;

        // Check if already imported (deduplication by localId)
        const existing = await db
          .select({ id: gymSessions.id })
          .from(gymSessions)
          .where(
            and(
              eq(gymSessions.userId, userId),
              eq(gymSessions.localId, session.id)
            )
          )
          .limit(1);

        if (existing.length > 0) continue;

        await db.insert(gymSessions).values({
          userId,
          localId: session.id,
          date: session.date,
          checkInTime: session.checkInTime,
          checkOutTime: session.checkOutTime ?? null,
          sessionType: session.sessionType,
          mood: session.mood ?? null,
          energyLevel: session.energyLevel ?? null,
          notes: session.notes ?? null,
          bodyWeight: session.bodyWeight ?? null,
          payload: JSON.stringify({
            exercises: session.exercises ?? [],
            cardio: session.cardio ?? null,
            aqua: session.aqua ?? null,
            sauna: session.sauna ?? null,
          }),
        });
        importedSessions++;
      }

      // ── 2. Import weight log ────────────────────────────────────────────────
      for (const entry of input.weightLog) {
        if (!entry.date || !entry.weight) continue;

        // Deduplication by userId + date
        const existing = await db
          .select({ id: weightLog.id })
          .from(weightLog)
          .where(
            and(
              eq(weightLog.userId, userId),
              eq(weightLog.date, entry.date)
            )
          )
          .limit(1);

        if (existing.length > 0) continue;

        await db.insert(weightLog).values({
          userId,
          date: entry.date,
          weight: entry.weight,
        });
        importedWeightEntries++;
      }

      // ── 3. Upsert fitness profile ───────────────────────────────────────────
      if (input.profile) {
        const p = input.profile;
        const existingProfile = await db
          .select({ id: fitnessProfile.id })
          .from(fitnessProfile)
          .where(eq(fitnessProfile.userId, userId))
          .limit(1);

        if (existingProfile.length === 0) {
          await db.insert(fitnessProfile).values({
            userId,
            name: p.name ?? null,
            currentWeight: p.currentWeight ?? null,
            targetWeight: p.targetWeight ?? null,
            startWeight: p.startWeight ?? null,
            age: p.age ?? null,
            height: p.height ?? null,
            bmi: p.bmi ?? null,
            gender: p.gender ?? null,
            startDate: p.startDate ?? null,
            avatarUrl: p.avatarUrl ?? null,
          });
        }
      }

      return {
        success: true,
        importedSessions,
        importedWeightEntries,
      };
    }),

  /**
   * Check if the user has already migrated their data.
   * Returns true if any sessions or weight entries exist for this user.
   */
  hasMigratedData: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return false;

    const sessions = await db
      .select({ id: gymSessions.id })
      .from(gymSessions)
      .where(eq(gymSessions.userId, ctx.user.id))
      .limit(1);

    return sessions.length > 0;
  }),

  /**
   * Get all migrated sessions for the current user (for display/sync back).
   */
  getMigratedSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(gymSessions)
      .where(eq(gymSessions.userId, ctx.user.id))
      .orderBy(gymSessions.date);
  }),
});
