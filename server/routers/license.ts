import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { TRPCError } from "@trpc/server";

/**
 * Verifies a WooCommerce order by checking if the given license key
 * matches an order key in the store. The license key is the WooCommerce
 * order key (format: wc_order_XXXXXXXXXXXXXXXX).
 */
async function verifyWooCommerceKey(licenseKey: string): Promise<{
  valid: boolean;
  customerName?: string;
  customerEmail?: string;
  orderId?: number;
  orderStatus?: string;
}> {
  const { wooStoreUrl, wooConsumerKey, wooConsumerSecret } = ENV;

  if (!wooStoreUrl || !wooConsumerKey || !wooConsumerSecret) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "WooCommerce credentials not configured",
    });
  }

  const credentials = Buffer.from(`${wooConsumerKey}:${wooConsumerSecret}`).toString("base64");

  // Search orders by order key
  const url = `${wooStoreUrl}/wp-json/wc/v3/orders?order_key=${encodeURIComponent(licenseKey)}&per_page=1`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[WooCommerce] API error:", response.status, text);
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Could not reach the store. Please try again.",
    });
  }

  const orders = await response.json() as Array<{
    id: number;
    status: string;
    order_key: string;
    billing: { first_name: string; last_name: string; email: string };
  }>;

  if (!Array.isArray(orders) || orders.length === 0) {
    return { valid: false };
  }

  const order = orders[0];

  // Accept orders that are completed or processing
  const validStatuses = ["completed", "processing"];
  if (!validStatuses.includes(order.status)) {
    return { valid: false, orderStatus: order.status };
  }

  return {
    valid: true,
    customerName: `${order.billing.first_name} ${order.billing.last_name}`.trim(),
    customerEmail: order.billing.email,
    orderId: order.id,
    orderStatus: order.status,
  };
}

export const licenseRouter = router({
  verify: publicProcedure
    .input(
      z.object({
        licenseKey: z.string().min(1, "License key is required"),
      })
    )
    .mutation(async ({ input }) => {
      const result = await verifyWooCommerceKey(input.licenseKey.trim());

      if (!result.valid) {
        return {
          success: false,
          message:
            result.orderStatus && !["completed", "processing"].includes(result.orderStatus)
              ? `Order status is "${result.orderStatus}". Only completed orders are accepted.`
              : "Invalid license key. Please check your key and try again.",
        };
      }

      return {
        success: true,
        customerName: result.customerName,
        customerEmail: result.customerEmail,
        orderId: result.orderId,
        message: "License verified successfully!",
      };
    }),
});
