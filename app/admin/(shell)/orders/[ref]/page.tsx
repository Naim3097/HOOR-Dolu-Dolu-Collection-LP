import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, TRANSITIONS } from "@/lib/admin/orders";
import { rm } from "@/lib/money";
import { SIZE_LABELS, type Size } from "@/lib/products";
import { countryName } from "@/lib/shipping/countries";
import { Card, CardHead, PageHead, Pill, Table, Td, Tr, fmtDate, btnGhostCls } from "@/components/admin/ui";
import { StatusActions, RefundForm, ShipmentForm, NotesForm } from "@/components/admin/order-actions";
import { EasyparcelBooking, EasyparcelParcelButtons } from "@/components/admin/shipping-panels";
import { getConnection } from "@/lib/shipping/config";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const [data, conn] = await Promise.all([getOrder(ref), getConnection()]);
  if (!data) notFound();
  const { order: o, items, payments, shipments, audit } = data;
  const c = o.customer, d = o.delivery;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-55)]">← Orders</Link>
        <PageHead title={o.ref} sub={`Placed ${fmtDate(o.created_at)}${o.paid_at ? ` · Paid ${fmtDate(o.paid_at)}` : ""}`} action={<div className="flex items-center gap-3"><Pill value={o.status} /><Link href={`/admin/orders/${o.ref}/packing-slip`} className={btnGhostCls}>Packing slip</Link></div>} />
      </div>

      <Card>
        <CardHead title="Update status" />
        <div className="px-5 py-4"><StatusActions orderRef={o.ref} next={TRANSITIONS[o.status]} /></div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Customer" />
          <dl className="grid grid-cols-[6rem_1fr] gap-y-2 px-5 py-4 text-[13px]">
            <dt className="text-[var(--ink-55)]">Name</dt><dd>{c.name}</dd>
            <dt className="text-[var(--ink-55)]">Email</dt><dd><a className="underline" href={`mailto:${c.email}`}>{c.email}</a></dd>
            <dt className="text-[var(--ink-55)]">Phone</dt><dd><a className="underline" href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^0/, "60")}`} target="_blank" rel="noopener">{c.phone}</a></dd>
            {Object.keys(o.attribution ?? {}).length > 0 && <><dt className="text-[var(--ink-55)]">Source</dt><dd className="text-[12px] text-[var(--ink-55)]">{Object.entries(o.attribution).map(([k, v]) => `${k}=${v}`).join(" · ")}</dd></>}
          </dl>
        </Card>
        <Card>
          <CardHead title="Delivery address" />
          <div className="px-5 py-4 text-[13px] leading-relaxed">
            <p className="font-bold">{c.name}</p>
            <p>{d.line1}{d.line2 ? `, ${d.line2}` : ""}</p>
            <p>{d.postcode} {d.city}{d.state ? `, ${d.state}` : ""}</p>
            {d.region === "overseas" && <p className="font-bold">{countryName(d.country ?? "")}</p>}
            <p className="mt-2 text-[12px] text-[var(--ink-55)]">{d.region === "overseas" ? "International" : d.region === "east" ? "Sabah / Sarawak / Labuan" : "Semenanjung"} · delivery {o.shipping_sen ? rm(o.shipping_sen) : "free"}{o.shipping_courier ? ` · customer chose ${o.shipping_courier}` : ""}</p>
            {d.notes && <p className="mt-2 border-l-2 border-[var(--line)] pl-3 text-[12px] italic">{d.notes}</p>}
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="Line items" />
        <Table head={["Piece", "Colour", "Size", "SKU", "Qty", "Unit", "Line"]}>
          {items.map((it) => { return (
            <Tr key={it.id}><Td className="font-bold">{it.product_name}</Td><Td>{it.colour_name}</Td><Td>{SIZE_LABELS[it.size as Size] ?? it.size}</Td><Td className="text-[11px] text-[var(--ink-55)]">{it.sku}</Td><Td>{it.qty}</Td><Td>{rm(it.unit_price_sen)}</Td><Td>{rm(it.qty * it.unit_price_sen)}</Td></Tr>
          ); })}
        </Table>
        <dl className="ml-auto grid w-72 grid-cols-2 gap-y-1 px-5 py-4 text-[13px] [font-variant-numeric:tabular-nums]">
          <dt className="text-[var(--ink-55)]">Subtotal</dt><dd className="text-right">{rm(o.subtotal_sen)}</dd>
          {o.discount_sen > 0 && <><dt className="text-[var(--ink-55)]">Discount {o.discount_code && `(${o.discount_code})`}</dt><dd className="text-right">−{rm(o.discount_sen)}</dd></>}
          <dt className="text-[var(--ink-55)]">Delivery</dt><dd className="text-right">{o.shipping_sen ? rm(o.shipping_sen) : "Free"}</dd>
          <dt className="font-bold">Total</dt><dd className="text-right font-bold">{rm(o.total_sen)}</dd>
          {o.refund_sen > 0 && <><dt className="text-rose-700">Refunded</dt><dd className="text-right text-rose-700">−{rm(o.refund_sen)}</dd></>}
        </dl>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Shipping" />
          <div className="divide-y divide-[var(--line-soft)]">
            {shipments.map((s) => (
              <div key={s.id} className="px-5 py-3 text-[13px]">
                <div className="flex flex-wrap items-center gap-2"><Pill value={s.status} /><span className="font-bold">{s.courier ?? "Courier not set"}</span>{s.tracking_no && (s.tracking_url ? <a className="underline" href={s.tracking_url} target="_blank" rel="noopener">{s.tracking_no}</a> : <span>{s.tracking_no}</span>)}</div>
                <p className="mt-1 text-[12px] text-[var(--ink-55)]">{s.weight_grams ? `${s.weight_grams} g · ` : ""}{s.cost_sen ? `${rm(s.cost_sen)} · ` : ""}{s.provider}{s.shipped_at ? ` · shipped ${fmtDate(s.shipped_at)}` : ""}{s.notes ? ` · ${s.notes}` : ""}{s.label_url && <> · <a className="underline" href={s.label_url} target="_blank" rel="noopener">Print label</a></>}</p>
                {s.provider === "easyparcel" && <div className="mt-2"><EasyparcelParcelButtons orderRef={o.ref} shipmentId={s.id} status={s.status} hasAwb={!!s.tracking_no} /></div>}
                <details className="mt-2"><summary className="cursor-pointer text-[11px] uppercase tracking-[0.14em] text-[var(--ink-55)]">Edit</summary><div className="pt-3"><ShipmentForm orderRef={o.ref} existing={s} /></div></details>
              </div>
            ))}
            {["paid", "fulfilled"].includes(o.status) && <div className="px-5 py-3"><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em]">Book with EasyParcel</p><EasyparcelBooking orderRef={o.ref} connected={conn.connected} /></div>}
            <details className="px-5 py-3" open={shipments.length === 0 && !conn.connected}><summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.14em]">Add parcel by hand</summary><div className="pt-3"><ShipmentForm orderRef={o.ref} /></div></details>
          </div>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHead title="Payments" />
            {payments.length === 0 ? <p className="px-5 py-4 text-[13px] text-[var(--ink-55)]">No payment recorded{o.payment_ref ? ` · Billplz bill ${o.payment_ref}` : ""}.</p> : (
              <ul className="divide-y divide-[var(--line-soft)] text-[13px]">{payments.map((p) => <li key={p.id} className="flex items-center justify-between px-5 py-3"><span><Pill value={p.status} /> <span className="ml-2">{p.provider}{p.provider_ref ? ` · ${p.provider_ref}` : ""}</span></span><span>{p.status === "refunded" ? "−" : ""}{rm(p.amount_sen)} <span className="text-[11px] text-[var(--ink-55)]">{fmtDate(p.paid_at ?? p.created_at)}</span></span></li>)}</ul>
            )}
            {["paid", "fulfilled", "completed"].includes(o.status) && <div className="border-t border-[var(--line-soft)] px-5 py-4"><RefundForm orderRef={o.ref} maxRm={(o.total_sen - o.refund_sen) / 100} /></div>}
          </Card>
          <Card>
            <CardHead title="Internal notes" />
            <div className="px-5 py-4"><NotesForm orderRef={o.ref} notes={o.admin_notes ?? ""} /></div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHead title="History" />
        {audit.length === 0 ? <p className="px-5 py-4 text-[13px] text-[var(--ink-55)]">Nothing yet.</p> : (
          <ul className="divide-y divide-[var(--line-soft)] text-[13px]">{audit.map((a) => <li key={a.id} className="flex flex-wrap justify-between gap-2 px-5 py-2.5"><span><span className="font-bold">{a.action}</span> <span className="text-[var(--ink-55)]">{a.detail ? JSON.stringify(a.detail) : ""}</span></span><span className="text-[12px] text-[var(--ink-55)]">{a.actor} · {fmtDate(a.created_at)}</span></li>)}</ul>
        )}
      </Card>
    </div>
  );
}
