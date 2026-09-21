import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { CONFIG } from "@/lib/products";
import { imgSrc, srcset } from "@/lib/format";
import "./globals.css";

/** Meta Pixel for the ad campaign. The snippet fires PageView itself; every
 *  other event reaches fbq through lib/tracking.ts, which maps the dataLayer
 *  names to Meta's standard ones (ViewContent, InitiateCheckout, Purchase…). */
const META_PIXEL_ID = "1493030802140511";

export const metadata: Metadata = {
  title: `${CONFIG.collection} — ${CONFIG.brand}`,
  description: "Heritage batik in premium cotton silk, an A-Cutline Dress with pockets, for every woman from petite to plus size. RM199, at your doorstep in 1–3 days.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { title: `${CONFIG.collection} — ${CONFIG.brand}`, description: "One dress, every occasion. Premium cotton silk, petite to plus size, pockets included. RM199.", images: [imgSrc("hero_desktop", 1400)] },
};
export const viewport: Viewport = { themeColor: "#FAF6F1" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" media="(max-width: 899px)" fetchPriority="high" href={imgSrc("hero_mobile", 941)} imageSrcSet={srcset("hero_mobile")} imageSizes="100vw" />
        <link rel="preload" as="image" media="(min-width: 900px)" fetchPriority="high" href={imgSrc("hero_desktop", 1400)} imageSrcSet={srcset("hero_desktop")} imageSizes="100vw" />
      </head>
      <body>
        {children}
        <Script id="meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
        ` }} />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} />
        </noscript>
      </body>
    </html>
  );
}
