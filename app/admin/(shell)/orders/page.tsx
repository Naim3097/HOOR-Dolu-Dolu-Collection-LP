import Link from "next/link";
import { listOrders, ORDER_STATUSES } from "@/lib/admin/orders";
import { rm } from "@/lib/money";
import { Card, CardHead, PageHead, Pill, Table, Td, Tr, fmtDate, inputCls, btnGhostCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const orders = await listOrders({ status, q });
  return (
    <div className="space-y-6">
      <PageHead title="Orders" sub="Filter by status or search a reference, name, email or phone." action={<Link href="/admin/orders/packing-slips" className={btnGhostCls}>Print packing slips</Link>} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {["all", ...ORDER_STATUSES].map((s) => {
            const on = (s === "all" && !status) || s === status;
            return <Link key={s} href={s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`} className={`border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${on ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--line)] text-[var(--ink-80)] hover:border-[var(--ink)]"}`}>{s}</Link>;
          })}
        </div>
        <form className="flex gap-2" action="/admin/orders">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q ?? ""} placeholder="Search reference, name, email" className={`${inputCls} w-64`} />
          <button className={btnGhostCls}>Search</button>
        </form>
      </div>
      <Card>
        <CardHead title={`${orders.length} ${orders.length === 1 ? "order" : "orders"}`} />
        {orders.length === 0 ? <p className="px-5 py-10 text-center text-[13px] text-[var(--ink-55)]">No orders match.</p> : (
          <Table head={["Order", "Customer", "Placed", "Items", "Total", "Status"]}>
            {orders.map((o) => (
              <Tr key={o.ref}>
                <Td className="font-bold"><Link href={`/admin/orders/${o.ref}`} className="hover:underline">{o.ref}</Link></Td>
                <Td>{o.customer?.name}<span className="block text-[11px] text-[var(--ink-55)]">{o.customer?.email}</span></Td>
                <Td className="text-[var(--ink-55)]">{fmtDate(o.created_at)}</Td><Td>{o.items}</Td><Td>{rm(o.total_sen)}</Td><Td><Pill value={o.status} /></Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
