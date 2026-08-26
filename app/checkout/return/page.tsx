import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CONFIG, SIZE_LABELS, PRODUCTS, type Size } from "@/lib/products";
import { money } from "@/lib/format";
import { Sprite } from "@/components/hoor/sprite";
import { PurchaseEvent } from "./purchase-event";
import { PAY_METHODS } from "@/components/hoor/checkout";

export const dynamic = "force-dynamic";

export default async function ReturnPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const db = supabaseAdmin();
  const { data: o } = ref ? await db.from("orders").select("*").eq("ref", ref).single() : { data: null };
  const { data: lines } = o ? await db.from("order_items").select("*").eq("order_ref", o.ref) : { data: [] };

  if (!o) return <Shell title="We could not find that order." lead={`Email ${CONFIG.support.email} with any details you have and we will track it down.`} />;
  if (o.status === "failed") return <Shell title="The payment did not go through." lead="Nothing was charged. Your bag is saved — go back and try another method." />;
  if (o.status !== "paid") return <Shell title="Confirming your payment…" lead={`Order ${o.ref}. This page refreshes on its own.`} refresh />;

  const method = PAY_METHODS.find((m) => m.id === o.payment_method)?.name ?? "Online payment";
  const d = o.delivery as { line1: string; line2?: string; postcode: string; city: string; state: string; region: "west" | "east" };
  const c = o.customer as { name: string; email: string };
  return (
    <>
      <Sprite />
      <div className="checkout is-open" style={{ position: "static", opacity: 1, pointerEvents: "auto" }}>
        <div className="co__head">
          <svg className="logo" viewBox="0 0 1281.9 424.49" role="img" aria-label="HOOR"><use href="#i-hoor" /></svg>
          <span className="co__secure">Order {o.ref}</span>
        </div>
        <div className="done done__wrap">
          <div className="done__tick"><svg aria-hidden="true"><use href="#i-tick" /></svg></div>
          <h1>Thank you. That&apos;s yours.</h1>
          <p className="done__lead">We have emailed a confirmation to <b>{c.email}</b>. Keep the order number below; it is the fastest way for us to find you.</p>
          <div className="done__ref">
            <div><span className="label">Order number</span><span className="v">{o.ref}</span></div>
            <div><span className="label">Paid</span><span className="v">{money(Number(o.total))}</span></div>
            <div><span className="label">Method</span><span className="v" style={{ fontSize: "1rem" }}>{method}</span></div>
          </div>
          <div style={{ marginTop: "2rem", border: "1px solid var(--line)", background: "var(--white)" }}>
            <div className="summary__head"><h3>What you ordered</h3></div>
            <div>{(lines ?? []).map((l) => {
              const p = PRODUCTS.find((x) => x.id === l.product_id); const cw = p?.colourways.find((x) => x.id === l.colourway_id);
              return (
                <div key={l.id} className="ci">
                  <div className="ci__media"><span className="ph">{cw && /* eslint-disable-next-line @next/next/no-img-element */ <img className="loaded" src={`/assets/img/${cw.images[0]}-480.webp`} alt="" />}</span></div>
                  <div><div className="ci__top"><div><h4>{p?.name}</h4><p className="meta">{cw?.name} · {SIZE_LABELS[l.size as Size]}</p></div><span className="price">{money(Number(l.unit_price) * l.qty)}</span></div><p className="meta" style={{ marginTop: ".35rem" }}>Qty {l.qty}</p></div>
                </div>);
            })}</div>
            <div className="summary__totals"><div className="totals" style={{ marginBottom: 0 }}>
              <div><span>Subtotal</span><span>{money(Number(o.subtotal))}</span></div>
              <div><span>Delivery · {CONFIG.shipping[d.region].label}</span><span>{Number(o.shipping) === 0 ? "Free" : money(Number(o.shipping))}</span></div>
              <div className="grand"><span>Total paid</span><span>{money(Number(o.total))}</span></div>
            </div></div>
            <div className="summary__trust"><p style={{ lineHeight: 1.5 }}><b style={{ color: "var(--ink)" }}>Delivering to</b><br />{c.name}, {d.line1}{d.line2 ? `, ${d.line2}` : ""}, {d.postcode} {d.city}, {d.state}</p></div>
          </div>
          <ol className="done__next">
            <li><span className="n">01</span><div><h3>We pack it</h3><p>Within {CONFIG.policy.dispatchDays} working days. You get an email with a tracking number the moment it leaves us.</p></div></li>
            <li><span className="n">02</span><div><h3>It arrives</h3><p>1–3 days across Semenanjung, 3–7 days to Sabah, Sarawak and Labuan.</p></div></li>
            <li><span className="n">03</span><div><h3>Try it on the same day</h3><p>If the size is wrong you have {CONFIG.policy.returnDays} days to post it back, unworn with tags. Email {CONFIG.support.email} with your order number and we will sort it.</p></div></li>
          </ol>
          <div className="co__actions">
            <Link className="btn" href="/#shop">Back to the collection</Link>
            <a className="co__back" href={`mailto:${CONFIG.support.email}?subject=Order%20${encodeURIComponent(o.ref)}`}>Email us about this order</a>
          </div>
        </div>
        <PurchaseEvent orderRef={o.ref} value={Number(o.total)} />
      </div>
    </>
  );
}

function Shell({ title, lead, refresh }: { title: string; lead: string; refresh?: boolean }) {
  return (
    <>
      <Sprite />
      {refresh && <meta httpEquiv="refresh" content="4" />}
      <div className="checkout is-open" style={{ position: "static", opacity: 1, pointerEvents: "auto" }}>
        <div className="co__head"><svg className="logo" viewBox="0 0 1281.9 424.49" role="img" aria-label="HOOR"><use href="#i-hoor" /></svg></div>
        <div className="done done__wrap"><h1>{title}</h1><p className="done__lead">{lead}</p><div className="co__actions"><Link className="btn" href="/#shop">Back to the collection</Link></div></div>
      </div>
    </>
  );
}
