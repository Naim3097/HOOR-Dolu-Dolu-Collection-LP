"use client";
import { useState } from "react";
import { PRODUCTS, CONFIG, COLOUR_COUNT, GRID_PREVIEW, type Product } from "@/lib/products";
import { money, numberWord } from "@/lib/format";
import { useStore, VARIANTS, lowStock } from "@/lib/store";
import { Ph } from "@/components/hoor/ph";
import { track } from "@/lib/tracking";

export function Shop() {
  const { filter, gridExpanded, dispatch, expandGrid } = useStore();
  const setFilter = (id: string | null) => {
    dispatch({ type: "filter", id });
    expandGrid();
    if (id) { VARIANTS.filter((v) => v.cw.id === id).forEach((v) => dispatch({ type: "cardColour", productId: v.product.id, colourwayId: id })); track("filter_colour", { colour: id }); }
  };
  return (
    <section className="shop wrap" id="shop">
      <div className="sect-head rv">
        <span className="label">The collection</span>
        <h2>Different prints, all in one A-Cutline Dress.</h2>
        <p className="sub">Pick a colour on the card to see it change. Everything is <span>{money(CONFIG.basePrice)}</span>, in every size we make.</p>
      </div>
      <div className="shop__bar rv" role="group" aria-label="Filter by colour">
        <span className="label">Colour</span>
        <div style={{ display: "contents" }}>
          <button className="chip" type="button" aria-pressed={filter === null} onClick={() => setFilter(null)}>All</button>
          {VARIANTS.map((v) => (
            <button key={v.key} className="chip" type="button" aria-pressed={filter === v.cw.id} onClick={() => setFilter(v.cw.id)}><i className="dot" style={{ background: v.cw.swatch }} />{v.cw.name}</button>
          ))}
        </div>
      </div>
      <div className="grid">{PRODUCTS.map((p, i) => <Card key={p.id} p={p} idx={i + 1} collapsed={!gridExpanded && !filter && i >= GRID_PREVIEW} />)}</div>
      {!gridExpanded && !filter && (
        <div className="grid__more">
          <button className="btn" type="button" onClick={expandGrid}>View all {numberWord(COLOUR_COUNT)} colours</button>
        </div>
      )}
    </section>
  );
}

function Card({ p, idx, collapsed }: { p: Product; idx: number; collapsed: boolean }) {
  const { cardColour, filter, dispatch, openProduct } = useStore();
  const cw = p.colourways.find((c) => c.id === cardColour[p.id]) ?? p.colourways[0];
  const hidden = collapsed || (!!filter && !p.colourways.some((c) => c.id === filter));
  const [hover, setHover] = useState(false);
  const wake = () => setHover(true);
  const pick = (id: string) => {
    const c = p.colourways.find((x) => x.id === id)!;
    dispatch({ type: "cardColour", productId: p.id, colourwayId: id });
    track("select_colour", { item_id: `${p.id}:${id}`, colour: c.name, item_name: p.name });
  };
  return (
    <article className={`card${hidden ? " is-hidden" : ""}`} data-product={p.id} onPointerEnter={wake} onFocus={wake}>
      <a className="card__media" href={`#${p.id}`} aria-label={`${p.name} in ${cw.name}, view details`} onClick={(e) => { e.preventDefault(); openProduct(`${p.id}:${cw.id}`); }}>
        <span className="card__idx">{String(idx).padStart(2, "0")}</span>
        <Ph as="span" name={cw.images[0]} alt={`${p.name} in ${cw.name}`} />
        {cw.images[1] && (hover ? <Ph as="span" name={cw.images[1]} alt="" /> : <span className="ph" aria-hidden="true" />)}
        <span className="btn btn--light card__quick">Select size</span>
      </a>
      <div className="card__info">
        <div className="card__name"><h3>{p.name}</h3><span className="price">{money(p.price)}</span></div>
        <p className="card__cw"><i className="cw-dot" style={{ background: cw.swatch }} /><span>{cw.name}</span></p>
        {p.colourways.length > 1 && (
          <div className="swatches" role="group" aria-label="Colour">
            {p.colourways.map((c) => <button key={c.id} className="swatch" type="button" aria-pressed={c.id === cw.id} aria-label={c.name} title={c.name} onClick={() => pick(c.id)}><i style={{ background: c.swatch }} /></button>)}
          </div>
        )}
        {CONFIG.showStockPressure && lowStock(cw) && <p className="stock-note">Low stock</p>}
      </div>
    </article>
  );
}
