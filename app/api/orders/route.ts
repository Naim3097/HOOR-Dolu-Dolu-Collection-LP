import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createBill } from "@/lib/billplz";
import { orderInput, priceOrderSen, regionFor, orderRef } from "@/lib/orders";
import { frozenQuoteAmount } from "@/lib/shipping/rates";
import { PIECE_GRAMS } from "@/lib/shipping/countries";
import { applyDiscount } from "@/lib/discounts";
import { CONFIG, sku } from "@/lib/products";

// Best-effort per-instance limiter: each order reserves real stock and
// creates a live Billplz bill, so a naive loop must not run unchecked.
const hits = new Map<string, number[]>();
function limited(key: string): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  list.push(now); hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 8;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "?").split(",")[0].trim();
  if (limited(ip)) return NextResponse.json({ error: "Too many attempts. Give it a minute." }, { status: 429 });
  const parsed = orderInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const ref = orderRef();
  const db = supabaseAdmin();

  // Prices and names come from the catalogue as it is right now; the order keeps a copy.
  const [{ data: prods }, { data: cws }, { data: settings }] = await Promise.all([
    db.from("products").select("id,name,price_sen,published").in("id", input.items.map((i) => i.productId)),
    db.from("colourways").select("product_id,id,name"),
    db.from("store_settings").select("free_shipping_threshold_sen,west_rate_sen,east_rate_sen,domestic_shipping_mode").eq("id", 1).single(),
  ]);
  const prod = (pid: string) => prods?.find((p) => p.id === pid && p.published);
  if (input.items.some((i) => !prod(i.productId))) return NextResponse.json({ error: "One of those pieces is no longer available." }, { status: 409 });
  const rates = settings ?? { free_shipping_threshold_sen: CONFIG.freeShippingOver == null ? null : CONFIG.freeShippingOver * 100, west_rate_sen: CONFIG.shipping.west.rate * 100, east_rate_sen: CONFIG.shipping.east.rate * 100, domestic_shipping_mode: "zone" };
  const country = input.delivery.country;
  const isMY = country === "MY";
  const courierPriced = !isMY || (rates.domestic_shipping_mode === "courier" && regionFor(input.delivery.state) === "east");

  // Zone pricing for Malaysia in zone mode; otherwise the frozen courier quote is the price.
  let base = priceOrderSen(input.items, isMY ? input.delivery.state : "Selangor", (i) => prod(i.productId)!.price_sen, rates);
  let chosen: { serviceId: string; serviceName: string; courier: string; quoteId: string } | null = null;
  if (courierPriced) {
    if (!input.shipping) return NextResponse.json({ error: "Choose a delivery option before paying." }, { status: 422 });
    const frozen = await frozenQuoteAmount(input.shipping.quoteId, input.shipping.serviceId);
    if (!frozen) return NextResponse.json({ error: "Your delivery quote expired. Pick the delivery option again." }, { status: 422 });
    // The quote must have been priced for THIS address and THIS cart, or a
    // cheap quote for one destination could pay for delivery to another.
    const pieces = input.items.reduce((s, i) => s + i.qty, 0);
    const expectedGrams = Math.max(PIECE_GRAMS, pieces * PIECE_GRAMS);
    const q = frozen.inputs;
    if (q.country !== country || q.postcode !== input.delivery.postcode.trim() || q.subdivision !== input.delivery.state.trim() || q.weight_grams !== expectedGrams)
      return NextResponse.json({ error: "Your delivery quote does not match this address. Pick the delivery option again." }, { status: 422 });
    chosen = { serviceId: input.shipping.serviceId, serviceName: frozen.serviceName, courier: frozen.courier, quoteId: input.shipping.quoteId };
    const free = isMY && rates.free_shipping_threshold_sen != null && base.subtotal >= rates.free_shipping_threshold_sen;
    base = { ...base, shipping: free ? 0 : frozen.amountSen, total: base.subtotal + (free ? 0 : frozen.amountSen), region: isMY ? base.region : ("overseas" as typeof base.region) };
  }
  const disc = await applyDiscount(input.discountCode, base.subtotal, base.shipping);
  if (!disc.ok) return NextResponse.json({ error: disc.error }, { status: 422 });
  const discountSen = disc.applied?.discount_sen ?? 0;
  const pricing = { ...base, shipping: disc.applied?.free_shipping ? 0 : base.shipping, total: base.subtotal - (disc.applied?.free_shipping ? 0 : discountSen) + (disc.applied?.free_shipping ? 0 : base.shipping) };

  // The order row goes in first: the stock ledger references it, so reserving
  // before the insert would trip the foreign key. A failed reservation deletes
  // the row again.
  // Refs are short enough to guess; the token is what gates the return page.
  const accessToken = randomBytes(16).toString("base64url");
  const { error: insErr } = await db.from("orders").insert({
    ref,
    access_token: accessToken,
    status: "pending",
    customer: input.customer,
    delivery: { ...input.delivery, region: pricing.region, notes: input.notes },
    shipping_quote_id: chosen?.quoteId ?? null,
    shipping_service_id: chosen?.serviceId ?? null,
    shipping_service_name: chosen?.serviceName ?? null,
    shipping_courier: chosen?.courier ?? null,
    payment_method: "billplz",
    attribution: input.attribution,
    subtotal_sen: pricing.subtotal,
    discount_sen: disc.applied && !disc.applied.free_shipping ? discountSen : 0,
    discount_code: disc.applied?.code ?? null,
    shipping_sen: pricing.shipping,
    total_sen: pricing.total,
    currency: CONFIG.currency,
  });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // Reserve stock atomically (RPC in supabase/migrations); each line leaves a ledger row against this order.
  const { error: reserveErr } = await db.rpc("reserve_stock", {
    p_items: input.items.map((i) => ({ sku: sku(i.productId, i.colourwayId, i.size), qty: i.qty })),
    p_order_ref: ref,
  });
  if (reserveErr) {
    await db.from("orders").delete().eq("ref", ref);
    const short = /insufficient stock/.test(reserveErr.message);
    if (!short) console.error("reserve_stock failed:", reserveErr);
    return NextResponse.json({ error: short ? "Some items are no longer in stock." : "We could not start the payment. Please try again." }, { status: short ? 409 : 500 });
  }

  await db.from("order_items").insert(
    input.items.map((i) => ({
      order_ref: ref,
      sku: sku(i.productId, i.colourwayId, i.size),
      product_id: i.productId,
      colourway_id: i.colourwayId,
      size: i.size,
      qty: i.qty,
      unit_price_sen: prod(i.productId)!.price_sen,
      product_name: prod(i.productId)!.name,
      colour_name: cws?.find((c) => c.product_id === i.productId && c.id === i.colourwayId)?.name ?? i.colourwayId,
    })),
  );

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  try {
    const bill = await createBill({
      orderRef: ref,
      amount: pricing.total / 100,
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone,
      description: `${CONFIG.brand} ${CONFIG.collection} — ${ref}`,
      redirectUrl: `${site}/checkout/return?ref=${ref}&t=${accessToken}`,
      callbackUrl: `${site}/api/webhooks/billplz`,
    });
    await db.from("orders").update({ payment_ref: bill.id }).eq("ref", ref);
    await db.from("payments").insert({ order_ref: ref, provider: "billplz", provider_ref: bill.id, status: "pending", amount_sen: bill.amount, raw: bill });
    // The discount redemption is recorded in settleOrder, when the money
    // actually arrives — unpaid checkouts must not burn a limited-use code.
    return NextResponse.json({ orderRef: ref, redirectUrl: bill.url });
  } catch (e) {
    await db.rpc("release_stock", { p_order_ref: ref, p_type: "release", p_actor: "system" });
    await db.from("orders").update({ status: "failed" }).eq("ref", ref);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
