"use client";
import { useRef, useState } from "react";
import { CONFIG } from "@/lib/products";
import { money } from "@/lib/format";
import { STATES, orderInput, priceOrder } from "@/lib/orders";
import { useStore, keyOf } from "@/lib/store";
import { Line, Totals } from "@/components/hoor/overlays";
import { track, attribution } from "@/lib/tracking";

/** Payment runs on Billplz's hosted page; the customer picks FPX or card there. */
export const PAY_METHODS = [
  { id: "billplz", name: "Pay securely with Billplz", sub: "FPX online banking or credit and debit card.", marks: ["FPX", "Visa", "Mastercard"], body: "You will be taken to Billplz, Malaysia's licensed payment gateway, to pay from your own bank or by card, then brought straight back here. Card and bank details are never seen or stored by this site." },
];

type Form = { name: string; phone: string; email: string; address1: string; address2: string; postcode: string; city: string; state: string; notes: string };
const EMPTY: Form = { name: "", phone: "", email: "", address1: "", address2: "", postcode: "", city: "", state: "", notes: "" };
const V: Record<string, (v: string) => true | string> = {
  name: (v) => v.trim().length >= 2 || "Please tell us who to address it to.",
  phone: (v) => /^(\+?6?0)[0-9]{8,10}$/.test(v.replace(/[\s-]/g, "")) || "Use a Malaysian number, e.g. 012 345 6789.",
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "We need a working email for your tracking number.",
  address1: (v) => v.trim().length >= 5 || "Please give us a street address.",
  postcode: (v) => /^\d{5}$/.test(v.trim()) || "Malaysian postcodes are 5 digits.",
  city: (v) => v.trim().length >= 2 || "Which city or town?",
  state: (v) => (STATES as readonly string[]).includes(v) || "Please choose your state so we can price delivery.",
};

export function Checkout({ open }: { open: boolean }) {
  const { close } = useStore();
  return (
    <div className={`checkout${open ? " is-open" : ""}`} id="checkout" aria-hidden={!open} role="dialog" aria-modal="true" aria-label="Checkout">
      <div className="co__head">
        <button className="x" onClick={close} aria-label="Back to the collection"><svg><use href="#i-x" /></svg></button>
        <svg className="logo" viewBox="0 0 1281.9 424.49" role="img" aria-label="HOOR"><use href="#i-hoor" /></svg>
        <span className="co__secure"><svg aria-hidden="true"><use href="#i-lock" /></svg>Secure checkout</span>
      </div>
      {open && <CheckoutBody />}
    </div>
  );
}

/** Mounted fresh on every open, so step/form state resets naturally. */
function CheckoutBody() {
  const { items, count, close } = useStore();
  const [step, setStep] = useState(1);
  const [f, setF] = useState<Form>(EMPTY);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const pricing = priceOrder(items, f.state || "Selangor");
  const regionLabel = CONFIG.shipping[f.state ? pricing.region : "west"].label;
  const top = () => box.current?.closest("#checkout")?.scrollTo(0, 0);

  const upd = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const next = () => {
    const e: Record<string, string> = {};
    for (const [k, fn] of Object.entries(V)) { const r = fn(f[k as keyof Form] || ""); if (r !== true) e[k] = r; }
    setErrs(e);
    if (Object.keys(e).length) { const first = box.current?.querySelector(`[data-f="${Object.keys(e)[0]}"]`); first?.scrollIntoView({ block: "center", behavior: "smooth" }); first?.querySelector<HTMLElement>("input,select")?.focus(); return; }
    setStep(2); top();
    track("add_shipping_info", { value: pricing.total, shipping_tier: pricing.region });
  };

  const pay = async () => {
    setBusy(true); setFail(null);
    track("add_payment_info", { payment_type: "billplz", value: pricing.total });
    try {
      const payload = { items, customer: { name: f.name, email: f.email, phone: f.phone }, delivery: { line1: f.address1, line2: f.address2, city: f.city, postcode: f.postcode, state: f.state }, notes: f.notes, attribution: attribution() };
      const parsed = orderInput.safeParse(payload);
      if (!parsed.success) throw new Error("Please check your details.");
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "We could not start the payment. Please try again.");
      location.assign(json.redirectUrl);
    } catch (e) { setFail((e as Error).message); setBusy(false); }
  };

  const field = (k: keyof Form, label: string, type = "text", o: { autoComplete?: string; placeholder?: string; hint?: string; optional?: boolean; inputMode?: "numeric"; maxLength?: number } = {}) => (
    <div className={`f${errs[k] ? " invalid" : ""}`} data-f={k}>
      <label htmlFor={`f-${k}`}>{label}{o.optional && <span style={{ color: "var(--ink-35)" }}> · optional</span>}</label>
      {type === "textarea" ? <textarea id={`f-${k}`} value={f[k]} onChange={upd(k)} /> :
        <input id={`f-${k}`} type={type} value={f[k]} onChange={upd(k)} autoComplete={o.autoComplete} placeholder={o.placeholder} inputMode={o.inputMode} maxLength={o.maxLength} />}
      {o.hint && <p className="hint">{o.hint}</p>}
      <p className="err">{errs[k]}</p>
    </div>
  );

  return (
      <div ref={box} className="co__wrap">
        <div>
          <ol className="steps">{["Details", "Payment", "Done"].map((s, i) => <li key={s} className={i === step - 1 ? "on" : i < step - 1 ? "done" : ""}>{s}</li>)}</ol>
          {step === 1 && (
            <section className="co__step on">
              <h2>Where are we sending it?</h2>
              <div className="fields">
                {field("name", "Full name", "text", { autoComplete: "name" })}
                <div className="two">{field("phone", "Phone", "tel", { autoComplete: "tel", placeholder: "012 345 6789", hint: "For the courier only." })}{field("email", "Email", "email", { autoComplete: "email", hint: "Order confirmation and tracking." })}</div>
                {field("address1", "Address", "text", { autoComplete: "address-line1" })}
                {field("address2", "Unit, floor, landmark", "text", { autoComplete: "address-line2", optional: true })}
                <div className="two">{field("postcode", "Postcode", "text", { autoComplete: "postal-code", inputMode: "numeric", maxLength: 5 })}{field("city", "City", "text", { autoComplete: "address-level2" })}</div>
                <div className={`f${errs.state ? " invalid" : ""}`} data-f="state">
                  <label htmlFor="f-state">State</label>
                  <select id="f-state" autoComplete="address-level1" value={f.state} onChange={upd("state")}><option value="">Choose your state</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
                  <p className="err">Please choose your state so we can price delivery.</p>
                </div>
                {field("notes", "Anything we should know?", "textarea", { optional: true })}
              </div>
              <div className="co__actions"><button className="btn btn--solid" onClick={next}>Continue to payment</button><button className="co__back" onClick={close}>Keep shopping</button></div>
            </section>
          )}
          {step === 2 && (
            <section className="co__step on">
              <h2>Ready to pay.</h2>
              <div className="pay-list">
                {PAY_METHODS.map((m) => (
                  <div key={m.id} className="pay-opt on">
                    <span className="pay-opt__top">
                      <span><span className="nm">{m.name}</span><br /><span className="sub">{m.sub}</span></span>
                      <span className="marks">{m.marks.map((x) => <span key={x} className="pay-mark">{x}</span>)}</span>
                    </span>
                    <span className="pay-opt__body">{m.body}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "1.75rem", borderTop: "1px solid var(--line)", paddingTop: "1.25rem" }}>
                <span className="label" style={{ color: "var(--ink-55)" }}>Delivering to</span>
                <p style={{ marginTop: ".5rem", fontSize: "var(--t-small)", lineHeight: 1.5 }}><b>{f.name}</b><br />{f.address1}{f.address2 ? `, ${f.address2}` : ""}<br />{f.postcode} {f.city}, {f.state}<br />{f.phone} · {f.email}</p>
                <button className="co__back" style={{ marginTop: ".75rem" }} onClick={() => setStep(1)}>Edit details</button>
              </div>
              {fail && <p className="err" style={{ display: "block", marginTop: "1rem", color: "var(--error)" }}>{fail}</p>}
              <div className="co__actions"><button className="btn btn--solid" disabled={busy} onClick={pay}>{busy ? "Preparing payment…" : `Pay ${money(pricing.total)}`}</button><button className="co__back" onClick={() => setStep(1)}>Back</button></div>
              <p className="co__note">By paying you agree to HOOR&apos;s terms and return policy. You will get an order number and an email the moment payment clears.</p>
            </section>
          )}
        </div>
        <aside className="summary">
          <div className="summary__head"><h3>Your order</h3><span className="label">{count} item{count === 1 ? "" : "s"}</span></div>
          <div className="summary__items">{items.map((l) => <Line key={keyOf(l)} l={l} compact />)}</div>
          <div className="summary__totals"><Totals subtotal={pricing.subtotal} shipping={f.state ? pricing.shipping : CONFIG.shipping.west.rate} regionLabel={regionLabel} style={{ marginBottom: 0 }} /></div>
          <ul className="summary__trust">
            <li><svg aria-hidden="true"><use href="#i-tick-s" /></svg>Dispatched within 24 hours, with tracking</li>
            <li><svg aria-hidden="true"><use href="#i-tick-s" /></svg>{CONFIG.policy.returnDays}-day exchange or return, unworn with tags</li>
            <li><svg aria-hidden="true"><use href="#i-tick-s" /></svg>Payment handled by HOOR&apos;s provider, never stored here</li>
          </ul>
        </aside>
      </div>
  );
}
