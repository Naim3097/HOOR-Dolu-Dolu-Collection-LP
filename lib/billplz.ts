import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Billplz hosted-bill integration (API v3).
 *
 * Flow: /api/orders creates a bill → customer pays on Billplz's page (FPX or
 * card, whatever the collection has enabled) → Billplz POSTs the callback to
 * /api/webhooks/billplz and sends the customer back to /checkout/return.
 *
 * Env:
 *   BILLPLZ_API_KEY          API Secret Key (Billplz → Settings → API Keys)
 *   BILLPLZ_COLLECTION_ID    collection the bills are created under
 *   BILLPLZ_X_SIGNATURE_KEY  X Signature Key, used to verify callbacks and redirects
 *   BILLPLZ_SANDBOX          "true" to use billplz-sandbox.com (staging, local)
 *
 * Docs: https://www.billplz.com/api
 */
const BASE = process.env.BILLPLZ_SANDBOX === "true" ? "https://www.billplz-sandbox.com/api/v3" : "https://www.billplz.com/api/v3";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const auth = () => `Basic ${Buffer.from(`${env("BILLPLZ_API_KEY")}:`).toString("base64")}`;

export type Bill = {
  id: string;
  collection_id: string;
  paid: boolean;
  state: "due" | "paid" | "deleted" | string;
  amount: number; // cents
  paid_amount: number; // cents
  due_at: string;
  email: string;
  mobile: string | null;
  name: string;
  url: string;
  paid_at: string | null;
  reference_1_label?: string;
  reference_1?: string;
  redirect_url?: string;
  callback_url?: string;
  description?: string;
};

export type CreateBillInput = {
  orderRef: string;
  amount: number; // MYR, 2dp
  name: string;
  email: string;
  phone: string;
  description: string; // max 200 chars
  redirectUrl: string;
  callbackUrl: string;
};

export async function createBill(input: CreateBillInput): Promise<Bill> {
  const body = new URLSearchParams({
    collection_id: env("BILLPLZ_COLLECTION_ID"),
    email: input.email,
    mobile: input.phone,
    name: input.name,
    amount: String(Math.round(input.amount * 100)),
    callback_url: input.callbackUrl,
    redirect_url: input.redirectUrl,
    description: input.description.slice(0, 200),
    deliver: "false", // we send our own confirmation; Billplz does not email or SMS the bill
    reference_1_label: "Order",
    reference_1: input.orderRef,
  });
  const res = await fetch(`${BASE}/bills`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as Partial<Bill> & { error?: unknown };
  if (!res.ok || !json.id || !json.url) throw new Error(`Billplz create bill failed: ${res.status} ${JSON.stringify(json)}`);
  return json as Bill;
}

/** Authoritative bill state, straight from Billplz. Use this to settle an order, never the redirect query alone. */
export async function getBill(id: string): Promise<Bill> {
  const res = await fetch(`${BASE}/bills/${encodeURIComponent(id)}`, { headers: { Authorization: auth(), Accept: "application/json" }, cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as Partial<Bill>;
  if (!res.ok || !json.id) throw new Error(`Billplz get bill failed: ${res.status} ${JSON.stringify(json)}`);
  return json as Bill;
}

/**
 * X Signature check. Billplz signs with HMAC-SHA256 over every field except
 * x_signature, sorted by key, each rendered as `key{value}` and joined by `|`.
 * The redirect uses the same recipe with the keys prefixed `billplz`
 * (billplzid, billplzpaid, billplzpaid_at).
 */
export function verifySignature(fields: Record<string, string>, prefix = ""): boolean {
  const key = process.env.BILLPLZ_X_SIGNATURE_KEY;
  if (!key) { console.error("BILLPLZ_X_SIGNATURE_KEY is not set; rejecting callback"); return false; }
  const given = fields.x_signature;
  if (typeof given !== "string" || !given) return false;
  const source = Object.keys(fields)
    .filter((k) => k !== "x_signature")
    .sort()
    .map((k) => `${prefix}${k}{${fields[k]}}`)
    .join("|");
  const expected = createHmac("sha256", key).update(source).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(given.toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Pull the `billplz[...]` fields out of the redirect query, if Billplz sent any. */
export function redirectFields(q: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(q)) {
    const m = /^billplz\[(\w+)\]$/.exec(k);
    if (m && typeof v === "string") out[m[1]] = v;
  }
  return out;
}
