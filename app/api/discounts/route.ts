import { NextResponse } from "next/server";
import { z } from "zod";
import { applyDiscount } from "@/lib/discounts";

const input = z.object({ code: z.string().max(32), subtotalSen: z.number().int().min(0), shippingSen: z.number().int().min(0) });

/** Checkout preview of a discount code. The order route re-checks it when the order is created. */
export async function POST(req: Request) {
  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const r = await applyDiscount(parsed.data.code, parsed.data.subtotalSen, parsed.data.shippingSen);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 422 });
  return NextResponse.json(r.applied);
}
