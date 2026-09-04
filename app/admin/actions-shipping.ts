"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { easyparcelClient, getShippingConfig, senderParty, disconnect } from "@/lib/shipping/config";
import { ratesForOrder, type StaffRate } from "@/lib/shipping/rates";
import { stateToIso } from "@/lib/shipping/states";
import { PIECE_GRAMS, parcelSizeFor } from "@/lib/shipping/countries";
import { sendTrackingEmailOnce } from "@/lib/notify";
import type { ActionResult } from "@/app/admin/actions";

async function audit(actor: string, action: string, target: string | null, detail?: Record<string, unknown>) { await supabaseAdmin().from("audit_log").insert({ actor, action, target, detail: detail ?? null }); }

export type CourierRate = StaffRate;

async function orderForShipping(ref: string) {
  const db = supabaseAdmin();
  const [{ data: o }, { data: items }] = await Promise.all([db.from("orders").select("*").eq("ref", ref).maybeSingle(), db.from("order_items").select("*").eq("order_ref", ref)]);
  if (!o) return null;
  const pieces = (items ?? []).reduce((s, i) => s + i.qty, 0);
  const weightGrams = Math.max(PIECE_GRAMS, pieces * PIECE_GRAMS);
  return { o, items: items ?? [], pieces, weightGrams };
}

/** Live courier rates for one order — same pickup/allowlist filters as checkout. Staff only. */
export async function fetchCourierRates(ref: string): Promise<{ rates: CourierRate[]; weightGrams: number; preferredServiceId: string | null } | { error: string }> {
  await requireStaff();
  const found = await orderForShipping(ref); if (!found) return { error: "Order not found." };
  const r = await ratesForOrder(found.o, found.pieces);
  if ("error" in r) return r;
  return { ...r, preferredServiceId: found.o.shipping_service_id ?? null };
}

/**
 * Books the parcel with EasyParcel and debits the wallet. A shipment row is
 * claimed pending → booked before the API call so a double click cannot book
 * twice; the claim is released if the booking fails.
 */
export async function bookWithEasyparcel(ref: string, serviceId: string): Promise<ActionResult & { trackingNo?: string }> {
  const staff = await requireStaff();
  const db = supabaseAdmin();
  const found = await orderForShipping(ref); if (!found) return { ok: false, error: "Order not found." };
  const conn = await getShippingConfig(); if (!conn.connected) return { ok: false, error: "EasyParcel is not connected." };
  const country = (found.o.delivery.country ?? "MY").toUpperCase();
  const recvState = country === "MY" ? stateToIso(found.o.delivery.state) : found.o.delivery.state;
  if (country === "MY" && !recvState) return { ok: false, error: "Could not map the state to an EasyParcel code." };

  let client; let chosen;
  try {
    client = await easyparcelClient();
    const quoted = await ratesForOrder(found.o, found.pieces);
    if ("error" in quoted) return { ok: false, error: quoted.error };
    chosen = quoted.rates.find((x) => x.serviceId === serviceId);
    if (!chosen) return { ok: false, error: "That courier option is no longer available. Refresh the rates." };
    try { const bal = await client.getWalletBalanceSen(); if (bal < chosen.amountSen) return { ok: false, error: `EasyParcel wallet is short: balance RM${(bal / 100).toFixed(2)}, this booking costs RM${(chosen.amountSen / 100).toFixed(2)}. Top up and try again.` }; } catch { /* a wallet read failure must not block a booking */ }
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Could not reach EasyParcel." }; }

  const { data: row, error: insErr } = await db.from("shipments").insert({ order_ref: ref, provider: "easyparcel", status: "booked", weight_grams: found.weightGrams, cost_sen: chosen.amountSen, courier: chosen.courierName }).select("id").single();
  if (insErr) return { ok: false, error: insErr.message };
  const release = async (msg: string): Promise<ActionResult> => { await db.from("shipments").delete().eq("id", row.id); return { ok: false, error: msg }; };

  try {
    const c = found.o.customer, d = found.o.delivery;
    const result = await client.submitOrder({
      reference: ref, serviceId, sender: senderParty(conn.sender), totalWeightKg: Math.max(found.weightGrams / 1000, 0.5), dimensions: parcelSizeFor(found.weightGrams), parcelValue: found.o.total_sen / 100,
      // The receiver's country travels: omitting it once booked an overseas parcel as domestic (Kalima's incident).
      receiver: { name: c.name, phone: c.phone, email: c.email, line1: d.line1, line2: d.line2 || undefined, city: d.city, postcode: d.postcode, state: recvState ?? "", country },
      content: found.items.map((i) => `${i.product_name ?? i.product_id} x${i.qty}`).join(", ").slice(0, 200),
    });
    let trackingNo = result.trackingNo, trackingUrl = result.trackingUrl, labelUrl = result.labelUrl;
    for (let n = 0; n < 3 && !(trackingNo && labelUrl); n++) {
      await new Promise((r) => setTimeout(r, 4000));
      try { const det = await client.getShipmentDetails(result.shipmentId); trackingNo = det.awbNumber ?? trackingNo; trackingUrl = det.trackingUrl ?? trackingUrl; labelUrl = det.labelUrl ?? labelUrl; } catch { /* keep what we have */ }
    }
    await db.from("shipments").update({ provider_ref: result.shipmentId, courier: result.courierName ?? chosen.courierName, tracking_no: trackingNo, tracking_url: trackingUrl, label_url: labelUrl, cost_sen: result.priceSen || chosen.amountSen, status: "shipped", shipped_at: new Date().toISOString() }).eq("id", row.id);
    if (found.o.status === "paid") await db.from("orders").update({ status: "fulfilled", fulfilled_at: new Date().toISOString() }).eq("ref", ref).eq("status", "paid");
    // Tracking email fires when the AWB is in hand; otherwise Fetch AWB or the webhook sends it later.
    const sent = trackingNo ? await sendTrackingEmailOnce(db, ref, row.id) : false;
    await audit(staff.email, "shipment.booked", ref, { shipment: result.shipmentId, service: serviceId, cost_sen: result.priceSen || chosen.amountSen, awb: trackingNo, email: sent });
    revalidatePath(`/admin/orders/${ref}`); revalidatePath("/admin/orders");
    return { ok: true, trackingNo: trackingNo ?? undefined };
  } catch (e) { return release(e instanceof Error ? e.message : "EasyParcel booking failed. The parcel was not booked."); }
}

/** Ask EasyParcel for the AWB and label once the courier has issued them. Free and repeatable. */
export async function refreshAwb(ref: string, shipmentId: number): Promise<ActionResult> {
  const staff = await requireStaff();
  const db = supabaseAdmin();
  const { data: s } = await db.from("shipments").select("provider,provider_ref").eq("id", shipmentId).maybeSingle();
  if (!s || s.provider !== "easyparcel" || !s.provider_ref) return { ok: false, error: "This parcel was not booked through EasyParcel." };
  try {
    const det = await (await easyparcelClient()).getShipmentDetails(s.provider_ref);
    if (!det.awbNumber && !det.labelUrl) return { ok: false, error: "EasyParcel has not issued the AWB yet. Try again in a minute." };
    const patch: Record<string, unknown> = {}; if (det.awbNumber) patch.tracking_no = det.awbNumber; if (det.labelUrl) patch.label_url = det.labelUrl; if (det.trackingUrl) patch.tracking_url = det.trackingUrl;
    await db.from("shipments").update(patch).eq("id", shipmentId);
    if (det.awbNumber) await sendTrackingEmailOnce(db, ref, shipmentId);
    await audit(staff.email, "shipment.awb_fetched", ref, { awb: det.awbNumber });
    revalidatePath(`/admin/orders/${ref}`);
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Could not reach EasyParcel." }; }
}

/** Cancel before collection; EasyParcel credits the wallet. The row stays, marked cancelled. */
export async function cancelEasyparcel(ref: string, shipmentId: number): Promise<ActionResult> {
  const staff = await requireStaff();
  const db = supabaseAdmin();
  const { data: s } = await db.from("shipments").select("provider,provider_ref,status").eq("id", shipmentId).maybeSingle();
  if (!s || s.provider !== "easyparcel" || !s.provider_ref) return { ok: false, error: "This parcel was not booked through EasyParcel." };
  if (!["booked", "shipped"].includes(s.status)) return { ok: false, error: `A ${s.status} parcel cannot be cancelled.` };
  try { await (await easyparcelClient()).cancelOrder(s.provider_ref); } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "EasyParcel refused the cancellation." }; }
  await db.from("shipments").update({ status: "cancelled", shipped_at: null }).eq("id", shipmentId);
  const { data: live } = await db.from("shipments").select("id").eq("order_ref", ref).in("status", ["booked", "shipped", "delivered"]).limit(1);
  if (!live?.length) await db.from("orders").update({ status: "paid", fulfilled_at: null }).eq("ref", ref).eq("status", "fulfilled");
  await audit(staff.email, "shipment.cancelled", ref, { shipment: s.provider_ref });
  revalidatePath(`/admin/orders/${ref}`); revalidatePath("/admin/orders");
  return { ok: true };
}

export async function saveSender(input: { name: string; phone: string; line1: string; line2: string; city: string; postcode: string; state: string }): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!stateToIso(input.state)) return { ok: false, error: "Use a Malaysian state name, e.g. Kuala Lumpur." };
  const { error } = await supabaseAdmin().from("store_settings").update({ sender_name: input.name.trim(), sender_phone: input.phone.trim(), sender_line1: input.line1.trim(), sender_line2: input.line2.trim() || null, sender_city: input.city.trim(), sender_postcode: input.postcode.trim(), sender_state: input.state.trim() }).eq("id", 1);
  if (error) return { ok: false, error: error.message };
  await audit(staff.email, "shipping.sender", null);
  revalidatePath("/admin/shipping");
  return { ok: true };
}

export async function disconnectEasyparcel(): Promise<ActionResult> {
  const staff = await requireStaff();
  if (staff.role !== "owner") return { ok: false, error: "Only the owner can disconnect EasyParcel." };
  await disconnect(); await audit(staff.email, "easyparcel.disconnect", null);
  revalidatePath("/admin/shipping");
  return { ok: true };
}

export async function walletBalance(): Promise<{ balanceSen: number } | { error: string }> {
  await requireStaff();
  try { return { balanceSen: await (await easyparcelClient()).getWalletBalanceSen() }; } catch (e) { return { error: e instanceof Error ? e.message : "Could not reach EasyParcel." }; }
}

/** Customer-facing pricing: zone rates or courier-picked at checkout, with courier allowlists. */
export async function savePricingMode(input: { mode: "zone" | "courier"; domestic: string; international: string }): Promise<ActionResult> {
  const staff = await requireStaff();
  const cfg = await getShippingConfig();
  if (input.mode === "courier" && !cfg.connected) return { ok: false, error: "Connect EasyParcel first: courier mode needs live rates, and a checkout that cannot price itself sells nothing." };
  const parse = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 20);
  const row = { domestic_shipping_mode: input.mode, domestic_allowed_couriers: parse(input.domestic), international_allowed_couriers: parse(input.international) };
  const { error } = await supabaseAdmin().from("store_settings").update(row).eq("id", 1);
  if (error) return { ok: false, error: error.message };
  await audit(staff.email, "shipping.pricing_mode", null, row);
  revalidatePath("/"); revalidatePath("/admin/shipping");
  return { ok: true };
}

