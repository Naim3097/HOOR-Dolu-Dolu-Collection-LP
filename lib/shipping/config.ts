import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { EasyParcelClient, EasyParcelTokenError, OAUTH_BASE, type PartyAddress } from "./easyparcel";

/**
 * EasyParcel connection for the single HOOR store: one merchant account, its
 * OAuth tokens on the store_settings row, readable only through the service
 * role. Ported from Kalima.
 */
const CLIENT_ID = process.env.EASYPARCEL_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.EASYPARCEL_CLIENT_SECRET ?? "";
const REDIRECT_URI = process.env.EASYPARCEL_REDIRECT_URI ?? "";

export const easyparcelConfigured = () => Boolean(CLIENT_ID && CLIENT_SECRET && REDIRECT_URI);

export type Sender = { name: string; phone: string; line1: string; line2: string | null; city: string; postcode: string; state: string };
export type Connection = { configured: boolean; connected: boolean; refreshExpires: string | null; sender: Sender };

export async function getConnection(): Promise<Connection> {
  const { data, error } = await supabaseAdmin().from("store_settings").select("easyparcel_access_token,easyparcel_refresh_token,easyparcel_refresh_expires,sender_name,sender_phone,sender_line1,sender_line2,sender_city,sender_postcode,sender_state").eq("id", 1).single();
  if (error) throw new Error(`reading shipping settings failed: ${error.message}`);
  return {
    configured: easyparcelConfigured(),
    connected: Boolean(data.easyparcel_access_token && data.easyparcel_refresh_token),
    refreshExpires: data.easyparcel_refresh_expires,
    sender: { name: data.sender_name, phone: data.sender_phone, line1: data.sender_line1, line2: data.sender_line2, city: data.sender_city, postcode: data.sender_postcode, state: data.sender_state },
  };
}
export const senderParty = (s: Sender): PartyAddress => ({ name: s.name, phone: s.phone, line1: s.line1, line2: s.line2 ?? undefined, city: s.city, postcode: s.postcode, state: s.state });

function expiresAt(p: Record<string, unknown>): string {
  const abs = p.expires_at ?? p.expiresAt;
  if (typeof abs === "string" && !Number.isNaN(new Date(abs).getTime())) return new Date(abs).toISOString();
  const rel = p.expires_in ?? p.expiresIn; const s = typeof rel === "number" ? rel : parseInt(String(rel ?? ""), 10);
  if (Number.isFinite(s)) return new Date(Date.now() + s * 1000).toISOString();
  throw new Error("EasyParcel token response carried no usable expiry");
}
function refreshExpiresAt(p: Record<string, unknown>): string | null {
  const rel = p.refresh_token_expires_in ?? p.refreshTokenExpiresIn; const s = typeof rel === "number" ? rel : parseInt(String(rel ?? ""), 10);
  return Number.isFinite(s) && s > 0 ? new Date(Date.now() + s * 1000).toISOString() : null;
}

/** Token exchange. A rotated refresh token is an update, never a requirement. */
async function exchange(body: URLSearchParams, keepRefresh?: string) {
  const res = await fetch(`${OAUTH_BASE}/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}` }, body, cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new EasyParcelTokenError(String(json.error_description ?? json.error ?? `token exchange failed (${res.status})`));
  const access = String(json.access_token ?? ""), refresh = String(json.refresh_token ?? "") || (keepRefresh ?? "");
  if (!access) throw new EasyParcelTokenError("token exchange returned no access token");
  if (!refresh) throw new EasyParcelTokenError("token exchange returned no refresh token");
  return { access, refresh, expiresAt: expiresAt(json), refreshExpiresAt: refreshExpiresAt(json) };
}

export const authUrl = (state: string) => `${OAUTH_BASE}/login?${new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, response_type: "code", state })}`;

export async function connectWithCode(code: string) {
  const t = await exchange(new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }));
  const { error } = await supabaseAdmin().from("store_settings").update({ easyparcel_access_token: t.access, easyparcel_refresh_token: t.refresh, easyparcel_token_expires: t.expiresAt, easyparcel_refresh_expires: t.refreshExpiresAt, easyparcel_enabled: true }).eq("id", 1);
  if (error) throw new Error(`storing EasyParcel tokens failed: ${error.message}`);
}
export async function disconnect() {
  await supabaseAdmin().from("store_settings").update({ easyparcel_access_token: null, easyparcel_refresh_token: null, easyparcel_token_expires: null, easyparcel_refresh_expires: null, easyparcel_enabled: false }).eq("id", 1);
}

/** The only way to get a token: refreshes with a five-minute margin and persists the new pair first. */
async function validAccessToken(): Promise<string> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("store_settings").select("easyparcel_access_token,easyparcel_refresh_token,easyparcel_token_expires").eq("id", 1).single();
  if (error) throw new Error(`reading EasyParcel tokens failed: ${error.message}`);
  const access = data.easyparcel_access_token as string | null, refresh = data.easyparcel_refresh_token as string | null, expires = data.easyparcel_token_expires as string | null;
  if (!access || !refresh) throw new EasyParcelTokenError("EasyParcel is not connected");
  if (expires && new Date(expires).getTime() - 5 * 60 * 1000 > Date.now()) return access;
  const next = await exchange(new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }), refresh);
  const { error: w } = await db.from("store_settings").update({ easyparcel_access_token: next.access, easyparcel_refresh_token: next.refresh, easyparcel_token_expires: next.expiresAt, ...(next.refreshExpiresAt ? { easyparcel_refresh_expires: next.refreshExpiresAt } : {}) }).eq("id", 1);
  if (w) throw new Error(`persisting refreshed token failed: ${w.message}`);
  return next.access;
}
export const easyparcelClient = async () => new EasyParcelClient(await validAccessToken());
