import Link from "next/link";
import { listAudit } from "@/lib/admin/config";
import { Card, CardHead, PageHead, Table, Td, Tr, fmtDate, inputCls, btnGhostCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const { page, q } = await searchParams;
  const a = await listAudit({ page: Number(page) || 1, q });
  return (
    <div className="space-y-6">
      <PageHead title="Audit log" sub="Every change made in the back office, and by the system, newest first." action={
        <form className="flex gap-2" action="/admin/audit"><input name="q" defaultValue={q ?? ""} placeholder="Search actor, action, target" className={`${inputCls} w-64`} /><button className={btnGhostCls}>Search</button></form>
      } />
      <Card>
        <CardHead title={`${a.count} entries · page ${a.page} of ${a.pages}`} action={
          <span className="flex gap-3 text-[12px]">
            {a.page > 1 && <Link className="underline" href={`/admin/audit?page=${a.page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>Newer</Link>}
            {a.page < a.pages && <Link className="underline" href={`/admin/audit?page=${a.page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>Older</Link>}
          </span>
        } />
        <Table head={["When", "Who", "Action", "Target", "Detail"]}>
          {a.rows.map((r) => (
            <Tr key={r.id}>
              <Td className="whitespace-nowrap text-[var(--ink-55)]">{fmtDate(r.created_at)}</Td>
              <Td>{r.actor}</Td>
              <Td className="font-bold">{r.action}</Td>
              <Td>{r.target?.startsWith("HR") ? <Link className="underline" href={`/admin/orders/${r.target}`}>{r.target}</Link> : r.target}</Td>
              <Td className="max-w-md truncate text-[11px] text-[var(--ink-55)]" >{r.detail ? JSON.stringify(r.detail) : ""}</Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
