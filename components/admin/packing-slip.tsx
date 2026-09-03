import { SIZE_LABELS, type Size } from "@/lib/products";
import { rm } from "@/lib/money";
import type { OrderRow, OrderItemRow } from "@/lib/admin/orders";
import { fmtDate } from "@/components/admin/ui";
import { PrintButton } from "@/components/admin/print-button";

export function PackingSlip({ order: o, items }: { order: OrderRow; items: OrderItemRow[] }) {
  const c = o.customer, d = o.delivery;
  return (
    <article className="mx-auto mb-8 max-w-[720px] border border-[var(--line)] bg-white p-10 text-[13px] text-black print:mb-0 print:max-w-none print:border-0 print:p-0 print:break-after-page">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-[family-name:var(--serif)] text-2xl tracking-[0.2em]">HOOR</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Packing slip</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{o.ref}</p>
          <p className="text-neutral-500">Placed {fmtDate(o.created_at)}</p>
          <PrintButton />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Deliver to</p>
          <p className="mt-2 font-bold">{c.name}</p>
          <p>{d.line1}{d.line2 ? `, ${d.line2}` : ""}</p>
          <p>{d.postcode} {d.city}</p>
          <p>{d.state}</p>
          <p className="mt-2">{c.phone}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">From</p>
          <p className="mt-2 font-bold">HOOR · Qiblah Enterprise</p>
          <p>Lot 2-5, Second Floor, The Linc KL</p>
          <p>360 Jalan Tun Razak, 50400 Kuala Lumpur</p>
          <p className="mt-2">+60 17-250 0323</p>
        </div>
      </div>
      <table className="mt-8 w-full border-collapse">
        <thead><tr className="border-b border-black text-left text-[10px] uppercase tracking-[0.16em]"><th className="py-2">Piece</th><th>Colour</th><th>Size</th><th className="text-right">Qty</th></tr></thead>
        <tbody>
          {items.map((it) => { return (
            <tr key={it.id} className="border-b border-neutral-200"><td className="py-2 font-bold">{it.product_name}</td><td>{it.colour_name}</td><td>{SIZE_LABELS[it.size as Size] ?? it.size}</td><td className="text-right">{it.qty}</td></tr>
          ); })}
        </tbody>
      </table>
      <div className="mt-6 flex justify-between text-neutral-500">
        <p>{items.reduce((s, i) => s + i.qty, 0)} piece(s) · {rm(o.total_sen)} paid{o.delivery.notes ? ` · Note: ${o.delivery.notes}` : ""}</p>
        <p>Packed by ________  Checked by ________</p>
      </div>
    </article>
  );
}
