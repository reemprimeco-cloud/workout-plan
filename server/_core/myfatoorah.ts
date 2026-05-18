import { ENV } from "./env";

const BASE = ENV.myfatoorahApiUrl.replace(/\/+$/, "");

// Gross prices are set so that after MyFatoorah fee (1% + 0.100 KWD)
// the net received equals the target amounts:
//   Prime Plus: monthly net 2.500 KWD, yearly net 25.000 KWD
//   Prime Pro:  monthly net 4.500 KWD, yearly net 45.000 KWD
// Formula: gross = (net + 0.100) / 0.99
export const PLAN_PRICES = {
  prime_plus: { monthly: 2.626, yearly: 25.354 },
  prime_pro:  { monthly: 4.646, yearly: 45.556 },
} as const;

export type PlanId = "prime_plus" | "prime_pro";
export type Period = "monthly" | "yearly";

interface InvoiceItem {
  ItemName: string;
  Quantity: number;
  UnitPrice: number;
}

interface CreateInvoiceParams {
  userId: string;
  plan: PlanId;
  period: Period;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  successUrl: string;
  errorUrl: string;
}

interface MyfatoorahInvoiceResponse {
  IsSuccess: boolean;
  Message: string;
  Data: {
    InvoiceId: number;
    InvoiceURL: string;
  };
}

interface MyfatoorahPaymentStatusResponse {
  IsSuccess: boolean;
  Message: string;
  Data: {
    InvoiceId: number;
    InvoiceStatus: "Paid" | "Pending" | "Failed" | "Expired";
    InvoiceValue: number;
    CustomerReference: string;
    InvoiceTransactions?: Array<{
      TransactionId: string;
      PaymentGateway: string;
      TransactionStatus: string;
    }>;
  };
}

export async function createInvoice(params: CreateInvoiceParams): Promise<{
  invoiceId: string;
  invoiceUrl: string;
}> {
  const price = PLAN_PRICES[params.plan][params.period];
  const planLabel = params.plan === "prime_plus" ? "Prime Plus" : "Prime Pro";
  const periodLabel = params.period === "monthly" ? "Monthly" : "Yearly";

  const body = {
    NotificationOption: "LNK",
    InvoiceValue: price,
    DisplayCurrencyIso: "KWD",
    CustomerName: params.customerName,
    CustomerEmail: params.customerEmail,
    ...(params.customerPhone ? { CustomerMobile: params.customerPhone } : {}),
    CallBackUrl: params.successUrl,
    ErrorUrl: params.errorUrl,
    Language: "EN",
    CustomerReference: params.userId,
    InvoiceItems: [
      {
        ItemName: `Prime Fit ${planLabel} — ${periodLabel}`,
        Quantity: 1,
        UnitPrice: price,
      } as InvoiceItem,
    ],
  };

  const res = await fetch(`${BASE}/v2/SendPayment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.myfatoorahApiKey}`,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as MyfatoorahInvoiceResponse;

  if (!json.IsSuccess) {
    throw new Error(`MyFatoorah createInvoice failed: ${json.Message}`);
  }

  return {
    invoiceId: String(json.Data.InvoiceId),
    invoiceUrl: json.Data.InvoiceURL,
  };
}

export async function getPaymentStatus(invoiceId: string): Promise<{
  status: "Paid" | "Pending" | "Failed" | "Expired";
  amount: number;
  userId: string;
  transactionId?: string;
}> {
  const res = await fetch(`${BASE}/v2/getPaymentStatus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.myfatoorahApiKey}`,
    },
    body: JSON.stringify({ Key: invoiceId, KeyType: "InvoiceId" }),
  });

  const json = (await res.json()) as MyfatoorahPaymentStatusResponse;

  if (!json.IsSuccess) {
    throw new Error(`MyFatoorah getPaymentStatus failed: ${json.Message}`);
  }

  const txn = json.Data.InvoiceTransactions?.[0];

  return {
    status: json.Data.InvoiceStatus,
    amount: json.Data.InvoiceValue,
    userId: json.Data.CustomerReference,
    transactionId: txn?.TransactionId,
  };
}

/** Look up payment status using the paymentId appended by MyFatoorah to the CallBackUrl */
export async function getPaymentStatusByPaymentId(paymentId: string): Promise<{
  status: "Paid" | "Pending" | "Failed" | "Expired";
  invoiceId: string;
  amount: number;
  userId: string;
  transactionId?: string;
}> {
  const res = await fetch(`${BASE}/v2/getPaymentStatus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.myfatoorahApiKey}`,
    },
    body: JSON.stringify({ Key: paymentId, KeyType: "PaymentId" }),
  });
  const json = (await res.json()) as MyfatoorahPaymentStatusResponse;
  if (!json.IsSuccess) {
    throw new Error(`MyFatoorah getPaymentStatus(paymentId) failed: ${json.Message}`);
  }
  const txn = json.Data.InvoiceTransactions?.[0];
  return {
    status: json.Data.InvoiceStatus,
    invoiceId: String(json.Data.InvoiceId),
    amount: json.Data.InvoiceValue,
    userId: json.Data.CustomerReference,
    transactionId: txn?.TransactionId,
  };
}

export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signature: string
): boolean {
  try {
    const crypto = require("crypto") as typeof import("crypto");
    const secret = ENV.myfatoorahWebhookKey;
    const hmac = crypto.createHmac("sha256", Buffer.from(secret, "base64"));
    hmac.update(typeof rawBody === "string" ? rawBody : rawBody);
    const computed = hmac.digest("base64");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}
