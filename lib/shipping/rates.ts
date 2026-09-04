import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { easyparcelClient, getShippingConfig, senderParty, type ShippingConfig } from "./config";
import { stateToIso } from "./states";
import { parcelSizeFor, PIECE_GRAMS } from "./countries";
import type { QuotationOption } from "./easyparcel";

/**
 * Quoting, in two flavours (ported from Kalima's verified integration):
 * quoteForCart is the checkout half — the quote IS the price, so the options
 * are frozen server-side and the browser carries only a uuid. ratesForOrder
 * is the staff half at booking time — nothing frozen, the numbers are HOOR's
 * own cost from the wallet.
 */

/** Pickup only (parcels leave from The Linc), and no service with a parcel minimum a single order cannot meet. */
const offered = (o: QuotationOption) => o.isPickup && !/\bmin\s*\d+\s*parcel/i.test(o.serviceName);

/** Courier allowlist: domestic list for Malaysia (NinjaVan by default), international list elsewhere. Empty list = everything. */
function allowed(cfg: ShippingConfig, country: string) {
  const list = (country === "MY" ? cfg.domesticAllowedCouriers : cfg.internationalAllowedCouriers).map((w) => w.toLowerCase().trim()).filter(Boolean);
  if (!list.length) return () => true;
  return (o: QuotationOption) => { const hay = `${o.courierName} ${o.serviceName}`.toLowerCase(); return list.some((w) => hay.includes(w)); };
}

export function connectionProblem(cfg: ShippingConfig): string | null {
  if (!cfg.configured) return "EasyParcel credentials are not configured.";
  if (!cfg.connected) return "EasyParcel is not connected. Connect it under Shipping.";
  if (!cfg.sender.postcode || !stateToIso(cfg.sender.state)) return "The pickup address under Shipping is incomplete.";
  return null;
}

const CANNOT_QUOTE = "We can't quote delivery to that address right now. WhatsApp us and we will sort it out.";

/** Failed cart quotes land in the audit log where staff will find them, one row per distinct reason per 15 minutes. Never fails the quote. */
async function recordQuoteFailure(detail: string, context: Record<string, unknown>) {
  try {
    const db = supabaseAdmin();
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recent } = await db.from("audit_log").select("id").eq("action", "shipping.quote_failed").eq("detail->>reason", detail).gte("created_at", since).limit(1);
    if (recent?.length) return;
    await db.from("audit_log").insert({ actor: "system", action: "shipping.quote_failed", target: null, detail: { reason: detail, ...context } });
  } catch { /* bookkeeping about a failure must never become a second failure */ }
}

export type CartQuote = { quoteId: string; weightGrams: number; options: { serviceId: string; label: string; courier: string; amountSen: number; duration: string | null }[] };

export async function quoteForCart(input: { pieces: number; country: string; postcode: string; subdivision: string; parcelValueRm: number }): Promise<CartQuote | { unavailable: string }> {
  const cfg = await getShippingConfig();
  const problem = connectionProblem(cfg);
  if (problem) { await recordQuoteFailure(problem, { country: input.country, postcode: input.postcode }); return { unavailable: CANNOT_QUOTE }; }

  const receiverState = input.country === "MY" ? stateToIso(input.subdivision) : input.subdivision;
  if (input.country === "MY" && !receiverState) return { unavailable: "Choose your state to see delivery options." };

  const weightGrams = Math.max(PIECE_GRAMS, input.pieces * PIECE_GRAMS);
  let options: QuotationOption[];
  try {
    const client = await easyparcelClient();
    options = await client.getQuotations({
      senderPostcode: cfg.sender.postcode, senderState: stateToIso(cfg.sender.state)!,
      receiverPostcode: input.postcode, receiverState: receiverState!, receiverCountry: input.country,
      totalWeightKg: Math.max(weightGrams / 1000, 0.5), dimensions: parcelSizeFor(weightGrams), parcelValue: input.parcelValueRm,
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    await recordQuoteFailure(detail, { country: input.country, postcode: input.postcode, weight_grams: weightGrams });
    return { unavailable: CANNOT_QUOTE };
  }

  options = options.filter(offered).filter(allowed(cfg, input.country));
  if (!options.length) return { unavailable: "No courier we work with delivers to that address." };

  // Frozen before it is shown. If the freeze fails the rates are not returned:
  // an option the server cannot price later is a worse failure than none.
  const db = supabaseAdmin();
  db.from("shipping_quotes").delete().lt("expires_at", new Date(Date.now() - 86400000).toISOString()).then(() => {}); // opportunistic GC
  const { data, error } = await db.from("shipping_quotes").insert({
    options: options.map((o) => ({ service_id: o.serviceId, service_name: o.serviceName, courier: o.courierName, amount_sen: o.amountSen, delivery_duration: o.deliveryDuration })),
    inputs: { country: input.country, postcode: input.postcode, subdivision: input.subdivision, weight_grams: weightGrams, parcel_value_rm: input.parcelValueRm },
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }).select("id").single();
  if (error || !data) { await recordQuoteFailure(`freeze failed: ${error?.message}`, { country: input.country }); return { unavailable: CANNOT_QUOTE }; }

  return {
    quoteId: data.id as string, weightGrams,
    options: options.map((o) => ({ serviceId: o.serviceId, label: o.serviceName.replace(/\s*\(From Door to Door\)\s*/i, "").trim(), courier: o.courierName, amountSen: o.amountSen, duration: o.deliveryDuration })),
  };
}

/** The frozen amount for one picked service, or null if the quote is unknown, expired, or never offered that service. */
export async function frozenQuoteAmount(quoteId: string, serviceId: string): Promise<{ amountSen: number; serviceName: string; courier: string } | null> {
  const { data } = await supabaseAdmin().from("shipping_quotes").select("options,expires_at").eq("id", quoteId).maybeSingle();
  if (!data || new Date(data.expires_at).getTime() < Date.now()) return null;
  const opt = (data.options as { service_id: string; service_name: string; courier: string; amount_sen: number }[]).find((o) => o.service_id === serviceId);
  return opt ? { amountSen: opt.amount_sen, serviceName: opt.service_name, courier: opt.courier } : null;
}

export type StaffRate = { serviceId: string; serviceName: string; courierName: string; amountSen: number; duration: string | null; pickup: boolean };

/** Live rates for staff at booking time, same filters as checkout. */
export async function ratesForOrder(order: { delivery: { country?: string; state: string; postcode: string }; total_sen: number }, pieces: number): Promise<{ rates: StaffRate[]; weightGrams: number } | { error: string }> {
  const cfg = await getShippingConfig();
  const problem = connectionProblem(cfg);
  if (problem) return { error: problem };
  const country = (order.delivery.country ?? "MY").toUpperCase();
  const receiverState = country === "MY" ? stateToIso(order.delivery.state) : order.delivery.state;
  if (!order.delivery.postcode || (country === "MY" && !receiverState)) return { error: "This order has no usable delivery postcode or state." };
  const weightGrams = Math.max(PIECE_GRAMS, pieces * PIECE_GRAMS);
  try {
    const client = await easyparcelClient();
    const options = (await client.getQuotations({
      senderPostcode: cfg.sender.postcode, senderState: stateToIso(cfg.sender.state)!,
      receiverPostcode: order.delivery.postcode, receiverState: receiverState!, receiverCountry: country,
      totalWeightKg: Math.max(weightGrams / 1000, 0.5), dimensions: parcelSizeFor(weightGrams), parcelValue: order.total_sen / 100,
    })).filter(offered).filter(allowed(cfg, country));
    if (!options.length) return { error: "No courier serves this route right now." };
    return { weightGrams, rates: options.map((o) => ({ serviceId: o.serviceId, serviceName: o.serviceName, courierName: o.courierName, amountSen: o.amountSen, duration: o.deliveryDuration, pickup: o.isPickup })) };
  } catch (e) { return { error: e instanceof Error ? e.message : "Could not reach EasyParcel." }; }
}

export { senderParty };
