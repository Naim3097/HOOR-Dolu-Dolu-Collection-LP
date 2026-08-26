import localFont from "next/font/local";

export const karla = localFont({
  src: [
    { path: "../public/assets/fonts/karla-400-normal-latin.woff2", weight: "400", style: "normal" },
    { path: "../public/assets/fonts/karla-700-normal-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-karla",
  display: "swap",
});

export const playfair = localFont({
  src: [
    { path: "../public/assets/fonts/playfair-display-400-normal-latin.woff2", weight: "400", style: "normal" },
    { path: "../public/assets/fonts/playfair-display-400-italic-latin.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-playfair",
  display: "swap",
});
