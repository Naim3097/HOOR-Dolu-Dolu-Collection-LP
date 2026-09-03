import { notFound } from "next/navigation";
import { getOrder } from "@/lib/admin/orders";
import { PackingSlip } from "@/components/admin/packing-slip";

export const dynamic = "force-dynamic";

export default async function SlipPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const data = await getOrder(ref);
  if (!data) notFound();
  return <PackingSlip order={data.order} items={data.items} />;
}
