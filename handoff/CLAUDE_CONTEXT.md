# Prime Fit — Claude Code Briefing

This document is written specifically for Claude Code (or any AI engineer) taking over development of Prime Fit. Read this before touching any code.

---

## What This App Is

Prime Fit is a **bilingual (Arabic/English) gym fitness PWA** built for a Kuwaiti gym called **Prime Printing Co.** The app is used by gym members to track workouts, log nutrition, chat with an AI coach, and participate in a social community. It is deployed on Manus at `primefit.manus.space`.

The app is a **subscription-gated PWA** — users must pay via MyFatoorah (a Kuwait-based payment gateway) to access the full app. There is a 7-day free trial. The owner manages the app through a built-in Admin Panel.

---

## The Stack (Exactly)

- **Frontend:** React 19, Tailwind CSS 4, Wouter (routing), React Query + tRPC (data fetching)
- **Backend:** Express 4, tRPC 11, Drizzle ORM, MySQL/TiDB
- **Auth:** Manus OAuth + Google OAuth + standalone email/password (JWT session cookies)
- **Storage:** Manus S3-compatible storage (via `storagePut`/`storageGet` helpers)
- **LLM:** Manus built-in LLM (`invokeLLM` from `server/_core/llm.ts`)
- **Payments:** MyFatoorah (Kuwait payment gateway)
- **Push Notifications:** VAPID Web Push (`web-push` package)
- **Real-time:** Socket.IO

**Do not introduce new dependencies without a clear reason.** The stack is intentionally minimal.

---

## Architecture Rules (Never Break These)

**1. All backend calls go through tRPC.** Never add raw `fetch()` or `axios` calls from the frontend to the backend. Never add REST endpoints. All procedures are in `server/routers.ts` or `server/routers/<feature>.ts`.

**2. All image `src` values must go through `resolveImageUrl()`.** The function is in `client/src/lib/imageUtils.ts`. It rewrites `/manus-storage/` paths to `/api/img/` to bypass Safari's cross-origin 307 redirect blocking. If you add a new `<img>` tag, use `<SafeImage>` component or call `resolveImageUrl(src)` on the src. This is not optional — skipping it breaks images on iOS Safari and PWA.

**3. Static assets must be uploaded to webdev storage, not stored in `client/public/`.** Files in `client/public/` are not deployed to production (they cause deployment timeouts). Use `manus-upload-file --webdev path/to/file.png` to upload, then register the returned URL in `client/src/lib/imageUtils.ts`'s `CDN_IMAGE_MAP`. Reference via `resolveImageUrl()`.

**4. The `/manus-storage/` path is intercepted by the platform CDN on production.** Our Express server's `storageProxy.ts` only runs in development. On production, `/manus-storage/` returns a 307 redirect that Safari blocks. Always use `/api/img/` for image serving. The `/api/img/` proxy in `server/_core/imageProxy.ts` fetches bytes from S3 and returns them directly.

**5. Never store file bytes in the database.** Store S3 keys/URLs only. Use `storagePut()` for all file uploads.

**6. The `useGymTracker` hook uses localStorage, not the database.** This is a known architectural debt (BUG-002). Do not add more localStorage-based state — all new features must use tRPC + database.

---

## Coding Conventions

**TypeScript:** Strict mode is enabled. No `any` types. All tRPC inputs must have Zod schemas. All database query helpers in `server/db.ts` return raw Drizzle rows (no transformation).

**File naming:** React components use PascalCase (`ExerciseLibrary.tsx`). Hooks use camelCase with `use` prefix (`useGymTracker.ts`). Server files use camelCase (`gymClasses.ts`). Database table names use snake_case.

**Router organisation:** Keep router files under ~150 lines. Split into `server/routers/<feature>.ts` when they grow. The main `server/routers.ts` re-exports all sub-routers.

**Component organisation:** Page-level components go in `client/src/pages/`. Reusable components go in `client/src/components/`. shadcn/ui primitives go in `client/src/components/ui/` — never modify these directly.

**CSS:** Use Tailwind utility classes. Avoid custom CSS except for animations and brand-specific styles in `client/src/index.css`. Never hardcode colors — use CSS variables (`--primary`, `--accent`, etc.).

---

## Business Rules (Never Change Without Owner Confirmation)

**1. Arabic uses the Kuwaiti dialect.** Not Modern Standard Arabic (فصحى). Not Egyptian dialect. Specifically Kuwaiti. All Arabic text, including the AI coach system prompt, must use Kuwaiti dialect.

**2. Dates are always Gregorian.** Never display Hijri calendar dates, even in the Arabic version.

**3. License keys expire 7 days from first use.** Not from generation date. Not from payment date. From the first time the key is activated.

**4. One free trial per email address.** The system checks the `accessCodes` table for existing rows with the same email before creating a new trial. Do not change this logic.

**5. The subscription system is demand-based, not week-based.** Users subscribe for a duration (monthly/yearly), not for a specific program week. The app has no concept of "Week 1", "Week 2", etc.

**6. All emojis must be replaced with SVG vector icons.** The owner has explicitly requested this. Use `AppIcons.tsx` components. Do not add new emoji to any UI element.

**7. Application information (version, build info) must be hidden and displayed in a small font at the page margin.** Do not show version numbers prominently.

**8. The app duration is open-ended.** There is no fixed program length. Users continue indefinitely as long as their subscription is active.

---

## Design Rules (Never Change Without Owner Confirmation)

**Brand Colors:**
- Primary: `#1B2E5E` (Navy Blue) — used for headers, primary buttons, text
- Accent: `#7BB8D4` (Sky Blue) — used for highlights, active states, borders
- Background: `#F0F4F8` — page background
- Cards: `#FFFFFF` — card backgrounds

**Typography:**
- Arabic: Cairo, Tajawal (Google Fonts)
- English: Inter (Google Fonts)
- Font is switched based on `lang` in `LanguageContext`

**Layout:** The app uses a **bottom tab navigation** with 7 tabs. Do not change to a sidebar or top navigation. The tab bar is fixed at the bottom, always visible.

**RTL:** When Arabic is active (`isRTL === true`), the entire layout flips to RTL via `dir="rtl"` on the root element. Ensure all new components respect RTL layout.

---

## Things Claude Must Never Change Without Confirmation

1. The MyFatoorah payment integration (`server/_core/myfatoorah.ts`, `server/handlers/myfatoorahWebhook.ts`) — any change here directly affects revenue
2. The license key generation logic (`server/handlers/licenseUtils.ts`) — changing the format breaks existing keys
3. The subscription gate (`client/src/components/LicenseGate.tsx`) — any weakening of this gate allows free access
4. The `drizzle/schema.ts` file — always run `pnpm db:push` after changes and verify the migration
5. The brand colors and bottom tab navigation layout — confirmed by the owner as final
6. The `patches/wouter@3.7.1.patch` file — this fixes a navigation bug; removing it breaks navigation
7. The `/api/img/` proxy (`server/_core/imageProxy.ts`) — this is the only way images work on iOS Safari

---

## Common Mistakes to Avoid

**Do not use `client/public/` for images.** Files there are not deployed. Use `manus-upload-file --webdev` and `resolveImageUrl()`.

**Do not add `<img src="/manus-storage/...">` directly.** Always use `resolveImageUrl()` or `<SafeImage>`.

**Do not call `setState` or `navigate` in the render phase.** Wrap in `useEffect`.

**Do not create new objects/arrays as tRPC query inputs in render.** Use `useState` or `useMemo` to stabilise references (prevents infinite re-fetch loops).

**Do not add Axios calls from the frontend.** All backend communication goes through tRPC.

**Do not modify `server/_core/` files** unless you are extending infrastructure. These are framework-level files.

**Do not commit `.env` files.** Use `webdev_request_secrets` to manage environment variables.

---

## Testing

Run tests with `pnpm test`. Tests use Vitest. All tests are in `server/*.test.ts` and `server/routers/*.test.ts`. The test suite requires a live database connection (`DATABASE_URL` must be set).

Before every checkpoint/deployment, ensure:
- `pnpm test` passes (all tests green)
- `npx tsc --noEmit` passes (zero TypeScript errors)
- The dev server starts without errors (`pnpm dev`)

---

## Deployment

The app is deployed on Manus Autoscale (serverless). To deploy:
1. Save a checkpoint via the Management UI
2. Click the **Publish** button

There is no CLI deploy command. Do not attempt to deploy via `git push` or any other method.
