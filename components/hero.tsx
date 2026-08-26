import { CONFIG } from "@/lib/products";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-[88svh] overflow-hidden bg-paper-2">
      <picture>
        <source media="(max-width: 899px)" srcSet="/assets/img/hero_mobile-900.webp" />
        <img
          src="/assets/img/hero_desktop-1400.webp"
          alt="Six batik kaftans from the Dolu-Dolu collection in a nostalgic Kuala Lumpur living room"
          className="absolute inset-0 h-full w-full object-cover object-[40%_center]"
          fetchPriority="high"
        />
      </picture>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/60 to-transparent p-gut pt-32 md:bg-none md:text-ink">
        <p className="text-label uppercase tracking-[0.3em] text-paper md:text-ink-55">{CONFIG.brand} · {CONFIG.tagline}</p>
        <h1 className="mt-3 font-serif text-hero leading-[0.95] text-paper md:text-ink">Batik<br />Dolu-Dolu</h1>
        <Button render={<a href="#shop" />} size="lg" className="mt-8 rounded-none uppercase tracking-widest">
          Shop the collection
        </Button>
      </div>
    </section>
  );
}
