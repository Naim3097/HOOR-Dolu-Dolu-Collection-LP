"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { TRANSITIONS, type OrderStatus } from "@/lib/admin/orders";
import { orderRefunded } from "@/lib/email";
import { sendTrackingEmailOnce } from "@/lib/notify";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function audit(actor: string, action: string, target: string | null, detail?: Record<string, unknown>) {
  await supabaseAdmin().from("audit_log").insert({ actor, action, target, detail: detail ?? null });
}

const STAMP: Partial<Record<OrderStatus, string>> = { paid: "paid_at", fulfilled: "fulfilled_at", completed: "completed_at", cancelled: "cancelled_at", refunded: "refunded_at" };

/** Move an order along its lifecycle. Cancelling or refunding returns the stock. */
export async function updateOrderStatus(ref: string, next: OrderStatus, note?: string): Promise<ActionResult> {
  const staff = await requireStaff();
  const db = supabaseAdmin();
  const { data: o } = await db.from("orders").select("status").eq("ref", ref).maybeSingle();
  if (!o) return { ok: false, error: "Order not found." };
  const from = o.status as OrderStatus;
  if (!TRANSITIONS[from].includes(next)) return { ok: false, error: `An order that is ${from} cannot become ${next}.` };

  const patch: Record<string, unknown> = { status: next };
  if (STAMP[next]) patch[STAMP[next]!] = new Date().toISOString();
  if (note) patch.admin_notes = note;
  const { error } = await db.from("orders").update(patch).eq("ref", ref).eq("status", from);
  if (error) return { ok: false, error: error.message };

  if (next === "cancelled" || next === "refunded") {
    await db.rpc("release_stock", { p_order_ref: ref, p_type: next === "refunded" ? "return" : "release", p_actor: staff.email });
  }
  await audit(staff.email, "order.status", ref, { from, to: next, note: note ?? null });
  revalidatePath(`/admin/orders/${ref}`); revalidatePath("/admin/orders"); revalidatePath("/admin");
  return { ok: true };
}

/** Record a refund. FPX and card money moves in Billplz's dashboard; this keeps the books and the stock straight. */
export async function recordRefund(ref: string, amountRm: number, reason: string): Promise<ActionResult> {
  const staff = await requireStaff();
  const sen = Math.round(amountRm * 100);
  if (!(sen > 0)) return { ok: false, error: "Enter the amount refunded." };
  const db = supabaseAdmin();
  const { data: o } = await db.from("orders").select("status,total_sen,refund_sen").eq("ref", ref).maybeSingle();
  if (!o) return { ok: false, error: "Order not found." };
  if (!["paid", "fulfilled", "completed"].includes(o.status)) return { ok: false, error: "Only a paid order can be refunded." };
  if (o.refund_sen + sen > o.total_sen) return { ok: false, error: "That is more than the customer paid." };
  const full = o.refund_sen + sen >= o.total_sen;
  const patch: Record<string, unknown> = { refund_sen: o.refund_sen + sen, admin_notes: reason };
  if (full) { patch.status = "refunded"; patch.refunded_at = new Date().toISOString(); }
  const { error } = await db.from("orders").update(patch).eq("ref", ref);
  if (error) return { ok: false, error: error.message };
  if (full) await db.rpc("release_stock", { p_order_ref: ref, p_type: "return", p_actor: staff.email });
  await db.from("payments").insert({ order_ref: ref, provider: "manual", status: "refunded", amount_sen: sen, raw: { reason, by: staff.email } });
  await audit(staff.email, full ? "order.refund.full" : "order.refund.partial", ref, { amount_sen: sen, reason });
  const { data: full_o } = await db.from("orders").select("*").eq("ref", ref).single();
  if (full_o) { const sent = await orderRefunded(full_o, sen); await audit("system", sent ? "email.refunded" : "email.refunded_failed", ref); }
  revalidatePath(`/admin/orders/${ref}`); revalidatePath("/admin/orders");
  return { ok: true };
}

/** Add or update a parcel by hand: courier, tracking number, weight. */
export async function saveShipment(input: { ref: string; id?: number; courier: string; trackingNo: string; trackingUrl?: string; weightGrams?: number; costRm?: number; notes?: string; status: "pending" | "booked" | "shipped" | "delivered" | "cancelled" }): Promise<ActionResult> {
  const staff = await requireStaff();
  const db = supabaseAdmin();
  const row = {
    order_ref: input.ref, provider: "manual", courier: input.courier.trim() || null, tracking_no: input.trackingNo.trim() || null,
    tracking_url: input.trackingUrl?.trim() || null, weight_grams: Math.max(0, Math.round(input.weightGrams ?? 0)), cost_sen: Math.max(0, Math.round((input.costRm ?? 0) * 100)),
    notes: input.notes?.trim() || null, status: input.status,
    shipped_at: input.status === "shipped" || input.status === "delivered" ? new Date().toISOString() : null,
    delivered_at: input.status === "delivered" ? new Date().toISOString() : null,
  };
  const { data: saved, error } = input.id ? await db.from("shipments").update(row).eq("id", input.id).select("id").single() : await db.from("shipments").insert(row).select("id").single();
  if (error) return { ok: false, error: error.message };
  await audit(staff.email, input.id ? "shipment.update" : "shipment.create", input.ref, { courier: row.courier, tracking_no: row.tracking_no, status: row.status });
  // The tracking email fires once, when a shipped parcel has its tracking number.
  if (["booked", "shipped", "delivered"].includes(row.status) && row.tracking_no) await sendTrackingEmailOnce(db, input.ref, saved.id);
  revalidatePath(`/admin/orders/${input.ref}`);
  return { ok: true };
}

export async function saveOrderNotes(ref: string, notes: string): Promise<ActionResult> {
  const staff = await requireStaff();
  const { error } = await supabaseAdmin().from("orders").update({ admin_notes: notes.trim() || null }).eq("ref", ref);
  if (error) return { ok: false, error: error.message };
  await audit(staff.email, "order.notes", ref);
  revalidatePath(`/admin/orders/${ref}`);
  return { ok: true };
}
