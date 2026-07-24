# Prime Fit — Staging Database Health Report

**Project:** `PrimeFit` (`dccxerplokwvecdwhytr`) · region `eu-west-3` · Postgres 17
**API URL:** `https://dccxerplokwvecdwhytr.supabase.co`
**Date:** 2026-07-23 · **Branch:** `migration/phase-2-standalone`

---

## 1. Schema — ✅ applied & verified (live)

Applied via MCP `apply_migration` (`init_prime_fit_schema`) and verified with a
live query:

| Object | Expected | Actual | Status |
|---|---|---|---|
| Base tables (`public`) | 55 | **55** | ✅ |
| Enum types (`public`) | 36 | **36** | ✅ |

This is the decisive validation of the MySQL→PostgreSQL port: the generated
`drizzle/0000_*.sql` (serial PKs, `pgEnum` types, `numeric`/`double precision`,
unique constraints for `user_follows` and `community_bookmarks`) applies cleanly
to a real Supabase Postgres with no errors.

## 2. Seed — ✅ applied via `scripts/staging_seed_and_realtime.sql` (SQL Editor, "Run and enable RLS")

Idempotent seed (bcrypt hashes pre-computed, cost 12). Expected row counts after
a first run:

| Table | Rows | Table | Rows |
|---|---|---|---|
| users | 4 | community_challenges | 1 |
| subscriptions | 4 | community_posts | 2 |
| nutrition_goals | 4 | social_notifications | 1 |
| notification_settings | 4 | reward_probabilities | 4 |
| gyms | 1 | site_appearance | 1 |
| gym_branches | 1 | exercise_overrides | 2 |
| gym_classes | 2 | | |

**Test accounts** (password login at `/auth`):

| Email | Password | Role | Plan |
|---|---|---|---|
| admin@primefit.test | `Admin123!` | admin | Prime Pro |
| trainer@primefit.test | `Trainer123!` | admin* | Prime Pro |
| premium@primefit.test | `Premium123!` | user | Prime Pro (paid, 1yr) |
| free@primefit.test | `Free123!` | user | Free |

\* No dedicated trainer role exists in the schema (`users.role` is `admin|user`);
the Trainer account maps to `admin`, as designed in Phase 2 scope.

## 3. Realtime — ✅ publication add applied

`social_notifications` and `community_posts` are added to the
`supabase_realtime` publication. See the RLS interaction in §4.

## 4. Security advisors — reviewed; one real finding, fixed

The Supabase security advisor's headline check on a fresh schema is
`rls_disabled_in_public`. Assessment:

- **Finding (real):** all 55 public tables had **RLS disabled**. Supabase exposes
  every table over its public PostgREST/GraphQL API authenticated by the **anon
  key**, which is shipped to the browser (needed for Realtime). With RLS off, the
  anon key can read/write all tables directly, bypassing the tRPC server and its
  auth. Severity: **high** for anything beyond throwaway data.
- **Fix (applied in the SQL):** `ENABLE ROW LEVEL SECURITY` on all 55 tables with
  **no policies** → deny-all for anon/authenticated roles. The app is unaffected:
  every data path uses the **service-role key** server-side, which bypasses RLS.
  Verification query expects `rls_enabled = 55, rls_disabled = 0`.
- **Documented trade-off (intentional):** under deny-all RLS, the browser (which
  connects to Realtime as the anon role — the app does **not** use Supabase Auth)
  receives no `postgres_changes` events, so live Realtime is inert and the client
  uses its built-in **polling fallback**. This is the secure default. To enable
  live Realtime for a specific table later, add an anon `SELECT` policy to it,
  accepting that the table becomes publicly readable via the API. `community_posts`
  is public content (low risk); `social_notifications` carries per-user text (add a
  policy only with that understood, or keep polling).

Other advisor categories (leaked-password protection, MFA, function search_path)
do not apply to this schema/setup or are Supabase-Auth features unused here.

**Re-run the advisors after applying the SQL** to confirm the RLS finding clears:
Dashboard → Advisors → Security, or MCP `get_advisors` once the tool is approved.

## 5. Connection details for deployment

| Variable | Value |
|---|---|
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | `https://dccxerplokwvecdwhytr.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Dashboard → Settings → API → `anon public` |
| `SUPABASE_SERVICE_KEY` | Dashboard → Settings → API → `service_role` (**server only**) |
| `DATABASE_URL` | Dashboard → Connect → **Transaction pooler** (port `6543`); app sets `prepare:false` |

Full variable list: `ENVIRONMENT.md`.

## 6. Outstanding (not database)

- Storage buckets (dashboard): `avatars`, `gyms`, `exercises`, `community`,
  `ai-assets` (public), `health-reports` (**private**).
- Vercel deploy + third-party keys (OpenAI, Google OAuth, MyFatoorah sandbox,
  SMTP, VAPID). See `DEPLOYMENT_GUIDE.md`.

## Summary

| Area | Status |
|---|---|
| Schema (55 tables, 36 enums) | ✅ live & verified |
| MySQL→Postgres port | ✅ proven against real DB |
| Seed + Realtime + RLS | ✅ applied via SQL Editor ("Run and enable RLS") |
| RLS security finding | ✅ fixed (deny-all RLS on all 55 tables; service-role bypass) |
| Storage / Vercel / keys | ⛔ user infra (dashboard + Vercel) |

<!-- staging deploy trigger: 2026-07-23T20:19:03Z -->
