import Link from "next/link";
import { loadCatalogAdmin } from "@/lib/catalog";
import { rm } from "@/lib/money";
import { imgSrc, registerImageMeta } from "@/lib/format";
import { Card, CardHead, PageHead, Pill, Table, Td, Tr, btnCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { products, images, rows } = await loadCatalogAdmin();
  registerImageMeta(images);
  const pub = new Map(rows.products.map((p) => [p.id, p.published]));
  return (
    <div className="space-y-6">
      <PageHead title="Products" sub="Every piece on the site. Stock moves through a ledger, so each change carries a reason." action={<Link href="/admin/products/new" className={btnCls}>+ Add piece</Link>} />
      <Card>
        <CardHead title={`${products.length} ${products.length === 1 ? "piece" : "pieces"}`} />
        <Table head={["", "Piece", "Price", "Colours × sizes", "Stock", "Status", ""]}>
          {products.map((p) => {
            const stock = p.colourways.reduce((s, c) => s + Object.values(c.stock).reduce((a, b) => a + b, 0), 0);
            const first = p.colourways[0]?.images[0];
            return (
              <Tr key={p.id}>
                <Td className="w-14">{first ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={imgSrc(first, 480)} alt="" className="h-14 w-10 object-cover" /> : <span className="block h-14 w-10 bg-[var(--paper-2)]" />}</Td>
                <Td className="font-bold"><Link href={`/admin/products/${p.id}`} className="hover:underline">{p.name}</Link><span className="block text-[11px] font-normal text-[var(--ink-55)]">{p.print}</span></Td>
                <Td>{rm(Math.round(p.price * 100))}</Td>
                <Td className="text-[var(--ink-55)]">{p.colourways.length} × 5</Td>
                <Td>{stock}{stock <= 5 && <span className="ml-2 text-[10px] font-bold uppercase text-rose-700">low</span>}</Td>
                <Td><Pill value={pub.get(p.id) ? "active" : "inactive"} /></Td>
                <Td><Link href={`/admin/products/${p.id}`} className="text-[11px] uppercase tracking-[0.14em] underline">Edit</Link></Td>
              </Tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}
