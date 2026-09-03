"use client";

/** Same event map as landing/js/app.js; pushes to dataLayer and mirrors to Meta Pixel. */
const META: Record<string, string> = {
  page_view: "PageView",
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  view_cart: "ViewCart",
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
  contact_whatsapp: "Contact",
  purchase: "Purchase",
};

export type TrackEvent =
  | "page_view" | "scroll_depth" | "cta_click" | "filter_colour" | "select_colour" | "view_item"
  | "select_size" | "view_size_guide" | "size_finder" | "faq_open" | "add_to_cart" | "view_cart"
  | "begin_checkout" | "add_shipping_info" | "select_payment_method" | "add_payment_info"
  | "play_video" | "contact_whatsapp" | "grid_expand" | "visit_maps" | "select_promotion" | "purchase";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

export function track(event: TrackEvent, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const payload = { event, ...data };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  const fb = META[event];
  if (fb && typeof window.fbq === "function") window.fbq("track", fb, data);
  if (new URLSearchParams(window.location.search).get("debug") === "1") console.log("[track]", payload);
}

/** Every URL param the visitor arrived with (utm_*, fbclid, ad ids) — goes into the order payload. */
export function attribution(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return Object.fromEntries(new URLSearchParams(window.location.search));
}
