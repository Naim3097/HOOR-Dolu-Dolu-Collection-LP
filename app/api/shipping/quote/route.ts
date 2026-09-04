import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getShippingConfig } from "@/lib/shipping/config";
import { quoteForCart } from "@/lib/shipping/rates";
import { isKnownCountry } from "@/lib/shipping/countries";
import { regionFor } from "@/lib/orders";

/**
 * Live courier options for the checkout. Public, so it is rate-limited (each
 * call spends HOOR's EasyParcel quota) and returns a frozen quote id — never
 * a price the browser could send back changed.
 */
const input = z.object({
  items: z.array(z.object({ productId: z.string().max(64), qty: z.number().int().min(1).max(10) })).min(1).max(20),
  country: z.string().length(2),
  state: z.string().max(60).default(""),
  postcode: z.string().min(2).max(12),
});

// Best-effort per-instance limiter; enough to stop a loop hammering the quota.
const hits = new Map<string, number[]>();
function limited(key: string): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  list.push(now); hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 20;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "?").split(",")[0].trim();
  if (limited(ip)) return NextResponse.json({ error: "Too many attempts. Give it a minute." }, { status: 429 });

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { items, state, postcode } = parsed.data;
  const country = parsed.data.country.toUpperCase();
  if (!isKnownCountry(country)) return NextResponse.json({ error: "We do not deliver to that country yet." }, { status: 422 });

  const cfg = await getShippingConfig();
  // Within Malaysia only Sabah, Sarawak and Labuan are courier-priced; Semenanjung is a flat rate.
  if (country === "MY" && (cfg.mode !== "courier" || regionFor(state) !== "east")) return NextResponse.json({ error: "This address is priced at the flat Semenanjung rate." }, { status: 409 });

  // The declared value is the goods subtotal, priced by the catalogue — not the browser.
  const { data: prods } = await supabaseAdmin().from("products").select("id,price_sen").in("id", items.map((i) => i.productId));
  const subtotalSen = items.reduce((s, i) => s + i.qty * (prods?.find((p) => p.id === i.productId)?.price_sen ?? 0), 0);
  if (!subtotalSen) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const quote = await quoteForCart({ pieces: items.reduce((s, i) => s + i.qty, 0), country, postcode: postcode.trim(), subdivision: state.trim(), parcelValueRm: subtotalSen / 100 });
  if ("unavailable" in quote) return NextResponse.json({ error: quote.unavailable }, { status: 422 });
  return NextResponse.json(quote);
}
