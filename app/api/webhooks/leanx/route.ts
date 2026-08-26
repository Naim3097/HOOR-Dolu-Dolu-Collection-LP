import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyCallback, isPaid, type LeanXCallback } from "@/lib/leanx";

export async function POST(req: Request) {
  const ct = req.headers.get("content-type") ?? "";
  const payload: LeanXCallback = ct.includes("json")
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries()) as LeanXCallback;

  if (!verifyCallback(payload)) return NextResponse.json({ error: "bad signature" }, { status: 401 });
  const ref = payload.external_id;
  if (!ref) return NextResponse.json({ error: "no external_id" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: order } = await db.from("orders").select("status").eq("ref", ref).single();
  if (!order) return NextResponse.json({ error: "unknown order" }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ ok: true }); // idempotent

  if (isPaid(payload.invoice_status)) {
    await db.from("orders").update({ status: "paid", paid_at: new Date().toISOString(), payment_ref: payload.invoice_no }).eq("ref", ref);
  } else if ((payload.invoice_status ?? "").toUpperCase() === "FAILED") {
    await db.rpc("release_stock", { p_order_ref: ref });
    await db.from("orders").update({ status: "failed" }).eq("ref", ref);
  }
  return NextResponse.json({ ok: true });
}
