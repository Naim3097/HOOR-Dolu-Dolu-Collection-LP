"use client";
import { useEffect, useRef, useState } from "react";
import { CONFIG, SIZES, SIZE_CHART, SIZE_LABELS, FABRIC, CARE, SHARED_DETAILS, COLOUR_COUNT, type Size } from "@/lib/products";
import { money, numberWord } from "@/lib/format";
import { useStore, keyOf, inStock, anyStock, type CartItem } from "@/lib/store";
import { Ph } from "@/components/hoor/ph";
import { Video } from "@/components/hoor/video";
import { Chart } from "@/components/hoor/fit";
import { LengthList } from "@/components/hoor/tail";
import { track } from "@/lib/tracking";
import { Checkout } from "@/components/hoor/checkout";

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

function Drawer({ id, title, open, wide, children, foot }: { id: string; title: React.ReactNode; open: boolean; wide?: boolean; children: React.ReactNode; foot?: React.ReactNode }) {
  const { close } = useStore();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open || !ref.current) return;
    const node = ref.current;
    requestAnimationFrame(() => node.querySelector<HTMLElement>(FOCUSABLE)?.focus());
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    addEventListener("keydown", trap); return () => removeEventListener("keydown", trap);
  }, [open]);
  return (
    <aside ref={ref} className={`drawer${wide ? " drawer--wide" : ""}${open ? " is-open" : ""}`} id={id} aria-hidden={!open} aria-labelledby={`${id}-t`} role="dialog" aria-modal="true">
      <div className="drawer__head"><span className="grip" /><h2 id={`${id}-t`}>{title}</h2><button className="x" onClick={close} aria-label="Close"><svg><use href="#i-x" /></svg></button></div>
      <div className="drawer__body">{children}</div>
      {foot !== undefined && <div className="drawer__foot" hidden={!foot}>{foot}</div>}
    </aside>
  );
}

export function Overlays() {
  const { overlay, close } = useStore();
  return (
    <>
      <div className={`scrim${overlay && overlay !== "checkout" ? " is-open" : ""}`} onClick={close} />
      <ProductDrawer open={overlay === "product"} />
      <CartDrawer open={overlay === "cart"} />
      <SizeDrawer open={overlay === "size"} />
      <Checkout open={overlay === "checkout"} />
      <Toast />
    </>
  );
}

/* ---------- product ---------- */
function ProductDrawer({ open }: { open: boolean }) {
  const { pd, dispatch, resolve, addToCart, close, open: openOverlay } = useStore();
  const [err, setErr] = useState(false);
  const slides = useRef<HTMLDivElement>(null);
  const [dot, setDot] = useState(0);
  const { product: p, colourway: cw } = resolve(pd ?? { productId: "", colourwayId: "" });
  const size = pd?.size ?? null, qty = pd?.qty ?? 1;
  const soldOut = !anyStock(cw);
  const cap = size ? Math.max(1, cw.stock[size]) : 9;
  const set = (patch: Partial<NonNullable<typeof pd>>) => pd && dispatch({ type: "pd", pd: { ...pd, ...patch } });
  const n = cw.images.length + (cw.video ? 1 : 0);

  const add = () => {
    if (!pd) return;
    if (!size) { setErr(true); slides.current?.parentElement?.parentElement?.querySelector(".sizes")?.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
    addToCart({ productId: p.id, colourwayId: cw.id, size, qty });
    close();
  };
  const sizeMsg = err ? "Please choose a size first." : soldOut ? "This colourway is fully sold out." : size
    ? (CONFIG.showStockPressure && cw.stock[size] <= 3 ? `Only ${cw.stock[size]} left in ${SIZE_LABELS[size]}.` : `Bust ${SIZE_CHART.data[size][1]}″ · Length ${SIZE_CHART.data[size][5]}″`)
    : "Choose a size to continue.";

  return (
    <Drawer id="dw-product" title="The piece" open={open} wide foot={pd && (
      <>
        <div className="pd__foot-price"><span className="k">{p.name} · {cw.name}{size ? ` · ${SIZE_LABELS[size]}` : ""}</span><span className="v">{money(p.price * qty)}</span></div>
        <button className="btn btn--solid btn--block" disabled={soldOut} onClick={add}>{soldOut ? "Sold out" : "Add to bag"}</button>
      </>
    )}>
      {pd && (
        <div className="pd" key={`${p.id}:${cw.id}`}>
          <div className="pd__gallery">
            <div className="pd__slides" ref={slides} onScroll={(e) => setDot(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
              {cw.images.map((im, i) => <Ph key={im} name={im} eager={i === 0} sizes="(min-width:860px) 46vw, 100vw" alt={`${p.name} in ${cw.name}, view ${i + 1}`} />)}
              {cw.video && open && <Video name={cw.video} caption="Campaign film" className="ph" />}
            </div>
            <div className="pd__dots" aria-hidden="true">{Array.from({ length: n }, (_, i) => <i key={i} className={i === dot ? "on" : ""} />)}</div>
          </div>
          <div className="pd__info">
            <span className="label eyebrow">{p.print}</span>
            <h3>{p.name}</h3>
            <p className="pd__cw">in {cw.name}</p>
            <p className="pd__price">{money(p.price)}</p>
            {p.colourways.length > 1 && (
              <div className="pd__block">
                <span className="label">Colour <span className="val">{cw.name}</span></span>
                <div className="swatches" role="group" aria-label="Colour">
                  {p.colourways.map((c) => (
                    <button key={c.id} className="swatch" type="button" aria-pressed={c.id === cw.id} aria-label={c.name} title={c.name} onClick={() => {
                      set({ colourwayId: c.id, size: size && inStock(c, size) ? size : null });
                      dispatch({ type: "cardColour", productId: p.id, colourwayId: c.id });
                      track("select_colour", { item_id: `${p.id}:${c.id}`, colour: c.name, item_name: p.name });
                      history.replaceState(null, "", `?p=${p.id}:${c.id}${location.hash}`);
                    }}><i style={{ background: c.swatch }} /></button>
                  ))}
                </div>
              </div>
            )}
            <div className="pd__block">
              <span className="label"><span>Size <span className="val">{size ? SIZE_LABELS[size] : ""}</span></span><button type="button" onClick={() => openOverlay("size")}>Size guide</button></span>
              <div className="sizes" role="group" aria-label="Size">
                {SIZES.map((s) => { const ok = inStock(cw, s); return (
                  <button key={s} className="size" type="button" aria-pressed={s === size} disabled={!ok} aria-label={`${SIZE_LABELS[s]}${ok ? "" : ", sold out"}`}
                    onClick={() => { setErr(false); set({ size: s, qty: 1 }); track("select_size", { item_id: `${p.id}:${cw.id}`, size: s, item_name: p.name, item_variant: cw.name }); }}>{SIZE_LABELS[s]}</button>); })}
              </div>
              <p className={`size-msg${err ? " err" : ""}`}>{sizeMsg}</p>
            </div>
            <div className="pd__block">
              <span className="label">Quantity</span>
              <div className="qty">
                <button type="button" aria-label="Decrease" disabled={qty <= 1} onClick={() => set({ qty: Math.max(1, qty - 1) })}>−</button>
                <output aria-live="polite">{qty}</output>
                <button type="button" aria-label="Increase" onClick={() => set({ qty: Math.min(cap, qty + 1) })}>+</button>
              </div>
            </div>
            <p className="pd__story">{p.story}</p>
            {p.note && <p className="pd__story" style={{ color: "var(--ink-55)", fontSize: "var(--t-small)", marginTop: ".5rem" }}>{p.note}</p>}
            <div className="acc">
              <details open><summary>The details<span className="pm" aria-hidden="true" /></summary><div className="acc__body"><ul>{SHARED_DETAILS.map((d) => <li key={d}>{d}</li>)}</ul></div></details>
              <details><summary>Fabric &amp; care<span className="pm" aria-hidden="true" /></summary><div className="acc__body"><p>{FABRIC}</p><p style={{ marginTop: ".6rem" }}>{CARE}</p></div></details>
              <details><summary>Size &amp; fit<span className="pm" aria-hidden="true" /></summary><div className="acc__body"><p>A-Cutline Dress, full length, hangs from the shoulder. Measurements are of the garment, in inches.</p><p style={{ marginTop: ".6rem" }}><button className="btn" onClick={() => openOverlay("size")}>Open the full chart</button></p></div></details>
              <details><summary>Delivery &amp; returns<span className="pm" aria-hidden="true" /></summary><div className="acc__body">
                <p>Dispatched within 24 hours, at your doorstep in 1–3 days. {money(CONFIG.shipping.west.rate)} to Semenanjung, {money(CONFIG.shipping.east.rate)} to Sabah, Sarawak &amp; Labuan{CONFIG.freeShippingOver ? `, free over ${money(CONFIG.freeShippingOver)}` : ""}.</p>
                <p style={{ marginTop: ".6rem" }}>{CONFIG.policy.returnDays} days to exchange or return, unworn with tags. Return postage is not covered.</p></div></details>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

/* ---------- cart line (shared with checkout summary) ---------- */
export function Line({ l, compact }: { l: CartItem; compact?: boolean }) {
  const { resolve, dispatch } = useStore();
  const { product, colourway } = resolve(l);
  const k = keyOf(l);
  return (
    <div className="ci">
      <div className="ci__media"><Ph as="span" name={colourway.images[0]} sizes="90px" /></div>
      <div>
        <div className="ci__top"><div><h4>{product.name}</h4><p className="meta">{colourway.name} · {SIZE_LABELS[l.size]}</p></div><span className="price">{money(product.price * l.qty)}</span></div>
        {compact ? <p className="meta" style={{ marginTop: ".35rem" }}>Qty {l.qty}</p> : (
          <div className="ci__bot">
            <div className="qty">
              <button type="button" aria-label="Decrease quantity" onClick={() => l.qty <= 1 ? dispatch({ type: "remove", key: k }) : dispatch({ type: "qty", key: k, delta: -1 })}>−</button>
              <output>{l.qty}</output>
              <button type="button" aria-label="Increase quantity" disabled={l.qty >= colourway.stock[l.size]} onClick={() => dispatch({ type: "qty", key: k, delta: 1 })}>+</button>
            </div>
            <button className="rm" type="button" onClick={() => dispatch({ type: "remove", key: k })}>Remove</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Totals({ subtotal, shipping, regionLabel, grandLabel = "Total", style }: { subtotal: number; shipping: number; regionLabel: string; grandLabel?: string; style?: React.CSSProperties }) {
  return (
    <div className="totals" style={style}>
      <div><span>Subtotal</span><span>{money(subtotal)}</span></div>
      <div><span>Delivery <span className="muted">· {regionLabel}</span></span><span>{shipping === 0 ? "Free" : money(shipping)}</span></div>
      <div className="grand"><span>{grandLabel}</span><span>{money(subtotal + shipping)}</span></div>
    </div>
  );
}

function CartDrawer({ open }: { open: boolean }) {
  const { items, count, subtotal, close, open: openOverlay } = useStore();
  const free = CONFIG.freeShippingOver;
  const ship = free && subtotal >= free ? 0 : CONFIG.shipping.west.rate;
  const total = subtotal + ship;
  return (
    <Drawer id="dw-cart" title={<>Your bag <span>{count ? `(${count})` : ""}</span></>} open={open} foot={items.length ? (
      <>
        <Totals subtotal={subtotal} shipping={ship} regionLabel={CONFIG.shipping.west.label} />
        <button className="btn btn--solid btn--block" onClick={() => { openOverlay("checkout"); track("begin_checkout", { value: total, num_items: count, content_ids: items.map((i) => `${i.productId}:${i.colourwayId}`) }); }}>Checkout · {money(total)}</button>
        <p className="co__note" style={{ marginTop: ".75rem", textAlign: "center" }}>Delivery is confirmed at checkout once we know your state.</p>
      </>
    ) : null}>
      {!items.length ? (
        <div className="cart__empty">
          <span className="serif">Your bag is empty.</span>
          <p>{numberWord(COLOUR_COUNT, true)} colours are waiting. Everything is {money(CONFIG.basePrice)}.</p>
          <p style={{ marginTop: "1.5rem" }}><button className="btn" onClick={() => { close(); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}>See the collection</button></p>
        </div>
      ) : (
        <>
          {free && (
            <div className="ship-nudge">
              {free - subtotal > 0 ? <>Add <b>{money(free - subtotal)}</b> for free delivery.</> : <><b>Free delivery</b> unlocked.</>}
              <div className="bar"><i style={{ width: `${Math.min(100, (subtotal / free) * 100)}%` }} /></div>
            </div>
          )}
          {items.map((l) => <Line key={keyOf(l)} l={l} />)}
        </>
      )}
    </Drawer>
  );
}

function SizeDrawer({ open }: { open: boolean }) {
  const { close } = useStore();
  return (
    <Drawer id="dw-size" title={<>Size &amp; fit</>} open={open}>
      <div style={{ padding: "1.5rem var(--gut) 2rem" }}>
        <p style={{ color: "var(--ink-80)", maxWidth: "44ch" }}>Every piece is the same A-Cutline Dress. It hangs from the shoulder, so the bust measurement is the one that decides your size.</p>
        <div className="chart-scroll" style={{ marginTop: "1.5rem" }}><Chart /></div>
        <p className="chart__note">{SIZE_CHART.note}</p>
        <div style={{ marginTop: "2rem", borderTop: "1px solid var(--line)", paddingTop: "1.5rem" }}>
          <h3 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: "1.3rem", marginBottom: ".75rem" }}>Length, by size</h3>
          <LengthList />
        </div>
        <p style={{ marginTop: "1.75rem" }}><button className="btn" onClick={() => { close(); document.getElementById("fit")?.scrollIntoView({ behavior: "smooth" }); setTimeout(() => document.getElementById("bust")?.focus(), 650); }}>Use the size finder</button></p>
      </div>
    </Drawer>
  );
}

function Toast() {
  const { toast, dispatch, open } = useStore();
  const [dismissed, setDismissed] = useState<number | null>(null);
  const shown = !!toast && dismissed !== toast.n;
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setDismissed(toast.n), 4200);
    return () => clearTimeout(t);
  }, [toast]);
  return (
    <div className={`toast${shown ? " is-shown" : ""}`} aria-live="polite">
      {toast && <>
        <Ph as="span" name={toast.img} sizes="40px" />
        <span>Added: {toast.text}</span>
        <button type="button" onClick={() => { setDismissed(toast.n); dispatch({ type: "toast", toast: null }); open("cart"); }}>View bag</button>
      </>}
    </div>
  );
}
