import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { productNames } from "@/lib/catalog";

export type OrderStatus = "pending" | "paid" | "fulfilled" | "completed" | "cancelled" | "refunded" | "failed";
export const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "fulfilled", "completed", "cancelled", "refunded", "failed"];

/** Where an order can go from each state, by hand in the back office. */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["fulfilled", "cancelled"],
  fulfilled: ["completed", "refunded"],
  completed: ["refunded"],
  cancelled: [],
  refunded: [],
  failed: [],
};

export type OrderRow = {
  ref: string; status: OrderStatus; customer: { name: string; email: string; phone: string };
  delivery: { line1: string; line2?: string; city: string; postcode: string; state: string; region: "west" | "east"; notes?: string };
  attribution: Record<string, string>; subtotal_sen: number; discount_sen: number; shipping_sen: number; total_sen: number; refund_sen: number;
  discount_code: string | null; currency: string; payment_ref: string | null; payment_method: string | null; admin_notes: string | null;
  paid_at: string | null; fulfilled_at: string | null; completed_at: string | null; cancelled_at: string | null; refunded_at: string | null;
  created_at: string; updated_at: string;
};
export type OrderItemRow = { id: number; order_ref: string; sku: string; product_id: string; colourway_id: string; size: string; qty: number; unit_price_sen: number; product_name: string; colour_name: string };
export type PaymentRow = { id: number; provider: string; provider_ref: string | null; status: string; amount_sen: number; paid_at: string | null; created_at: string };
export type ShipmentRow = { id: number; provider: string; provider_ref: string | null; courier: string | null; tracking_no: string | null; tracking_url: string | null; label_url: string | null; status: string; weight_grams: number; cost_sen: number; notes: string | null; shipped_at: string | null; delivered_at: string | null; created_at: string };
export type AuditRow = { id: number; actor: string; action: string; target: string | null; detail: Record<string, unknown> | null; created_at: string };

export async function listOrders(opts: { status?: string; q?: string; limit?: number } = {}) {
  const db = supabaseAdmin();
  let query = db.from("orders").select("ref,status,customer,total_sen,created_at,paid_at").order("created_at", { ascending: false }).limit(opts.limit ?? 200);
  if (opts.status && ORDER_STATUSES.includes(opts.status as OrderStatus)) query = query.eq("status", opts.status);
  if (opts.q) {
    const q = opts.q.trim();
    query = query.or(`ref.ilike.%${q}%,customer->>email.ilike.%${q}%,customer->>name.ilike.%${q}%,customer->>phone.ilike.%${q}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  const refs = (data ?? []).map((o) => o.ref);
  const counts: Record<string, number> = {};
  if (refs.length) {
    const { data: items } = await db.from("order_items").select("order_ref,qty").in("order_ref", refs);
    for (const it of items ?? []) counts[it.order_ref] = (counts[it.order_ref] ?? 0) + it.qty;
  }
  return (data ?? []).map((o) => ({ ...o, items: counts[o.ref] ?? 0 })) as (Pick<OrderRow, "ref" | "status" | "customer" | "total_sen" | "created_at" | "paid_at"> & { items: number })[];
}

export async function getOrder(ref: string) {
  const db = supabaseAdmin();
  const [{ data: order }, { data: items }, { data: payments }, { data: shipments }, { data: audit }] = await Promise.all([
    db.from("orders").select("*").eq("ref", ref).maybeSingle(),
    db.from("order_items").select("*").eq("order_ref", ref).order("id"),
    db.from("payments").select("*").eq("order_ref", ref).order("created_at", { ascending: false }),
    db.from("shipments").select("*").eq("order_ref", ref).order("created_at", { ascending: false }),
    db.from("audit_log").select("*").eq("target", ref).order("created_at", { ascending: false }).limit(50),
  ]);
  if (!order) return null;
  const names = await productNames();
  const lines = (items ?? []).map((it) => { const n = names(it.product_id, it.colourway_id); return { ...it, product_name: it.product_name ?? n.product, colour_name: it.colour_name ?? n.colour }; });
  return { order: order as OrderRow, items: lines as OrderItemRow[], payments: (payments ?? []) as PaymentRow[], shipments: (shipments ?? []) as ShipmentRow[], audit: (audit ?? []) as AuditRow[] };
}

export async function dashboardStats() {
  const db = supabaseAdmin();
  const now = new Date();
  const kl = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));
  const startOfDay = new Date(kl); startOfDay.setHours(0, 0, 0, 0);
  const dayStartIso = new Date(startOfDay.getTime() - (kl.getTime() - now.getTime())).toISOString();
  const since14 = new Date(now.getTime() - 14 * 86400000).toISOString();
  const since30 = new Date(now.getTime() - 30 * 86400000).toISOString();
  const SOLD = ["paid", "fulfilled", "completed"];
  const [{ data: today }, { data: last14 }, { count: pending }, { data: last30 }] = await Promise.all([
    db.from("orders").select("total_sen").in("status", SOLD).gte("paid_at", dayStartIso),
    db.from("orders").select("total_sen,paid_at").in("status", SOLD).gte("paid_at", since14),
    db.from("orders").select("ref", { count: "exact", head: true }).in("status", ["paid"]),
    db.from("orders").select("ref,total_sen").in("status", SOLD).gte("paid_at", since30),
  ]);
  const sum = (rows: { total_sen: number }[] | null) => (rows ?? []).reduce((s, r) => s + r.total_sen, 0);
  const days: { day: string; sen: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
    days.push({ day: key, sen: 0 });
  }
  for (const r of last14 ?? []) {
    const key = new Date(r.paid_at!).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
    const d = days.find((x) => x.day === key); if (d) d.sen += r.total_sen;
  }
  let top: { name: string; units: number; sen: number }[] = [];
  if (last30?.length) {
    const { data: items } = await db.from("order_items").select("product_id,colourway_id,qty,unit_price_sen").in("order_ref", last30.map((o) => o.ref));
    const agg: Record<string, { units: number; sen: number }> = {};
    for (const it of items ?? []) { const k = `${it.product_id} · ${it.colourway_id}`; agg[k] ??= { units: 0, sen: 0 }; agg[k].units += it.qty; agg[k].sen += it.qty * it.unit_price_sen; }
    top = Object.entries(agg).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.units - a.units).slice(0, 5);
  }
  const n30 = last30?.length ?? 0;
  return { salesTodaySen: sum(today), ordersToday: today?.length ?? 0, avgOrderSen: n30 ? Math.round(sum(last30) / n30) : 0, pending: pending ?? 0, days, top };
}
