import { listDiscounts } from "@/lib/admin/config";
import { PageHead } from "@/components/admin/ui";
import { DiscountsTable } from "@/components/admin/config-forms";

export const dynamic = "force-dynamic";

export default async function DiscountsPage() {
  const codes = await listDiscounts();
  return (
    <div className="space-y-6">
      <PageHead title="Discounts" sub="Percentage, fixed-amount and free-delivery codes. Switch a code off to stop it instantly." />
      <DiscountsTable codes={codes} />
    </div>
  );
}
