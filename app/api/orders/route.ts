import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createBill } from "@/lib/leanx";
import { orderInput, priceOrder, orderRef } from "@/lib/orders";
import { CONFIG, sku } from "@/lib/products";

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
  });
  if (reserveErr) return NextResponse.json({ error: "Some items are no longer in stock." }, { status: 409 });

  const { error: insErr } = await db.from("orders").insert({
    ref,
    status: "pending",
    customer: input.customer,
    delivery: { ...input.delivery, region: pricing.region, notes: input.notes },
    payment_method: input.paymentMethod,
    attribution: input.attribution,
    subtotal: pricing.subtotal,
    shipping: pricing.shipping,
    total: pricing.total,
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
      unit_price: CONFIG.basePrice,
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
      callbackUrl: `${site}/api/webhooks/leanx`,
    });
    await db.from("orders").update({ payment_ref: bill.billId }).eq("ref", ref);
    return NextResponse.json({ orderRef: ref, redirectUrl: bill.redirectUrl });
  } catch (e) {
    await db.rpc("release_stock", { p_order_ref: ref });
    await db.from("orders").update({ status: "failed" }).eq("ref", ref);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
