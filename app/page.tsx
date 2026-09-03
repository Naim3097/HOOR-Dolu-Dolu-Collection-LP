import { StoreProvider } from "@/lib/store";
import { CatalogProvider } from "@/lib/catalog-context";
import { loadCatalog } from "@/lib/catalog";
import { Sprite } from "@/components/hoor/sprite";
import { Chrome } from "@/components/hoor/chrome";
import { Header } from "@/components/hoor/header";
import { Hero, Claims, Story } from "@/components/hoor/hero";
import { Shop } from "@/components/hoor/shop";
import { Occasions, Fabric } from "@/components/hoor/occasions";
import { Fit } from "@/components/hoor/fit";
import { Faq, Closer, Footer, StickyBar, WaFab } from "@/components/hoor/tail";
import { Overlays } from "@/components/hoor/overlays";

/** Catalogue comes from the database; the back office revalidates this page on every change. */
export const revalidate = 300;

export default async function Page() {
  const { products, images, settings } = await loadCatalog();
  return (
    <CatalogProvider products={products} images={images} settings={settings}>
    <StoreProvider>
      <Sprite />
      <Chrome />
      <a className="skip" href="#shop">Skip to the collection</a>
      <Header />
      <main id="top">
        <Hero /><Claims /><Story /><Shop /><Occasions /><Fabric /><Fit /><Faq /><Closer />
      </main>
      <Footer />
      <StickyBar />
      <WaFab />
      <Overlays />
    </StoreProvider>
    </CatalogProvider>
  );
}
