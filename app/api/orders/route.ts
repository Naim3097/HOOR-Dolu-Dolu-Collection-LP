import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createBill } from "@/lib/billplz";
import { orderInput, priceOrderSen, orderRef } from "@/lib/orders";
import { applyDiscount, recordRedemption } from "@/lib/discounts";
import { CONFIG, sku } from "@/lib/products";

export async function POST(req: Request) {
  const parsed = orderInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const ref = orderRef();
  const db = supabaseAdmin();

  // Prices and names come from the catalogue as it is right now; the order keeps a copy.
  const [{ data: prods }, { data: cws }, { data: settings }] = await Promise.all([
    db.from("products").select("id,name,price_sen,published").in("id", input.items.map((i) => i.productId)),
    db.from("colourways").select("product_id,id,name"),
    db.from("store_settings").select("free_shipping_threshold_sen,west_rate_sen,east_rate_sen").eq("id", 1).single(),
  ]);
  const prod = (pid: string) => prods?.find((p) => p.id === pid && p.published);
  if (input.items.some((i) => !prod(i.productId))) return NextResponse.json({ error: "One of those pieces is no longer available." }, { status: 409 });
  const base = priceOrderSen(input.items, input.delivery.state, (i) => prod(i.productId)!.price_sen, settings ?? { free_shipping_threshold_sen: CONFIG.freeShippingOver == null ? null : CONFIG.freeShippingOver * 100, west_rate_sen: CONFIG.shipping.west.rate * 100, east_rate_sen: CONFIG.shipping.east.rate * 100 });
  const disc = await applyDiscount(input.discountCode, base.subtotal, base.shipping);
  if (!disc.ok) return NextResponse.json({ error: disc.error }, { status: 422 });
  const discountSen = disc.applied?.discount_sen ?? 0;
  const pricing = { ...base, shipping: disc.applied?.free_shipping ? 0 : base.shipping, total: base.subtotal - (disc.applied?.free_shipping ? 0 : discountSen) + (disc.applied?.free_shipping ? 0 : base.shipping) };

  // Reserve stock atomically (RPC defined in supabase/migrations). Fails if any line is short.
  const { error: reserveErr } = await db.rpc("reserve_stock", {
    p_items: input.items.map((i) => ({ sku: sku(i.productId, i.colourwayId, i.size), qty: i.qty })),
    p_order_ref: ref,
  });
  if (reserveErr) return NextResponse.json({ error: "Some items are no longer in stock." }, { status: 409 });

  const { error: insErr } = await db.from("orders").insert({
    ref,
    status: "pending",
    customer: input.customer,
    delivery: { ...input.delivery, region: pricing.region, notes: input.notes },
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
      redirectUrl: `${site}/checkout/return?ref=${ref}`,
      callbackUrl: `${site}/api/webhooks/billplz`,
    });
    await db.from("orders").update({ payment_ref: bill.id }).eq("ref", ref);
    await db.from("payments").insert({ order_ref: ref, provider: "billplz", provider_ref: bill.id, status: "pending", amount_sen: bill.amount, raw: bill });
    if (disc.applied) await recordRedemption(disc.applied.code, ref, disc.applied.free_shipping ? base.shipping : discountSen);
    return NextResponse.json({ orderRef: ref, redirectUrl: bill.url });
  } catch (e) {
    await db.rpc("release_stock", { p_order_ref: ref, p_type: "release", p_actor: "system" });
    await db.from("orders").update({ status: "failed" }).eq("ref", ref);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
