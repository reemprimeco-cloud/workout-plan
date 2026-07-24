# Prime Fit — Standalone Deployment Guide (Vercel + Supabase)

This guide deploys the standalone (Manus-free) app to a **staging** environment.
No step here was executed for you — it requires accounts and secrets only you
hold. Follow top to bottom.

Branch to deploy: `migration/phase-2-standalone`.

---

## 0. Prerequisites (you provide)

- A **Supabase** project (staging) — gives you the Postgres connection string,
  project URL, anon key, and service-role key.
- A **Vercel** account + this repo connected.
- **OpenAI** API key (or any OpenAI-compatible endpoint).
- **Google OAuth** test client (Client ID + Secret) with the staging redirect URI.
- **MyFatoorah** sandbox API key + webhook secret.
- **SMTP** test account (host/port/user/pass/from).
- **VAPID** keypair (`npx web-push generate-vapid-keys`).

---

## 1. Supabase — database

1. Create the staging project. Copy the **connection string** (use the
   *transaction pooler* URL, port 6543 — the app sets `prepare:false` for it),
   the **project URL**, **anon key**, and **service-role key**.
2. Apply the schema. Locally, with `DATABASE_URL` set to the Supabase connection string:
   ```bash
   pnpm install
   pnpm db:migrate        # applies drizzle/0000_*.sql (all 55 tables + enums)
   ```
   (Or paste `drizzle/0000_*.sql` into the Supabase SQL editor.)
3. Seed demo data + test accounts:
   ```bash
   DATABASE_URL="postgres://…pooler…:6543/postgres" pnpm seed
   ```

## 2. Supabase — storage buckets

Create these buckets (Storage → New bucket). Mark **health-reports private**;
the rest public:

| Bucket | Access |
|---|---|
| `avatars` | public |
| `gyms` | public |
| `exercises` | public |
| `community` | public |
| `ai-assets` | public |
| `health-reports` | **private** |

(Server uploads use the service-role key and bypass RLS; the `/api/img/` proxy
refuses private buckets, and health-report reads use signed URLs.)

## 3. Supabase — Realtime

Enable Realtime on the tables the client subscribes to (Database → Replication →
`supabase_realtime` publication, or SQL):
```sql
alter publication supabase_realtime add table social_notifications;
alter publication supabase_realtime add table community_posts;
```
If you skip this, the app automatically falls back to polling.

## 4. Vercel — project

1. Import the repo; set the production branch to `migration/phase-2-standalone`
   (or merge it into your default branch first).
2. Vercel reads `vercel.json`: build `vite build` → `dist/public` (static CDN),
   `/api/*` → the `api/index.ts` serverless function, SPA fallback, and an
   daily Cron on `/api/cron/workout-reminders` (06:00 UTC — Vercel Hobby allows
   daily crons only; switch `vercel.json` to `0 * * * *` for hourly on Pro).
3. Add all environment variables from `ENVIRONMENT.md` (staging values).
4. Deploy.

## 5. Google OAuth

In the Google Cloud console, add the authorized redirect URI:
`https://<your-vercel-domain>/api/auth/google/callback`, and set
`VITE_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## 6. MyFatoorah sandbox

Set `MYFATOORAH_API_URL=https://apitest.myfatoorah.com`, the sandbox key, and a
`MYFATOORAH_WEBHOOK_SECRET`; point the sandbox webhook at
`https://<domain>/api/webhooks/myfatoorah`.

## 7. Verify

Run the checklist in `SMOKE_TEST.md`.

---

## Self-hosting (alternative to Vercel)

The app still runs as a single Node process (Socket.IO removed, so no sticky
sessions needed):
```bash
pnpm build && node dist/index.js     # reads PORT, serves API + static
```
Set the same env vars, and replace the Vercel Cron with any scheduler hitting
`GET /api/cron/workout-reminders` with `Authorization: Bearer $CRON_SECRET`.
