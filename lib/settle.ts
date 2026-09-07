import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { orderConfirmation } from "@/lib/email";
import { recordRedemption } from "@/lib/discounts";

type OrderRow = { ref: string; status: string };

/**
 * Mark an order paid. Idempotent: a second callback or a refresh of the return
 * page is a no-op. If the order had already been marked failed (customer came
 * back unpaid, stock released) and Billplz later reports the bill paid, the
 * stock is reserved again on a best-effort basis: the money has been taken,
 * so the order is honoured either way.
 */
export async function settleOrder(db: SupabaseClient, order: OrderRow, billId: string, paidAt?: string | null, raw?: unknown) {
  if (["paid", "fulfilled", "completed", "refunded"].includes(order.status)) return;
  if (order.status === "failed" || order.status === "cancelled") {
    const { data: lines } = await db.from("order_items").select("sku,qty").eq("order_ref", order.ref);
    if (lines?.length) await db.rpc("reserve_stock", { p_items: lines.map((l) => ({ sku: l.sku, qty: l.qty })), p_order_ref: order.ref });
  }
  const when = paidAt || new Date().toISOString();
  // The conditional update is the claim: only the caller whose update matched
  // a row is the first settle, and only that caller emails and records the
  // redemption — a concurrent webhook + return page must not double up.
  const { data: claimed } = await db.from("orders").update({ status: "paid", paid_at: when, payment_ref: billId }).eq("ref", order.ref).in("status", ["pending", "failed", "cancelled"]).select("ref");
  const first = Boolean(claimed?.length);
  const { data: existing } = await db.from("payments").select("id").eq("provider", "billplz").eq("provider_ref", billId).maybeSingle();
  const row = { status: "paid", paid_at: when, ...(raw ? { raw } : {}) };
  if (existing) await db.from("payments").update(row).eq("id", existing.id);
  else { const { data: o } = await db.from("orders").select("total_sen").eq("ref", order.ref).single(); await db.from("payments").insert({ order_ref: order.ref, provider: "billplz", provider_ref: billId, amount_sen: o?.total_sen ?? 0, ...row }); }
  if (!first) return;
  await db.from("audit_log").insert({ actor: "webhook", action: "order.paid", target: order.ref, detail: { bill: billId } });
  const [{ data: full }, { data: items }] = await Promise.all([db.from("orders").select("*").eq("ref", order.ref).single(), db.from("order_items").select("*").eq("order_ref", order.ref).order("id")]);
  // Amounts are correct by construction (the server created the bill), so a
  // mismatch means something is badly wrong — alarm, don't stay quiet.
  const paidSen = (raw as { paid_amount?: number } | undefined)?.paid_amount;
  if (full && typeof paidSen === "number" && paidSen !== full.total_sen)
    await db.from("audit_log").insert({ actor: "system", action: "order.amount_mismatch", target: order.ref, detail: { bill: billId, paid_sen: paidSen, total_sen: full.total_sen } });
  if (full?.discount_code) await recordRedemption(full.discount_code, order.ref, full.discount_sen ?? 0);
  if (full && items) {
    const sent = await orderConfirmation(full, items.map((l) => ({ ...l, product_name: l.product_name ?? l.product_id, colour_name: l.colour_name ?? l.colourway_id })));
    await db.from("audit_log").insert({ actor: "system", action: sent ? "email.confirmation" : "email.confirmation_failed", target: order.ref });
  }
}

/** The customer came back without paying: free the stock and let them try again. */
export async function abandonOrder(db: SupabaseClient, order: OrderRow) {
  if (order.status !== "pending") return;
  await db.rpc("release_stock", { p_order_ref: order.ref, p_type: "release", p_actor: "system" });
  await db.from("orders").update({ status: "failed" }).eq("ref", order.ref).eq("status", "pending");
  await db.from("audit_log").insert({ actor: "system", action: "order.abandoned", target: order.ref });
}
