import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  verifyAccessCode,
  listAccessCodes,
  createAccessCode,
  toggleAccessCode,
  deleteAccessCode,
  updateAccessCodeEmail,
  upsertUser,
} from "../db";
import { resendKeyEmail } from "../_core/email";
import { sdk } from "../_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";

export const licenseRouter = router({
  verify: publicProcedure
    .input(
      z.object({
        licenseKey: z.string().min(1, "License key is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const row = await verifyAccessCode(input.licenseKey.trim());
      if (!row) {
        return {
          success: false,
          message: "كود الوصول غير صحيح أو غير مفعّل. يرجى التحقق من الكود والمحاولة مجدداً.",
        };
      }

      // Create / update a users row so protectedProcedures work for license users
      const openId = `license:${row.code}`;
      // Admin license keys — these keys grant admin role on login
      const ADMIN_LICENSE_KEYS = ['PRIME-ADMIN_REEM'];
      const isAdminKey = ADMIN_LICENSE_KEYS.includes(row.code.trim().toUpperCase());
      await upsertUser({
        openId,
        name: row.customerName ?? null,
        email: row.customerEmail ?? null,
        loginMethod: "license",
        lastSignedIn: new Date(),
        ...(isAdminKey ? { role: 'admin' as const } : {}),
      });

      // Issue a session cookie (same flow as OAuth callback)
      const sessionToken = await sdk.createSessionToken(openId, {
        name: row.customerName || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        customerName: row.customerName ?? undefined,
        customerEmail: row.customerEmail ?? undefined,
        expiresAt: row.expiresAt ?? undefined,
        plan: (row.expiresAt ? 'monthly' : 'lifetime') as string,
        message: "تم التحقق من الكود بنجاح!",
      };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
    }
    return listAccessCodes();
  }),

  create: protectedProcedure
    .input(
      z.object({
        code: z.string().min(4, "Code must be at least 4 characters"),
        customerName: z.string().optional(),
        customerEmail: z.string().email().optional().or(z.literal("")),
        note: z.string().optional(),
        expiresAt: z.string().optional(), // ISO date string, e.g. "2027-01-01"
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
      }
      await createAccessCode({
        code: input.code.trim(),
        customerName: input.customerName || null,
        customerEmail: input.customerEmail || null,
        note: input.note || null,
        isActive: true,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      });
      return { success: true };
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
      }
      await toggleAccessCode(input.id, input.isActive);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
      }
      await deleteAccessCode(input.id);
      return { success: true };
    }),

  updateEmail: protectedProcedure
    .input(z.object({
      id: z.number(),
      email: z.string().email("Invalid email address"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
      }
      const updated = await updateAccessCodeEmail(input.id, input.email);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Code not found" });
      return { success: true, row: updated };
    }),

  resendEmail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
      }
      // Fetch the access code row
      const codes = await listAccessCodes();
      const row = codes.find((c: any) => c.id === input.id);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Code not found" });
      if (!row.customerEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "No email address on this code" });
      const sent = await resendKeyEmail({
        to: row.customerEmail,
        customerName: row.customerName || "عزيزي المشترك",
        licenseKey: row.code,
        expiresAt: row.expiresAt ?? null,
      });
      if (!sent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send email" });
      return { success: true };
    }),
});
