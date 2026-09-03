import { listOrders, getOrder } from "@/lib/admin/orders";
import { PackingSlip } from "@/components/admin/packing-slip";

export const dynamic = "force-dynamic";

/** The morning run: every paid order not yet fulfilled, one slip per sheet. */
export default async function SlipsPage() {
  const paid = await listOrders({ status: "paid" });
  const all = (await Promise.all(paid.map((o) => getOrder(o.ref)))).filter(Boolean);
  if (all.length === 0) return <p className="text-[13px] text-[var(--ink-55)]">Nothing to pack. Every paid order is already fulfilled.</p>;
  return <>{all.map((d) => <PackingSlip key={d!.order.ref} order={d!.order} items={d!.items} />)}</>;
}
