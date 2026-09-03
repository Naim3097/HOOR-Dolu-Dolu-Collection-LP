import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * EasyParcel status pushes. No HMAC scheme is published, so a shared secret
 * header is required and the route fails closed without one. Always answers
 * 200 once authorised so EasyParcel stops retrying; failures go to the logs.
 */
export const dynamic = "force-dynamic";
const SECRET = process.env.EASYPARCEL_WEBHOOK_SECRET ?? "";
const STATUS: Record<string, string> = { pending: "pending", booked: "booked", processing: "booked", "to be collected": "booked", "schedule in arrangement": "booked", collected: "shipped", "drop off": "shipped", in_transit: "shipped", "in transit": "shipped", "delivery in transit": "shipped", out_for_delivery: "shipped", delivered: "delivered", completed: "delivered", cancelled: "cancelled", canceled: "cancelled", cancel: "cancelled" };
const CODE: Record<number, string> = { 0: "cancelled", 2: "booked", 3: "shipped", 4: "shipped", 5: "delivered", 7: "booked", 11: "shipped" };

export async function POST(req: Request) {
  if (!SECRET) return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  const given = req.headers.get("x-webhook-secret") ?? "";
  const a = Buffer.from(given), b = Buffer.from(SECRET);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const shipmentNo = String(body.shipment_number ?? body.shipment_id ?? "");
  const code = Number(body.shipment_status_code);
  const word = String(body.shipment_status ?? body.status ?? "").toLowerCase();
  const next = (Number.isFinite(code) && CODE[code]) || STATUS[word];
  const db = supabaseAdmin();
  if (shipmentNo) {
    const { data: s } = await db.from("shipments").select("id,order_ref,status").eq("provider", "easyparcel").eq("provider_ref", shipmentNo).maybeSingle();
    if (s) {
      const patch: Record<string, unknown> = {};
      if (typeof body.awb_number === "string" && body.awb_number) patch.tracking_no = body.awb_number;
      if (typeof body.tracking_url === "string" && body.tracking_url) patch.tracking_url = body.tracking_url;
      if (typeof body.awb_url === "string" && body.awb_url) patch.label_url = body.awb_url;
      if (next && next !== s.status) { patch.status = next; if (next === "delivered") patch.delivered_at = new Date().toISOString(); if (next === "shipped" && !("shipped_at" in patch)) patch.shipped_at = new Date().toISOString(); }
      if (Object.keys(patch).length) await db.from("shipments").update(patch).eq("id", s.id);
      if (next === "delivered") await db.from("orders").update({ status: "completed", completed_at: new Date().toISOString() }).eq("ref", s.order_ref).eq("status", "fulfilled");
      await db.from("audit_log").insert({ actor: "easyparcel", action: "shipment.webhook", target: s.order_ref, detail: { shipment: shipmentNo, status: word || code, applied: patch } });
    }
  }
  return NextResponse.json({ ok: true });
}
