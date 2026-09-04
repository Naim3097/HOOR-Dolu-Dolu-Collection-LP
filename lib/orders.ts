import { z } from "zod";
import { CONFIG, SIZES } from "@/lib/products";
import { isKnownCountry } from "@/lib/shipping/countries";

export const EAST = ["Sabah", "Sarawak", "Labuan"] as const;
export const STATES = [
  "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka", "Negeri Sembilan", "Pahang",
  "Perak", "Perlis", "Pulau Pinang", "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu",
] as const;

export const orderInput = z.object({
  items: z.array(z.object({
    productId: z.string(),
    colourwayId: z.string(),
    size: z.enum(SIZES),
    qty: z.number().int().min(1).max(10),
  })).min(1),
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6).max(24),
  }),
  delivery: z.object({
    country: z.string().length(2).transform((s) => s.toUpperCase()).default("MY"),
    line1: z.string().min(3),
    line2: z.string().optional().default(""),
    city: z.string().min(2),
    postcode: z.string().min(2).max(12),
    state: z.string().max(60).optional().default(""),
  }).superRefine((d, ctx) => {
    if (!isKnownCountry(d.country)) ctx.addIssue({ code: "custom", path: ["country"], message: "We do not deliver to that country yet." });
    if (d.country === "MY") {
      if (!/^\d{5}$/.test(d.postcode.trim())) ctx.addIssue({ code: "custom", path: ["postcode"], message: "Malaysian postcodes are 5 digits." });
      if (!(STATES as readonly string[]).includes(d.state)) ctx.addIssue({ code: "custom", path: ["state"], message: "Choose a Malaysian state." });
    } else if (d.postcode.trim().length < 3) {
      ctx.addIssue({ code: "custom", path: ["postcode"], message: "Enter the delivery postcode." });
    }
  }),
  /** The frozen courier quote the customer picked; required when courier-priced. */
  shipping: z.object({ quoteId: z.string().uuid(), serviceId: z.string().min(1).max(64) }).optional(),
  notes: z.string().max(500).optional().default(""),
  discountCode: z.string().max(32).optional().default(""),
  attribution: z.record(z.string(), z.string()).default({}),
});
export type OrderInput = z.infer<typeof orderInput>;

export function regionFor(state: string): "west" | "east" | "overseas" {
  return (EAST as readonly string[]).includes(state) ? "east" : "west";
}

export type Rates = { freeShippingOver: number | null; west: number; east: number };
/** Client-side preview in ringgit; the server prices the real order from the catalogue. */
export function priceOrder(items: OrderInput["items"], state: string, unit: (i: OrderInput["items"][number]) => number = () => CONFIG.basePrice, rates: Rates = { freeShippingOver: CONFIG.freeShippingOver, west: CONFIG.shipping.west.rate, east: CONFIG.shipping.east.rate }) {
  const subtotal = items.reduce((s, i) => s + i.qty * unit(i), 0);
  const region = regionFor(state);
  const free = rates.freeShippingOver != null && subtotal >= rates.freeShippingOver;
  const shipping = free ? 0 : region === "east" ? rates.east : rates.west;
  return { subtotal, shipping, total: subtotal + shipping, region };
}

/** Server-side pricing in sen from the live catalogue and store settings. */
export function priceOrderSen(items: OrderInput["items"], state: string, unitSen: (i: OrderInput["items"][number]) => number, s: { free_shipping_threshold_sen: number | null; west_rate_sen: number; east_rate_sen: number }) {
  const subtotal = items.reduce((sum, i) => sum + i.qty * unitSen(i), 0);
  const region = regionFor(state);
  const free = s.free_shipping_threshold_sen != null && subtotal >= s.free_shipping_threshold_sen;
  const shipping = free ? 0 : region === "east" ? s.east_rate_sen : s.west_rate_sen;
  return { subtotal, shipping, total: subtotal + shipping, region };
}

export function orderRef() {
  const d = new Date();
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HR${ymd}-${rand}`;
}
