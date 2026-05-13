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
import { wooCommerceWebhookHandler } from "../handlers/wooCommerceWebhook";
import { startWooPoller } from "../handlers/wooPoller";
import { handleMyfatoorahWebhook } from "../handlers/myfatoorahWebhook";

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
  // ── WooCommerce webhook — MUST be before express.json() ─────────────────
  app.post(
    "/api/webhooks/woocommerce",
    express.raw({ type: "application/json" }),
    (req, res, next) => {
      // Safely capture raw body for HMAC verification
      const raw = req.body;
      if (Buffer.isBuffer(raw)) {
        (req as any).rawBody = raw;
        try { req.body = JSON.parse(raw.toString()); } catch { req.body = {}; }
      } else if (typeof raw === 'string') {
        (req as any).rawBody = Buffer.from(raw);
        try { req.body = JSON.parse(raw); } catch { req.body = {}; }
      } else if (raw && typeof raw === 'object') {
        // Already parsed — reconstruct raw buffer from stringified body
        const str = JSON.stringify(raw);
        (req as any).rawBody = Buffer.from(str);
        req.body = raw;
      } else {
        (req as any).rawBody = Buffer.alloc(0);
        req.body = {};
      }
      next();
    },
    wooCommerceWebhookHandler,
  );

  // ── Debug endpoint — confirm webhook is reachable ─────────────────────────
  // GET /api/webhooks/woocommerce/ping → { ok: true, ... }
  app.get("/api/webhooks/woocommerce/ping", (_req, res) => {
    res.json({
      ok: true,
      message: "WooCommerce webhook endpoint is alive ✅",
      smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      wooSecretConfigured: !!process.env.WOO_WEBHOOK_SECRET,
      dbConfigured: !!process.env.DATABASE_URL,
      timestamp: new Date().toISOString(),
    });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Scheduled handlers — must be mounted BEFORE tRPC and static fallthrough
  app.post("/api/scheduled/workoutReminder", workoutReminderHandler);

  // ── MyFatoorah webhook — MUST be before express.json() ─────────────────
  app.post(
    "/api/webhooks/myfatoorah",
    express.raw({ type: "application/json" }),
    handleMyfatoorahWebhook,
  );

  // ── WooCommerce order poller — catches any orders missed by webhook ───────
  startWooPoller();

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
