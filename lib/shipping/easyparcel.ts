import "server-only";
import { dialCodeFor } from "./countries";

/**
 * EasyParcel Open API client, written against the published spec
 * (https://easyparcel.github.io/OpenAPI/, version pinned in the path).
 * Ported from Kalima's verified client. Money crossing this boundary becomes
 * integer sen immediately. One parcel per call.
 */
const API_BASE = "https://api.easyparcel.com/open_api/2026-06";
export const OAUTH_BASE = "https://api.easyparcel.com/oauth";

export class EasyParcelError extends Error { constructor(message: string, readonly status?: number, readonly payload?: unknown) { super(message); this.name = "EasyParcelError"; } }
export class EasyParcelTokenError extends Error { readonly needsReconnect = true; constructor(message: string) { super(message); this.name = "EasyParcelTokenError"; } }

export type PartyAddress = { name: string; phone: string; email?: string; line1: string; line2?: string; city: string; postcode: string; state: string; country?: string };
export type QuotationOption = { serviceId: string; serviceName: string; courierName: string; amountSen: number; deliveryDuration: string | null; isPickup: boolean; isDropoff: boolean };
export type BookingResult = { shipmentId: string; trackingNo: string | null; labelUrl: string | null; trackingUrl: string | null; courierName: string | null; serviceName: string | null; priceSen: number };
export type ShipmentDetails = { awbNumber: string | null; labelUrl: string | null; trackingUrl: string | null; status: string | null };

const toSen = (v: unknown) => { const n = typeof v === "number" ? v : parseFloat(String(v ?? "")); return Number.isFinite(n) ? Math.round(n * 100) : 0; };
function pick<T = unknown>(o: Record<string, unknown>, ...keys: string[]): T | undefined { for (const k of keys) { const v = o?.[k]; if (v !== undefined && v !== null && v !== "") return v as T; } return undefined; }

/** Transit time in words; the API sends strings, objects, and objects-as-strings. */
function formatDuration(raw: unknown): string | null {
  if (typeof raw === "string") { const t = raw.trim(); if (t.startsWith("{")) { try { return formatDuration(JSON.parse(t)); } catch { return null; } } return t || null; }
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>; const unit = typeof d.type === "string" ? d.type.trim().replace(/s$/, "") : null; if (!unit) return null;
  const num = (v: unknown) => { const n = typeof v === "number" ? v : parseFloat(String(v ?? "")); return Number.isFinite(n) ? n : null; };
  const min = num(d.min ?? d.from), max = num(d.max ?? d.to);
  if (min !== null && max !== null) return min === max ? `${min} ${unit}${min === 1 ? "" : "s"}` : `${min}–${max} ${unit}s`;
  const v = num(d.value); return v === null ? null : `${v} ${unit}${v === 1 ? "" : "s"}`;
}

/**
 * Dialling country and subscriber number in separate fields, no trunk zero and
 * no international prefix. The prefix is stripped only from numbers that
 * announced themselves as international (+ or 00), and the country comes from
 * the ADDRESS: a Singapore landline is eight digits starting 65, and stripping
 * on digits alone would mangle it.
 */
function phoneParts(p: PartyAddress) {
  const code = (p.country ?? "MY").toUpperCase();
  const raw = (p.phone ?? "").trim(); const intl = /^\+|^00/.test(raw);
  let digits = raw.replace(/\D+/g, "");
  if (intl) { if (digits.startsWith("00")) digits = digits.slice(2); const dial = dialCodeFor(code); if (dial && digits.startsWith(dial)) digits = digits.slice(dial.length); }
  if (digits.startsWith("0")) digits = digits.slice(1);
  return { code, number: digits };
}
const todayInMalaysia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export class EasyParcelClient {
  constructor(private readonly accessToken: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try { res = await fetch(`${API_BASE}${path}`, { ...init, headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${this.accessToken}`, ...(init?.headers ?? {}) }, cache: "no-store" }); }
    catch (e) { throw new EasyParcelError(`EasyParcel unreachable: ${e instanceof Error ? e.message : "network error"}`); }
    const text = await res.text(); let json: unknown = null; try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
    if (!res.ok) {
      const msg = (json as Record<string, unknown>)?.message ?? (json as Record<string, unknown>)?.error ?? `HTTP ${res.status}`;
      if (res.status === 401) throw new EasyParcelTokenError(String(msg));
      throw new EasyParcelError(String(msg), res.status, json);
    }
    return json as T;
  }

  /** Live rates. Response is data[] of shipments, each with quotations[]; total_amount is the price actually charged. */
  async getQuotations(i: { senderPostcode: string; senderState: string; receiverPostcode: string; receiverState: string; receiverCountry?: string; totalWeightKg: number; dimensions?: { width: number; height: number; length: number }; parcelValue: number }): Promise<QuotationOption[]> {
    const dims = i.dimensions ?? { width: 30, height: 8, length: 20 };
    const json = await this.request<Record<string, unknown>>("/shipment/quotations", { method: "POST", body: JSON.stringify({ shipment: [{
      sender: { postcode: i.senderPostcode, subdivision_code: i.senderState, country: "MY" },
      receiver: { postcode: i.receiverPostcode, subdivision_code: i.receiverState, country: i.receiverCountry ?? "MY" },
      weight: i.totalWeightKg, width: dims.width, height: dims.height, length: dims.length, parcel_value: i.parcelValue,
    }] }) });
    const shipments = Array.isArray(json?.data) ? (json.data as Record<string, unknown>[]) : [];
    const raw = shipments.flatMap((sh) => (Array.isArray(sh?.quotations) ? (sh.quotations as Record<string, unknown>[]) : []));
    return raw.map((o) => {
      const courier = (o?.courier ?? {}) as Record<string, unknown>, pricing = (o?.pricing ?? {}) as Record<string, unknown>;
      const serviceId = pick<string>(courier, "service_id"); if (!serviceId) return null;
      if (String(pick(pricing, "currency") ?? "MYR").toUpperCase() !== "MYR") return null;
      return { serviceId: String(serviceId), serviceName: String(pick(courier, "service_name") ?? "Delivery"), courierName: String(pick(courier, "courier_name") ?? "Courier"), amountSen: toSen(pick(pricing, "total_amount")), deliveryDuration: formatDuration(courier.delivery_duration), isPickup: Boolean(courier.is_pickup), isDropoff: Boolean(courier.is_dropoff) } satisfies QuotationOption;
    }).filter((o): o is QuotationOption => o !== null && o.amountSen > 0).sort((a, b) => a.amountSen - b.amountSen);
  }

  /** Books one parcel and debits the wallet. A 200 is not a booking: the per-shipment status is. */
  async submitOrder(i: { reference: string; serviceId: string; collectionDate?: string; sender: PartyAddress; receiver: PartyAddress; totalWeightKg: number; dimensions?: { width: number; height: number; length: number }; parcelValue: number; content: string }): Promise<BookingResult> {
    const party = (p: PartyAddress) => { const ph = phoneParts(p); return { name: p.name, phone_number_country_code: ph.code, phone_number: ph.number, ...(p.email ? { email: p.email } : {}), address_1: p.line1, ...(p.line2 ? { address_2: p.line2 } : {}), postcode: p.postcode, city: p.city, subdivision_code: p.state, country_code: p.country ?? "MY" }; };
    const dims = i.dimensions ?? { width: 30, height: 8, length: 20 };
    const json = await this.request<Record<string, unknown>>("/shipment/submit_orders", { method: "POST", body: JSON.stringify({ shipment: [{
      reference: i.reference, service_id: i.serviceId, collection_date: i.collectionDate ?? todayInMalaysia(), weight: i.totalWeightKg, width: dims.width, height: dims.height, length: dims.length,
      item: [{ content: i.content, weight: i.totalWeightKg, width: dims.width, height: dims.height, length: dims.length, currency_code: "MYR", value: i.parcelValue, quantity: 1 }],
      sender: party(i.sender), receiver: party(i.receiver), feature: { email_tracking: Boolean(i.receiver.email) },
    }] }) });
    const orders = Array.isArray(json?.data) ? (json.data as Record<string, unknown>[]) : [];
    const first = orders.flatMap((o) => (Array.isArray(o?.shipments) ? (o.shipments as Record<string, unknown>[]) : []))[0];
    if (!first) throw new EasyParcelError(String(pick(json, "message") ?? "EasyParcel booked no shipment"), undefined, json);
    if (String(first.status ?? "").toLowerCase() !== "success") throw new EasyParcelError(String(pick(first, "message") ?? pick(json, "message") ?? "EasyParcel refused the shipment"), undefined, json);
    const shipmentNumber = pick<string>(first, "shipment_number"); if (!shipmentNumber) throw new EasyParcelError("EasyParcel returned no shipment number", undefined, json);
    const pricing = (first.pricing_breakdown ?? {}) as Record<string, unknown>, labels = (first.awb_urls_by_format ?? {}) as Record<string, unknown>;
    return { shipmentId: String(shipmentNumber), trackingNo: (pick<string>(first, "awb_number") ?? null) as string | null, labelUrl: (pick<string>(first, "awb_url") ?? pick<string>(labels, "A4", "A6", "A5") ?? null) as string | null, trackingUrl: (pick<string>(first, "tracking_url") ?? null) as string | null, courierName: (pick<string>(first, "courier") ?? null) as string | null, serviceName: (pick<string>(first, "courier_service") ?? null) as string | null, priceSen: toSen(pick(pricing, "total_paid_amount")) };
  }

  /** AWB, label and tracking link once the courier has issued them. */
  async getShipmentDetails(shipmentNumber: string): Promise<ShipmentDetails> {
    const json = await this.request<Record<string, unknown>>("/shipment/details", { method: "POST", body: JSON.stringify({ shipment_number: shipmentNumber }) });
    const rows = Array.isArray(json?.data) ? (json.data as Record<string, unknown>[]) : [];
    const d = (rows[0]?.shipment_details ?? {}) as Record<string, unknown>;
    return { awbNumber: (pick<string>(d, "awb_number") ?? null) as string | null, labelUrl: (pick<string>(d, "awb_url") ?? null) as string | null, trackingUrl: (pick<string>(d, "tracking_url") ?? null) as string | null, status: (pick<string>(d, "shipment_status") ?? null) as string | null };
  }

  async cancelOrder(shipmentNumber: string, remark = "Cancelled from the HOOR back office"): Promise<void> {
    const json = await this.request<Record<string, unknown>>("/shipment/cancel", { method: "POST", body: JSON.stringify({ cancel_list: [{ shipment_number: shipmentNumber, remark }] }) });
    const first = (Array.isArray(json?.data) ? (json.data as Record<string, unknown>[]) : [])[0];
    if (first && String(first.status ?? "").toLowerCase() !== "success") throw new EasyParcelError(String(pick(first, "message") ?? "EasyParcel refused the cancellation"), undefined, json);
  }

  /** MYR wallet balance in sen. The free-credit wallet is deliberately not counted. */
  async getWalletBalanceSen(): Promise<number> {
    const json = await this.request<Record<string, unknown>>("/wallet");
    const d = ((json?.data as Record<string, unknown>) ?? {}) as Record<string, unknown>;
    const wallets = Array.isArray(d.wallet) ? (d.wallet as Record<string, unknown>[]) : [];
    return toSen(pick(wallets.find((w) => String(w?.currency ?? "MYR").toUpperCase() === "MYR") ?? {}, "balance"));
  }
}
