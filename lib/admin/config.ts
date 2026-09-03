import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

export type Settings = {
  store_name: string; store_email: string; store_phone: string; whatsapp: string; hours: string; instagram: string;
  free_shipping_threshold_sen: number | null; west_rate_sen: number; east_rate_sen: number; return_days: number; updated_at: string;
};
export async function getSettings(): Promise<Settings> {
  const { data } = await supabaseAdmin().from("store_settings").select("*").eq("id", 1).single();
  return data as Settings;
}

export type Discount = { id: number; code: string; kind: "percent" | "fixed" | "free_shipping"; amount: number; min_spend_sen: number; max_redemptions: number | null; redeemed_count: number; starts_at: string | null; ends_at: string | null; active: boolean; created_at: string };
export async function listDiscounts(): Promise<Discount[]> {
  const { data } = await supabaseAdmin().from("discount_codes").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Discount[];
}

export type Customer = { email: string; name: string; phone: string; orders: number; paid_orders: number; spent_sen: number; first_at: string; last_at: string; state: string };
/** Customers are derived from orders: HOOR has no accounts. */
export async function listCustomers(q?: string): Promise<Customer[]> {
  const { data } = await supabaseAdmin().from("orders").select("customer,delivery,status,total_sen,created_at").order("created_at", { ascending: false }).limit(2000);
  const byEmail = new Map<string, Customer>();
  for (const o of data ?? []) {
    const c = o.customer as { name: string; email: string; phone: string };
    const key = c.email.toLowerCase();
    const cur = byEmail.get(key) ?? { email: key, name: c.name, phone: c.phone, orders: 0, paid_orders: 0, spent_sen: 0, first_at: o.created_at, last_at: o.created_at, state: (o.delivery as { state: string }).state };
    cur.orders += 1;
    if (["paid", "fulfilled", "completed"].includes(o.status)) { cur.paid_orders += 1; cur.spent_sen += o.total_sen; }
    if (o.created_at < cur.first_at) cur.first_at = o.created_at;
    byEmail.set(key, cur);
  }
  let list = [...byEmail.values()].sort((a, b) => b.last_at.localeCompare(a.last_at));
  if (q) { const s = q.toLowerCase(); list = list.filter((c) => c.email.includes(s) || c.name.toLowerCase().includes(s) || c.phone.includes(s)); }
  return list;
}

export type StaffRow = { id: string; email: string; full_name: string | null; role: "owner" | "staff"; created_at: string; last_sign_in_at: string | null };
export async function listStaff(): Promise<StaffRow[]> {
  const db = supabaseAdmin();
  const [{ data: profiles }, { data: users }] = await Promise.all([db.from("profiles").select("*").order("created_at"), db.auth.admin.listUsers({ perPage: 200 })]);
  return (profiles ?? []).map((p) => ({ ...p, last_sign_in_at: users?.users.find((u) => u.id === p.id)?.last_sign_in_at ?? null })) as StaffRow[];
}

export async function listAudit(opts: { page?: number; q?: string } = {}) {
  const size = 50, page = Math.max(1, opts.page ?? 1);
  let query = supabaseAdmin().from("audit_log").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * size, page * size - 1);
  if (opts.q) query = query.or(`actor.ilike.%${opts.q}%,action.ilike.%${opts.q}%,target.ilike.%${opts.q}%`);
  const { data, count } = await query;
  return { rows: data ?? [], count: count ?? 0, page, pages: Math.max(1, Math.ceil((count ?? 0) / size)) };
}
