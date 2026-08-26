import type { Metadata, Viewport } from "next";
import { CONFIG } from "@/lib/products";
import "./globals.css";

export const metadata: Metadata = {
  title: `${CONFIG.collection} — ${CONFIG.brand}`,
  description: "Heritage batik redrawn on an A-cut with pockets, sizes S/M–4XL. One dress, every occasion.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { images: ["/assets/img/hero_desktop-1400.webp"] },
};
export const viewport: Viewport = { themeColor: "#FAF6F1" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" media="(max-width: 899px)" fetchPriority="high" href="/assets/img/hero_mobile-853.webp" imageSrcSet="/assets/img/hero_mobile-480.webp 480w, /assets/img/hero_mobile-853.webp 853w" imageSizes="100vw" />
        <link rel="preload" as="image" media="(min-width: 900px)" fetchPriority="high" href="/assets/img/hero_desktop-1400.webp" imageSrcSet="/assets/img/hero_desktop-900.webp 900w, /assets/img/hero_desktop-1400.webp 1400w, /assets/img/hero_desktop-1672.webp 1672w" imageSizes="100vw" />
      </head>
      <body>{children}</body>
    </html>
  );
}
