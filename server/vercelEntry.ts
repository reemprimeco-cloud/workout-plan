// Bundle source for the Vercel serverless function.
//
// esbuild bundles this file (see vercel.json `buildCommand`) into
// `api/_bundle.js`, inlining the entire server tree into a single module. That
// avoids Node's ESM loader trying to resolve extensionless relative imports
// (e.g. `../server/_core/index`) at runtime on Vercel, which fails because
// Vercel traces rather than bundles the function.
import { buildApp } from "./_core/index";

const app = buildApp();

export default app;
