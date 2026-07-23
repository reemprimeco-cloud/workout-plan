# Prime Fit — Security Documentation

## Authentication

Prime Fit supports three authentication methods, all managed through `server/_core/oauth.ts` and `server/routers/standaloneAuth.ts`.

**Manus OAuth** is the primary authentication method. The flow follows standard OAuth 2.0: the frontend redirects to the Manus login portal with a `state` parameter that encodes the `window.location.origin` and the return path. After login, the portal redirects to `/api/oauth/callback` with a `code`. The server exchanges the code for a user token, creates or updates the user record, and issues a signed session cookie.

**Google OAuth** is the secondary method. The frontend initiates the flow via the Google Sign-In button. The server exchanges the Google authorization code for a profile, creates or updates the user record, and issues a session cookie.

**Standalone Email/Password** is the tertiary method. Passwords are hashed with `bcryptjs` (bcrypt, 10 rounds) before storage. Login returns a session cookie. Password reset uses a 6-digit OTP sent via email, valid for 15 minutes.

**Session Cookies** are signed JWTs (`jose` library). The cookie is `httpOnly`, `sameSite: 'lax'`, and `secure: true` in production. The JWT payload contains `userId`, `role`, and `exp`. The `JWT_SECRET` must be at least 32 characters.

---

## Authorization

**Role-Based Access Control** uses the `users.role` column (`'admin'` | `'user'`). The tRPC context (`server/_core/context.ts`) reads the session cookie and attaches the user to `ctx.user`. Three procedure types enforce access levels:

| Procedure Type | Access Level | Usage |
|----------------|-------------|-------|
| `publicProcedure` | No auth required | Public data (pricing, gym classes) |
| `protectedProcedure` | Authenticated user required | All user-specific features |
| `adminProcedure` | Admin role required | Admin Panel, CMS, license management |

The `adminProcedure` middleware checks `ctx.user.role === 'admin'` and throws `FORBIDDEN` if not met. Never bypass this check by adding role checks in individual procedures — always use `adminProcedure` for admin operations.

---

## Security Headers

The Express server uses `helmet` middleware with the following configuration:

- `Content-Security-Policy` — restricts script sources to `'self'` and trusted CDNs
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Strict-Transport-Security` — enforces HTTPS with a 1-year max-age
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## Rate Limiting

`express-rate-limit` is applied to sensitive endpoints:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 10 requests | 15 minutes |
| `/api/auth/register` | 5 requests | 1 hour |
| `/api/auth/reset-password` | 5 requests | 1 hour |
| `/api/webhooks/*` | 100 requests | 1 minute |

---

## Webhook Signature Verification

Both the MyFatoorah and WooCommerce webhook handlers verify the HMAC-SHA256 signature of incoming payloads before processing them. The verification is done before any database operations.

**MyFatoorah:** The `X-MyFatoorah-Signature` header is verified against `MYFATOORAH_WEBHOOK_SECRET`.

**WooCommerce:** The `X-WC-Webhook-Signature` header is verified against `WOO_WEBHOOK_SECRET`.

If signature verification fails, the handler returns `HTTP 401` and logs the failure. Never disable signature verification, even in development.

---

## Input Validation

All tRPC procedure inputs are validated with Zod schemas defined inline in the procedure. The schemas are strict — no extra fields are allowed. Common validations:

- String fields: `z.string().min(1).max(255)` (prevents empty strings and SQL injection via length limits)
- Email fields: `z.string().email()`
- Numeric fields: `z.number().int().positive()`
- Enum fields: `z.enum([...])` (prevents invalid values)

Never trust client-provided data. Always validate on the server, even if the frontend also validates.

---

## Secrets Handling

All secrets are stored as environment variables, never in code or committed to the repository. The `.env` file is gitignored. In production, secrets are injected by the Manus platform at runtime.

The `server/_core/env.ts` file defines the canonical list of all environment variables and their types. It throws an error at startup if any required variable is missing, preventing silent failures in production.

**Never log secrets.** The server-side logging added for debugging (`console.log("UPLOAD RESULT", result)`) must be removed before production. The `BUILT_IN_FORGE_API_KEY` and `MYFATOORAH_API_KEY` are particularly sensitive and must never appear in logs.

---

## File Upload Security

File uploads go through the following validation chain:

1. **Client-side:** File type is checked against an allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/gif`). File size is limited to 16MB.
2. **Server-side:** The tRPC procedure re-validates the MIME type by checking the base64 data URI prefix. Files are uploaded to S3 with the validated MIME type as the `Content-Type`.
3. **Storage:** Files are stored in S3 with a random key that includes the user ID as a prefix, preventing path traversal.

The `/api/img/` proxy only serves files from the Manus S3 bucket. It validates the key format and rejects any key containing `..` or absolute paths.

---

## CORS

The Express server is configured to accept requests only from the app's own origin. The tRPC client sends `credentials: 'include'` with every request, which requires the server to respond with `Access-Control-Allow-Credentials: true` and a specific (non-wildcard) `Access-Control-Allow-Origin`.

The `/api/img/` proxy adds `Access-Control-Allow-Origin: *` to image responses because images are public assets that do not carry credentials.

---

## Known Security Concerns

**Base64 avatar storage (BUG-004):** Storing base64-encoded images in the database bypasses the file upload security chain described above. An attacker could theoretically store a very large base64 string to exhaust database storage. This should be fixed by migrating to S3 storage (see `TODO.md`).

**No CSRF protection on tRPC:** The tRPC endpoints do not use CSRF tokens. They rely on the `sameSite: 'lax'` cookie attribute for CSRF protection. This is acceptable for the current use case but should be reviewed if the app ever adds state-changing GET requests.

**Standalone auth OTP expiry:** The 6-digit OTP for password reset is valid for 15 minutes. This is a reasonable window but could be reduced to 5 minutes for higher security.
