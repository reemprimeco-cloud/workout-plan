/**
 * Admin router — profile management and broadcast notifications
 * All procedures require admin role.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAdminProfile,
  upsertAdminProfile,
  createBroadcast,
  listBroadcasts,
  getAllLicensedCustomerEmails,
  listAccessCodes,
} from "../db";
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
        base64: z.string(), // data:image/...;base64,...
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      // Strip data URL prefix
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
    return { total, active, inactive, totalBroadcasts, totalRecipients };
  }),

  // ── Broadcasts ────────────────────────────────────────────────────────────
  listBroadcasts: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    return listBroadcasts();
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
        // Small delay to avoid SMTP rate limits
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
});
