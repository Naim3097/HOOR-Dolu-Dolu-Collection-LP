"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { renderAndUpload, removeRenders } from "@/lib/media-server";
import { SIZES } from "@/lib/products";
import type { ActionResult } from "@/app/admin/actions";

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
async function audit(actor: string, action: string, target: string | null, detail?: Record<string, unknown>) {
  await supabaseAdmin().from("audit_log").insert({ actor, action, target, detail: detail ?? null });
}
function bump(id?: string) { revalidatePath("/"); revalidatePath("/admin/products"); if (id) revalidatePath(`/admin/products/${id}`); }

export type ProductInput = { id?: string; name: string; print: string; story: string; note: string; priceRm: number; published: boolean; position: number };

export async function saveProduct(input: ProductInput): Promise<ActionResult & { id?: string }> {
  const staff = await requireStaff();
  const db = supabaseAdmin();
  const id = input.id ?? slugify(input.name);
  if (!id) return { ok: false, error: "Give the piece a name first." };
  const row = { name: input.name.trim(), print: input.print.trim(), story: input.story.trim(), note: input.note.trim() || null, price_sen: Math.round(input.priceRm * 100), published: input.published, position: input.position };
  if (!row.name) return { ok: false, error: "Give the piece a name." };
  if (!(row.price_sen >= 0)) return { ok: false, error: "Price must be zero or more." };
  const { error } = input.id ? await db.from("products").update(row).eq("id", id) : await db.from("products").insert({ id, ...row });
  if (error) return { ok: false, error: error.code === "23505" ? "A piece with that name already exists." : error.message };
  await audit(staff.email, input.id ? "product.update" : "product.create", id, { price_sen: row.price_sen, published: row.published });
  bump(id);
  return { ok: true, id };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const staff = await requireStaff();
  const db = supabaseAdmin();
  const { count } = await db.from("order_items").select("id", { count: "exact", head: true }).eq("product_id", id);
  if (count) return { ok: false, error: `Orders reference this piece (${count} lines). Unpublish it instead of deleting.` };
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit(staff.email, "product.delete", id);
  bump();
  return { ok: true };
}

export async function saveColourway(input: { productId: string; id?: string; name: string; swatch: string; video: string; position: number }): Promise<ActionResult & { id?: string }> {
  const staff = await requireStaff();
  const db = supabaseAdmin();
  const id = input.id ?? slugify(input.name);
  if (!id || !input.name.trim()) return { ok: false, error: "Give the colour a name." };
  const row = { name: input.name.trim(), swatch: input.swatch, video: input.video.trim() || null, position: input.position };
  const { error } = input.id
    ? await db.from("colourways").update(row).eq("product_id", input.productId).eq("id", id)
    : await db.from("colourways").insert({ product_id: input.productId, id, ...row });
  if (error) return { ok: false, error: error.message };
  if (!input.id) {
    // Every colour comes in every size; stock starts at zero and moves through the ledger.
    await db.from("variants").upsert(SIZES.map((s) => ({ sku: `${input.productId}:${id}:${s}`.toUpperCase(), product_id: input.productId, colourway_id: id, size: s, stock: 0 })), { onConflict: "sku", ignoreDuplicates: true });
  }
  await audit(staff.email, input.id ? "colourway.update" : "colourway.create", `${input.productId}:${id}`, row);
  bump(input.productId);
  return { ok: true, id };
}

export async function deleteColourway(productId: string, id: string): Promise<ActionResult> {
  const staff = await requireStaff();
  const db = supabaseAdmin();
  const { count } = await db.from("order_items").select("id", { count: "exact", head: true }).eq("product_id", productId).eq("colourway_id", id);
  if (count) return { ok: false, error: "Orders reference this colour; it cannot be deleted." };
  const { error } = await db.from("colourways").delete().eq("product_id", productId).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit(staff.email, "colourway.delete", `${productId}:${id}`);
  bump(productId);
  return { ok: true };
}

/** Upload one photo: rendered to WebP sizes, pushed to the bucket, recorded in product_images. */
export async function uploadProductImage(form: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const productId = String(form.get("productId") ?? ""), colourwayId = String(form.get("colourwayId") ?? ""), type = String(form.get("type") ?? "full");
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, error: "Choose an image file." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Keep each image under 10 MB." };
  const db = supabaseAdmin();
  const { data: existing } = await db.from("product_images").select("name,position").eq("product_id", productId).eq("colourway_id", colourwayId).order("position");
  const n = (existing ?? []).filter((e) => e.name.includes(`_${type}_`)).length + 1;
  const name = `${productId}_${colourwayId}_${type}_${String(n).padStart(2, "0")}_${Date.now().toString(36)}`;
  try {
    const meta = await renderAndUpload(name, Buffer.from(await file.arrayBuffer()));
    const { error } = await db.from("product_images").insert({ product_id: productId, colourway_id: colourwayId, name, width: meta.width, height: meta.height, widths: meta.widths, lqip: meta.lqip, position: (existing?.length ?? 0) + 1 });
    if (error) return { ok: false, error: error.message };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
  await audit(staff.email, "image.upload", `${productId}:${colourwayId}`, { name, bytes: file.size });
  bump(productId);
  return { ok: true };
}

export async function deleteProductImage(id: number): Promise<ActionResult> {
  const staff = await requireStaff();
  const db = supabaseAdmin();
  const { data: img } = await db.from("product_images").select("*").eq("id", id).maybeSingle();
  if (!img) return { ok: false, error: "Image not found." };
  await db.from("product_images").delete().eq("id", id);
  try { await removeRenders(img.name, img.widths); } catch { /* the row is gone; a stray file in the bucket is harmless */ }
  await audit(staff.email, "image.delete", `${img.product_id}:${img.colourway_id}`, { name: img.name });
  bump(img.product_id);
  return { ok: true };
}

export async function moveProductImage(id: number, dir: -1 | 1): Promise<ActionResult> {
  await requireStaff();
  const db = supabaseAdmin();
  const { data: img } = await db.from("product_images").select("*").eq("id", id).maybeSingle();
  if (!img) return { ok: false, error: "Image not found." };
  const { data: siblings } = await db.from("product_images").select("id,position").eq("product_id", img.product_id).eq("colourway_id", img.colourway_id).order("position");
  const list = siblings ?? []; const i = list.findIndex((s) => s.id === id); const j = i + dir;
  if (j < 0 || j >= list.length) return { ok: true };
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(list.map((s, k) => db.from("product_images").update({ position: k + 1 }).eq("id", s.id)));
  bump(img.product_id);
  return { ok: true };
}

/** Ledger adjustment: restock, correction, or stocktake. Never edits the number directly. */
export async function adjustStock(sku: string, delta: number, type: "restock" | "adjustment", reason: string): Promise<ActionResult & { stock?: number }> {
  const staff = await requireStaff();
  if (!Number.isInteger(delta) || delta === 0) return { ok: false, error: "Enter a whole number other than zero." };
  if (!reason.trim()) return { ok: false, error: "Say why, so the movement history makes sense later." };
  const { data, error } = await supabaseAdmin().rpc("adjust_stock", { p_sku: sku, p_delta: delta, p_type: type, p_reason: reason.trim(), p_actor: staff.email });
  if (error) return { ok: false, error: error.message.includes("below zero") ? "That would take stock below zero." : error.message };
  await audit(staff.email, "stock.adjust", sku, { delta, type, reason });
  bump(sku.split(":")[0].toLowerCase());
  return { ok: true, stock: data as number };
}
