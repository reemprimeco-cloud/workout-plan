export const ENV = {
  appId:              process.env.VITE_APP_ID ?? "",
  cookieSecret:       process.env.JWT_SECRET ?? "",
  databaseUrl:        process.env.DATABASE_URL ?? "",
  // OWNER_OPEN_ID kept as a generic "this openId is the admin/owner" config
  // (used in db.ts to auto-promote the owner). Set it to the owner's standalone
  // openId. OAUTH_SERVER_URL was Manus-OAuth-only and was removed (Stage 2).
  ownerOpenId:        process.env.OWNER_OPEN_ID ?? "",
  isProduction:       process.env.NODE_ENV === "production",
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
  googleClientId:       process.env.VITE_GOOGLE_CLIENT_ID ?? "",
};

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
