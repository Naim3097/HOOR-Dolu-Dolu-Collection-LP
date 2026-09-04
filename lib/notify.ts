import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { orderShipped } from "@/lib/email";

/**
 * Send the tracking email for one parcel, once. Fires only when the parcel
 * has a tracking number — "when the tracking number is ready", per the
 * client — and stamps the shipment so booking, AWB fetch, the webhook and
 * manual entry can all call this without double-sending. Never throws.
 */
export async function sendTrackingEmailOnce(db: SupabaseClient, orderRef: string, shipmentId: number): Promise<boolean> {
  try {
    const { data: s } = await db.from("shipments").select("id,courier,tracking_no,tracking_url,status,tracking_email_sent_at").eq("id", shipmentId).maybeSingle();
    if (!s || !s.tracking_no || s.tracking_email_sent_at) return false;
    if (!["booked", "shipped", "delivered"].includes(s.status)) return false;

    // Claim the stamp first so two concurrent paths cannot both send.
    const { data: claimed } = await db.from("shipments").update({ tracking_email_sent_at: new Date().toISOString() }).eq("id", s.id).is("tracking_email_sent_at", null).select("id").maybeSingle();
    if (!claimed) return false;

    const [{ data: order }, { data: items }] = await Promise.all([
      db.from("orders").select("*").eq("ref", orderRef).single(),
      db.from("order_items").select("*").eq("order_ref", orderRef).order("id"),
    ]);
    if (!order || !items) return false;
    const sent = await orderShipped(order, items.map((l) => ({ ...l, product_name: l.product_name ?? l.product_id, colour_name: l.colour_name ?? l.colourway_id })), { courier: s.courier, tracking_no: s.tracking_no, tracking_url: s.tracking_url });
    if (!sent) await db.from("shipments").update({ tracking_email_sent_at: null }).eq("id", s.id); // let a later path retry
    await db.from("audit_log").insert({ actor: "system", action: sent ? "email.tracking" : "email.tracking_failed", target: orderRef, detail: { shipment: s.id, awb: s.tracking_no } });
    return sent;
  } catch (e) { console.error("[email] tracking email failed", e); return false; }
}
