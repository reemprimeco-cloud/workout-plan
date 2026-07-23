# Prime Fit — Infrastructure Checklist (staging)

Tick each before running the smoke test. None of this can be done from the code
session — it needs your accounts.

## Supabase
- [ ] Staging project created.
- [ ] Connection string (transaction pooler, :6543) captured as `DATABASE_URL`.
- [ ] Project URL + anon key + service-role key captured.
- [ ] Migration applied (`pnpm db:migrate` or SQL editor) — 55 tables + enum types exist.
- [ ] `pnpm seed` run — 4 test accounts + demo data present.
- [ ] Buckets created: `avatars`, `gyms`, `exercises`, `community`, `ai-assets` (public), `health-reports` (**private**).
- [ ] Realtime enabled on `social_notifications` + `community_posts`.

## Vercel
- [ ] Repo connected; deploy branch = `migration/phase-2-standalone` (or merged to default).
- [ ] All env vars from `ENVIRONMENT.md` set (staging values).
- [ ] `CRON_SECRET` set (enables the reminder cron).
- [ ] Deployment succeeded; static + `/api/*` both reachable.

## Third-party
- [ ] OpenAI key valid and funded.
- [ ] Google OAuth: staging redirect URI `…/api/auth/google/callback` authorized.
- [ ] MyFatoorah **sandbox** key + webhook secret; webhook points at `…/api/webhooks/myfatoorah`.
- [ ] SMTP test account verified (send a test email).
- [ ] VAPID keypair generated and set.

## Security (staging hygiene)
- [ ] Staging uses a **separate DB** and **sandbox** payment keys — never production.
- [ ] `JWT_SECRET` is staging-only (not reused from anywhere).
- [ ] (Carryover from Phase 1) production credentials that leaked earlier were rotated; the `.manus/` PII history purge is done or scheduled.
