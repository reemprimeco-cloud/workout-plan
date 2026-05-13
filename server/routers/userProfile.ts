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
   * Get the current user's avatar URL and display name from the DB.
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { avatarUrl: null, name: null };
    const result = await db
      .select({ avatarUrl: users.avatarUrl, name: users.name })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return result[0] ?? { avatarUrl: null, name: null };
  }),
});
