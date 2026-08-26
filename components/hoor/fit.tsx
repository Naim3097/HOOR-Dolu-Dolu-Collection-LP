"use client";
import { useState } from "react";
import { CONFIG, FIT_RULES, LENGTH_GUIDE, SIZES, SIZE_CHART, SIZE_LABELS, type Size } from "@/lib/products";
import { useStore } from "@/lib/store";
import { track } from "@/lib/tracking";

export const recommend = (inches: number) => FIT_RULES.find((r) => inches <= r.max)?.size ?? null;

export function Chart({ rec }: { rec?: Size | null }) {
  return (
    <table className="chart">
      <caption className="sr">HOOR A-Cut size chart in inches</caption>
      <thead><tr><th scope="col">Inches</th>{SIZES.map((s) => <th key={s} scope="col">{SIZE_LABELS[s]}</th>)}</tr></thead>
      <tbody>{SIZE_CHART.rows.map((row, i) => <tr key={row}><th scope="row">{row}</th>{SIZES.map((s) => <td key={s} className={s === rec ? "is-rec" : ""}>{SIZE_CHART.data[s][i]}</td>)}</tr>)}</tbody>
    </table>
  );
}

export function Fit() {
  const { close } = useStore();
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [val, setVal] = useState("");
  const raw = parseFloat(val);
  const inches = unit === "cm" ? raw / 2.54 : raw;
  const size = !raw || Number.isNaN(raw) ? undefined : inches < 24 || inches > 70 ? "off" : recommend(inches);
  const g = size && size !== "off" ? LENGTH_GUIDE.find((l) => l.size === size) : null;

  const switchUnit = (next: "in" | "cm") => {
    if (next === unit) return;
    if (!Number.isNaN(raw)) setVal(String(next === "cm" ? Math.round(raw * 2.54) : Math.round((raw / 2.54) * 2) / 2));
    setUnit(next);
  };
  return (
    <section className="fit wrap" id="fit">
      <div className="sect-head rv">
        <span className="label">Size &amp; fit</span>
        <h2>Find your size in ten seconds.</h2>
        <p className="sub">One measurement is enough. The cut is loose and A-line, so it hangs from the shoulder. Your waist and hip do not decide the size.</p>
      </div>
      <div className="fit__grid">
        <div className="finder rv">
          <div className="finder__row">
            <div className="field">
              <label htmlFor="bust">Your bust measurement</label>
              <div className="field__input">
                <input id="bust" type="number" inputMode="decimal" min={20} max={90} step={0.5} placeholder={unit === "cm" ? "e.g. 96" : "e.g. 38"} autoComplete="off" value={val}
                  onChange={(e) => setVal(e.target.value)} onBlur={() => { if (g && size && size !== "off") track("size_finder", { size, bust_in: Math.round(inches) }); }} />
                <span className="unit"><span className="unit-toggle">
                  {(["in", "cm"] as const).map((u) => <button key={u} type="button" aria-pressed={unit === u} onClick={() => switchUnit(u)}>{u}</button>)}
                </span></span>
              </div>
            </div>
          </div>
          <div className="finder__out" aria-live="polite">
            {size === undefined && <p className="muted">Measure around the fullest part, over a light layer, tape level and not pulled tight.</p>}
            {size === "off" && <p className="muted">That looks off. Check whether you are in inches or centimetres.</p>}
            {size === null && <><p className="rec">Let us check for you.</p><p>You are just past our largest listed size. Email <a href={`mailto:${CONFIG.support.email}`} style={{ textDecoration: "underline" }}>{CONFIG.support.email}</a> with your measurement; 4XL runs 54″ at the bust and there is usually room.</p></>}
            {g && size && size !== "off" && <>
              <p className="rec">We would put you in <b>{SIZE_LABELS[size]}</b>.</p>
              <p>The garment measures {SIZE_CHART.data[size][1]}″ at the bust, which leaves you about {Math.round(SIZE_CHART.data[size][1] - inches)}″ of room to move. Length is {g.length}″ from the shoulder, which suits {g.suits}.</p>
              <p style={{ marginTop: "1rem" }}><a className="btn" href="#shop" onClick={close}>Back to the collection</a></p>
            </>}
          </div>
        </div>
        <div className="rv rv-d1">
          <div className="chart-scroll"><Chart rec={size && size !== "off" ? size : null} /></div>
          <p className="chart__note">{SIZE_CHART.note}</p>
        </div>
      </div>
    </section>
  );
}
