"use client";
import { CONFIG, FAQ, LENGTH_GUIDE, STORE } from "@/lib/products";
import { money, PAY_NAMES, lqip } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Ph } from "@/components/hoor/ph";
import { track } from "@/lib/tracking";

export function Faq() {
  const { open } = useStore();
  return (
    <section className="faq"><div className="wrap">
      <div className="sect-head rv"><span className="label">Before you order</span><h2>The things people ask us.</h2></div>
      <div className="faq__list rv rv-d1">
        {FAQ.map((f, i) => (
          <details key={f.q} id={i === 3 ? "faq-delivery" : undefined} onToggle={(e) => e.currentTarget.open && track("faq_open", { question: f.q })}>
            <summary><span>{f.q}</span><span className="pm" aria-hidden="true" /></summary>
            <div className="faq__a">{f.a.split("\n").map((line, j) => <p key={j}>{line}</p>)}{f.cta === "size" && <button className="btn" onClick={() => open("size")}>Open the size guide</button>}</div>
          </details>
        ))}
      </div>
      <Visit />
    </div></section>
  );
}

/** The storefront photograph does the identifying; the card just frames it. */
function Visit() {
  return (
    <div className="visit rv">
      <div className="visit__photo">
        <Ph name={STORE.image} sizes="(min-width: 780px) 40vw, 100vw" pos="50% 32%" alt="The HOOR store at The Linc, Kuala Lumpur" />
      </div>
      <div className="visit__info">
        <span className="label">Visit the store</span>
        <h3 className="serif">{STORE.name}</h3>
        <p>{STORE.address[0]}<br />{STORE.address[1]}</p>
        <p className="visit__meta">{STORE.hours}<br /><a href={STORE.phoneHref}>{STORE.phone}</a></p>
        <p className="visit__popup"><span className="label">Also at</span>{STORE.popup.name}, {STORE.popup.address} · <a href={STORE.popup.maps} target="_blank" rel="noopener">Map</a></p>
        <a className="btn" target="_blank" rel="noopener" href={STORE.maps} onClick={() => track("visit_maps")}>Open in Google Maps</a>
      </div>
    </div>
  );
}

export function Closer() {
  const { open } = useStore();
  return (
    <section className="closer">
      <div className="closer__media" aria-hidden="true">
        <div className="ph" style={{ backgroundImage: `url("${lqip("closer_desktop") ?? ""}")` }}>
          <picture>
            <source media="(max-width: 899px)" sizes="100vw" srcSet="/assets/img/closer_mobile-480.webp 480w, /assets/img/closer_mobile-1024.webp 1024w" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="loaded" src="/assets/img/closer_desktop-1400.webp" sizes="100vw" srcSet="/assets/img/closer_desktop-900.webp 900w, /assets/img/closer_desktop-1400.webp 1400w, /assets/img/closer_desktop-2112.webp 2112w" alt="" width={2112} height={896} loading="lazy" decoding="async" />
          </picture>
        </div>
      </div>
      <div className="closer__inner wrap">
        <div className="rv">
          <span className="label">Still deciding?</span>
          <h2 className="serif">Take the one you keep scrolling back to.</h2>
          <p>Sizes S/M to 4XL, {money(CONFIG.basePrice)} each.{CONFIG.freeShippingOver ? <> Free delivery over {money(CONFIG.freeShippingOver)}.</> : null}</p>
        </div>
        <div className="closer__cta rv rv-d1">
          <a className="btn btn--solid" href="#shop" onClick={() => track("cta_click", { location: "closer_cta" })}>Back to the collection</a>
          <button className="btn" onClick={() => open("size")}>Check my size</button>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { open } = useStore();
  return (
    <footer className="foot"><div className="wrap">
      <div className="foot__grid">
        <div className="foot__mark"><svg viewBox="0 0 1281.9 424.49" role="img" aria-label="HOOR" style={{ color: "var(--paper)" }}><use href="#i-hoor" /></svg><p>{CONFIG.tagline}</p></div>
        <div><h3 className="foot-h">Help</h3><ul>
          <li><button onClick={() => open("size")}>Size &amp; fit guide</button></li>
          <li><a href="#faq-delivery">Delivery times</a></li>
          <li><a href="https://hoor.my/p/Contact_us" target="_blank" rel="noopener">Contact us</a></li></ul></div>
        <div><h3 className="foot-h">Policies</h3><ul>
          <li><a href="https://hoor.my/returnpolicy" target="_blank" rel="noopener">Returns &amp; refunds</a></li>
          <li><a href="https://hoor.my/p/Terms_and_conditions" target="_blank" rel="noopener">Terms</a></li>
          <li><a href="https://hoor.my/p/Privacy_policies" target="_blank" rel="noopener">Privacy</a></li></ul></div>
        <div><h3 className="foot-h">Customer care</h3><ul>
          <li><a href={`mailto:${CONFIG.support.email}`}>{CONFIG.support.email}</a></li>
          <li><a href={STORE.phoneHref}>{STORE.phone}</a></li>
          <li>{CONFIG.support.hours}</li>
          <li>The Linc KL, Jalan Tun Razak</li>
          <li>Pop-up: KL East Mall, LG</li>
          <li><a href="https://instagram.com/we.are.hoor" target="_blank" rel="noopener">{CONFIG.support.instagram}</a></li></ul>
          <h3 className="foot-h" style={{ marginTop: "1.5rem" }}>We accept</h3>
          <div className="foot__pay">{CONFIG.payments.map((p) => <span key={p} className="pay-mark">{PAY_NAMES[p] ?? p}</span>)}</div>
        </div>
      </div>
      <div className="foot__base"><span>© {new Date().getFullYear()} HOOR · QIBLAH ENTERPRISE (NS0246134-U)</span><span>Batik Dolu-Dolu campaign</span></div>
    </div></footer>
  );
}

export function StickyBar() {
  return (
    <div className="sticky-bar" id="stickybar">
      <div className="meta"><div className="t">Batik Dolu-Dolu</div><div className="s">{money(CONFIG.basePrice)} · S/M – 4XL</div></div>
      <a className="btn" href="#shop" onClick={() => track("cta_click", { location: "sticky_cta" })}>Shop now</a>
    </div>
  );
}

export function WaFab() {
  const num = (CONFIG.support.whatsapp || "").replace(/[^0-9]/g, "");
  if (!num) return null;
  const msg = `Hi HOOR! I'm looking at the ${CONFIG.collection} collection and have a question.`;
  return (
    <a className="wa-fab" data-wa href={`https://wa.me/${num}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener" aria-label="Chat with HOOR on WhatsApp" onClick={() => track("contact_whatsapp", { location: "floating_button" })}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
    </a>
  );
}

export function LengthList() {
  return (
    <ul style={{ fontSize: "var(--t-small)", color: "var(--ink-80)" }}>
      {LENGTH_GUIDE.map((l) => <li key={l.size} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: ".5rem 0", borderBottom: "1px solid var(--line-soft)" }}><b>{l.size === "SM" ? "S/M" : l.size === "LXL" ? "L/XL" : l.size}</b><span>{l.length}″ · {l.suits}</span></li>)}
    </ul>
  );
}
