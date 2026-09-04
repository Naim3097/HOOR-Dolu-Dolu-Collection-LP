import "server-only";
import { supabaseAnon, supabaseAdmin } from "@/lib/supabase/server";
import { SIZES, type Product, type Colourway, type Size } from "@/lib/products";

export type ImageMeta = { lqip: string; dims: [number, number]; widths: number[] };
export type StoreSettings = { email: string; phone: string; whatsapp: string; hours: string; instagram: string; freeShippingOver: number | null; west: number; east: number; returnDays: number; shippingMode: "zone" | "courier" };
export type Catalog = { products: Product[]; images: Record<string, ImageMeta>; settings: StoreSettings };
const toSettings = (s: Record<string, unknown> | null): StoreSettings => ({
  email: (s?.store_email as string) ?? "hooriemodestwear@gmail.com", phone: (s?.store_phone as string) ?? "+60 17-250 0323", whatsapp: (s?.whatsapp as string) ?? "60172500323",
  hours: (s?.hours as string) ?? "Every day, 10am – 9pm", instagram: (s?.instagram as string) ?? "@we.are.hoor",
  freeShippingOver: s?.free_shipping_threshold_sen == null ? null : (s.free_shipping_threshold_sen as number) / 100,
  west: ((s?.west_rate_sen as number) ?? 800) / 100, east: ((s?.east_rate_sen as number) ?? 1500) / 100, returnDays: (s?.return_days as number) ?? 7,
  shippingMode: ((s?.domestic_shipping_mode as "zone" | "courier") ?? "zone"),
});

type ProductRow = { id: string; name: string; print: string; story: string; note: string | null; price_sen: number; published: boolean; position: number };
type CwRow = { product_id: string; id: string; name: string; swatch: string; video: string | null; position: number };
type ImgRow = { id: number; product_id: string; colourway_id: string; name: string; width: number; height: number; widths: number[]; lqip: string; position: number };
type VarRow = { sku: string; product_id: string; colourway_id: string; size: Size; stock: number };

function assemble(products: ProductRow[], cws: CwRow[], imgs: ImgRow[], vars: VarRow[]): Omit<Catalog, "settings"> {
  const images: Record<string, ImageMeta> = {};
  for (const i of imgs) images[i.name] = { lqip: i.lqip, dims: [i.width, i.height], widths: i.widths };
  const out: Product[] = products.map((p) => ({
    id: p.id, name: p.name, print: p.print, story: p.story, note: p.note ?? undefined, price: p.price_sen / 100,
    colourways: cws.filter((c) => c.product_id === p.id).map<Colourway>((c) => {
      const stock = Object.fromEntries(SIZES.map((s) => [s, 0])) as Record<Size, number>;
      for (const v of vars) if (v.product_id === p.id && v.colourway_id === c.id) stock[v.size] = v.stock;
      return { id: c.id, name: c.name, swatch: c.swatch, video: c.video, stock, images: imgs.filter((i) => i.product_id === p.id && i.colourway_id === c.id).map((i) => i.name) };
    }),
  }));
  return { products: out, images };
}

/** Published catalogue for the storefront, via the anon key (RLS hides unpublished pieces). */
export async function loadCatalog(): Promise<Catalog> {
  const db = supabaseAnon();
  const [{ data: p }, { data: c }, { data: i }, { data: v }, { data: s }] = await Promise.all([
    db.from("products").select("*").eq("published", true).order("position"),
    db.from("colourways").select("*").order("position"),
    db.from("product_images").select("*").order("position"),
    db.from("variants").select("sku,product_id,colourway_id,size,stock"),
    db.from("store_settings").select("store_email,store_phone,whatsapp,hours,instagram,free_shipping_threshold_sen,west_rate_sen,east_rate_sen,return_days,domestic_shipping_mode").eq("id", 1).maybeSingle(),
  ]);
  return { ...assemble((p ?? []) as ProductRow[], (c ?? []) as CwRow[], (i ?? []) as ImgRow[], (v ?? []) as VarRow[]), settings: toSettings(s) };
}

/** Everything, published or not, for the back office. */
export async function loadCatalogAdmin() {
  const db = supabaseAdmin();
  const [{ data: p }, { data: c }, { data: i }, { data: v }] = await Promise.all([
    db.from("products").select("*").order("position"),
    db.from("colourways").select("*").order("position"),
    db.from("product_images").select("*").order("position"),
    db.from("variants").select("sku,product_id,colourway_id,size,stock"),
  ]);
  const rows = { products: (p ?? []) as ProductRow[], colourways: (c ?? []) as CwRow[], images: (i ?? []) as ImgRow[], variants: (v ?? []) as VarRow[] };
  const { data: s } = await db.from("store_settings").select("*").eq("id", 1).maybeSingle();
  return { ...assemble(rows.products, rows.colourways, rows.images, rows.variants), settings: toSettings(s), rows };
}

/** Names for order lines that predate the snapshot columns. */
export async function productNames() {
  const db = supabaseAdmin();
  const [{ data: p }, { data: c }] = await Promise.all([db.from("products").select("id,name"), db.from("colourways").select("product_id,id,name")]);
  return (pid: string, cid: string) => ({
    product: p?.find((x) => x.id === pid)?.name ?? pid.toUpperCase(),
    colour: c?.find((x) => x.product_id === pid && x.id === cid)?.name ?? cid,
  });
}
