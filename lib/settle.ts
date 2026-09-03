import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  await db.from("orders").update({ status: "paid", paid_at: when, payment_ref: billId }).eq("ref", order.ref).in("status", ["pending", "failed", "cancelled"]);
  const { data: existing } = await db.from("payments").select("id").eq("provider", "billplz").eq("provider_ref", billId).maybeSingle();
  const row = { status: "paid", paid_at: when, ...(raw ? { raw } : {}) };
  if (existing) await db.from("payments").update(row).eq("id", existing.id);
  else { const { data: o } = await db.from("orders").select("total_sen").eq("ref", order.ref).single(); await db.from("payments").insert({ order_ref: order.ref, provider: "billplz", provider_ref: billId, amount_sen: o?.total_sen ?? 0, ...row }); }
  await db.from("audit_log").insert({ actor: "webhook", action: "order.paid", target: order.ref, detail: { bill: billId } });
}

/** The customer came back without paying: free the stock and let them try again. */
export async function abandonOrder(db: SupabaseClient, order: OrderRow) {
  if (order.status !== "pending") return;
  await db.rpc("release_stock", { p_order_ref: order.ref, p_type: "release", p_actor: "system" });
  await db.from("orders").update({ status: "failed" }).eq("ref", order.ref).eq("status", "pending");
  await db.from("audit_log").insert({ actor: "system", action: "order.abandoned", target: order.ref });
}
