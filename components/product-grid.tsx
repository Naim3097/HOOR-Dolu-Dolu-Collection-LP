import Image from "next/image";
import lqip from "@/lib/lqip.json";
import { PRODUCTS, CONFIG, imgSrc } from "@/lib/products";

const blur = (name: string) => (lqip as { lqip: Record<string, string> }).lqip[name];

export function ProductGrid() {
  return (
    <section id="shop" className="px-gut py-sect">
      <header className="mb-12 max-w-2xl">
        <h2 className="font-serif text-display leading-tight">Six prints. One cut.</h2>
        <p className="mt-4 text-lead text-ink-80">From {CONFIG.currencySymbol}{CONFIG.basePrice}. Sizes S/M – 4XL. Pockets in every one.</p>
      </header>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
        {PRODUCTS.map((p) => {
          const c = p.colourways[0];
          return (
            <li key={p.id}>
              <a href={`/?p=${p.id}`} className="group block">
                <div className="relative aspect-[2/3] overflow-hidden bg-paper-2">
                  <Image src={imgSrc(c.images[0], 900)} alt={`${p.name} in ${c.name}`} fill sizes="(max-width: 768px) 50vw, 33vw"
                    placeholder={blur(c.images[0]) ? "blur" : "empty"} blurDataURL={blur(c.images[0])}
                    className="object-cover transition-transform duration-700 ease-hoor group-hover:scale-[1.03]" />
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <h3 className="font-serif text-lg tracking-wide">{p.name}</h3>
                  <span className="text-sm text-ink-55">{CONFIG.currencySymbol}{p.price}</span>
                </div>
                <p className="mt-1 text-sm text-ink-55">{p.print}</p>
                <div className="mt-2 flex gap-1.5">
                  {p.colourways.map((cw) => <span key={cw.id} title={cw.name} className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: cw.swatch }} />)}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
