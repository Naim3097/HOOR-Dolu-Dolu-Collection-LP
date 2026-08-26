import "server-only";
import { createHash } from "node:crypto";

/**
 * LeanX.io hosted-bill integration.
 * ⚑ Endpoint paths, field names and the hash recipe below follow LeanX's
 *   public merchant docs as best understood; verify against your account's
 *   API reference and sandbox before go-live. Everything is isolated here.
 */
const BASE = process.env.LEANX_BASE_URL ?? "https://api.leanx.io";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export type CreateBillInput = {
  orderRef: string;
  amount: number; // MYR, 2dp
  name: string;
  email: string;
  phone: string;
  description: string;
  redirectUrl: string;
  callbackUrl: string;
};

export type CreateBillResult = { billId: string; redirectUrl: string };

export async function createBill(input: CreateBillInput): Promise<CreateBillResult> {
  const res = await fetch(`${BASE}/api/v1/merchant/create-bill-page`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "auth-token": env("LEANX_AUTH_TOKEN") },
    body: JSON.stringify({
      collection_uuid: env("LEANX_COLLECTION_UUID"),
      amount: input.amount.toFixed(2),
      redirect_url: input.redirectUrl,
      callback_url: input.callbackUrl,
      full_name: input.name,
      email: input.email,
      phone_number: input.phone,
      description: input.description,
      external_id: input.orderRef,
    }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.data?.redirect_url) {
    throw new Error(`LeanX create-bill failed: ${res.status} ${JSON.stringify(json)}`);
  }
  return { billId: json.data.bill_uuid ?? json.data.invoice_no ?? "", redirectUrl: json.data.redirect_url };
}

export type LeanXCallback = {
  external_id?: string;
  invoice_no?: string;
  invoice_status?: string; // e.g. SUCCESS / FAILED / PENDING
  amount?: string;
  hash?: string;
  [k: string]: unknown;
};

/** Verify the callback hash. ⚑ Confirm the exact concatenation order with LeanX. */
export function verifyCallback(payload: LeanXCallback): boolean {
  const key = env("LEANX_HASH_KEY");
  const expected = createHash("sha256")
    .update(`${key}|${payload.external_id ?? ""}|${payload.invoice_no ?? ""}|${payload.amount ?? ""}|${payload.invoice_status ?? ""}`)
    .digest("hex");
  return typeof payload.hash === "string" && payload.hash.toLowerCase() === expected;
}

export function isPaid(status?: string) {
  return (status ?? "").toUpperCase() === "SUCCESS";
}
