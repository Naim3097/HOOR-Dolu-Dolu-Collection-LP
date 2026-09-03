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
export async function settleOrder(db: SupabaseClient, order: OrderRow, billId: string, paidAt?: string | null) {
  if (order.status === "paid") return;
  if (order.status === "failed") {
    const { data: lines } = await db.from("order_items").select("sku,qty").eq("order_ref", order.ref);
    if (lines?.length) await db.rpc("reserve_stock", { p_items: lines.map((l) => ({ sku: l.sku, qty: l.qty })) });
  }
  await db
    .from("orders")
    .update({ status: "paid", paid_at: paidAt || new Date().toISOString(), payment_ref: billId })
    .eq("ref", order.ref)
    .neq("status", "paid");
}

/** The customer came back without paying: free the stock and let them try again. */
export async function abandonOrder(db: SupabaseClient, order: OrderRow) {
  if (order.status !== "pending") return;
  await db.rpc("release_stock", { p_order_ref: order.ref });
  await db.from("orders").update({ status: "failed" }).eq("ref", order.ref).eq("status", "pending");
}
