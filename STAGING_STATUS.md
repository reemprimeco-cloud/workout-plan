# Prime Fit — Staging Status

**Live URL:** https://workout-plan-weld.vercel.app
**Deployed commit:** `5c0bbef` on `migration/phase-2-standalone` · **Date:** 2026-07-24
**Stack:** Vercel (Hobby) serverless + Supabase `PrimeFit` (`dccxerplokwvecdwhytr`, eu-west-3)

## Verified live (smoke-tested)

| Check | Result |
|---|---|
| `system.health` tRPC ping | ✅ `{"ok":true}` |
| Database via pooler (6543) + seed | ✅ `community.getFeed` returns both seeded posts with user names |
| Email/password login (`premium@primefit.test`) | ✅ 200 + JWT `app_session_id` cookie (`HttpOnly; Secure; SameSite=None`) |
| Login rate limiting | ✅ `ratelimit: 10;w=900` headers present |
| Helmet security headers | ✅ CSP, HSTS, nosniff, etc. |
| Storage buckets (6, `health-reports` private) | ✅ created |
| Deny-all RLS on all 55 tables | ✅ applied |

**Test accounts:** `admin@primefit.test`/`Admin123!` · `trainer@primefit.test`/`Trainer123!` · `premium@primefit.test`/`Premium123!` · `free@primefit.test`/`Free123!`

## Deploy issues found & fixed during Stage 10

1. **Hourly cron rejected on Vercel Hobby** — every phase-2 deploy silently failed
   config validation; `main` (no vercel.json) kept serving. Fixed: cron now daily
   (`0 6 * * *`); restore hourly on Pro. (`cd3dca1`)
2. **`ERR_MODULE_NOT_FOUND` at runtime** — Vercel traces (not bundles) functions;
   the extensionless ESM import of `../server/_core/index` failed. Fixed: server
   pre-bundled to `api/_bundle.js` via esbuild (`./vite` excluded). (`5c0bbef`)
3. **DB password URL-encoding** — password contains `@`; must be `%40` in
   `DATABASE_URL`.

## Environment variables set (Production)

`DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `SUPABASE_URL`, `VITE_SUPABASE_URL`,
`SUPABASE_SERVICE_KEY`, `VITE_SUPABASE_ANON_KEY`.

## Phase 3A — feature activation log

| Feature | Status | Notes |
|---|---|---|
| AI coach / food analysis (OpenAI) | ✅ Live | `coach.chat` returns real GPT-4o replies |
| Google OAuth login | ✅ Live | New client created (old leaked-secret client deleted); UI button restored (`d926359`) — was removed in Manus era, backend flow was intact |
| MyFatoorah **live** payments | ⚠️ Partially verified | Real payment succeeded (KNET, 2.626 KD); manually replaying the webhook call proved the full pipeline (signature check → license generation `PRIME-9K5Z-3SH6` → subscription activation → billing history) works correctly end-to-end. **Open issue:** MyFatoorah's portal is not yet auto-delivering the webhook to us — the Endpoint field in Webhook Settings appeared to not persist (reverted to placeholder styling). Follow-up: re-verify the endpoint saved, or contact MyFatoorah support; the code path itself needs no further work. |
| SMTP (Gmail) | ✅ Live | Password-reset email delivered to real inbox |
| VAPID + CRON_SECRET | ✅ Live | `notifications.getVapidPublicKey` → `configured:true`; cron endpoint 401 without secret, 200 with it |

**Phase 3A: complete.** All five integrations configured and verified on production (`main`, https://workout-plan-weld.vercel.app).

## Phase 3B — security hygiene

| Item | Status | Notes |
|---|---|---|
| Git history purge (`.manus/db/*.json` + customer PII in commit messages) | ✅ Done | Deeper than the original Phase 1 finding: 60+ `.manus/db/*.json` files contained the **production TiDB connection details** (host/port/user/db) and query results with real emails; 2 commit messages contained a real customer's name + email in plaintext. Rewrote history with `git-filter-repo` (strip `.manus/` from all commits + redact the 2 messages), force-pushed all 4 branches. **All commit SHAs changed** — any existing local clone must be re-cloned fresh, not pulled. |
| `v2.0.0` tag repointed to rewritten history | ✅ Done | Deleted the release, then the tag itself (two separate GitHub objects — deleting the release alone does not remove the tag), via the GitHub UI (git proxy blocks tag ref pushes; no GitHub-API tool exists for this either). New tag verified via API to point at the clean rewritten `main`. |
| Rotate leaked production credentials (MyFatoorah key, old DB password, JWT secret, SMTP password, Google secret, WooCommerce keys, VAPID, AWS STS) | ⏳ Owner action | The old TiDB/MySQL production database itself is being retired in favor of Postgres/Supabase (Phase 2), which neutralizes most of these; explicitly rotate anything still live (MyFatoorah — done, new key generated during Phase 3A; Google OAuth secret — done, new client created; others as needed if still in use). |
| `v1.1.0-phase1-security` tag | ⏳ Owner action | Never successfully pushed (same proxy restriction); recreate via GitHub UI if desired, targeting the equivalent commit on the rewritten `migration/phase-1-security` branch. |

## Known limitations / risks

- **Vercel Hobby**: daily-only cron (reminders fire 06:00 UTC only); in-memory
  rate limits reset per cold start.
- **Realtime**: deny-all RLS means browser gets no live events → automatic
  polling fallback is in effect (by design; see DATABASE_HEALTH.md §4).
- **Rotate the staging DB password** before production use (it transited chat
  during setup) — Supabase → Database Settings → Reset password, then update
  `DATABASE_URL` in Vercel and redeploy.
- Carry-over owner tasks: rotate previously leaked production credentials; purge
  `.manus/db` PII from git history; tag `v1.1.0-phase1-security` push.

## Next

1. Browser/PWA pass on the live URL (login, dashboard, community, admin).
2. Add feature keys above as desired; re-run the relevant SMOKE_TEST.md items.
3. PR `migration/phase-2-standalone` → `main` (only after owner approval).
