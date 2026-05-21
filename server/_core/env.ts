export const ENV = {
  appId:              process.env.VITE_APP_ID ?? "",
  cookieSecret:       process.env.JWT_SECRET ?? "",
  databaseUrl:        process.env.DATABASE_URL ?? "",
  oAuthServerUrl:     process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId:        process.env.OWNER_OPEN_ID ?? "",
  isProduction:       process.env.NODE_ENV === "production",
  forgeApiUrl:        process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey:        process.env.BUILT_IN_FORGE_API_KEY ?? "",
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
  // ── Supabase ──────────────────────────────────────────────────────────────
  supabaseUrl:        process.env.SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? "",   // service_role key (server only)
  supabaseAnonKey:    process.env.VITE_SUPABASE_ANON_KEY ?? "", // anon key (client safe)
  // ── MyFatoorah ────────────────────────────────────────────────────────────
  myfatoorahApiKey:     process.env.MYFATOORAH_API_KEY ?? "",
  myfatoorahApiUrl:     process.env.MYFATOORAH_API_URL ?? "https://api.myfatoorah.com",  // prod
  myfatoorahWebhookKey: process.env.MYFATOORAH_WEBHOOK_SECRET ?? "",
  appDomain:            process.env.APP_DOMAIN ?? "primefit.app",
  // ── Google OAuth ──────────────────────────────────────────────────────────
  googleClientId:       process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret:   process.env.GOOGLE_CLIENT_SECRET ?? "",
};
