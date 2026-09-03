import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

export type Applied = { code: string; kind: "percent" | "fixed" | "free_shipping"; discount_sen: number; free_shipping: boolean };

/**
 * Check a code against a subtotal and return what it takes off. Used by the
 * checkout preview and again, authoritatively, when the order is created.
 */
export async function applyDiscount(codeRaw: string | undefined, subtotalSen: number, shippingSen: number): Promise<{ ok: true; applied: Applied | null } | { ok: false; error: string }> {
  const code = (codeRaw ?? "").trim().toUpperCase();
  if (!code) return { ok: true, applied: null };
  const { data: d } = await supabaseAdmin().from("discount_codes").select("*").eq("code", code).maybeSingle();
  if (!d || !d.active) return { ok: false, error: "That code is not valid." };
  const now = Date.now();
  if (d.starts_at && new Date(d.starts_at).getTime() > now) return { ok: false, error: "That code is not active yet." };
  if (d.ends_at && new Date(d.ends_at).getTime() < now) return { ok: false, error: "That code has expired." };
  if (d.max_redemptions != null && d.redeemed_count >= d.max_redemptions) return { ok: false, error: "That code has been fully redeemed." };
  if (subtotalSen < d.min_spend_sen) return { ok: false, error: `That code needs a minimum of RM${(d.min_spend_sen / 100).toFixed(0)}.` };
  const discount_sen = d.kind === "percent" ? Math.round((subtotalSen * d.amount) / 100) : d.kind === "fixed" ? Math.min(d.amount, subtotalSen) : shippingSen;
  return { ok: true, applied: { code, kind: d.kind, discount_sen, free_shipping: d.kind === "free_shipping" } };
}

export async function recordRedemption(code: string, orderRef: string, amountSen: number) {
  const db = supabaseAdmin();
  await db.from("discount_redemptions").insert({ code, order_ref: orderRef, amount_sen: amountSen });
  await db.rpc("bump_redemption", { p_code: code });
}
