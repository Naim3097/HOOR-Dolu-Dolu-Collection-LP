/**
 * Campaign data — ported from landing/js/data.js.
 * ⚑ = assumption to confirm with HOOR (see HANDOVER.md §1).
 * Product copy lives here; live stock lives in Supabase (`variants.stock`).
 */

export const CONFIG = {
  brand: "HOOR",
  tagline: "the most beautiful",
  collection: "Batik Dolu-Dolu",
  currency: "MYR",
  currencySymbol: "RM",
  basePrice: 199, // ⚑
  freeShippingOver: 250 as number | null, // ⚑
  shipping: {
    west: { label: "Semenanjung Malaysia", rate: 8 }, // ⚑
    east: { label: "Sabah / Sarawak / Labuan", rate: 15 }, // ⚑
  },
  support: {
    email: "hooriemodestwear@gmail.com",
    hours: "Every day, 10am – 9pm",
    phone: "+60 17-250 0323", // hoor.my storefront config
    instagram: "@we.are.hoor",
    whatsapp: "60172500323", // ⚑
  },
  payments: ["visa", "mastercard", "unionpay", "fpx", "maybank", "cimb", "banktransfer"],
  // Dispatch/delivery promise per client: out in 24 hours, arrives 1–3 days.
  policy: { returnDays: 7, refundDays: 14 },
  showStockPressure: false,
} as const;

export const SIZES = ["SM", "LXL", "2XL", "3XL", "4XL"] as const;
export type Size = (typeof SIZES)[number];
export const SIZE_LABELS: Record<Size, string> = { SM: "S/M", LXL: "L/XL", "2XL": "2XL", "3XL": "3XL", "4XL": "4XL" };

export const SIZE_CHART = {
  note: "HOOR A-Cutline Dress. Measurements in inches. Please allow 1–3cm variance; every piece is measured by hand.",
  rows: ["Shoulder", "Bust", "Sleeve", "Arm hole", "Hip", "Length"],
  data: {
    SM: [15.5, 40, 21.5, 21, 51, 53],
    LXL: [16, 44, 22.5, 22, 54, 55],
    "2XL": [17, 46, 23, 23, 56, 56],
    "3XL": [18, 50, 23.5, 24.5, 60, 57],
    "4XL": [19, 54, 24, 25.5, 60, 57],
  } satisfies Record<Size, number[]>,
};

export const FIT_RULES: { max: number; size: Size | null }[] = [
  { max: 37, size: "SM" },
  { max: 41, size: "LXL" },
  { max: 43, size: "2XL" },
  { max: 47, size: "3XL" },
  { max: 51, size: "4XL" },
  { max: Infinity, size: null },
];

export const LENGTH_GUIDE: { size: Size; length: number; suits: string }[] = [
  { size: "SM", length: 53, suits: "up to about 5'3\"" },
  { size: "LXL", length: 55, suits: "about 5'3\" – 5'6\"" },
  { size: "2XL", length: 56, suits: "about 5'5\" – 5'7\"" },
  { size: "3XL", length: 57, suits: "about 5'6\" – 5'9\"" },
  { size: "4XL", length: 57, suits: "about 5'6\" – 5'9\"" },
];

export const FABRIC =
  "Premium cotton silk: soft, breathable and fluid. It falls straight from the shoulder instead of clinging, and stays cool across a long Malaysian day.";
export const CARE =
  "Machine wash cold, hand wash recommended. Do not bleach. Do not tumble dry. Warm iron if needed."; // hoor.my product details
export const SHARED_DETAILS = [
  "HOOR Premium Cotton Silk",
  "Loose A-Cutline Dress that skims, never clings",
  "V neck with a soft stand collar",
  "Pockets on both sides, deep enough for a phone",
  "Full length, unlined, in five sizes from S/M to 4XL",
];

export type Colourway = {
  id: string;
  name: string;
  swatch: string;
  images: string[];
  video: string | null;
  /** Placeholder stock — the source of truth is Supabase `variants`. */
  stock: Record<Size, number>;
};

export type Product = {
  id: string;
  name: string;
  story: string;
  print: string;
  note?: string;
  price: number;
  colourways: Colourway[];
};

const P = (p: Omit<Product, "price">): Product => ({ ...p, price: CONFIG.basePrice });

export const PRODUCTS: Product[] = [
  P({
    id: "dilla", name: "DILLA", print: "Painted floral batik",
    story: "Watercolour blooms in coral and rose drifting over soft peach. The lightest piece in the collection to look at, and the one that photographs like spring.",
    colourways: [{ id: "soft-peach", name: "Soft Peach", swatch: "#D3BDCA", images: ["dilla_soft-peach_full_01", "dilla_soft-peach_back_01", "dilla_soft-peach_full_02", "dilla_soft-peach_detail_01", "dilla_soft-peach_full_03"], video: null, stock: { SM: 15, LXL: 22, "2XL": 5, "3XL": 6, "4XL": 2 } }],
  }),
  P({
    id: "dilla-senja", name: "DILLA · SENJA", print: "Night floral batik",
    story: "Painted peonies and iris climbing from the hem on near-black, with the same bloom carried across the sleeve. The evening piece.",
    colourways: [{ id: "black-batik", name: "Black Batik", swatch: "#1B2527", images: ["dilla-senja_black-batik_full_01", "dilla-senja_black-batik_full_02", "dilla-senja_black-batik_detail_01", "dilla-senja_black-batik_detail_02", "dilla-senja_black-batik_full_03", "dilla-senja_black-batik_back_01"], video: "senja_midnight", stock: { SM: 4, LXL: 11, "2XL": 2, "3XL": 0, "4XL": 1 } }],
  }),
  P({
    id: "thalia-pusaka", name: "THALIA · PUSAKA", print: "Heirloom medallion batik",
    story: "A tile-work medallion running the full length of the front panel, edged with the fine scrolling border you used to see on a good tablecloth.",
    colourways: [{ id: "teal-green", name: "Teal Green", swatch: "#2A4A58", images: ["thalia-pusaka_teal-green_full_01", "thalia-pusaka_teal-green_full_02", "thalia-pusaka_teal-green_back_01", "thalia-pusaka_teal-green_detail_01", "thalia-pusaka_teal-green_detail_02"], video: "pusaka_deep-teal", stock: { SM: 12, LXL: 20, "2XL": 6, "3XL": 3, "4XL": 2 } }],
  }),
];

/** Every purchasable colour across the collection (seventeen at the time of writing). */
export const COLOUR_COUNT = PRODUCTS.reduce((n, p) => n + p.colourways.length, 0);
/** Cards shown before the visitor presses "View all". */
export const GRID_PREVIEW = 6;

export const STORE = {
  name: "The Linc, Kuala Lumpur",
  address: ["Lot 2-5, Second Floor, The Linc", "360, Jalan Tun Razak, 50400 Kuala Lumpur"],
  hours: CONFIG.support.hours,
  phone: CONFIG.support.phone,
  phoneHref: "tel:+60172500323",
  maps: "https://maps.google.com/?q=The+Linc+KL,+360+Jalan+Tun+Razak,+50400+Kuala+Lumpur",
  image: "visit_premise",
  popup: {
    name: "HOOR Pop-up Store",
    address: "KL East Mall, Lower Ground",
    maps: "https://maps.google.com/?q=KL+East+Mall,+Jalan+Taman+Melati,+Kuala+Lumpur",
  },
};

export const CLAIMS = ["Premium Cotton Silk", "Petite to Plus Size", "Sizes S/M – 4XL", "Pocket included", "Lightweight & flowy"];

export const OCCASIONS = [
  { label: "Office wear", note: "Easy movement at your desk and through long meetings, with pockets for your stationery and lanyard." },
  { label: "Celebration moments", note: "Elegant for Raya, birthdays, kenduri, and even as mak pengantin." },
  { label: "Holiday getaway", note: "Weighs only 400g, so your travel bag stays light. Designs made for your OOTD." },
  { label: "Umrah friendly", note: "Modest, full coverage, and comfortable through long days of ibadah and travel." },
];

export const FAQ: { q: string; a: string; cta?: "size" }[] = [
  { q: "How do I know which size to take?", a: "Measure around the fullest part of your bust and use the finder above; it reads straight off HOOR's A-Cutline Dress chart. The A-Cutline Dress is loose, hanging from the shoulder rather than fitting the waist. If you fall between two sizes, take the smaller one unless you want extra length.", cta: "size" },
  { q: "Is it see-through? Is it hot?", a: "The cotton silk is opaque and not see-through, including the light colours. Premium Cotton Silk is light, breathable and made for Malaysian weather." },
  { q: "Does it really have pockets?", a: "Yes. Side seam pockets on every piece, set into the A-Cutline Dress so they disappear when you are not using them. Deep enough for a phone." },
  { q: "When will it arrive?", a: "Your order is dispatched within 24 hours and arrives at your doorstep within 1–3 days. You get a tracking number the moment it ships." },
  { q: "What if it does not fit?", a: `You have ${CONFIG.policy.returnDays} days from delivery to post it back for an exchange or refund, unworn and with tags on. Return postage is on you; refunds are processed within ${CONFIG.policy.refundDays} working days. Email ${CONFIG.support.email} with your order number to start.` },
  { q: "Can I see the dresses in person?", a: `Yes. Visit us at:\nHOOR Boutique: Lot 2-5, Second Floor, The Linc KL, 360 Jalan Tun Razak, 50400 Kuala Lumpur\nHOOR Pop-up Store: KL East Mall, Lower Ground\nOpen every day from 10am to 9pm. Call or WhatsApp ${CONFIG.support.phone}.` },
  { q: "Is my payment secure?", a: "Payment is taken by HOOR's payment provider, not by this page. Card details are entered on the provider's own encrypted form and are never stored here. FPX sends you to your own bank's login." },
];

export const sku = (productId: string, colourwayId: string, size: Size) => `${productId}:${colourwayId}:${size}`.toUpperCase();
