/**
 * Build every deployable image and video from the originals in /assets.
 *
 *   npm run media:build            everything
 *   npm run media:build -- images  images only (fast)
 *   npm run media:build -- videos  videos only (ffmpeg, a few minutes)
 *
 * Reads media/manifest.json, writes media/dist/{img,video} and lib/lqip.json
 * (blur placeholders, intrinsic sizes and the widths that exist per image).
 * media/dist is git-ignored; `npm run media:upload` pushes it to Supabase.
 */
import sharp from "sharp";
import { execFile } from "node:child_process";
import { mkdir, readFile, stat, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "assets");
const DIST = path.join(ROOT, "media/dist");
const what = process.argv[2] ?? "all";
const doImages = what === "all" || what === "images";
const doVideos = what === "all" || what === "videos";

const man = JSON.parse(await readFile(path.join(ROOT, "media/manifest.json"), "utf8"));
await mkdir(path.join(DIST, "img"), { recursive: true });
await mkdir(path.join(DIST, "video"), { recursive: true });

const kb = (n) => `${Math.round(n / 1024)}k`;
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

/* ---------- images ------------------------------------------------------ */
// lib/lqip.json is the app's view of the media set: it is rewritten on every
// image build so the placeholders, sizes and widths never drift from dist.
const lqipPath = path.join(ROOT, "lib/lqip.json");
const meta = { lqip: {}, dims: {}, widths: {} };

if (doImages) {
  let inBytes = 0, outBytes = 0;
  const webp = { quality: man.quality, effort: 6, smartSubsample: true };
  for (const it of man.images) {
    const file = path.join(SRC, it.src);
    inBytes += (await stat(file)).size;
    const base = sharp(file, { failOn: "none" }).rotate();
    const { width: W, height: H } = await base.metadata();
    meta.dims[it.out] = [W, H];
    const widths = (it.widths ?? (it.type === "sizechart" ? [900] : man.widths)).filter((w) => w <= W);
    meta.widths[it.out] = widths;
    const line = [];
    for (const w of widths) {
      const buf = await base.clone().resize({ width: w, withoutEnlargement: true }).webp(webp).toBuffer();
      await writeFile(path.join(DIST, "img", `${it.out}-${w}.webp`), buf);
      outBytes += buf.length;
      line.push(`${w}w:${kb(buf.length)}`);
    }
    // 20px blur placeholder, inlined so frames never paint empty (CLS = 0).
    const tiny = await base.clone().resize({ width: 20 }).webp({ quality: 60 }).toBuffer();
    meta.lqip[it.out] = `data:image/webp;base64,${tiny.toString("base64")}`;
    console.log(`  ${it.out.padEnd(30)} ${line.join(" ")}`);
  }
  console.log(`images: ${man.images.length} sources, ${mb(inBytes)} in → ${mb(outBytes)} out\n`);
}

/* ---------- videos ------------------------------------------------------ */
if (doVideos) {
  let outBytes = 0;
  for (const v of man.videos ?? []) {
    const file = path.join(SRC, v.src);
    const vf = `scale=${v.w}:-2,format=yuv420p`;
    const outWebm = path.join(DIST, "video", `${v.out}.webm`);
    const outMp4 = path.join(DIST, "video", `${v.out}.mp4`);
    const log = path.join(tmpdir(), `hoor-vp9-${v.out}`);
    const common = ["-y", "-hide_banner", "-loglevel", "error", "-i", file, "-an", "-vf", vf];

    // VP9 constrained quality, two passes: CRF for quality, `kbps` as the ceiling.
    const vp9 = ["-c:v", "libvpx-vp9", "-crf", String(v.crf ?? 35), "-b:v", `${v.kbps}k`, "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-passlogfile", log];
    await run("ffmpeg", [...common, ...vp9, "-pass", "1", "-f", "null", process.platform === "win32" ? "NUL" : "/dev/null"]);
    await run("ffmpeg", [...common, ...vp9, "-pass", "2", outWebm]);
    await rm(`${log}-0.log`, { force: true });

    // H.264 fallback for anything that will not play VP9.
    await run("ffmpeg", [...common, "-c:v", "libx264", "-crf", "27", "-maxrate", `${v.kbps}k`, "-bufsize", `${v.kbps * 2}k`, "-preset", "slow", "-profile:v", "high", "-movflags", "+faststart", outMp4]);

    // Poster frame as WebP, same width as the film.
    const png = path.join(tmpdir(), `hoor-poster-${v.out}.png`);
    await run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-ss", String(v.poster), "-i", file, "-frames:v", "1", "-vf", vf, png]);
    const poster = await sharp(png).webp({ quality: man.quality, effort: 6 }).toBuffer();
    await writeFile(path.join(DIST, "video", `${v.out}_poster.webp`), poster);
    await rm(png, { force: true });

    const sizes = { webm: (await stat(outWebm)).size, mp4: (await stat(outMp4)).size, poster: poster.length };
    outBytes += sizes.webm + sizes.mp4 + sizes.poster;
    console.log(`  ${v.out.padEnd(30)} webm:${kb(sizes.webm)} mp4:${kb(sizes.mp4)} poster:${kb(sizes.poster)}`);
  }
  console.log(`videos: ${(man.videos ?? []).length} sources → ${mb(outBytes)} out\n`);
}

if (doImages) {
  await writeFile(lqipPath, JSON.stringify(meta, null, 1) + "\n");
  console.log(`wrote lib/lqip.json (${Object.keys(meta.lqip).length} placeholders)`);
}
