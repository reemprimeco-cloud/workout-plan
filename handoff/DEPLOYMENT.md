# Prime Fit — Deployment Guide

## Prerequisites

- Node.js 22+ (project uses `pnpm` as the package manager)
- MySQL 8 or TiDB database
- Access to all environment variables listed in `ENVIRONMENT.md`
- A Manus account (for the built-in LLM, storage, and OAuth)

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/workout-plan.git
cd workout-plan
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file at the project root. Copy the template below and fill in your values:

```env
DATABASE_URL=mysql://user:password@localhost:3306/primefit
JWT_SECRET=your_minimum_32_character_secret_here
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
OWNER_OPEN_ID=your_manus_open_id
OWNER_NAME=Your Name
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your_server_forge_key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_key
MYFATOORAH_API_KEY=your_myfatoorah_key
MYFATOORAH_API_URL=https://apitest.myfatoorah.com
MYFATOORAH_WEBHOOK_SECRET=your_webhook_secret
WOO_STORE_URL=https://your-woo-store.com
WOO_CONSUMER_KEY=ck_your_key
WOO_CONSUMER_SECRET=cs_your_secret
WOO_WEBHOOK_SECRET=your_woo_webhook_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
SMTP_FROM=Prime Fit <your@email.com>
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_APP_TITLE=Prime Fit
```

### 4. Run Database Migrations

This command generates Drizzle migration files and applies them to the database:

```bash
pnpm db:push
```

### 5. Start the Development Server

```bash
pnpm dev
```

This starts the Express server with Vite's HMR bridge. The app is available at `http://localhost:3000` (or the next available port if 3000 is busy).

---

## Running Tests

```bash
pnpm test
```

Tests are in `server/*.test.ts` and `server/routers/*.test.ts`. They use Vitest with a real database connection (requires `DATABASE_URL` to be set).

---

## Production Build

### 1. Build the Application

```bash
pnpm build
```

This runs two commands:
- `vite build` — compiles the React frontend into `dist/`
- `esbuild server/_core/index.ts ... --outdir=dist` — bundles the Express server into `dist/`

### 2. Start the Production Server

```bash
node dist/index.js
```

The server reads the `PORT` environment variable (or finds an available port starting from 3000).

---

## Manus Platform Deployment

The project is hosted on **Manus Autoscale** (serverless). Deployment is done through the Manus Management UI — there is no CLI deploy command.

### Steps to Deploy

1. Ensure all code changes are committed and a checkpoint has been saved (the Management UI's "Save Checkpoint" action)
2. Click the **Publish** button in the Management UI header
3. The platform builds the Docker image, runs the production build, and deploys to the CDN

### Custom Dockerfile

The project does **not** include a custom `Dockerfile` — the Manus platform generates one automatically. If a `Dockerfile` is ever added at the project root, the platform will use it instead of the default template. Only add one if you need extra system binaries (ffmpeg, fonts, etc.).

### Domain Configuration

The live domain is `primefit.manus.space`. Custom domains can be configured in **Settings → Domains** in the Management UI.

---

## Database Migrations

Drizzle ORM is used for schema management. The workflow is:

1. Edit `drizzle/schema.ts` to add or modify tables
2. Run `pnpm db:push` — this generates a new migration file in `drizzle/migrations/` and applies it
3. Commit the generated migration file to the repository

**Warning:** `pnpm db:push` applies migrations directly to the connected database. In production, ensure you are pointing at the correct `DATABASE_URL` before running this command. Database data is not recoverable after destructive migrations.

---

## Storage

All user-uploaded files (gym logos, exercise images, session icons, community post images, avatars) are stored in Manus S3-compatible storage. No setup is required — the `BUILT_IN_FORGE_API_KEY` and `BUILT_IN_FORGE_API_URL` credentials are automatically injected by the platform.

Static workout images (exercise illustrations, nav icons, session type icons) are uploaded to webdev static storage using:

```bash
manus-upload-file --webdev path/to/image.png
```

The returned `/manus-storage/xxx.png` URL must be registered in `client/src/lib/imageUtils.ts` in the `CDN_IMAGE_MAP` object, and referenced via `resolveImageUrl()` in all React components.

---

## Rollback

If a deployment breaks the live site, roll back using the Manus Management UI:

1. Open the **Version History** from the three-dot menu (⋯) in the Management UI header
2. Select the last known good checkpoint
3. Click **Rollback**

This restores the code to that checkpoint state. Database schema changes are **not** rolled back automatically — if you ran a destructive migration, you must manually restore the database.

---

## Environment Variable Management

All secrets are managed through **Settings → Secrets** in the Manus Management UI. Changes take effect on the next deployment. Never commit `.env` files to the repository.

---

## Monitoring

Production logs are accessible via:

```bash
manus-webdev-logs
manus-webdev-logs --limit 50
manus-webdev-logs --end-time <timestamp>
```

These show the live server console output from the deployed application.
