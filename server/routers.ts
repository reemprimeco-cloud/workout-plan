import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { licenseRouter } from "./routers/license";
import { notificationsRouter } from "./routers/notifications";
import { coachRouter } from "./routers/coach";
import { communityRouter } from "./routers/community";
import { adminRouter } from "./routers/admin";
import { subscriptionRouter } from "./routers/subscription";
import { userProfileRouter } from "./routers/userProfile";
import { spinWheelRouter } from "./routers/spinWheel";
import { nutritionRouter } from "./routers/nutrition";
import { workoutMigrationRouter } from "./routers/workoutMigration";
import { inAppNotificationsRouter } from "./routers/inAppNotifications";
import { announcementsRouter } from "./routers/announcements";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  license: licenseRouter,
  notifications: notificationsRouter,
  coach: coachRouter,
  community: communityRouter,
  admin: adminRouter,
  subscription: subscriptionRouter,
  userProfile: userProfileRouter,
  spinWheel: spinWheelRouter,
  nutrition: nutritionRouter,
  workoutMigration: workoutMigrationRouter,
  inAppNotifications: inAppNotificationsRouter,
  announcements: announcementsRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
