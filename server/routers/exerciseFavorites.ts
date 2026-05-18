import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { exerciseFavorites } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";

export const exerciseFavoritesRouter = router({
  /**
   * Get all favorited exercise IDs for the current user.
   * Returns a plain string array of exerciseId values.
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [] as string[];
    const rows = await db
      .select({ exerciseId: exerciseFavorites.exerciseId })
      .from(exerciseFavorites)
      .where(eq(exerciseFavorites.userId, ctx.user.id));
    return rows.map((r: { exerciseId: string }) => r.exerciseId);
  }),

  /**
   * Add an exercise to the user's favorites.
   * Silently ignores duplicates (INSERT IGNORE semantics via try/catch).
   */
  addFavorite: protectedProcedure
    .input(z.object({ exerciseId: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      try {
        await db.insert(exerciseFavorites).values({
          userId: ctx.user.id,
          exerciseId: input.exerciseId,
        });
      } catch {
        // Duplicate key — already favorited, ignore
      }
      return { success: true };
    }),

  /**
   * Remove an exercise from the user's favorites.
   */
  removeFavorite: protectedProcedure
    .input(z.object({ exerciseId: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .delete(exerciseFavorites)
        .where(
          and(
            eq(exerciseFavorites.userId, ctx.user.id),
            eq(exerciseFavorites.exerciseId, input.exerciseId)
          )
        );
      return { success: true };
    }),
});
