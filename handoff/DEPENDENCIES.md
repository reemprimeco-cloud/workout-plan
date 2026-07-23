# Prime Fit — Dependencies

## Runtime Dependencies

### Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.1 | UI framework |
| `react-dom` | ^19.2.1 | React DOM renderer |
| `express` | ^4.21.2 | HTTP server for the API and static file serving |
| `vite` | ^7.1.7 | Frontend build tool and dev server HMR bridge |

---

### API Layer (tRPC)

| Package | Version | Purpose |
|---------|---------|---------|
| `@trpc/server` | ^11.6.0 | Server-side tRPC router and procedure definitions |
| `@trpc/client` | ^11.6.0 | Type-safe client for calling tRPC procedures |
| `@trpc/react-query` | ^11.6.0 | React hooks integration for tRPC (useQuery, useMutation) |
| `@tanstack/react-query` | ^5.90.2 | Underlying data-fetching and caching library used by tRPC |
| `superjson` | ^1.13.3 | Serializer that preserves `Date`, `Map`, `Set` across the tRPC wire |
| `zod` | ^4.1.12 | Schema validation for all tRPC input types |

---

### Database

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | ^0.44.5 | Type-safe ORM for MySQL/TiDB. Schema defined in `drizzle/schema.ts` |
| `mysql2` | ^3.15.0 | MySQL driver used by Drizzle ORM |

---

### Authentication & Security

| Package | Version | Purpose |
|---------|---------|---------|
| `jose` | 6.1.0 | JWT signing and verification for session cookies |
| `bcryptjs` | ^3.0.3 | Password hashing for standalone email/password auth |
| `cookie` | ^1.0.2 | Cookie parsing middleware for Express |
| `helmet` | ^8.1.0 | HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) |
| `express-rate-limit` | ^8.5.2 | Rate limiting on auth and payment endpoints |

---

### File Storage (S3)

| Package | Version | Purpose |
|---------|---------|---------|
| `@aws-sdk/client-s3` | ^3.693.0 | S3-compatible storage client for Manus built-in storage |
| `@aws-sdk/s3-request-presigner` | ^3.693.0 | Generates presigned URLs for S3 objects |

---

### Email

| Package | Version | Purpose |
|---------|---------|---------|
| `nodemailer` | ^8.0.7 | SMTP email sending (license keys, notifications, password reset) |

---

### Web Push Notifications

| Package | Version | Purpose |
|---------|---------|---------|
| `web-push` | ^3.6.7 | VAPID-based Web Push notification sending |

---

### Real-time (Socket.IO)

| Package | Version | Purpose |
|---------|---------|---------|
| `socket.io` | ^4.8.3 | Server-side WebSocket server for real-time community feed updates |
| `socket.io-client` | ^4.8.3 | Client-side WebSocket connection |

---

### Routing

| Package | Version | Purpose |
|---------|---------|---------|
| `wouter` | ^3.3.5 | Lightweight client-side router for React. Patched via `patches/wouter@3.7.1.patch` |

---

### UI Components (shadcn/ui + Radix)

All `@radix-ui/react-*` packages are headless UI primitives used by shadcn/ui components. They provide accessible, unstyled components that are styled with Tailwind CSS.

| Package | Purpose |
|---------|---------|
| `@radix-ui/react-accordion` | Collapsible sections |
| `@radix-ui/react-alert-dialog` | Confirmation dialogs |
| `@radix-ui/react-avatar` | Profile pictures with fallback |
| `@radix-ui/react-checkbox` | Checkbox inputs |
| `@radix-ui/react-dialog` | Modal dialogs |
| `@radix-ui/react-dropdown-menu` | Dropdown menus |
| `@radix-ui/react-popover` | Floating panels |
| `@radix-ui/react-progress` | Progress bars |
| `@radix-ui/react-radio-group` | Radio button groups |
| `@radix-ui/react-scroll-area` | Custom scrollbars |
| `@radix-ui/react-select` | Dropdown selects |
| `@radix-ui/react-separator` | Dividers |
| `@radix-ui/react-slider` | Range sliders |
| `@radix-ui/react-slot` | Polymorphic component slot |
| `@radix-ui/react-switch` | Toggle switches |
| `@radix-ui/react-tabs` | Tab navigation |
| `@radix-ui/react-tooltip` | Hover tooltips |
| `class-variance-authority` | Type-safe component variant system |
| `clsx` | Conditional className utility |
| `tailwind-merge` | Merges Tailwind classes without conflicts |
| `lucide-react` | Icon library (SVG icons) |
| `cmdk` | Command palette component |
| `input-otp` | OTP code input |
| `embla-carousel-react` | Carousel/slider |
| `vaul` | Drawer/bottom sheet |
| `react-resizable-panels` | Resizable panel layouts |
| `sonner` | Toast notification system |

---

### Forms

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | ^7.64.0 | Form state management and validation |
| `@hookform/resolvers` | ^5.2.2 | Zod resolver for react-hook-form |

---

### Data Visualisation

| Package | Version | Purpose |
|---------|---------|---------|
| `recharts` | ^2.15.2 | Charts for the Stats panel (workout frequency, weight progress) |
| `react-day-picker` | ^9.11.1 | Calendar component for workout history |

---

### Animation

| Package | Version | Purpose |
|---------|---------|---------|
| `framer-motion` | ^12.23.22 | Animations for tab transitions, spin wheel, and micro-interactions |
| `tailwindcss-animate` | ^1.0.7 | Tailwind CSS animation utilities |
| `tw-animate-css` | ^1.4.0 | Additional CSS animation presets |

---

### Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `date-fns` | ^4.1.0 | Date manipulation and formatting |
| `nanoid` | ^5.1.5 | Unique ID generation for license keys and tokens |
| `axios` | ^1.12.0 | HTTP client used for MyFatoorah API calls and WooCommerce API |
| `dotenv` | ^17.2.2 | Loads `.env` file in development |
| `next-themes` | ^0.4.6 | Theme provider (dark/light mode) |
| `streamdown` | ^1.4.0 | Streaming Markdown renderer for AI chat responses |
| `xlsx` | ^0.18.5 | Excel/CSV file parsing for gym class schedule import |

---

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | 5.9.3 | TypeScript compiler |
| `tsx` | ^4.19.1 | TypeScript execution for the dev server (`pnpm dev`) |
| `esbuild` | ^0.25.0 | Fast bundler for the production server build |
| `vite` | ^7.1.7 | Frontend build tool |
| `@vitejs/plugin-react` | ^5.0.4 | Vite plugin for React JSX transform |
| `@tailwindcss/vite` | ^4.1.3 | Tailwind CSS v4 Vite integration |
| `tailwindcss` | ^4.1.14 | Utility-first CSS framework |
| `drizzle-kit` | ^0.31.4 | Drizzle ORM CLI for schema generation and migrations |
| `vitest` | ^2.1.4 | Unit testing framework |
| `prettier` | ^3.6.2 | Code formatter |
| `@builder.io/vite-plugin-jsx-loc` | ^0.1.1 | Adds source location data to JSX elements (used by Manus visual editor) |
| `vite-plugin-manus-runtime` | ^0.0.57 | Manus platform runtime plugin (debug collector, storage proxy) |
| `postcss` | ^8.4.47 | CSS post-processor (required by Tailwind) |
| `autoprefixer` | ^10.4.20 | Adds vendor prefixes to CSS |

---

## Patches

`patches/wouter@3.7.1.patch` — A custom patch applied to the `wouter` router package. The patch fixes a navigation issue specific to the app's tab-based layout. Do not remove this patch without testing all navigation flows.

---

## Notable Overrides

`tailwindcss>nanoid` is pinned to `3.3.7` to avoid a breaking change in nanoid v4+ that requires ESM-only imports, which conflicts with the CommonJS build of some Tailwind internals.
