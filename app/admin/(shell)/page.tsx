import Link from "next/link";
import { dashboardStats, listOrders } from "@/lib/admin/orders";
import { rm } from "@/lib/money";
import { Card, CardHead, PageHead, Pill, Stat, Table, Td, Tr, fmtDate, btnGhostCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [stats, recent] = await Promise.all([dashboardStats(), listOrders({ limit: 8 })]);
  const max = Math.max(1, ...stats.days.map((d) => d.sen));
  const today = new Intl.DateTimeFormat("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }).format(new Date());
  return (
    <div className="space-y-6">
      <PageHead title="Dashboard" sub={today} action={<Link href="/admin/orders" className={btnGhostCls}>View orders</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Sales today" value={rm(stats.salesTodaySen)} />
        <Stat label="Orders today" value={String(stats.ordersToday)} />
        <Stat label="Avg order value (30d)" value={rm(stats.avgOrderSen)} />
        <Stat label="To pack" value={String(stats.pending)} sub={stats.pending ? "paid, not yet fulfilled" : "All caught up"} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHead title="Sales, last 14 days" action={<span className="text-[12px] text-[var(--ink-55)]">{rm(stats.days.reduce((s, d) => s + d.sen, 0))} total</span>} />
          <div className="flex h-40 items-end gap-1.5 px-5 pb-4 pt-6">
            {stats.days.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}: ${rm(d.sen)}`}>
                <div className="w-full bg-[var(--sage-deep)]" style={{ height: `${Math.max(2, (d.sen / max) * 120)}px`, opacity: d.sen ? 1 : 0.25 }} />
                <span className="text-[9px] text-[var(--ink-55)]">{d.day.slice(8)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHead title="Top pieces, 30 days" action={<span className="text-[12px] text-[var(--ink-55)]">by units</span>} />
          <ul className="divide-y divide-[var(--line-soft)]">
            {stats.top.length === 0 && <li className="px-5 py-6 text-[13px] text-[var(--ink-55)]">No paid orders yet.</li>}
            {stats.top.map((t) => (
              <li key={t.name} className="flex items-center justify-between px-5 py-3 text-[13px]"><span className="uppercase tracking-wide">{t.name}</span><span className="text-[var(--ink-55)]">{t.units} units · {rm(t.sen)}</span></li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <CardHead title="Recent orders" action={<Link href="/admin/orders" className="text-[12px] underline">View all</Link>} />
        {recent.length === 0 ? <p className="px-5 py-8 text-[13px] text-[var(--ink-55)]">No orders yet.</p> : (
          <Table head={["Order", "Customer", "Placed", "Items", "Total", "Status"]}>
            {recent.map((o) => (
              <Tr key={o.ref}>
                <Td className="font-bold"><Link href={`/admin/orders/${o.ref}`} className="hover:underline">{o.ref}</Link></Td>
                <Td>{o.customer?.name}</Td><Td className="text-[var(--ink-55)]">{fmtDate(o.created_at)}</Td><Td>{o.items}</Td><Td>{rm(o.total_sen)}</Td><Td><Pill value={o.status} /></Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
