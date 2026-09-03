"use client";
import { CLAIMS } from "@/lib/products";
import { lqip } from "@/lib/format";
import { Ph } from "@/components/hoor/ph";
import { track } from "@/lib/tracking";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__media">
        <div className="ph" style={{ backgroundImage: `url("${lqip("hero_desktop")}")` }}>
          <picture>
            <source media="(max-width: 899px)" sizes="100vw" srcSet="/assets/img/hero_mobile-480.webp 480w, /assets/img/hero_mobile-941.webp 941w" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="loaded" src="/assets/img/hero_desktop-1400.webp" sizes="100vw" srcSet="/assets/img/hero_desktop-900.webp 900w, /assets/img/hero_desktop-1400.webp 1400w, /assets/img/hero_desktop-1672.webp 1672w"
              alt="The Batik Dolu-Dolu collection: five prints worn together in a Kuala Lumpur apartment" width={1672} height={941} fetchPriority="high" decoding="async" />
          </picture>
        </div>
      </div>
      <div className="hero__inner">
        <header className="hero__masthead">
          <p className="hero__eyebrow label">HOOR · Koleksi Baharu</p>
          <h1>Batik <span className="it serif">Dolu-Dolu</span></h1>
        </header>
        <div className="hero__deck">
          <p className="hero__lead">Made from Premium Cotton Silk, in a comfortable A-Cutline for easy movement. Suitable for petite and plus size women.</p>
          <div className="hero__cta">
            <a className="btn btn--light" href="#shop" onClick={() => track("cta_click", { location: "hero_cta" })}>Shop the collection</a>
            <a className="btn btn--light" href="#occasions">Where you&apos;ll wear it</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Claims() {
  return <section className="claims" id="claims" aria-label="What every piece has"><ul className="claims__track">{CLAIMS.map((c) => <li key={c}>{c}</li>)}</ul></section>;
}

export function Story() {
  return (
    <section className="story wrap">
      <div className="story__grid">
        <div className="story__body rv">
          <p className="drop"><em>Dolu-dolu</em> is what you say about the old days. Not nostalgia exactly, more like recognition.</p>
          <p>These prints come from that shelf. The tiles, the lace, the flowers you grew up seeing on every good baju, redrawn with care and put on a dress you can wear any day of the week.</p>
          <p>Shot in a flat that still has the upright piano, the corduroy wingback and the checkerboard rug. Nothing was borrowed in.</p>
        </div>
        <figure className="story__fig rv rv-d1">
          <div className="story__stack">
            <Ph name="rimbun_cocoa_full_01" alt="RIMBUN in Cocoa, seated in the green wingback" />
            <Ph name="semarak_maroon_detail_01" alt="SEMARAK print, close" sizes="240px" className="ph--layer" />
          </div>
          <figcaption>RIMBUN in Cocoa, SEMARAK in close-up. Shot on location, Kuala Lumpur.</figcaption>
        </figure>
      </div>
    </section>
  );
}
