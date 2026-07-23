import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerImageProxy } from "./imageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { workoutReminderHandler } from "../handlers/workoutReminder";
import { handleMyfatoorahWebhook as myfatoorahWebhookHandler } from "../handlers/myfatoorahWebhook";
import { googleAuthRedirect, googleAuthCallback } from "../handlers/googleOAuth";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

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

// ── Rate limiters ─────────────────────────────────────────────────────────────
/** Login: max 10 attempts per 15 minutes per IP */
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  keyGenerator: (req) => {
    // Use x-forwarded-for if behind proxy, else remote address
    const forwarded = req.headers["x-forwarded-for"];
    return (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null)
      ?? req.socket?.remoteAddress
      ?? "unknown";
  },
});

/** Sign-up: max 5 accounts per hour per IP */
const signupRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sign-up attempts. Please try again in an hour." },
  keyGenerator: (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    return (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null)
      ?? req.socket?.remoteAddress
      ?? "unknown";
  },
});

/** Forgot-password: max 3 requests per hour per IP */
const forgotPasswordRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Please try again in an hour." },
  keyGenerator: (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    return (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null)
      ?? req.socket?.remoteAddress
      ?? "unknown";
  },
});

/**
 * License-key verification: max 10 attempts per 15 minutes per IP (PF-008).
 * license.verify succeeds against a ~40-bit PRIME-XXXX-XXXX key and, on
 * success, issues a one-year session cookie — i.e. it is a second login
 * endpoint. Without this limiter it was un-throttled and brute-forceable.
 */
const licenseVerifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many license verification attempts. Please try again in 15 minutes." },
  keyGenerator: (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    return (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null)
      ?? req.socket?.remoteAddress
      ?? "unknown";
  },
});

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

  // ── Google OAuth redirect flow (mobile-safe) ─────────────────────────────
  app.get("/api/auth/google", googleAuthRedirect);
  app.get("/api/auth/google/callback", googleAuthCallback);

  // ── Security middleware ───────────────────────────────────────────────────
  app.use(helmet({
    // Allow inline scripts/styles needed by Vite HMR in development
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
  }));

  // ── Rate limiting on auth endpoints ──────────────────────────────────────
  // Applied as path-prefix middleware BEFORE the tRPC handler so they fire
  // regardless of which tRPC procedure is called.
  app.use("/api/trpc/standaloneAuth.login", loginRateLimit);
  app.use("/api/trpc/standaloneAuth.signUp", signupRateLimit);
  app.use("/api/trpc/standaloneAuth.forgotPassword", forgotPasswordRateLimit);
  app.use("/api/trpc/license.verify", licenseVerifyRateLimit);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerImageProxy(app);
  registerOAuthRoutes(app);
  // Scheduled handlers — must be mounted BEFORE tRPC and static fallthrough
  app.post("/api/scheduled/workoutReminder", workoutReminderHandler);

  // NOTE: The unauthenticated /api/debug/test-reminder/:userId and
  // /api/debug/notifications endpoints were removed (PF-011). They allowed
  // anyone to trigger push notifications to arbitrary users and to read
  // push-subscription counts / VAPID config state without authentication.

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
