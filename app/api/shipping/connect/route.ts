import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getStaff } from "@/lib/auth";
import { authUrl, easyparcelConfigured } from "@/lib/shipping/config";

/** Starts the EasyParcel OAuth round trip. Staff only. `state` proves the trip began in this browser and carries no identity. */
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getStaff())) return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  if (!easyparcelConfigured()) return NextResponse.json({ error: "EASYPARCEL_CLIENT_ID, _CLIENT_SECRET and _REDIRECT_URI are not set." }, { status: 503 });
  const state = crypto.randomBytes(24).toString("hex");
  (await cookies()).set("ep_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return NextResponse.redirect(authUrl(state));
}
