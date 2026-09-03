"use client";
import { CLAIMS } from "@/lib/products";
import { lqip, imgSrc, srcset } from "@/lib/format";
import { Ph } from "@/components/hoor/ph";
import { track } from "@/lib/tracking";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__media">
        <div className="ph" style={{ backgroundImage: `url("${lqip("hero_desktop")}")` }}>
          <picture>
            <source media="(max-width: 899px)" sizes="100vw" srcSet={srcset("hero_mobile")} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="loaded" src={imgSrc("hero_desktop", 1400)} sizes="100vw" srcSet={srcset("hero_desktop")}
              alt="The Batik Dolu-Dolu collection: five prints worn together in a Kuala Lumpur apartment" width={1672} height={799} fetchPriority="high" decoding="async" />
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

const STORY_POINTS = [
  { head: "Breathable & airy", body: "perfect for Malaysia's warm weather" },
  { head: "Flowy & lightweight", body: "moves beautifully as you walk" },
  { head: "Doesn't cling to the body", body: "giving you a relaxed, comfortable fit" },
  { head: "Comfortable in the heat", body: "ideal for everyday wear, kenduri, and umrah too" },
  { head: "Soft against the skin", body: "for all-day comfort" },
];

export function Story() {
  return (
    <section className="story wrap" id="story">
      <div className="story__grid">
        <div className="story__body rv">
          <p className="drop"><em>Dolu-dolu</em> is what you say about the old days. Feeling nostalgic, just like the 90s era.</p>
          <p>These prints come from memories of the old days. The flowers you grew up seeing on every painting, abstract and kain batik, redrawn on a beautiful Premium Cotton Silk dress.</p>
          <p>The fabric is soft, with an airy texture that drapes naturally over the body without clinging, giving you that comfortable feeling from morning to night.</p>
          <h3 className="story__why">Why you&apos;ll love Cotton Silk</h3>
          <ul className="story__list">
            {STORY_POINTS.map((s) => <li key={s.head}><b>{s.head}</b> — {s.body}</li>)}
          </ul>
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
