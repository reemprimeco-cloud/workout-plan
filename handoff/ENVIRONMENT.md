# Prime Fit — Environment Variables

## Overview

All environment variables are managed through the Manus project secrets system. They are never committed to the repository. In development, they are loaded from a `.env` file (not included in the repo). In production, they are injected by the Manus platform at runtime.

The canonical list of all variables and their TypeScript bindings is in `server/_core/env.ts`.

---

## Complete Variable Reference

### Database

| Variable | Example Value | Purpose |
|----------|--------------|---------|
| `DATABASE_URL` | `mysql://user:pass@host:3306/dbname` | MySQL/TiDB connection string. Used by Drizzle ORM for all database operations. |

---

### Authentication

| Variable | Example Value | Purpose |
|----------|--------------|---------|
| `JWT_SECRET` | `********` | Secret used to sign and verify session cookies (JWT). Must be at least 32 characters. Changing this invalidates all existing sessions. |
| `VITE_APP_ID` | `prime_fit_app_id` | Manus OAuth application ID. Used by the frontend to initiate the OAuth flow. |
| `OAUTH_SERVER_URL` | `https://oauth.manus.im` | Manus OAuth backend base URL. Used server-side to exchange codes for tokens. |
| `VITE_OAUTH_PORTAL_URL` | `https://login.manus.im` | Manus login portal URL. The frontend redirects users here to log in. |
| `OWNER_OPEN_ID` | `manus_user_xxx` | The Manus OpenID of the project owner. Used to identify the admin account. |
| `OWNER_NAME` | `Prime Fit Admin` | Display name of the project owner. |

---

### Google OAuth

| Variable | Example Value | Purpose |
|----------|--------------|---------|
| `VITE_GOOGLE_CLIENT_ID` | `123456789-xxx.apps.googleusercontent.com` | Google OAuth client ID. Used by the frontend Google Sign-In button. |
| `GOOGLE_CLIENT_SECRET` | `********` | Google OAuth client secret. Used server-side to exchange the authorization code. |

---

### Manus Built-in APIs (LLM, Storage, Notifications)

| Variable | Example Value | Purpose |
|----------|--------------|---------|
| `BUILT_IN_FORGE_API_URL` | `https://forge.manus.im` | Base URL for all Manus built-in APIs (LLM, storage, notifications, etc.). Used server-side only. |
| `BUILT_IN_FORGE_API_KEY` | `********` | Bearer token for server-side Manus API calls. Never expose to the frontend. |
| `VITE_FRONTEND_FORGE_API_URL` | `https://forge.manus.im` | Same base URL, but exposed to the frontend via Vite's `VITE_` prefix. |
| `VITE_FRONTEND_FORGE_API_KEY` | `********` | Frontend-safe API key for Manus APIs. Has reduced permissions compared to the server key. |

---

### Payments (MyFatoorah)

| Variable | Example Value | Purpose |
|----------|--------------|---------|
| `MYFATOORAH_API_KEY` | `********` | MyFatoorah API bearer token. Used to create invoices and verify payment status. **This is the live production key — treat it as highly sensitive.** |
| `MYFATOORAH_API_URL` | `https://api.myfatoorah.com` | MyFatoorah API base URL. Use `https://apitest.myfatoorah.com` for sandbox testing. |
| `MYFATOORAH_WEBHOOK_SECRET` | `********` | HMAC-SHA256 secret for verifying MyFatoorah webhook signatures. Set in the MyFatoorah dashboard. |

---

### WooCommerce (Legacy)

| Variable | Example Value | Purpose |
|----------|--------------|---------|
| `WOO_STORE_URL` | `https://primeprinting.co` | WooCommerce store base URL. Used by the webhook handler to verify order origins. |
| `WOO_CONSUMER_KEY` | `ck_********` | WooCommerce REST API consumer key. Used to fetch order details. |
| `WOO_CONSUMER_SECRET` | `cs_********` | WooCommerce REST API consumer secret. |
| `WOO_WEBHOOK_SECRET` | `********` | HMAC-SHA256 secret for verifying WooCommerce webhook payloads. |

---

### Email (SMTP)

| Variable | Example Value | Purpose |
|----------|--------------|---------|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server hostname. |
| `SMTP_PORT` | `587` | SMTP port. 587 for TLS (STARTTLS), 465 for SSL. |
| `SMTP_USER` | `noreply@primeprinting.co` | SMTP authentication username. |
| `SMTP_PASS` | `********` | SMTP authentication password or app password. |
| `SMTP_FROM` | `Prime Fit <noreply@primeprinting.co>` | The "From" address shown in sent emails. |

---

### Web Push Notifications (VAPID)

| Variable | Example Value | Purpose |
|----------|--------------|---------|
| `VAPID_PUBLIC_KEY` | `BHxxx...` | VAPID public key. Sent to the browser when subscribing to push notifications. Also exposed as `VITE_VAPID_PUBLIC_KEY`. |
| `VAPID_PRIVATE_KEY` | `********` | VAPID private key. Used server-side to sign push notification payloads. Never expose to the frontend. |
| `VITE_VAPID_PUBLIC_KEY` | `BHxxx...` | Same as `VAPID_PUBLIC_KEY` but accessible in the frontend via Vite's `VITE_` prefix. |

---

### Analytics

| Variable | Example Value | Purpose |
|----------|--------------|---------|
| `VITE_ANALYTICS_ENDPOINT` | `https://analytics.manus.im` | Analytics event collection endpoint. |
| `VITE_ANALYTICS_WEBSITE_ID` | `prime_fit_website_id` | Website identifier for the analytics service. |

---

### App Identity

| Variable | Example Value | Purpose |
|----------|--------------|---------|
| `VITE_APP_TITLE` | `Prime Fit` | App title shown in the browser tab and PWA manifest. |
| `VITE_APP_LOGO` | `/api/img/prime_fit_logo.png` | App logo URL used in the Manus dialog and PWA icon. |

---

### Unused / Legacy Variables

The following variables are defined in `server/_core/env.ts` but are not currently used by any application code. They may be remnants from an earlier Supabase integration that was replaced by the Manus S3 storage system.

| Variable | Notes |
|----------|-------|
| `SUPABASE_URL` | Defined in env.ts, no Supabase client code exists |
| `SUPABASE_SERVICE_KEY` | Same as above |
| `VITE_SUPABASE_ANON_KEY` | Same as above |

These should be removed in a future cleanup to reduce confusion.

---

## Setting Variables

In the Manus platform, all variables are managed through **Settings → Secrets** in the Management UI. Variables prefixed with `VITE_` are automatically exposed to the frontend build. All others are server-only.

For local development, create a `.env` file at the project root (it is gitignored) with the format:

```
DATABASE_URL=mysql://...
JWT_SECRET=your_32_char_secret_here
MYFATOORAH_API_KEY=your_key_here
...
```
