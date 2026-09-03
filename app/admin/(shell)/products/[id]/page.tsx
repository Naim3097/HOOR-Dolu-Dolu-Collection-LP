import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCatalogAdmin } from "@/lib/catalog";
import { supabaseAdmin } from "@/lib/supabase/server";
import { registerImageMeta, imgSrc } from "@/lib/format";
import { PageHead, Pill } from "@/components/admin/ui";
import { ProductForm, ColourwayEditor, DeleteProduct } from "@/components/admin/product-editor";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { images, rows } = await loadCatalogAdmin();
  registerImageMeta(images);
  const p = rows.products.find((x) => x.id === id);
  if (!p) notFound();
  const cws = rows.colourways.filter((c) => c.product_id === id);
  const imgs = rows.images.filter((i) => i.product_id === id).map((i) => ({ ...i, thumb: imgSrc(i.name, 480) }));
  const vars = rows.variants.filter((v) => v.product_id === id);
  const { data: moves } = await supabaseAdmin().from("stock_movements").select("*").in("sku", vars.map((v) => v.sku)).order("created_at", { ascending: false }).limit(40);
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/products" className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-55)]">← Products</Link>
        <PageHead title={p.name} sub="Edit details, colours, photos and ledger-tracked stock." action={<Pill value={p.published ? "active" : "inactive"} />} />
      </div>
      <ProductForm product={{ id: p.id, name: p.name, print: p.print, story: p.story, note: p.note ?? "", priceRm: p.price_sen / 100, published: p.published, position: p.position }} />
      {cws.map((c) => (
        <ColourwayEditor key={c.id} productId={id} colourway={c} images={imgs.filter((i) => i.colourway_id === c.id)} variants={vars.filter((v) => v.colourway_id === c.id)} movements={(moves ?? []).filter((m) => m.sku.startsWith(`${id}:${c.id}:`.toUpperCase()))} />
      ))}
      <ColourwayEditor productId={id} position={cws.length + 1} />
      <DeleteProduct id={id} />
    </div>
  );
}
