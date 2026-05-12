import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  verifyAccessCode,
  listAccessCodes,
  createAccessCode,
  toggleAccessCode,
  deleteAccessCode,
  upsertUser,
} from "../db";
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
      await upsertUser({
        openId,
        name: row.customerName ?? null,
        email: row.customerEmail ?? null,
        loginMethod: "license",
        lastSignedIn: new Date(),
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
});
