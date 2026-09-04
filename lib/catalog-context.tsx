"use client";
import { createContext, useContext } from "react";
import { CONFIG, type Product } from "@/lib/products";
import type { StoreSettings } from "@/lib/catalog";
import { registerImageMeta, type ImageMeta } from "@/lib/format";

const FALLBACK: StoreSettings = { email: CONFIG.support.email, phone: CONFIG.support.phone, whatsapp: CONFIG.support.whatsapp, hours: CONFIG.support.hours, instagram: CONFIG.support.instagram, freeShippingOver: CONFIG.freeShippingOver, west: CONFIG.shipping.west.rate, east: CONFIG.shipping.east.rate, returnDays: CONFIG.policy.returnDays, shippingMode: "zone" };
const Ctx = createContext<{ products: Product[]; settings: StoreSettings }>({ products: [], settings: FALLBACK });

/**
 * Hands the storefront the catalogue loaded by the page. Image metadata (blur
 * placeholder, size, rendered widths) is registered for the image helpers as a
 * side effect of rendering, on the server and again on the client.
 */
export function CatalogProvider({ products, images, settings, children }: { products: Product[]; images: Record<string, ImageMeta>; settings?: StoreSettings; children: React.ReactNode }) {
  registerImageMeta(images);
  return <Ctx.Provider value={{ products, settings: settings ?? FALLBACK }}>{children}</Ctx.Provider>;
}
export const useCatalog = () => useContext(Ctx);
