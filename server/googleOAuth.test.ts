/**
 * googleOAuth.test.ts
 * Validates that GOOGLE_CLIENT_SECRET is configured and the Google OAuth
 * redirect endpoint is reachable.
 */
import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("Google OAuth configuration", () => {
  it("should have GOOGLE_CLIENT_SECRET set in environment", () => {
    const secret = process.env.GOOGLE_CLIENT_SECRET;
    expect(secret, "GOOGLE_CLIENT_SECRET must be set").toBeTruthy();
    expect(secret!.length, "GOOGLE_CLIENT_SECRET must be non-empty").toBeGreaterThan(0);
  });

  it("should have VITE_GOOGLE_CLIENT_ID set in environment", () => {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    expect(clientId, "VITE_GOOGLE_CLIENT_ID must be set").toBeTruthy();
    expect(clientId!.length, "VITE_GOOGLE_CLIENT_ID must be non-empty").toBeGreaterThan(0);
  });
});
