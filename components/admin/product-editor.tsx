"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProduct, deleteProduct, saveColourway, deleteColourway, uploadProductImage, deleteProductImage, moveProductImage, adjustStock, type ProductInput } from "@/app/admin/actions-catalog";
import type { ActionResult } from "@/app/admin/actions";
import { SIZES, SIZE_LABELS, type Size } from "@/lib/products";
import { Card, CardHead, Field, inputCls, btnCls, btnGhostCls, fmtDate } from "@/components/admin/ui";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const run = <T extends ActionResult>(fn: () => Promise<T>, after?: (r: T) => void, msg = "Saved") => start(async () => {
    setError(null); setDone(null);
    const r = await fn();
    if (!r.ok) setError(r.error); else { setDone(msg); after?.(r); router.refresh(); }
  });
  return { pending, error, done, run };
}
const Msg = ({ error, done }: { error: string | null; done: string | null }) => error ? <p className="text-[13px] text-rose-700">{error}</p> : done ? <p className="text-[13px] text-emerald-700">{done}</p> : null;

export function ProductForm({ product }: { product?: ProductInput }) {
  const router = useRouter();
  const { pending, error, done, run } = useAction();
  const [f, setF] = useState<ProductInput>(product ?? { name: "", print: "", story: "", note: "", priceRm: 199, published: false, position: 99 });
  const set = (k: keyof ProductInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.type === "number" ? Number(e.target.value) : e.target.value });
  return (
    <Card>
      <CardHead title="Details" />
      <form className="space-y-4 px-5 py-5" onSubmit={(e) => { e.preventDefault(); run(() => saveProduct(f), (r) => { if (!product && r.id) router.push(`/admin/products/${r.id}`); }); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" hint={product ? `Slug: ${product.id}` : "The slug is made from the name and cannot change later."}><input className={inputCls} value={f.name} onChange={set("name")} required /></Field>
          <Field label="Print" hint="Short, e.g. Painted floral batik"><input className={inputCls} value={f.print} onChange={set("print")} /></Field>
        </div>
        <Field label="Story" hint="One or two sentences shown in the product drawer."><textarea className={`${inputCls} min-h-20`} value={f.story} onChange={set("story")} /></Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem_6rem_auto]">
          <Field label="Note (optional)" hint="Small print under the story, e.g. Shown styled with a shawl."><input className={inputCls} value={f.note} onChange={set("note")} /></Field>
          <Field label="Price (RM)"><input className={inputCls} type="number" step="0.01" min="0" value={f.priceRm} onChange={set("priceRm")} required /></Field>
          <Field label="Order"><input className={inputCls} type="number" value={f.position} onChange={set("position")} /></Field>
          <label className="flex items-end gap-2 pb-2 text-[13px]"><input type="checkbox" checked={f.published} onChange={set("published")} /> Published</label>
        </div>
        <div className="flex items-center gap-4"><button className={btnCls} disabled={pending}>{product ? "Save details" : "Create piece"}</button><Msg error={error} done={done} /></div>
      </form>
    </Card>
  );
}

export function DeleteProduct({ id }: { id: string }) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  return (
    <div className="flex items-center gap-4 text-[13px]">
      <button className={`${btnGhostCls} border-rose-300 text-rose-700 hover:border-rose-700`} disabled={pending} onClick={() => { if (confirm("Delete this piece, its colours, photos and stock records? Orders that reference it will block the delete.")) run(() => deleteProduct(id), () => router.push("/admin/products")); }}>Delete piece</button>
      {error && <span className="text-rose-700">{error}</span>}
      <span className="text-[var(--ink-55)]">Prefer unpublishing: the piece disappears from the site but its history stays.</span>
    </div>
  );
}

type Cw = { id: string; name: string; swatch: string; video: string | null; position: number };
type Img = { id: number; name: string; width: number; height: number; position: number; thumb: string };
type Var = { sku: string; size: Size; stock: number };
type Move = { id: number; sku: string; type: string; qty_delta: number; reason: string | null; actor: string | null; order_ref: string | null; created_at: string };

export function ColourwayEditor({ productId, colourway, images = [], variants = [], movements = [], position }: { productId: string; colourway?: Cw; images?: Img[]; variants?: Var[]; movements?: Move[]; position?: number }) {
  const { pending, error, done, run } = useAction();
  const [f, setF] = useState({ name: colourway?.name ?? "", swatch: colourway?.swatch ?? "#888888", video: colourway?.video ?? "", position: colourway?.position ?? position ?? 1 });
  const [open, setOpen] = useState(!!colourway);
  if (!colourway && !open) return <button className={btnGhostCls} onClick={() => setOpen(true)}>+ Add colour</button>;
  return (
    <Card>
      <CardHead title={colourway ? `Colour · ${colourway.name}` : "New colour"} action={colourway && <span className="inline-block h-4 w-4 border border-[var(--line)]" style={{ background: colourway.swatch }} />} />
      <form className="space-y-3 px-5 py-4" onSubmit={(e) => { e.preventDefault(); run(() => saveColourway({ productId, id: colourway?.id, ...f })); }}>
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem_1fr_5rem]">
          <Field label="Colour name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
          <Field label="Swatch"><div className="flex gap-2"><input type="color" className="h-9 w-10 border border-[var(--line)]" value={f.swatch} onChange={(e) => setF({ ...f, swatch: e.target.value })} /><input className={inputCls} value={f.swatch} onChange={(e) => setF({ ...f, swatch: e.target.value })} /></div></Field>
          <Field label="Film (optional)" hint="Base name of a film in the bucket, e.g. senja_midnight"><input className={inputCls} value={f.video} onChange={(e) => setF({ ...f, video: e.target.value })} /></Field>
          <Field label="Order"><input className={inputCls} type="number" value={f.position} onChange={(e) => setF({ ...f, position: Number(e.target.value) })} /></Field>
        </div>
        <div className="flex items-center gap-4">
          <button className={btnGhostCls} disabled={pending}>{colourway ? "Save colour" : "Add colour"}</button>
          {colourway && <button type="button" className="text-[11px] uppercase tracking-[0.14em] text-rose-700 underline" onClick={() => { if (confirm(`Remove ${colourway.name}? Its photos and stock records go too.`)) run(() => deleteColourway(productId, colourway.id)); }}>Remove</button>}
          <Msg error={error} done={done} />
        </div>
      </form>
      {colourway && (
        <>
          <Photos productId={productId} colourwayId={colourway.id} images={images} />
          <Stock variants={variants} movements={movements} />
        </>
      )}
    </Card>
  );
}

function Photos({ productId, colourwayId, images }: { productId: string; colourwayId: string; images: Img[] }) {
  const { pending, error, done, run } = useAction();
  const file = useRef<HTMLInputElement>(null);
  const [type, setType] = useState("full");
  return (
    <div className="border-t border-[var(--line-soft)] px-5 py-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-55)]">Photos · first one is the card image</p>
      <div className="flex flex-wrap gap-3">
        {images.map((i, idx) => (
          <figure key={i.id} className="w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.thumb} alt="" className="h-32 w-24 object-cover" />
            <figcaption className="mt-1 flex items-center justify-between text-[10px] text-[var(--ink-55)]">
              <span>{idx === 0 ? "card" : idx + 1} · {i.width}px</span>
              <span className="flex gap-1">
                <button type="button" title="Move earlier" disabled={pending || idx === 0} onClick={() => run(() => moveProductImage(i.id, -1))}>←</button>
                <button type="button" title="Move later" disabled={pending || idx === images.length - 1} onClick={() => run(() => moveProductImage(i.id, 1))}>→</button>
                <button type="button" title="Delete" className="text-rose-700" disabled={pending} onClick={() => { if (confirm("Delete this photo?")) run(() => deleteProductImage(i.id), undefined, "Deleted"); }}>×</button>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(); fd.set("productId", productId); fd.set("colourwayId", colourwayId); fd.set("type", type); const f = file.current?.files?.[0]; if (!f) return; fd.set("file", f); run(() => uploadProductImage(fd), () => { if (file.current) file.current.value = ""; }, "Uploaded"); }}>
        <Field label="Add a photo" hint="JPEG, PNG or WebP up to 10 MB. Rendered to WebP at 480, 900 and 1400px."><input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="text-[13px]" required /></Field>
        <Field label="Kind"><select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}><option value="full">full</option><option value="detail">detail</option><option value="back">back</option></select></Field>
        <button className={btnGhostCls} disabled={pending}>{pending ? "Uploading…" : "Upload"}</button>
        <Msg error={error} done={done} />
      </form>
    </div>
  );
}

function Stock({ variants, movements }: { variants: Var[]; movements: Move[] }) {
  const { pending, error, done, run } = useAction();
  const [sku, setSku] = useState(variants[0]?.sku ?? "");
  const [delta, setDelta] = useState("1");
  const [type, setType] = useState<"restock" | "adjustment">("restock");
  const [reason, setReason] = useState("");
  const bySize = new Map(variants.map((v) => [v.size, v]));
  return (
    <div className="border-t border-[var(--line-soft)] px-5 py-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-55)]">Stock on hand</p>
      <div className="grid grid-cols-5 gap-2 text-center">
        {SIZES.map((s) => { const v = bySize.get(s); return <div key={s} className={`border px-2 py-2 ${v && v.stock === 0 ? "border-rose-300 bg-rose-50" : "border-[var(--line)]"}`}><p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-55)]">{SIZE_LABELS[s]}</p><p className="text-lg [font-variant-numeric:tabular-nums]">{v?.stock ?? "—"}</p></div>; })}
      </div>
      <form className="mt-4 grid items-end gap-3 sm:grid-cols-[8rem_6rem_9rem_1fr_auto]" onSubmit={(e) => { e.preventDefault(); run(() => adjustStock(sku, Number(delta), type, reason), () => setReason(""), "Stock updated"); }}>
        <Field label="Size"><select className={inputCls} value={sku} onChange={(e) => setSku(e.target.value)}>{variants.map((v) => <option key={v.sku} value={v.sku}>{SIZE_LABELS[v.size]}</option>)}</select></Field>
        <Field label="± Units"><input className={inputCls} type="number" step="1" value={delta} onChange={(e) => setDelta(e.target.value)} required /></Field>
        <Field label="Type"><select className={inputCls} value={type} onChange={(e) => setType(e.target.value as "restock" | "adjustment")}><option value="restock">Restock</option><option value="adjustment">Correction</option></select></Field>
        <Field label="Reason"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. 20 pcs from supplier, stocktake 3 Sep" required /></Field>
        <button className={btnGhostCls} disabled={pending}>Apply</button>
      </form>
      <Msg error={error} done={done} />
      {movements.length > 0 && (
        <details className="mt-4"><summary className="cursor-pointer text-[11px] uppercase tracking-[0.14em] text-[var(--ink-55)]">Movement history ({movements.length})</summary>
          <ul className="mt-2 divide-y divide-[var(--line-soft)] text-[12px]">{movements.map((m) => <li key={m.id} className="flex flex-wrap justify-between gap-2 py-1.5"><span><b className={m.qty_delta < 0 ? "text-rose-700" : "text-emerald-700"}>{m.qty_delta > 0 ? "+" : ""}{m.qty_delta}</b> {SIZE_LABELS[m.sku.split(":")[2] as Size] ?? m.sku} · {m.type}{m.reason ? ` · ${m.reason}` : ""}{m.order_ref ? ` · ${m.order_ref}` : ""}</span><span className="text-[var(--ink-55)]">{m.actor} · {fmtDate(m.created_at)}</span></li>)}</ul>
        </details>
      )}
    </div>
  );
}
