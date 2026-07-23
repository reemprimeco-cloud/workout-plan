// Vercel serverless entry point.
//
// The whole Express app (all /api routes) is exported as the default handler.
// vercel.json rewrites /api/* to this function and serves the built client
// (dist/public) from the CDN for everything else. `VERCEL=1` (set by the
// platform) prevents server/_core/index.ts from also calling startServer().
import { buildApp } from "../server/_core/index";

const app = buildApp();

export default app;
