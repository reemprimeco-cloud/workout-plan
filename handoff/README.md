# Prime Fit — Local Development Setup

This guide walks any engineer through running Prime Fit locally from a clean machine.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22.x | [nodejs.org](https://nodejs.org) |
| pnpm | 9.x | `npm install -g pnpm` |
| MySQL | 8.x or TiDB | Local MySQL or a cloud TiDB instance |
| Git | Any | [git-scm.com](https://git-scm.com) |

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd workout-plan
```

---

## 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies and applies the `patches/wouter@3.7.1.patch` automatically via the `pnpm.patchedDependencies` configuration.

---

## 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with the following required variables. See `ENVIRONMENT.md` for a full description of every variable.

**Required for the app to start:**
```env
DATABASE_URL=mysql://user:password@localhost:3306/primefit
JWT_SECRET=your-32-character-minimum-secret-key
```

**Required for authentication:**
```env
# Manus OAuth (primary)
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im

# Google OAuth (secondary)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Required for file storage:**
```env
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

**Required for payments:**
```env
MYFATOORAH_API_KEY=your-myfatoorah-api-key
MYFATOORAH_API_URL=https://api.myfatoorah.com
MYFATOORAH_WEBHOOK_SECRET=your-webhook-secret
```

**Required for email:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@primefit.app
```

**Required for push notifications:**
```env
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

To generate VAPID keys:
```bash
node -e "const webpush = require('web-push'); const keys = webpush.generateVAPIDKeys(); console.log(keys);"
```

---

## 4. Set Up the Database

Run the Drizzle migrations to create all tables:

```bash
pnpm db:push
```

This runs `drizzle-kit generate && drizzle-kit migrate` which applies all migrations in `drizzle/` to your database.

To verify the tables were created:
```bash
mysql -u user -p primefit -e "SHOW TABLES;"
```

---

## 5. Start the Development Server

```bash
pnpm dev
```

This starts the Express server with `tsx watch` (hot reload). The server serves both the API (`/api/*`) and the Vite frontend via the Vite middleware bridge.

The app will be available at: **http://localhost:3000**

---

## 6. Run Tests

```bash
pnpm test
```

All tests use Vitest. Tests are in `server/*.test.ts` and `server/routers/*.test.ts`. The test suite requires a live database connection.

---

## 7. Build for Production

```bash
pnpm build
```

This runs:
1. `vite build` — builds the React frontend to `dist/client/`
2. `esbuild server/_core/index.ts` — bundles the Express server to `dist/index.js`

To run the production build locally:
```bash
node dist/index.js
```

---

## 8. Code Quality

Format code:
```bash
pnpm format
```

Type check (no emit):
```bash
npx tsc --noEmit
```

---

## Project Structure

```
workout-plan/
├── client/                    # React frontend
│   ├── public/                # Static files (favicon, manifest only — no images)
│   └── src/
│       ├── _core/hooks/       # useAuth hook
│       ├── components/        # Reusable UI components
│       │   └── ui/            # shadcn/ui primitives (do not edit)
│       ├── contexts/          # React contexts (Language, CMS)
│       ├── data/              # Static exercise and workout data
│       ├── hooks/             # Custom hooks (useGymTracker, useHaptic, etc.)
│       ├── lib/               # Utilities (imageUtils, exerciseData, trpc client)
│       ├── pages/             # Page-level components
│       ├── App.tsx            # Routes and layout
│       ├── index.css          # Global styles and Tailwind theme
│       └── main.tsx           # App entry point with providers
├── drizzle/                   # Database schema and migrations
│   ├── schema.ts              # All table definitions
│   └── *.sql                  # Migration files
├── server/                    # Express backend
│   ├── _core/                 # Framework infrastructure (do not edit)
│   ├── handlers/              # Webhook and utility handlers
│   ├── routers/               # tRPC router files (one per feature)
│   ├── db.ts                  # Database query helpers
│   ├── routers.ts             # Main router (merges all sub-routers)
│   └── storage.ts             # S3 storage helpers
├── shared/                    # Shared types and constants
├── handoff/                   # Engineering handoff documentation
├── package.json
├── drizzle.config.ts
├── vite.config.ts
└── vitest.config.ts
```

---

## Common Issues

**`DATABASE_URL` connection refused:** Ensure MySQL is running and the connection string uses the correct host, port, user, and password.

**`JWT_SECRET` too short:** The secret must be at least 32 characters. Use `openssl rand -hex 32` to generate one.

**Images not loading in development:** Images are served via the `/api/img/` proxy. Ensure `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` are set.

**`pnpm install` fails on patch:** If the wouter patch fails, run `pnpm install --no-frozen-lockfile` to regenerate the lockfile.

**TypeScript errors after pulling:** Run `pnpm install` to ensure all type definitions are up to date, then `npx tsc --noEmit`.

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm test` | Run all tests |
| `pnpm format` | Format all files with Prettier |
| `pnpm db:push` | Apply database schema changes |
| `npx tsc --noEmit` | Type check without building |
