import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/auth";
import { connectWithCode, easyparcelConfigured } from "@/lib/shipping/config";
import { supabaseAdmin } from "@/lib/supabase/server";

/** EasyParcel OAuth callback. Identity comes from the staff session; `state` only guards against CSRF. */
export const dynamic = "force-dynamic";

function back(req: NextRequest, message: string, ok = false) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return NextResponse.redirect(new URL(`/admin/shipping?${ok ? "connected" : "error"}=${encodeURIComponent(message)}`, process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`));
}

export async function GET(req: NextRequest) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  if (!easyparcelConfigured()) return back(req, "EasyParcel credentials are not configured.");
  const p = req.nextUrl.searchParams;
  if (p.get("error")) return back(req, `EasyParcel refused the connection: ${p.get("error")}`);
  const code = p.get("code"), state = p.get("state");
  if (!code || !state) return back(req, "EasyParcel did not return an authorisation code.");
  const jar = await cookies(); const expected = jar.get("ep_oauth_state")?.value; jar.delete("ep_oauth_state");
  const a = Buffer.from(state), b = Buffer.from(expected ?? "");
  if (!expected || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return back(req, "That connection attempt could not be verified. Please try again.");
  try { await connectWithCode(code); } catch (e) { return back(req, e instanceof Error ? e.message : "Could not complete the connection."); }
  await supabaseAdmin().from("audit_log").insert({ actor: staff.email, action: "easyparcel.connect", target: null });
  return back(req, "EasyParcel connected.", true);
}
