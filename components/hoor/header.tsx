"use client";
import { CONFIG } from "@/lib/products";
import { useStore } from "@/lib/store";
export function Header() {
  const { count, open } = useStore();
  return (
    <header className="header" id="header">
      <a className="header__mark" href="#top" aria-label="HOOR — top of page">
        <svg viewBox="0 0 1281.9 424.49" role="img" aria-label="HOOR"><use href="#i-hoor" /></svg>
        <span className="cx">{CONFIG.collection}</span>
      </a>
      <span className="header__spacer" />
      <button className="hbtn" onClick={() => open("size")} aria-label="Open the size and fit guide"><svg aria-hidden="true"><use href="#i-ruler" /></svg><span className="hide-s" aria-hidden="true">Size</span></button>
      <button className="hbtn" onClick={() => open("cart")} aria-label="Open bag"><svg aria-hidden="true"><use href="#i-bag" /></svg><span>Bag</span><span className="count">{count || ""}</span></button>
    </header>
  );
}
