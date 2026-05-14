/**
 * Shared license utilities — used by both wooCommerceWebhook and wooPoller
 */
import crypto from "crypto";

// Only issue licenses for this specific WooCommerce product
export const PRIME_FIT_PRODUCT_ID = 5802;

// Map variation IDs to plans — update when you add WooCommerce variations
export const VARIATION_PLAN_MAP: Record<number, "monthly" | "quarterly" | "yearly" | "lifetime"> = {
  // e.g. 5803: "monthly", 5804: "yearly"
};

export type LicensePlan = "monthly" | "quarterly" | "yearly" | "lifetime";

/** Generate a license key in format PRIME-XXXX-XXXX using only unambiguous chars */
export function generateLicenseKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  const part  = () => Array.from({ length: 4 }, () =>
    chars[crypto.randomInt(0, chars.length)]
  ).join("");
  return `PRIME-${part()}-${part()}`;
}

/** Detect subscription plan from WooCommerce line items */
export function detectPlan(lineItems: any[]): LicensePlan {
  for (const item of lineItems) {
    if (item.variation_id && VARIATION_PLAN_MAP[item.variation_id]) {
      return VARIATION_PLAN_MAP[item.variation_id];
    }
    const text = ((item.name ?? "") + " " + JSON.stringify(item.meta_data ?? "")).toLowerCase();
    if (text.includes("yearly") || text.includes("سنوي") || text.includes("year")) return "yearly";
    if (text.includes("quarterly") || text.includes("ربع") || text.includes("3 month")) return "quarterly";
    if (text.includes("monthly") || text.includes("شهري") || text.includes("month")) return "monthly";
  }
  return "lifetime";
}

/** Convert plan to expiry date (null = never expires) */
export function planToExpiry(plan: LicensePlan): Date | null {
  const days: Record<LicensePlan, number | null> = {
    monthly: 30, quarterly: 90, yearly: 365, lifetime: null,
  };
  const d = days[plan];
  return d ? new Date(Date.now() + d * 86400_000) : null;
}

/** Check if a WooCommerce order contains the Prime Fit product */
export function hasPrimeFitProduct(order: any): boolean {
  const lineItems: any[] = order?.line_items ?? [];
  return lineItems.some(
    item => item.product_id === PRIME_FIT_PRODUCT_ID || item.variation_id === PRIME_FIT_PRODUCT_ID
  );
}
