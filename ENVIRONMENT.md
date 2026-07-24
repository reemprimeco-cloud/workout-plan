# Prime Fit — Environment Variables (standalone)

Set these in Vercel (or your host) for **staging**. `VITE_*` vars are exposed to
the browser at build time — never put secrets in a `VITE_` var beyond the
publishable ones noted. In production the server refuses to boot without
`DATABASE_URL` and `JWT_SECRET`.

## Core (required)
| Variable | Notes |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string (transaction pooler, port 6543). |
| `JWT_SECRET` | ≥32-char session-signing secret. |
| `VITE_APP_ID` | Any constant string (kept as a JWT claim). |

## Supabase
| Variable | Notes |
|---|---|
| `SUPABASE_URL` | Project URL (server storage). |
| `SUPABASE_SERVICE_KEY` | Service-role key — **server only**. |
| `VITE_SUPABASE_URL` | Project URL (browser Realtime). |
| `VITE_SUPABASE_ANON_KEY` | Anon key (browser Realtime). |

## AI provider (vendor-agnostic)
| Variable | Notes |
|---|---|
| `AI_PROVIDER` | `openai` (default). |
| `OPENAI_API_KEY` | Provider key. |
| `OPENAI_BASE_URL` | Default `https://api.openai.com`; any OpenAI-compatible base works. |
| `AI_MODEL` | e.g. `gpt-4o`. |
| `AI_TRANSCRIBE_MODEL` | e.g. `whisper-1`. |
| `AI_IMAGE_MODEL` | e.g. `gpt-image-1`. |

## Auth (Google)
| Variable | Notes |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client id. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret. |

## Payments (MyFatoorah)
| `MYFATOORAH_API_KEY` · `MYFATOORAH_API_URL` (`https://apitest.myfatoorah.com` for sandbox) · `MYFATOORAH_WEBHOOK_SECRET` |

## Email (SMTP)
| `SMTP_HOST` · `SMTP_PORT` · `SMTP_USER` · `SMTP_PASS` · `SMTP_FROM` · `OWNER_EMAIL` (owner-alert recipient; defaults to `SMTP_USER`) |

## Web Push (VAPID)
| `VAPID_PUBLIC_KEY` · `VAPID_PRIVATE_KEY` · `VITE_VAPID_PUBLIC_KEY` |

## Scheduled cron
| Variable | Notes |
|---|---|
| `CRON_SECRET` | Bearer token for `/api/cron/workout-reminders`. Vercel Cron sends it automatically. If unset, the cron endpoint returns 503. |

## Optional
| `OWNER_OPEN_ID` | Set to an account's openId to auto-promote it to admin. |
| `APP_DOMAIN` · `VITE_APP_TITLE` · `VITE_APP_LOGO` | Cosmetic. |

## Removed (do NOT set — Manus legacy)
`OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `BUILT_IN_FORGE_API_URL`,
`BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`,
`VITE_FRONTEND_FORGE_API_KEY`, `VITE_ANALYTICS_ENDPOINT`,
`VITE_ANALYTICS_WEBSITE_ID`.
