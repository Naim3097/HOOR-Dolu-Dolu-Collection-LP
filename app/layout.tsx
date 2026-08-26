import type { Metadata } from "next";
import { karla, playfair } from "@/lib/fonts";
import { Toaster } from "@/components/ui/sonner";
import { CONFIG } from "@/lib/products";
import "./globals.css";

export const metadata: Metadata = {
  title: `${CONFIG.collection} — ${CONFIG.brand}`,
  description:
    "One dress, every occasion. Heritage batik redrawn on premium crepe, sizes S/M–4XL, pockets included.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { images: ["/assets/img/hero_desktop-1400.webp"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${karla.variable} ${playfair.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
