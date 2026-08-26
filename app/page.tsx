import { Hero } from "@/components/hero";
import { Claims } from "@/components/claims";
import { ProductGrid } from "@/components/product-grid";
import { CONFIG } from "@/lib/products";

export default function Page() {
  return (
    <main>
      <Hero />
      <Claims />
      <ProductGrid />
      <footer className="border-t border-line px-gut py-10 text-sm text-ink-55">
        © {CONFIG.brand} · {CONFIG.support.email} · {CONFIG.support.hours}
      </footer>
    </main>
  );
}
