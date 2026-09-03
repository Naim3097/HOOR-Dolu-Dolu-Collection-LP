import type { Metadata, Viewport } from "next";
import { CONFIG } from "@/lib/products";
import "./globals.css";

export const metadata: Metadata = {
  title: `${CONFIG.collection} — ${CONFIG.brand}`,
  description: "Heritage batik in premium cotton silk, A-Cut with pockets, for every woman from petite to plus size. RM199, at your doorstep in 1–3 days.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { title: `${CONFIG.collection} — ${CONFIG.brand}`, description: "One dress, every occasion. Premium cotton silk, petite to plus size, pockets included. RM199.", images: ["/assets/img/hero_desktop-1400.webp"] },
};
export const viewport: Viewport = { themeColor: "#FAF6F1" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" media="(max-width: 899px)" fetchPriority="high" href="/assets/img/hero_mobile-941.webp" imageSrcSet="/assets/img/hero_mobile-480.webp 480w, /assets/img/hero_mobile-941.webp 941w" imageSizes="100vw" />
        <link rel="preload" as="image" media="(min-width: 900px)" fetchPriority="high" href="/assets/img/hero_desktop-1400.webp" imageSrcSet="/assets/img/hero_desktop-900.webp 900w, /assets/img/hero_desktop-1400.webp 1400w, /assets/img/hero_desktop-1672.webp 1672w" imageSizes="100vw" />
      </head>
      <body>{children}</body>
    </html>
  );
}
