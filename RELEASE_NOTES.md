# Release Notes — v2.0.0

**Release:** Phase 2 — Standalone Migration (Manus → Vercel + Supabase)
**Branch merged:** `migration/phase-2-standalone` → `main` (PR #1)
**Staging:** https://workout-plan-weld.vercel.app — deployed & smoke-verified
**Validation:** `tsc --noEmit` clean · build green · tests 147/149 (2 pre-existing env-only) · live smoke: health ✅ DB ✅ auth ✅

## Highlights

Prime Fit no longer depends on the Manus platform for anything at runtime.
The app targets **Vercel serverless + Supabase** (Postgres · Storage · Realtime)
and still runs as a single self-hosted Node process if preferred.

| Area | Before (Manus) | After (standalone) |
|---|---|---|
| Auth | Manus OAuth portal | JWT session + Google OAuth + email/password |
| AI | forge.manus.im, hard-coded model | vendor-agnostic `AiProvider` (OpenAI default), all env-driven |
| Storage | Manus S3 presign | Supabase Storage — 6 buckets, private `health-reports`, signed URLs |
| Database | MySQL/TiDB | **PostgreSQL** — 55 tables, 36 enums, fresh migration, postgres-js |
| Real-time | Socket.IO server | Supabase Realtime + automatic polling fallback |
| Scheduled jobs | Per-user Manus Heartbeat | one Vercel Cron (`CRON_SECRET`), daily on Hobby |
| Runtime | long-running Express | bundled serverless function (`api/_bundle.js`) + static CDN |
| Analytics/build | manus plugins, Umami | removed |

## Breaking changes

- **Environment variables**: Manus vars removed (`OAUTH_SERVER_URL`, `BUILT_IN_FORGE_*`,
  `VITE_FRONTEND_FORGE_*`, `VITE_ANALYTICS_*`, `VITE_OAUTH_PORTAL_URL`); Supabase/AI/cron
  vars added — see `ENVIRONMENT.md`. `DATABASE_URL` is now Postgres (pooler :6543;
  URL-encode special chars in the password, e.g. `@` → `%40`).
- **Database**: MySQL schema/migrations discarded; fresh Postgres baseline
  (`drizzle/0000_*.sql`). No production data migrated (separate plan).
- **Manus login removed**: existing Manus-OAuth accounts cannot sign in; use
  email/password or Google.
- **Socket.IO removed**: no `/socket.io` endpoint; clients use Supabase Realtime
  or polling.

## Deployment notes (learned on staging)

1. Vercel **Hobby caps crons at daily** — sub-daily cron in `vercel.json` silently
   fails the whole deployment at config validation.
2. Vercel traces (doesn't bundle) functions — extensionless ESM imports crash at
   runtime (`ERR_MODULE_NOT_FOUND`); the server is pre-bundled by the build.
3. Supabase RLS enabled deny-all on all tables; server uses service-role (bypass);
   browser Realtime therefore falls back to polling by design.

## Operational checklist (staging → production)

- Rotate the staging DB password and any credentials that transited chat/e-mail.
- Add feature keys when needed: `OPENAI_API_KEY`, Google OAuth, MyFatoorah
  (sandbox → live), `SMTP_*`, `VAPID_*`, `CRON_SECRET`.
- Vercel Pro for hourly reminder cron + shared rate-limit store (Upstash) before
  real traffic.
- Outstanding from Phase 1: purge `.manus/db` PII from git history; rotate the
  previously leaked production credentials.

## Test accounts (staging)

`admin@primefit.test`/`Admin123!` · `trainer@primefit.test`/`Trainer123!` ·
`premium@primefit.test`/`Premium123!` · `free@primefit.test`/`Free123!`

---

# Release Notes — v1.1.0-phase1-security

**Release:** Phase 1 — Production Stabilization (Security)
**Branch merged:** `migration/phase-1-security` → `claude/manus-standalone-migration-maa8av`
**Commits:** 14 (13 fixes + 1 regression fix) · **DB migrations:** none
**Validation:** `tsc --noEmit` clean · tests 147/149 (2 failures are pre-existing environment-only checks, see Deployment notes)
**Status:** Merged to development. **Not deployed.** Production (`main`) untouched.

This release hardens security, repairs the (previously non-functional) MyFatoorah payment pipeline, and closes several authentication/authorization bypasses. It intentionally contains **no** platform-migration work (that is Phase 2) and **no** database schema changes.

---

## Security fixes

| ID | Fix | Commit |
|----|-----|--------|
| PF-011 | Removed two **unauthenticated** debug endpoints (`/api/debug/test-reminder/:userId`, `/api/debug/notifications`) that allowed anyone to send push notifications to arbitrary users and to read push-subscription counts / VAPID config state. | `728ef02` |
| PF-009 | Fixed an **IDOR** in `markSingleNotificationRead` / `deleteNotification` — they accepted a `userId` but never filtered by it, letting any user mark-read or delete another user's notifications by id. Now scoped to `(id AND userId)`. | `6f5aecc` |
| PF-006 | Locked down `subscription.getKeyByInvoice` — was a **public** procedure returning any customer's license key for a guessable, sequential `invoiceId` (enumeration/IDOR). Now `protectedProcedure` bound to the invoice's owner. | `ce7777c` |
| PF-012 | Added **server-side image validation** to `storagePut`: magic-byte sniffing (JPEG/PNG/WebP/GIF only — rejects SVG/HTML stored-XSS), a 10 MB cap, and uses the sniffed type as `Content-Type` instead of the client's. | `ec3457b` |
| PF-015 | Hardening batch: webhook error responses no longer leak `message`/`stack`; storage keys reject `..` traversal; spin-wheel selection uses `crypto.randomInt` (CSPRNG); `env.ts` fails fast in production when `DATABASE_URL`/`JWT_SECRET` are missing. | `4267352` |
| PF-008 | Rate-limited `license.verify` (10 / 15 min per IP) — it issues a one-year session on success and was an unthrottled second login endpoint. | `a49b4dc` |
| PF-002 | Stopped tracking `.manus/` (62 files containing customer PII + DB connection metadata) and added it to `.gitignore`. *(Forward-looking only — history purge is an outstanding operational task.)* | `2aed1d5` |

## Payment fixes (MyFatoorah)

| ID | Fix | Commit |
|----|-----|--------|
| PF-003 | **The payment→license pipeline was non-functional.** The webhook route was mounted before the JSON body parser, so `req.body` was always undefined and every real callback returned `400 missing-invoice-id`. The route now mounts after helmet with its own parser (1 MB cap) that also captures the raw body for signature verification. | `3852e72` |
| PF-004 | Webhook secret check now **fails closed** (rejects when no secret is configured, previously skipped verification entirely) and compares in **constant time** (SHA-256 + `timingSafeEqual`). | `91977c2` |
| PF-005 | The license key is now routed to the **verified** payer (the `CustomerReference`/openId from `getPaymentStatus`), not the attacker-controllable `CustomerEmail` in the request body. | `e31ea70` |
| PF-013 | Webhook processing is now **idempotent** (a prior paid billing row for the invoice short-circuits — safe against MyFatoorah retries) and the subscription upsert + billing writes run in a **single DB transaction**. | `48c9598` |

## Authentication fixes

| ID | Fix | Commit |
|----|-----|--------|
| PF-007 | `googleSignIn` now validates the token's **`aud`** (against `VITE_GOOGLE_CLIENT_ID`), **`iss`**, and **`email_verified`**. Previously it checked only `sub`/`email`, so a Google ID token issued to *any* OAuth client could be replayed to log in as that email — a full auth bypass. Fails closed when unconfigured. | `ef179c6` |

## Other fixes

| ID | Fix | Commit |
|----|-----|--------|
| PF-010 | Community feed + comments no longer scan the **entire `users` table** on a public, frequently-polled endpoint; lookups are scoped with `inArray(users.id, …)`. | `1acc28e` |
| B-1 | **Regression fix:** PF-012's image-only validation broke PDF uploads in `health.uploadReport` (documented "image or PDF"). That one non-image caller now opts out via `{ validateImage: false }`; image endpoints keep validation. | `4bbb32e` |

---

## Breaking changes

There are **no breaking changes to the database** (no migrations). Two **behavioral** changes require attention because clients/integrations depend on them:

1. **`subscription.getKeyByInvoice` now requires authentication (PF-006).** The post-payment success page must call it with a valid session cookie (the payer is already authenticated from a protected checkout). Unauthenticated or cross-account calls now return `null`/`UNAUTHORIZED` instead of a key. → Verify the session survives the MyFatoorah redirect (see checklist).
2. **`storagePut` now rejects non-image uploads by default (PF-012).** Any *future* caller uploading non-images must pass `{ validateImage: false }` (as `health.uploadReport` now does). All current image endpoints are unaffected.

Additionally, **`env.ts` now aborts startup in production if `DATABASE_URL` or `JWT_SECRET` is missing (PF-015)** — intended fail-fast behavior, but it will stop a misconfigured production boot that previously started with empty secrets.

---

## Deployment notes

- **No database migration** is required for this release (`drizzle/` unchanged).
- **Environment:** `DATABASE_URL` and `JWT_SECRET` **must** be set in production or the server will refuse to boot (PF-015). `MYFATOORAH_WEBHOOK_SECRET` must be set or the webhook will reject all callers with `500 webhook-not-configured` (PF-004, fail-closed).
- **Reverse proxy / cookies:** the session cookie is `SameSite=None` with `Secure` derived from `x-forwarded-proto`, and `trust proxy` is **not** set. Confirm the load balancer forwards `X-Forwarded-Proto: https` so the cookie is issued and survives the MyFatoorah redirect (gates PF-006). *(A dedicated `trust proxy` fix is Phase 2 / PF-023.)*
- **Rate limiting** keys on the first `x-forwarded-for` hop — verify the LB populates it.
- **MyFatoorah signature mode:** PF-004 hardened the static-secret-header model currently in use. If the merchant account is configured for HMAC signatures instead, real callbacks will `401` and the HMAC path (`verifyWebhookSignature`, now fed by `req.rawBody`) must be enabled — confirm the account's webhook mode before enabling in production.
- **Test suite:** 147/149 pass. The 2 failures are `server/googleOAuth.test.ts` asserting `GOOGLE_CLIENT_SECRET` / `VITE_GOOGLE_CLIENT_ID` are present in the process environment; they pass wherever those vars are set (e.g., CI with secrets) and are **not** caused by this release.

---

## Manual verification checklist (post-deploy smoke)

Full detail lives in the Production Readiness doc and `STAGING_CHECKLIST.md`. Minimum smoke set:

- [ ] `POST /api/debug/test-reminder/1` and `GET /api/debug/notifications` both return **404** (PF-011).
- [ ] Email/password, Google, and license-key login all succeed; session persists across requests.
- [ ] Google login with a **foreign-audience** token is rejected (PF-007).
- [ ] Sandbox MyFatoorah payment: webhook returns 200 (not 400), license key generated, emailed to the **account** email, and shown on the success page **only to the payer** (PF-003/004/005/006).
- [ ] Re-sending the same paid webhook does **not** double-extend or duplicate billing (PF-013).
- [ ] SVG upload to an image endpoint is rejected; a PDF upload to `health.uploadReport` **succeeds** (PF-012 / B-1).
- [ ] `license.verify` throttles after 10 rapid attempts (PF-008).
- [ ] Community feed/comments load without a full `users` scan (PF-010).

---

## Outstanding operational tasks (not code — owner/ops)

These are **prerequisites for production**, tracked from Phase 1 but not part of this code release:

- [ ] **PF-001 — Rotate all credentials** exposed in the earlier `.project-config.json` leak (MyFatoorah key, JWT secret, DB password, SMTP app password, Google client secret, WooCommerce keys, VAPID keys). Highest priority.
- [ ] **PF-002 (history) — Purge committed PII** from prior git history (`git filter-repo`/BFG + coordinated force-push). This release only stopped future tracking.
- [ ] **PF-014 — Apply the `accessCodes.customerEmail` unique constraint** (dedupe existing rows first; needs live DB). The application-level trial check exists; the DB constraint is the follow-up.
- [ ] **PF-004 follow-up** — Confirm MyFatoorah webhook mode (static-secret vs HMAC) and enable the HMAC path if required.
- [ ] **PF-013 follow-up** — Optionally fold the access-code create/extend into the webhook transaction and send email strictly after commit (needs live-DB testing).
