import "server-only";
import sharp from "sharp";
import { StorageClient } from "@supabase/storage-js";

/**
 * Renders one uploaded product photo the same way scripts/media-build.mjs does
 * (WebP at 480/900/1400 capped to the source width, plus a 20px blur) and puts
 * the renders in the media bucket. Returns what product_images needs.
 */
const WIDTHS = [480, 900, 1400];
const BUCKET = "assets";

function storage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return new StorageClient(`${url}/storage/v1`, { apikey: key, Authorization: `Bearer ${key}` });
}

export async function renderAndUpload(name: string, input: Buffer) {
  const base = sharp(input, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const W = meta.width ?? 0, H = meta.height ?? 0;
  if (!W || !H) throw new Error("That file is not an image we can read.");
  const widths = WIDTHS.filter((w) => w <= W);
  if (!widths.length) widths.push(W);
  const st = storage();
  for (const w of widths) {
    const buf = await base.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80, effort: 5, smartSubsample: true }).toBuffer();
    const { error } = await st.from(BUCKET).upload(`img/${name}-${w}.webp`, buf, { upsert: true, cacheControl: "31536000", contentType: "image/webp" });
    if (error) throw new Error(`Upload failed: ${error.message}`);
  }
  const tiny = await base.clone().resize({ width: 20 }).webp({ quality: 60 }).toBuffer();
  return { width: W, height: H, widths, lqip: `data:image/webp;base64,${tiny.toString("base64")}` };
}

export async function removeRenders(name: string, widths: number[]) {
  await storage().from(BUCKET).remove(widths.map((w) => `img/${name}-${w}.webp`));
}
