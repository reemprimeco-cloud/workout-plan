# Prime Fit — Migration Guide (Manus → Self-Hosted)

This guide explains every Manus-specific dependency and how to replace it if the project is ever migrated away from the Manus platform.

---

## Overview of Manus Dependencies

| Dependency | Used For | Replacement |
|-----------|---------|-------------|
| Manus OAuth | Primary user authentication | Auth0, Clerk, or custom JWT |
| Manus S3 Storage | File storage (images, uploads) | AWS S3, Cloudflare R2, or Supabase Storage |
| Manus Built-in LLM | AI Coach, food photo analysis, image generation | OpenAI API, Anthropic API |
| Manus Push Notifications | Owner alerts | Keep `web-push` library, replace `notifyOwner` |
| Manus Analytics | Page view tracking | Plausible, PostHog, or Umami |
| Manus Hosting | Deployment | Railway, Render, Fly.io, or VPS |
| Manus Heartbeat | Scheduled jobs | Cron jobs, BullMQ, or Inngest |
| `vite-plugin-manus-runtime` | Dev tooling | Remove entirely |
| `@builder.io/vite-plugin-jsx-loc` | Visual editor | Remove if not using a visual editor |

---

## 1. Manus OAuth → Custom Auth

**Files to change:** `server/_core/oauth.ts`, `server/_core/context.ts`, `client/src/const.ts`, `client/src/main.tsx`

The Manus OAuth flow uses `OAUTH_SERVER_URL` and `VITE_OAUTH_PORTAL_URL` to redirect users to the Manus login portal. To replace:

1. Remove the Manus OAuth redirect in `client/src/const.ts` (`getLoginUrl()`)
2. Replace with your chosen auth provider's SDK (e.g., Auth0's `loginWithRedirect()`)
3. Update `server/_core/oauth.ts` to verify tokens from the new provider
4. Update `server/_core/context.ts` to extract the user from the new token format
5. Remove `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`, `OWNER_NAME` from environment variables

The standalone email/password auth (`server/routers/standaloneAuth.ts`) is already self-contained and does not depend on Manus. It can be kept as-is.

---

## 2. Manus S3 Storage → AWS S3 or Alternative

**Files to change:** `server/storage.ts`, `server/_core/storageProxy.ts`, `server/_core/imageProxy.ts`

The `storagePut` and `storageGet` helpers in `server/storage.ts` use the Manus S3-compatible API via `BUILT_IN_FORGE_API_KEY` and `BUILT_IN_FORGE_API_URL`. To replace with AWS S3:

1. Create an S3 bucket and IAM user with `s3:PutObject`, `s3:GetObject` permissions
2. Replace the `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` with `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`
3. Update `server/storage.ts` to use the standard AWS S3 SDK (already installed: `@aws-sdk/client-s3`)
4. Update `server/_core/imageProxy.ts` to fetch from the new S3 bucket

The `@aws-sdk/client-s3` package is already installed — the migration is primarily a configuration change.

---

## 3. Manus Built-in LLM → OpenAI

**Files to change:** `server/_core/llm.ts`

The `invokeLLM` function calls `BUILT_IN_FORGE_API_URL/v1/chat/completions` with `BUILT_IN_FORGE_API_KEY`. The API is OpenAI-compatible. To replace with OpenAI directly:

1. Add `OPENAI_API_KEY` environment variable
2. Update `server/_core/llm.ts` to use `https://api.openai.com/v1/chat/completions` with the OpenAI key
3. Update the model name from the Manus default to `gpt-4o` or your preferred model

The `invokeLLM` function signature and return type do not need to change — it already follows the OpenAI chat completions format.

---

## 4. Manus Push Notifications → Self-hosted

**Files to change:** `server/_core/notification.ts`

The `notifyOwner` function calls `BUILT_IN_FORGE_API_URL/v1/notification/send` to send in-app notifications to the project owner. To replace:

1. Remove the `notifyOwner` function or replace it with an email notification via `nodemailer` (already installed)
2. The user-facing Web Push notifications (`web-push` package) are already self-contained and do not depend on Manus

---

## 5. Manus Analytics → Self-hosted

**Files to change:** `client/index.html`, `vite.config.ts`

The analytics script is injected via `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID`. To replace:

1. Remove the analytics script from `client/index.html`
2. Add your chosen analytics provider's script (Plausible, PostHog, etc.)
3. Remove `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` from environment variables

---

## 6. Manus Hosting → Self-hosted

The project is a standard Node.js Express app. To self-host:

1. Build: `pnpm build` (outputs to `dist/`)
2. Start: `node dist/index.js`
3. Set `PORT` environment variable (the server reads this)
4. Set all environment variables from `ENVIRONMENT.md`
5. Run `pnpm db:push` to apply database migrations

**Docker:** A `Dockerfile` can be added at the project root. The server listens on `process.env.PORT`. A minimal Dockerfile:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## 7. Manus Heartbeat → Cron Jobs

**Files to change:** `server/_core/heartbeat.ts`, `server/_core/sdk.ts`

The Heartbeat system is a Manus-specific scheduled job runner. It calls `/api/heartbeat` on a schedule defined in the Management UI. To replace with a standard cron system:

1. Remove `server/_core/heartbeat.ts` and `server/_core/sdk.ts`
2. Add a cron library (e.g., `node-cron` or `BullMQ`)
3. Move the heartbeat handler logic to standard cron job functions
4. Remove the `/api/heartbeat` Express route from `server/_core/index.ts`

---

## 8. Remove Manus Dev Plugins

**Files to change:** `vite.config.ts`

Remove these Vite plugins that are Manus-specific:

```ts
// Remove these imports and their usage in the plugins array:
import { vitePluginManusRuntime } from 'vite-plugin-manus-runtime';
import { vitePluginManusDebugCollector } from 'vite-plugin-manus-runtime';
import jsxLocPlugin from '@builder.io/vite-plugin-jsx-loc';
```

Also remove from `devDependencies` in `package.json`:
- `vite-plugin-manus-runtime`
- `@builder.io/vite-plugin-jsx-loc`

---

## 9. Environment Variable Mapping

| Manus Variable | Self-hosted Replacement |
|----------------|------------------------|
| `BUILT_IN_FORGE_API_URL` | `OPENAI_BASE_URL` (or remove) |
| `BUILT_IN_FORGE_API_KEY` | `OPENAI_API_KEY` |
| `VITE_FRONTEND_FORGE_API_URL` | Remove (no frontend LLM calls) |
| `VITE_FRONTEND_FORGE_API_KEY` | Remove |
| `VITE_APP_ID` | Remove (Manus OAuth only) |
| `OAUTH_SERVER_URL` | Remove (Manus OAuth only) |
| `VITE_OAUTH_PORTAL_URL` | Remove (Manus OAuth only) |
| `OWNER_OPEN_ID` | Remove (Manus OAuth only) |
| `OWNER_NAME` | Keep (used in email templates) |
| `VITE_ANALYTICS_ENDPOINT` | Replace with your analytics URL |
| `VITE_ANALYTICS_WEBSITE_ID` | Replace with your analytics ID |
| `DATABASE_URL` | Keep (standard MySQL connection string) |
| `JWT_SECRET` | Keep |
| `MYFATOORAH_API_KEY` | Keep |
| `MYFATOORAH_API_URL` | Keep |
| `MYFATOORAH_WEBHOOK_SECRET` | Keep |
| `WOO_*` | Keep (WooCommerce integration) |
| `SMTP_*` | Keep |
| `VAPID_*` | Keep |
| `GOOGLE_CLIENT_*` | Keep |

---

## Migration Checklist

- [ ] Replace Manus OAuth with chosen auth provider
- [ ] Set up S3 bucket and update storage helpers
- [ ] Replace `invokeLLM` with OpenAI API
- [ ] Replace `notifyOwner` with email notification
- [ ] Remove Manus analytics, add self-hosted analytics
- [ ] Remove Manus Vite plugins
- [ ] Set up cron jobs to replace Heartbeat
- [ ] Update all environment variables
- [ ] Add `Dockerfile` for containerised deployment
- [ ] Run `pnpm db:push` on the new database
- [ ] Test the full auth flow end-to-end
- [ ] Test the payment flow end-to-end
- [ ] Test image uploads and serving
- [ ] Test push notifications
