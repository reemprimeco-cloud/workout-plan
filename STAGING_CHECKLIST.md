# Staging Deployment Checklist — v1.1.0-phase1-security

Run this **before** promoting Phase 1 to staging, and again as the staging smoke test. Do not proceed to production until every **[blocking]** item passes. This checklist covers only Phase 1 changes; it is not a full-app regression suite.

**Release under test:** `v1.1.0-phase1-security` (tag) · development branch `claude/manus-standalone-migration-maa8av`
**DB migrations in this release:** none.

---

## 0. Pre-flight (before deploying to staging)

- [ ] **[blocking]** Confirm the staging build is at the release tag: `git describe --tags` → `v1.1.0-phase1-security`.
- [ ] **[blocking]** `pnpm install` succeeds; `pnpm run check` is clean; `pnpm test` is 147/149 (only the 2 `googleOAuth.test.ts` env-presence failures, unless CI sets those vars — then 149/149).
- [ ] **[blocking]** `pnpm build` succeeds (vite client + esbuild server).
- [ ] **[blocking]** Staging secrets are set: `DATABASE_URL`, `JWT_SECRET` (server will refuse to boot without them — PF-015), `MYFATOORAH_API_KEY`, `MYFATOORAH_WEBHOOK_SECRET`, `VITE_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, SMTP vars, VAPID vars.
- [ ] **[blocking]** Staging uses a **separate, non-production database** and the **MyFatoorah sandbox** (`https://apitest.myfatoorah.com`), not live keys.
- [ ] Confirm the load balancer forwards `X-Forwarded-Proto: https` (gates cookie `Secure` + PF-006).
- [ ] Take a DB snapshot / note the current image tag for rollback.

## 1. Boot & health

- [ ] **[blocking]** Server boots; `GET /api/trpc/health.ping` returns `ok:true`. No `Missing required environment variables` error (PF-015).
- [ ] SPA loads; no console errors on first paint.

## 2. Debug-endpoint removal (PF-011)

- [ ] **[blocking]** `curl -i -X POST https://<staging>/api/debug/test-reminder/1` → **404**.
- [ ] **[blocking]** `curl -i https://<staging>/api/debug/notifications` → **404**.

## 3. Authentication (PF-007)

- [ ] **[blocking]** Email/password login works; session cookie set and persists.
- [ ] **[blocking]** Google login with a real app token succeeds.
- [ ] **[blocking]** Google login with a **foreign-audience** token → `UNAUTHORIZED` (no account created).
- [ ] Google login with `email_verified:false` token → `UNAUTHORIZED`.
- [ ] With `VITE_GOOGLE_CLIENT_ID` unset (throwaway env), Google sign-in → `INTERNAL_SERVER_ERROR` (fail-closed), not accept-all.

## 4. Session / cookie (gates PF-006)

- [ ] **[blocking]** `Set-Cookie` for the session shows `HttpOnly; Path=/; SameSite=None; Secure` over HTTPS.
- [ ] **[blocking]** Log in → start checkout → return from MyFatoorah → session still present (cookie survives the cross-site redirect).
- [ ] Rate-limit buckets key on the real client IP (two IPs behind the LB don't share a bucket).

## 5. Payments — MyFatoorah sandbox (PF-003/004/005/006/013)

- [ ] **[blocking]** A sandbox "Paid" webhook returns **200** (not `400 missing-invoice-id`) — PF-003.
- [ ] **[blocking]** Webhook with a **missing** secret → `500 webhook-not-configured`; with a **wrong** secret → `401`; correct secret → processes — PF-004.
- [ ] **[blocking]** License key is emailed to the **account** email even when the webhook body's `CustomerEmail` differs — PF-005.
- [ ] **[blocking]** Re-send the identical paid webhook → `{ idempotent:true }`; exactly **one** paid `billing_history` row; `expiresAt` **not** double-extended — PF-013.
- [ ] **[blocking]** Induced failure mid-write leaves **no** partial subscription/billing state (transaction rolls back) — PF-013.
- [ ] **[blocking]** Success page: the **payer** sees their key; a **different/unauthenticated** user calling `getKeyByInvoice` with any invoiceId gets **null** (enumeration returns nothing) — PF-006.
- [ ] A "Failed" webhook records `status:failed` and grants no access.

## 6. Uploads (PF-012 / B-1)

- [ ] **[blocking]** SVG-with-`<script>` (declared `image/svg+xml`) upload to an image endpoint (avatar/community/CMS) → **rejected**.
- [ ] **[blocking]** Valid JPEG/PNG/WebP/GIF upload succeeds; stored `Content-Type` is the sniffed type.
- [ ] **[blocking]** **PDF** upload via `health.uploadReport` **succeeds** (B-1 regression fix).
- [ ] Image > 10 MB → rejected.

## 7. Security regressions (PF-008/009/010/015)

- [ ] **[blocking]** 11 rapid `license.verify` calls from one IP → ≥ the 11th returns **429** (PF-008).
- [ ] **[blocking]** User A cannot mark-read/delete user B's notification (PF-009).
- [ ] Community feed/comments load correctly; DB query log shows bounded `users` lookups, not full scans (PF-010).
- [ ] Forced webhook error returns a generic body — **no** stack/message leak (PF-015).
- [ ] Spin wheel returns rewards with a plausible distribution (PF-015 CSPRNG).

## 8. Sign-off

- [ ] All **[blocking]** items above pass.
- [ ] Outstanding operational tasks acknowledged as **still pending** and **not** blocking staging, but **blocking production**: PF-001 (rotate credentials), PF-002 history purge, PF-014 (DB unique constraint), PF-004 HMAC-mode confirmation.
- [ ] Rollback rehearsed: redeploy previous image tag (this release has no migration, so a code-only rollback fully restores prior behavior).
- [ ] Named approver + date recorded here: ______________________

---

_Detailed test/expected/failure/recovery steps for each item: see the Phase 1 Production Readiness document._
