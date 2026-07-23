# Prime Fit — Staging Smoke Test

Run after deploy. `[blocking]` items must pass before calling staging good.

## Boot & static
- [ ] `[blocking]` `GET /api/trpc/health.ping` → `{ ok: true }`.
- [ ] `[blocking]` App loads; no console errors; assets served from CDN.

## Auth
- [ ] `[blocking]` Log in as `premium@primefit.test` / `Premium123!` (email/password); session persists across reloads.
- [ ] `[blocking]` Google login works; a foreign-audience token is rejected (PF-007).
- [ ] Admin (`admin@primefit.test`) can open `/admin`; free user cannot.
- [ ] `[blocking]` Session cookie is `Secure; SameSite=None` over HTTPS (trust-proxy working).

## Database / data
- [ ] `[blocking]` Seeded content visible: community feed shows the two demo posts; a gym class appears; spin wheel has rewards.
- [ ] Nutrition goals load for the logged-in user.

## Storage
- [ ] `[blocking]` Upload an avatar (JPEG/PNG) → appears; stored in the `avatars` bucket.
- [ ] `[blocking]` SVG upload to an image endpoint is rejected (PF-012).
- [ ] `[blocking]` PDF upload via health report succeeds (B-1); it lands in the private `health-reports` bucket and is served via a signed URL, not `/api/img/`.

## AI
- [ ] `[blocking]` AI Coach returns a reply (OpenAI configured).
- [ ] Nutrition food-photo analysis returns macros.

## Payments (MyFatoorah sandbox)
- [ ] `[blocking]` Checkout → sandbox payment → webhook returns 200 (not 400), license generated, emailed to the account email (PF-003/004/005).
- [ ] Re-sending the same paid webhook is idempotent — no double subscription/billing (PF-013).
- [ ] Success page shows the payer their key; another user can’t read it (PF-006).

## Realtime + cron
- [ ] `[blocking]` With two sessions, a like/comment on user A’s post makes A’s notification badge update live (Supabase Realtime). Disable Realtime → app still updates via polling.
- [ ] Manually hit `GET /api/cron/workout-reminders` with `Authorization: Bearer $CRON_SECRET` → `{ ok: true, sent, skipped }`; without the secret → 401.

## Security regressions (carried from Phase 1)
- [ ] `/api/debug/*` → 404 (PF-011).
- [ ] `license.verify` throttles after ~10 rapid attempts (PF-008).
- [ ] Webhook error responses are generic (no stack) (PF-015).

## Sign-off
- [ ] All `[blocking]` items pass. Named approver + date: ____________________
