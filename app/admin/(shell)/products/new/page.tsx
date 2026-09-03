import Link from "next/link";
import { ProductForm } from "@/components/admin/product-editor";
import { PageHead } from "@/components/admin/ui";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-55)]">← Products</Link>
      <PageHead title="New piece" sub="Save the details first, then add colours, photos and stock." />
      <ProductForm />
    </div>
  );
}
