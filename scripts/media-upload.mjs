/**
 * Push media/dist to the Supabase Storage bucket the app serves media from.
 *
 *   npm run media:upload              everything in media/dist
 *   npm run media:upload -- img       one folder only (img or video)
 *
 * Targets the project in NEXT_PUBLIC_SUPABASE_URL using SUPABASE_SERVICE_ROLE_KEY
 * (both read from .env.local). To publish to another project, e.g. production,
 * point those two variables at it for the one command:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run media:upload
 *
 * Creates the public bucket if it is missing, then upserts every file with a
 * one-year cache header. Re-running is safe; unchanged files are re-uploaded.
 */
import { StorageClient } from "@supabase/storage-js";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "media/dist");
const BUCKET = process.env.ASSET_BUCKET ?? "assets";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example).");
  process.exit(1);
}

const TYPES = { ".webp": "image/webp", ".webm": "video/webm", ".mp4": "video/mp4", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
// Storage only: the full supabase-js client wants a WebSocket for realtime, which Node 20 lacks.
const storage = new StorageClient(`${url}/storage/v1`, { apikey: key, Authorization: `Bearer ${key}` });

const { data: buckets, error: listErr } = await storage.listBuckets();
if (listErr) throw listErr;
if (!buckets.some((b) => b.name === BUCKET)) {
  const { error } = await storage.createBucket(BUCKET, { public: true, fileSizeLimit: "50MB" });
  if (error) throw error;
  console.log(`created public bucket "${BUCKET}"`);
}

const only = process.argv[2];
const files = (await readdir(DIST, { recursive: true })).filter((f) => TYPES[path.extname(f)] && (!only || f.startsWith(`${only}/`)));
if (!files.length) { console.error("media/dist is empty. Run `npm run media:build` first."); process.exit(1); }

let done = 0, bytes = 0;
const queue = [...files];
await Promise.all(Array.from({ length: 6 }, async () => {
  for (let f = queue.shift(); f; f = queue.shift()) {
    const body = await readFile(path.join(DIST, f));
    const { error } = await storage.from(BUCKET).upload(f, body, { upsert: true, cacheControl: "31536000", contentType: TYPES[path.extname(f)] });
    if (error) throw new Error(`${f}: ${error.message}`);
    done++; bytes += body.length;
    if (done % 20 === 0 || done === files.length) console.log(`  ${done}/${files.length} uploaded`);
  }
}));

const ref = new URL(url).host.split(".")[0];
console.log(`\n${done} files, ${(bytes / 1048576).toFixed(1)} MB → ${ref}/${BUCKET}`);
console.log(`public base: ${url}/storage/v1/object/public/${BUCKET}`);
