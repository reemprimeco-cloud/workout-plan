export const ENV = {
  appId:              process.env.VITE_APP_ID ?? "",
  cookieSecret:       process.env.JWT_SECRET ?? "",
  databaseUrl:        process.env.DATABASE_URL ?? "",
  // OWNER_OPEN_ID kept as a generic "this openId is the admin/owner" config
  // (used in db.ts to auto-promote the owner). Set it to the owner's standalone
  // openId. OAUTH_SERVER_URL was Manus-OAuth-only and was removed (Stage 2).
  ownerOpenId:        process.env.OWNER_OPEN_ID ?? "",
  isProduction:       process.env.NODE_ENV === "production",
  // Comma-separated. Doubles as the destination for owner notifications and as
  // the identity check behind `isOwnerEmail` — the accounts that run the app
  // rather than buy it.
  ownerEmail:         process.env.OWNER_EMAIL ?? "",
  // Shared secret for the scheduled-cron endpoint (Vercel Cron sends it as a
  // Bearer token). If empty, the cron endpoint is disabled (returns 503).
  cronSecret:         process.env.CRON_SECRET ?? "",
  wooStoreUrl:        process.env.WOO_STORE_URL ?? "",
  wooConsumerKey:     process.env.WOO_CONSUMER_KEY ?? "",
  wooConsumerSecret:  process.env.WOO_CONSUMER_SECRET ?? "",
  wooWebhookSecret:   process.env.WOO_WEBHOOK_SECRET ?? "",
  vapidPublicKey:     process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey:    process.env.VAPID_PRIVATE_KEY ?? "",
  smtpHost:           process.env.SMTP_HOST ?? "smtp.gmail.com",
  smtpPort:           parseInt(process.env.SMTP_PORT ?? "587"),
  smtpUser:           process.env.SMTP_USER ?? "",
  smtpPass:           process.env.SMTP_PASS ?? "",
  smtpFrom:           process.env.SMTP_FROM ?? "Prime Fit <noreply@primefit.app>",
  // ── AI provider (vendor-agnostic; see server/_core/ai) ────────────────────
  aiProvider:         process.env.AI_PROVIDER ?? "openai",
  openaiApiKey:       process.env.OPENAI_API_KEY ?? "",
  openaiBaseUrl:      process.env.OPENAI_BASE_URL ?? "https://api.openai.com",
  aiModel:            process.env.AI_MODEL ?? "gpt-4o",
  aiTranscribeModel:  process.env.AI_TRANSCRIBE_MODEL ?? "whisper-1",
  aiImageModel:       process.env.AI_IMAGE_MODEL ?? "gpt-image-1",
  // ── Supabase ──────────────────────────────────────────────────────────────
  supabaseUrl:        process.env.SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? "",   // service_role key (server only)
  supabaseAnonKey:    process.env.VITE_SUPABASE_ANON_KEY ?? "", // anon key (client safe)
  // ── MyFatoorah ────────────────────────────────────────────────────────────
  myfatoorahApiKey:     process.env.MYFATOORAH_API_KEY ?? "",
  myfatoorahApiUrl:     process.env.MYFATOORAH_API_URL ?? "https://api.myfatoorah.com",  // prod
  myfatoorahWebhookKey: process.env.MYFATOORAH_WEBHOOK_SECRET ?? "",
  appDomain:            process.env.APP_DOMAIN ?? "primefit.app",
  // Web OAuth client — the audience of ID tokens minted by the website's
  // "Sign in with Google" button.
  googleClientId:       process.env.VITE_GOOGLE_CLIENT_ID ?? "",
  // Native iOS OAuth client(s) — Google validates bundle ID per client, so
  // the iOS app (and any per-environment build: com.primefit.ios[.dev|.staging])
  // uses its own client ID whose ID tokens carry a different `aud`. Accept a
  // comma-separated list so multiple iOS build configs can be allowed at once.
  googleIosClientIds:   (process.env.GOOGLE_IOS_CLIENT_IDS ?? process.env.GOOGLE_IOS_CLIENT_ID ?? "")
                          .split(",").map(s => s.trim()).filter(Boolean),
  // Sign in with Apple — the `aud` claim on an Apple identity token is the
  // app's bundle ID itself (unlike Google's separate OAuth client id), so
  // this is just the iOS app's bundle id(s) across build configs
  // (com.primefit.ios[.dev|.staging]).
  appleBundleIds:       (process.env.APPLE_BUNDLE_IDS ?? "")
                          .split(",").map(s => s.trim()).filter(Boolean),
  // ── App Store Server Notifications V2 ──────────────────────────────────
  // The bundle ID the notification payload must carry. Defaults to the first
  // Sign in with Apple bundle ID since it's the same app; set explicitly when
  // those lists need to differ (e.g. accepting .dev tokens for auth but only
  // production notifications for billing).
  appleNotificationsBundleId: process.env.APPLE_NOTIFICATIONS_BUNDLE_ID ?? "",
  // Numeric App Store app ID ("appAppleId" in App Store Connect → App
  // Information). Required by Apple's verifier for Production notifications;
  // omitted in Sandbox.
  appleAppId:           process.env.APPLE_APP_ID ?? "",
  // DER-encoded Apple root CAs, base64, comma-separated. Optional: when unset
  // the roots are fetched once from Apple's certificate authority over
  // verified TLS. Set this for deployments with no outbound egress, or to pin
  // the exact trust anchors. See server/_core/appleRootCerts.ts.
  appleRootCertsB64:    (process.env.APPLE_ROOT_CERTS_B64 ?? "")
                          .split(",").map(s => s.trim()).filter(Boolean),
};

/**
 * All Google OAuth client IDs whose ID tokens this server accepts as valid
 * audience (`aud`). Combines the web client with any native iOS clients.
 * A token's `aud` must exactly match one of these (see PF-007 in
 * standaloneAuth.googleSignIn) — this is the multi-platform equivalent of
 * checking a single client ID, not a relaxation of the check.
 */
export const GOOGLE_ALLOWED_AUDIENCES: string[] = [
  ENV.googleClientId,
  ...ENV.googleIosClientIds,
].filter(Boolean);

/** Bundle IDs this server accepts as a Sign in with Apple token's `aud`. */
export const APPLE_ALLOWED_AUDIENCES: string[] = [...ENV.appleBundleIds].filter(Boolean);

/**
 * Is this the account that operates Prime Fit, rather than a customer of it?
 *
 * Owner accounts are never gated by subscription state: they exist to run the
 * app — support, content, demos, checking a bug report a member filed — and
 * locking the operator out of their own product when a trial lapses has no
 * upside. Config-driven rather than a hard-coded address so the owner can
 * change without a deploy, and comma-separated so a second operator can be
 * added later.
 *
 * Matching is case- and whitespace-insensitive: email casing carries no
 * meaning, and an owner who typed "R.bhck@…" at signup must not lose access
 * because the env var says "r.bhck@…".
 */
export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email || !ENV.ownerEmail) return false;
  const candidate = email.trim().toLowerCase();
  return ENV.ownerEmail
    .split(",")
    .some(entry => entry.trim().toLowerCase() === candidate);
}

// PF-015: fail fast in production if a hard-required secret is missing.
// Previously every variable silently defaulted to "" (contradicting
// SECURITY.md's claim that startup fails on missing vars), so a misconfigured
// deploy would boot with an empty JWT secret or no database rather than
// erroring. Only the two secrets the app cannot safely run without are
// enforced here, and only in production so dev/test are unaffected.
if (ENV.isProduction) {
  const required: Array<[string, string]> = [
    ["DATABASE_URL", ENV.databaseUrl],
    ["JWT_SECRET", ENV.cookieSecret],
  ];
  const missing = required.filter(([, value]) => !value).map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(", ")}`,
    );
  }
}
