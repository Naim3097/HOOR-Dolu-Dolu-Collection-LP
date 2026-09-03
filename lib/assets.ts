/**
 * Where images and video are served from.
 *
 * Media is not bundled with the app. `npm run media:build` renders it from the
 * originals in /assets and `npm run media:upload` pushes it to the public
 * "assets" bucket of the Supabase project the app points at, so each
 * environment serves media from its own project through Supabase's CDN.
 * Nothing here goes through Vercel image optimisation.
 *
 * NEXT_PUBLIC_ASSET_BASE overrides the derived bucket URL when set.
 */
const BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE ??
  (process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets` : "/assets");

/** `asset("img/foo-900.webp")` → absolute URL on the media bucket. */
export const asset = (p: string) => `${BASE}/${p.replace(/^\/+/, "")}`;
