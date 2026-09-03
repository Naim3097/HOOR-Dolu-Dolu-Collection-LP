import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Media is served from Supabase Storage as pre-rendered WebP/WebM (see lib/assets.ts);
  // nothing goes through Vercel image optimisation.
  images: { unoptimized: true },
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default nextConfig;
