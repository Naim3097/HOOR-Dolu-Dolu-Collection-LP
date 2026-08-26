import { z } from "zod";
import { CONFIG, SIZES } from "@/lib/products";

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
    phone: z.string().min(8),
  }),
  delivery: z.object({
    line1: z.string().min(3),
    line2: z.string().optional().default(""),
    city: z.string().min(2),
    postcode: z.string().regex(/^\d{5}$/),
    state: z.enum(STATES),
  }),
  notes: z.string().max(500).optional().default(""),
  paymentMethod: z.enum(["fpx", "card", "transfer"]).default("fpx"),
  attribution: z.record(z.string(), z.string()).default({}),
});
export type OrderInput = z.infer<typeof orderInput>;

export function regionFor(state: string): "west" | "east" {
  return (EAST as readonly string[]).includes(state) ? "east" : "west";
}

export function priceOrder(items: OrderInput["items"], state: string) {
  const subtotal = items.reduce((s, i) => s + i.qty * CONFIG.basePrice, 0);
  const region = regionFor(state);
  const free = CONFIG.freeShippingOver != null && subtotal >= CONFIG.freeShippingOver;
  const shipping = free ? 0 : CONFIG.shipping[region].rate;
  return { subtotal, shipping, total: subtotal + shipping, region };
}

export function orderRef() {
  const d = new Date();
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HR${ymd}-${rand}`;
}
