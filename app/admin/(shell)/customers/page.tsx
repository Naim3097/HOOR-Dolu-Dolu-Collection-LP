import Link from "next/link";
import { listCustomers } from "@/lib/admin/config";
import { rm } from "@/lib/money";
import { Card, CardHead, PageHead, Table, Td, Tr, fmtDate, inputCls, btnGhostCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const customers = await listCustomers(q);
  return (
    <div className="space-y-6">
      <PageHead title="Customers" sub="Everyone who has placed an order, grouped by email. HOOR has no customer accounts, so this is built from orders." action={
        <form className="flex gap-2" action="/admin/customers"><input name="q" defaultValue={q ?? ""} placeholder="Search name, email, phone" className={`${inputCls} w-64`} /><button className={btnGhostCls}>Search</button></form>
      } />
      <Card>
        <CardHead title={`${customers.length} ${customers.length === 1 ? "customer" : "customers"}`} />
        {customers.length === 0 ? <p className="px-5 py-10 text-center text-[13px] text-[var(--ink-55)]">No customers yet.</p> : (
          <Table head={["Customer", "Phone", "State", "Orders", "Spent", "Last order"]}>
            {customers.map((c) => (
              <Tr key={c.email}>
                <Td className="font-bold">{c.name}<span className="block text-[11px] font-normal text-[var(--ink-55)]">{c.email}</span></Td>
                <Td><a className="underline" href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^0/, "60")}`} target="_blank" rel="noopener">{c.phone}</a></Td>
                <Td className="text-[var(--ink-55)]">{c.state}</Td>
                <Td>{c.paid_orders}{c.orders !== c.paid_orders && <span className="text-[11px] text-[var(--ink-55)]"> / {c.orders}</span>}</Td>
                <Td>{rm(c.spent_sen)}</Td>
                <Td className="text-[var(--ink-55)]"><Link className="hover:underline" href={`/admin/orders?q=${encodeURIComponent(c.email)}`}>{fmtDate(c.last_at)}</Link></Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
