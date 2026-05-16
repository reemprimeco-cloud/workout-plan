import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { workoutReminderHandler } from "../handlers/workoutReminder";
import { handleMyfatoorahWebhook as myfatoorahWebhookHandler } from "../handlers/myfatoorahWebhook";

// ── Socket.IO singleton — import this in routers to emit events ───────────────
let _io: SocketIOServer | null = null;
export function getIO(): SocketIOServer | null { return _io; }
export function setIO(io: SocketIOServer) { _io = io; }

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ── Socket.IO setup ──────────────────────────────────────────────────────
  const io = new SocketIOServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/socket.io",
  });
  setIO(io);

  io.on("connection", (socket) => {
    // Client sends their userId to join a personal room for direct notifications
    socket.on("join", (userId: number) => {
      if (userId) socket.join(`user:${userId}`);
    });
    socket.on("disconnect", () => {});
  });
  app.post("/api/webhooks/myfatoorah", myfatoorahWebhookHandler);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Scheduled handlers — must be mounted BEFORE tRPC and static fallthrough
  app.post("/api/scheduled/workoutReminder", workoutReminderHandler);

  // ── Manual reminder test — POST /api/debug/test-reminder/:userId ─────────
  // Fires a push to a specific user without needing the cron
  app.post("/api/debug/test-reminder/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (!userId) return res.status(400).json({ error: "invalid userId" });

      const { getPushSubscriptionByUser, getNotificationSettings } = await import("../db");
      const { sendPushToSubscription } = await import("../routers/notifications");

      const sub      = await getPushSubscriptionByUser(userId);
      const settings = await getNotificationSettings(userId);

      if (!sub) return res.status(404).json({ error: "no push subscription for this user — they must enable notifications first" });

      const lang = (settings?.language ?? "ar") as "ar" | "en";
      const result = await sendPushToSubscription(sub.endpoint, sub.p256dh, sub.auth, {
        title: lang === "ar" ? "🏋️ تذكير التمرين" : "🏋️ Workout Reminder",
        body:  lang === "ar" ? "حان وقت تمرينك! لا تتأخري 💪" : "Time for your workout! Don't skip it 💪",
        icon:  "/icons/icon-192.png",
        url:   "/",
      });

      return res.json({ ok: true, result, userId, lang });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/debug/notifications", async (_req, res) => {
    const { getDb } = await import("../db");
    const { pushSubscriptions, notificationSettings } = await import("../../drizzle/schema");

    const db = await getDb();
    let subCount = 0;
    let enabledCount = 0;
    let sampleSettings: any = null;

    if (db) {
      const subs = await db.select().from(pushSubscriptions).limit(100);
      subCount = subs.length;
      const settings = await db.select().from(notificationSettings).limit(100);
      enabledCount = settings.filter((s: any) => s.enabled).length;
      sampleSettings = settings[0] ?? null;
    }

    res.json({
      ok: true,
      checks: {
        vapidPublicKey:  !!process.env.VAPID_PUBLIC_KEY  ? "✅ set" : "❌ MISSING",
        vapidPrivateKey: !!process.env.VAPID_PRIVATE_KEY ? "✅ set" : "❌ MISSING",
        forgeApiUrl:     !!process.env.BUILT_IN_FORGE_API_URL  ? "✅ set" : "❌ MISSING — cron jobs won't fire",
        forgeApiKey:     !!process.env.BUILT_IN_FORGE_API_KEY  ? "✅ set" : "❌ MISSING — cron jobs won't fire",
        smtpUser:        !!process.env.SMTP_USER ? "✅ set" : "⚠️ not set",
      },
      stats: {
        pushSubscriptions: subCount,
        enabledReminders:  enabledCount,
      },
      sampleSettings: sampleSettings ? {
        userId:              sampleSettings.userId,
        enabled:             sampleSettings.enabled,
        reminderTime:        sampleSettings.reminderTime,
        days:                sampleSettings.days,
        hasCronTaskUid:      !!sampleSettings.scheduleCronTaskUid,
        scheduleCronTaskUid: sampleSettings.scheduleCronTaskUid ?? "null — cron never created",
      } : "no settings rows found",
      timestamp: new Date().toISOString(),
    });
  });


  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
