"use client";
import { createContext, useContext, useEffect, useMemo, useReducer, useCallback, useRef } from "react";
import { PRODUCTS, CONFIG, SIZES, type Size, type Product, type Colourway, sku } from "@/lib/products";
import { track } from "@/lib/tracking";

export type CartItem = { productId: string; colourwayId: string; size: Size; qty: number };
export type Overlay = "product" | "cart" | "size" | "checkout" | null;
export type PD = { productId: string; colourwayId: string; size: Size | null; qty: number };
type Toast = { text: string; img: string; n: number } | null;

type State = { items: CartItem[]; overlay: Overlay; pd: PD | null; cardColour: Record<string, string>; filter: string | null; toast: Toast; gridExpanded: boolean };
type Action =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; item: CartItem }
  | { type: "qty"; key: string; delta: number }
  | { type: "remove"; key: string }
  | { type: "clear" }
  | { type: "overlay"; overlay: Overlay }
  | { type: "pd"; pd: PD | null }
  | { type: "cardColour"; productId: string; colourwayId: string }
  | { type: "filter"; id: string | null }
  | { type: "expandGrid" }
  | { type: "toast"; toast: Toast };

export const keyOf = (i: { productId: string; colourwayId: string; size: Size }) => sku(i.productId, i.colourwayId, i.size);
export const inStock = (cw: Colourway, s: Size) => (cw.stock?.[s] ?? 0) > 0;
export const anyStock = (cw: Colourway) => SIZES.some((s) => inStock(cw, s));
export const lowStock = (cw: Colourway) => SIZES.reduce((n, s) => n + (cw.stock?.[s] || 0), 0) <= 6;
export const VARIANTS = PRODUCTS.flatMap((p) => p.colourways.map((c) => ({ product: p, cw: c, key: `${p.id}:${c.id}` })));

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "hydrate": return { ...s, items: a.items };
    case "add": {
      const k = keyOf(a.item), ex = s.items.find((i) => keyOf(i) === k);
      return { ...s, items: ex ? s.items.map((i) => (keyOf(i) === k ? { ...i, qty: i.qty + a.item.qty } : i)) : [...s.items, a.item] };
    }
    case "qty": return { ...s, items: s.items.map((i) => (keyOf(i) === a.key ? { ...i, qty: Math.max(1, i.qty + a.delta) } : i)) };
    case "remove": return { ...s, items: s.items.filter((i) => keyOf(i) !== a.key) };
    case "clear": return { ...s, items: [] };
    case "overlay": return { ...s, overlay: a.overlay };
    case "pd": return { ...s, pd: a.pd };
    case "cardColour": return { ...s, cardColour: { ...s.cardColour, [a.productId]: a.colourwayId } };
    case "filter": return { ...s, filter: a.id };
    case "expandGrid": return s.gridExpanded ? s : { ...s, gridExpanded: true };
    case "toast": return { ...s, toast: a.toast };
  }
}

type Ctx = State & {
  dispatch: (a: Action) => void;
  open: (o: Exclude<Overlay, null>) => void;
  close: () => void;
  openProduct: (key: string, size?: Size | null) => void;
  expandGrid: () => void;
  addToCart: (item: CartItem) => void;
  count: number; subtotal: number;
  resolve: (i: { productId: string; colourwayId: string }) => { product: Product; colourway: Colourway };
};
const C = createContext<Ctx | null>(null);
const LS = "hoor_ddl_cart_v2";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], overlay: null, pd: null, cardColour: {}, filter: null, toast: null, gridExpanded: false });
  const lastFocus = useRef<Element | null>(null);

  const resolve = useCallback((i: { productId: string; colourwayId: string }) => {
    const product = PRODUCTS.find((p) => p.id === i.productId) ?? PRODUCTS[0];
    const colourway = product.colourways.find((c) => c.id === i.colourwayId) ?? product.colourways[0];
    return { product, colourway };
  }, []);

  const open = useCallback((o: Exclude<Overlay, null>) => {
    lastFocus.current = document.activeElement;
    dispatch({ type: "overlay", overlay: o });
    if (o === "cart") track("view_cart", { value: state.items.reduce((n, i) => n + i.qty * CONFIG.basePrice, 0), content_ids: state.items.map((i) => `${i.productId}:${i.colourwayId}`) });
    if (o === "size") track("view_size_guide");
  }, [state.items]);

  const close = useCallback(() => {
    dispatch({ type: "overlay", overlay: null });
    if (location.search.includes("p=")) history.replaceState(null, "", location.pathname + location.hash);
    (lastFocus.current as HTMLElement | null)?.focus?.();
  }, []);

  const openProduct = useCallback((key: string, size: Size | null = null) => {
    const v = VARIANTS.find((x) => x.key === key) ?? VARIANTS[0];
    const preferred = size && inStock(v.cw, size) ? size : null;
    dispatch({ type: "pd", pd: { productId: v.product.id, colourwayId: v.cw.id, size: preferred, qty: 1 } });
    lastFocus.current = document.activeElement;
    dispatch({ type: "overlay", overlay: "product" });
    history.replaceState(null, "", `?p=${v.key}${preferred ? `&size=${preferred}` : ""}${location.hash}`);
    track("view_item", { item_id: v.key, item_name: v.product.name, item_variant: v.cw.name, value: v.product.price, currency: CONFIG.currency });
  }, []);

  /* First six cards show until the visitor asks for more; a filter or deep link opens the whole range. */
  const expandGrid = useCallback(() => { dispatch({ type: "expandGrid" }); track("grid_expand"); }, []);

  const addToCart = useCallback((item: CartItem) => {
    dispatch({ type: "add", item });
    const { product, colourway } = resolve(item);
    track("add_to_cart", { item_id: `${item.productId}:${item.colourwayId}`, item_name: product.name, item_variant: colourway.name, size: item.size, quantity: item.qty, value: product.price * item.qty, currency: CONFIG.currency });
    dispatch({ type: "toast", toast: { text: `${product.name} · ${colourway.name} · ${item.size}`, img: colourway.images[0], n: Date.now() } });
  }, [resolve]);

  useEffect(() => {
    try { const raw = localStorage.getItem(LS); if (raw) dispatch({ type: "hydrate", items: JSON.parse(raw) }); } catch {}
    const q = new URLSearchParams(location.search), p = q.get("p");
    if (p) { const [pid, cid] = p.split(":"); const v = VARIANTS.find((x) => x.product.id === pid && (!cid || x.cw.id === cid)); if (v) { dispatch({ type: "expandGrid" }); openProduct(v.key, q.get("size") as Size | null); } }
  }, [openProduct]);
  useEffect(() => { try { localStorage.setItem(LS, JSON.stringify(state.items)); } catch {} }, [state.items]);
  useEffect(() => { document.body.classList.toggle("is-locked", !!state.overlay); }, [state.overlay]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && state.overlay) close(); };
    addEventListener("keydown", onKey); return () => removeEventListener("keydown", onKey);
  }, [state.overlay, close]);

  const value = useMemo<Ctx>(() => ({
    ...state, dispatch, open, close, openProduct, expandGrid, addToCart, resolve,
    count: state.items.reduce((n, i) => n + i.qty, 0),
    subtotal: state.items.reduce((n, i) => n + i.qty * CONFIG.basePrice, 0),
  }), [state, open, close, openProduct, expandGrid, addToCart, resolve]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useStore() { const c = useContext(C); if (!c) throw new Error("useStore outside StoreProvider"); return c; }
