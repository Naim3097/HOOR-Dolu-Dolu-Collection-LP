"use server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { requireStaff } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ActionResult } from "@/app/admin/actions";

async function audit(actor: string, action: string, target: string | null, detail?: Record<string, unknown>) {
  await supabaseAdmin().from("audit_log").insert({ actor, action, target, detail: detail ?? null });
}

/* ---------- settings ---------------------------------------------------- */
export async function saveSettings(input: { store_name: string; store_email: string; store_phone: string; whatsapp: string; hours: string; instagram: string; freeShippingRm: string; westRm: number; eastRm: number; return_days: number }): Promise<ActionResult> {
  const staff = await requireStaff();
  const row = {
    store_name: input.store_name.trim(), store_email: input.store_email.trim(), store_phone: input.store_phone.trim(), whatsapp: input.whatsapp.replace(/\D/g, ""), hours: input.hours.trim(), instagram: input.instagram.trim(),
    free_shipping_threshold_sen: input.freeShippingRm.trim() === "" ? null : Math.round(Number(input.freeShippingRm) * 100),
    west_rate_sen: Math.round(input.westRm * 100), east_rate_sen: Math.round(input.eastRm * 100), return_days: Math.max(0, Math.round(input.return_days)),
  };
  if (!row.store_name || !row.store_email) return { ok: false, error: "Store name and email are required." };
  const { error } = await supabaseAdmin().from("store_settings").update(row).eq("id", 1);
  if (error) return { ok: false, error: error.message };
  await audit(staff.email, "settings.update", null, row);
  revalidatePath("/"); revalidatePath("/admin/settings"); revalidatePath("/admin/shipping");
  return { ok: true };
}

/* ---------- discounts --------------------------------------------------- */
export async function saveDiscount(input: { id?: number; code: string; kind: "percent" | "fixed" | "free_shipping"; amount: number; minSpendRm: number; maxRedemptions: string; startsAt: string; endsAt: string; active: boolean }): Promise<ActionResult> {
  const staff = await requireStaff();
  const code = input.code.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) return { ok: false, error: "Codes are 3 to 24 letters, numbers, dashes or underscores." };
  if (input.kind === "percent" && !(input.amount > 0 && input.amount <= 100)) return { ok: false, error: "Percent must be between 1 and 100." };
  if (input.kind === "fixed" && !(input.amount > 0)) return { ok: false, error: "Enter the amount off in ringgit." };
  const row = {
    code, kind: input.kind, amount: input.kind === "fixed" ? Math.round(input.amount * 100) : input.kind === "percent" ? Math.round(input.amount) : 0,
    min_spend_sen: Math.round((input.minSpendRm || 0) * 100), max_redemptions: input.maxRedemptions.trim() === "" ? null : Math.max(1, Math.round(Number(input.maxRedemptions))),
    starts_at: input.startsAt ? new Date(input.startsAt).toISOString() : null, ends_at: input.endsAt ? new Date(input.endsAt).toISOString() : null, active: input.active,
  };
  const db = supabaseAdmin();
  const { error } = input.id ? await db.from("discount_codes").update(row).eq("id", input.id) : await db.from("discount_codes").insert(row);
  if (error) return { ok: false, error: error.code === "23505" ? "That code already exists." : error.message };
  await audit(staff.email, input.id ? "discount.update" : "discount.create", code, row);
  revalidatePath("/admin/discounts");
  return { ok: true };
}
export async function toggleDiscount(id: number, active: boolean): Promise<ActionResult> {
  const staff = await requireStaff();
  const { data, error } = await supabaseAdmin().from("discount_codes").update({ active }).eq("id", id).select("code").single();
  if (error) return { ok: false, error: error.message };
  await audit(staff.email, active ? "discount.enable" : "discount.disable", data.code);
  revalidatePath("/admin/discounts");
  return { ok: true };
}
export async function deleteDiscount(id: number): Promise<ActionResult> {
  const staff = await requireStaff();
  const db = supabaseAdmin();
  const { data: d } = await db.from("discount_codes").select("code,redeemed_count").eq("id", id).maybeSingle();
  if (!d) return { ok: false, error: "Code not found." };
  if (d.redeemed_count > 0) return { ok: false, error: "This code has been used on orders. Switch it off instead of deleting it." };
  const { error } = await db.from("discount_codes").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit(staff.email, "discount.delete", d.code);
  revalidatePath("/admin/discounts");
  return { ok: true };
}

/* ---------- staff ------------------------------------------------------- */
const tempPassword = () => randomBytes(9).toString("base64url");

/** Owner creates a staff login and hands over the one-time password out of band. */
export async function createStaff(input: { email: string; fullName: string; role: "owner" | "staff" }): Promise<ActionResult & { password?: string }> {
  const me = await requireStaff();
  if (me.role !== "owner") return { ok: false, error: "Only the owner can add staff." };
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email." };
  const password = tempPassword();
  const db = supabaseAdmin();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: input.fullName.trim() } });
  if (error) return { ok: false, error: error.message };
  await db.from("profiles").update({ role: input.role, full_name: input.fullName.trim() || null }).eq("id", data.user.id);
  await audit(me.email, "staff.create", email, { role: input.role });
  revalidatePath("/admin/staff");
  return { ok: true, password };
}
export async function resetStaffPassword(id: string): Promise<ActionResult & { password?: string }> {
  const me = await requireStaff();
  if (me.role !== "owner") return { ok: false, error: "Only the owner can reset passwords." };
  const password = tempPassword();
  const db = supabaseAdmin();
  const { data, error } = await db.auth.admin.updateUserById(id, { password });
  if (error) return { ok: false, error: error.message };
  await audit(me.email, "staff.password_reset", data.user.email ?? id);
  return { ok: true, password };
}
export async function setStaffRole(id: string, role: "owner" | "staff"): Promise<ActionResult> {
  const me = await requireStaff();
  if (me.role !== "owner") return { ok: false, error: "Only the owner can change roles." };
  if (id === me.id && role !== "owner") return { ok: false, error: "You cannot demote yourself." };
  const { data, error } = await supabaseAdmin().from("profiles").update({ role }).eq("id", id).select("email").single();
  if (error) return { ok: false, error: error.message };
  await audit(me.email, "staff.role", data.email, { role });
  revalidatePath("/admin/staff");
  return { ok: true };
}
export async function removeStaff(id: string): Promise<ActionResult> {
  const me = await requireStaff();
  if (me.role !== "owner") return { ok: false, error: "Only the owner can remove staff." };
  if (id === me.id) return { ok: false, error: "You cannot remove yourself." };
  const db = supabaseAdmin();
  const { data: p } = await db.from("profiles").select("email").eq("id", id).maybeSingle();
  const { error } = await db.auth.admin.deleteUser(id);
  if (error) return { ok: false, error: error.message };
  await audit(me.email, "staff.remove", p?.email ?? id);
  revalidatePath("/admin/staff");
  return { ok: true };
}
