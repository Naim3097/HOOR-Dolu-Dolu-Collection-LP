import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Vercel cron (see vercel.json, once a day: the Hobby plan allows no more):
 * pending orders older than 24 hours never got paid, so their reserved stock
 * goes back on the shelf. Billplz bills stay
 * payable, and a late payment still settles through the webhook, which
 * re-reserves stock when it can.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const db = supabaseAdmin();
  const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: stale } = await db.from("orders").select("ref").eq("status", "pending").lt("created_at", cutoff);
  for (const o of stale ?? []) {
    await db.rpc("release_stock", { p_order_ref: o.ref, p_type: "release", p_actor: "system" });
    await db.from("orders").update({ status: "failed", admin_notes: "Expired: unpaid after 24 hours." }).eq("ref", o.ref).eq("status", "pending");
    await db.from("audit_log").insert({ actor: "system", action: "order.expire", target: o.ref });
  }
  return NextResponse.json({ expired: (stale ?? []).map((o) => o.ref) });
}
