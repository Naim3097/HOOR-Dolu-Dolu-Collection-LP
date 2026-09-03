"use client";
import { createContext, useContext } from "react";
import type { Product } from "@/lib/products";
import { registerImageMeta, type ImageMeta } from "@/lib/format";

const Ctx = createContext<{ products: Product[] }>({ products: [] });

/**
 * Hands the storefront the catalogue loaded by the page. Image metadata (blur
 * placeholder, size, rendered widths) is registered for the image helpers as a
 * side effect of rendering, on the server and again on the client.
 */
export function CatalogProvider({ products, images, children }: { products: Product[]; images: Record<string, ImageMeta>; children: React.ReactNode }) {
  registerImageMeta(images);
  return <Ctx.Provider value={{ products }}>{children}</Ctx.Provider>;
}
export const useCatalog = () => useContext(Ctx);
