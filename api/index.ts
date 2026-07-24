// Vercel serverless function entry.
//
// The Express app is pre-bundled (entire server tree inlined) into
// `./_bundle.js` by the build step, so this file's only import uses an explicit
// `.js` extension that Node's ESM loader resolves cleanly on Vercel. Bundling
// the server elsewhere avoids the ERR_MODULE_NOT_FOUND that occurs when Vercel
// traces (rather than bundles) a function whose imports are extensionless.
// See vercel.json `buildCommand`.
// @ts-ignore - generated at build time by esbuild
import app from "./_bundle.js";

export default app;
