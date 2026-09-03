import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifySignature } from "@/lib/billplz";
import { settleOrder } from "@/lib/settle";

/**
 * Billplz callback. Arrives as a form POST shortly after the customer pays,
 * independent of whether they make it back to /checkout/return.
 */
export async function POST(req: Request) {
  const ct = req.headers.get("content-type") ?? "";
  const fields: Record<string, string> = ct.includes("json")
    ? Object.fromEntries(Object.entries((await req.json()) as Record<string, unknown>).map(([k, v]) => [k, String(v)]))
    : Object.fromEntries([...(await req.formData()).entries()].map(([k, v]) => [k, String(v)]));

  if (!verifySignature(fields)) return NextResponse.json({ error: "bad signature" }, { status: 401 });
  if (!fields.id) return NextResponse.json({ error: "no bill id" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: order } = await db.from("orders").select("ref,status").eq("payment_ref", fields.id).single();
  if (!order) return NextResponse.json({ error: "unknown bill" }, { status: 404 });

  if (fields.paid === "true") await settleOrder(db, order, fields.id, fields.paid_at);
  return NextResponse.json({ ok: true });
}
