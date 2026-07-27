/**
 * User Profile Router
 * Handles avatar upload to S3 and display name updates for authenticated users.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const userProfileRouter = router({
  /**
   * Upload a profile avatar image (base64 encoded) to S3.
   * Returns the storage URL to display in the UI.
   */
  uploadAvatar: protectedProcedure
    .input(
      z.object({
        base64: z.string(), // data:image/...;base64,...  OR raw base64
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Strip data URL prefix if present
      const base64Data = input.base64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Limit to 5 MB
      if (buffer.length > 5 * 1024 * 1024) {
        throw new Error("Image too large. Maximum size is 5 MB.");
      }

      const ext = input.mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
      const key = `user-avatars/${ctx.user.id}-${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);

      // Persist the URL in the users table
      const db = await getDb();
      if (db) {
        await db
          .update(users)
          .set({ avatarUrl: url })
          .where(eq(users.id, ctx.user.id));
      }

      return { url };
    }),

  /**
   * Update the display name stored in the users table.
   * This syncs the name from localStorage to the DB.
   */
  updateDisplayName: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        await db
          .update(users)
          .set({ name: input.name })
          .where(eq(users.id, ctx.user.id));
      }
      return { success: true };
    }),

  /**
   * Get the current user's profile: display name, avatar, and body metrics.
   *
   * `currentWeight` / `targetWeight` are Postgres `numeric`, which the driver
   * returns as strings to avoid float precision loss. They're converted to
   * numbers here so clients get a consistent JSON shape and don't each have to
   * remember to parse them.
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const empty = {
      avatarUrl: null,
      name: null,
      age: null,
      height: null,
      currentWeight: null,
      targetWeight: null,
      gender: null,
    };
    const db = await getDb();
    if (!db) return empty;
    const result = await db
      .select({
        avatarUrl: users.avatarUrl,
        name: users.name,
        age: users.age,
        height: users.height,
        currentWeight: users.currentWeight,
        targetWeight: users.targetWeight,
        gender: users.gender,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    const row = result[0];
    if (!row) return empty;
    return {
      ...row,
      currentWeight: row.currentWeight === null ? null : Number(row.currentWeight),
      targetWeight: row.targetWeight === null ? null : Number(row.targetWeight),
    };
  }),

  /**
   * Persist the body metrics behind BMI, calorie targets and AI coaching.
   *
   * These previously lived only in the iOS app's UserDefaults and the web's
   * localStorage, so reinstalling or switching device silently lost them —
   * and because the coach and calorie goals are derived from this profile, a
   * user in that state got generic coaching and wrong targets with no
   * indication anything was missing.
   *
   * Every field is optional and only provided fields are written, so a client
   * can send a partial edit without clobbering values it doesn't manage.
   * Ranges are clamped to physically plausible values rather than trusting the
   * client, since these feed calorie maths.
   */
  updateFitnessProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        age: z.number().int().min(10).max(120).optional(),
        height: z.number().int().min(80).max(260).optional(),
        currentWeight: z.number().min(20).max(400).optional(),
        targetWeight: z.number().min(20).max(400).optional(),
        gender: z.enum(["male", "female"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.age !== undefined) updates.age = input.age;
      if (input.height !== undefined) updates.height = input.height;
      // numeric columns take strings — pass through as-is so the value lands
      // with full precision rather than a float round-trip.
      if (input.currentWeight !== undefined) updates.currentWeight = String(input.currentWeight);
      if (input.targetWeight !== undefined) updates.targetWeight = String(input.targetWeight);
      if (input.gender !== undefined) updates.gender = input.gender;

      if (Object.keys(updates).length === 0) return { success: true };

      updates.updatedAt = new Date();
      await db.update(users).set(updates).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
});
