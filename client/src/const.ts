export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// The Manus OAuth portal redirect was removed during the standalone migration
// (Stage 2). Login now goes to the app's own /auth page, which offers
// email/password sign-in and the self-contained Google redirect flow
// (/api/auth/google). An optional returnPath is preserved as ?returnTo.
export const getLoginUrl = (returnPath?: string) => {
  const url = new URL("/auth", window.location.origin);
  if (returnPath) url.searchParams.set("returnTo", returnPath);
  return url.toString();
};
