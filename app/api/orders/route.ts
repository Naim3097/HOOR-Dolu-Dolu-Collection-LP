import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createBill } from "@/lib/billplz";
import { orderInput, priceOrder, orderRef } from "@/lib/orders";
import { CONFIG, sku } from "@/lib/products";
import { toSen } from "@/lib/money";

export async function POST(req: Request) {
  const parsed = orderInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const pricing = priceOrder(input.items, input.delivery.state);
  const ref = orderRef();
  const db = supabaseAdmin();

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
    subtotal_sen: toSen(pricing.subtotal),
    shipping_sen: toSen(pricing.shipping),
    total_sen: toSen(pricing.total),
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
      unit_price_sen: toSen(CONFIG.basePrice),
    })),
  );

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  try {
    const bill = await createBill({
      orderRef: ref,
      amount: pricing.total,
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone,
      description: `${CONFIG.brand} ${CONFIG.collection} — ${ref}`,
      redirectUrl: `${site}/checkout/return?ref=${ref}`,
      callbackUrl: `${site}/api/webhooks/billplz`,
    });
    await db.from("orders").update({ payment_ref: bill.id }).eq("ref", ref);
    await db.from("payments").insert({ order_ref: ref, provider: "billplz", provider_ref: bill.id, status: "pending", amount_sen: bill.amount, raw: bill });
    return NextResponse.json({ orderRef: ref, redirectUrl: bill.url });
  } catch (e) {
    await db.rpc("release_stock", { p_order_ref: ref, p_type: "release", p_actor: "system" });
    await db.from("orders").update({ status: "failed" }).eq("ref", ref);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
