"use client";
import { useEffect, useRef, useState } from "react";
import { CONFIG } from "@/lib/products";
import { money } from "@/lib/format";
import { STATES, regionFor, orderInput } from "@/lib/orders";
import { COUNTRIES, countryName } from "@/lib/shipping/countries";
import { useStore, keyOf } from "@/lib/store";
import { useCatalog } from "@/lib/catalog-context";
import { Line, Totals } from "@/components/hoor/overlays";
import { track, attribution } from "@/lib/tracking";

/** Payment runs on Billplz's hosted page; the customer picks FPX or card there. */
export const PAY_METHODS = [
  { id: "billplz", name: "Pay securely with Billplz", sub: "FPX online banking or credit and debit card.", marks: ["FPX", "Visa", "Mastercard"], body: "You will be taken to Billplz, Malaysia's licensed payment gateway, to pay from your own bank or by card, then brought straight back here. Card and bank details are never seen or stored by this site." },
];

type Form = { country: string; name: string; phone: string; email: string; address1: string; address2: string; postcode: string; city: string; state: string; notes: string };
const EMPTY: Form = { country: "MY", name: "", phone: "", email: "", address1: "", address2: "", postcode: "", city: "", state: "", notes: "" };

type QuoteOption = { serviceId: string; label: string; courier: string; amountSen: number; duration: string | null };
type Quote = { quoteId: string; options: QuoteOption[] };

function validate(f: Form): Record<string, string> {
  const isMY = f.country === "MY";
  const e: Record<string, string> = {};
  if (f.name.trim().length < 2) e.name = "Please tell us who to address it to.";
  if (isMY ? !/^(\+?6?0)[0-9]{8,10}$/.test(f.phone.replace(/[\s-]/g, "")) : !/^\+?[\d\s()-]{6,20}$/.test(f.phone.trim())) e.phone = isMY ? "Use a Malaysian number, e.g. 012 345 6789." : "Use a phone number the courier can reach, with country code.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "We need a working email for your tracking number.";
  if (f.address1.trim().length < 5) e.address1 = "Please give us a street address.";
  if (isMY ? !/^\d{5}$/.test(f.postcode.trim()) : f.postcode.trim().length < 3) e.postcode = isMY ? "Malaysian postcodes are 5 digits." : "Enter the delivery postcode.";
  if (f.city.trim().length < 2) e.city = "Which city or town?";
  if (isMY && !(STATES as readonly string[]).includes(f.state)) e.state = "Please choose your state so we can price delivery.";
  return e;
}

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
  const { products, settings } = useCatalog();
  const unit = (i: { productId: string }) => products.find((p) => p.id === i.productId)?.price ?? CONFIG.basePrice;

  const isMY = f.country === "MY";
  /** Courier-priced: everywhere overseas, and Malaysia when the store runs in courier mode. */
  const needsCourier = !isMY || settings.shippingMode === "courier";

  /* ---- live courier quote ------------------------------------------------
     The quote is tagged with the address+cart it was fetched for; a change of
     either makes it stale (rendered as "no quote yet") until the debounced
     re-fetch lands, so no state needs clearing inside the effect. */
  const itemsKey = items.map((i) => `${i.productId}:${i.qty}`).join(",");
  const quotable = needsCourier && (isMY ? /^\d{5}$/.test(f.postcode.trim()) && (STATES as readonly string[]).includes(f.state) : f.postcode.trim().length >= 3 && f.city.trim().length >= 2);
  const quoteKey = quotable ? [f.country, f.postcode.trim(), f.state, itemsKey].join("|") : "";
  const [qs, setQs] = useState<{ key: string; quote: Quote | null; err: string | null; serviceId: string }>({ key: "", quote: null, err: null, serviceId: "" });

  useEffect(() => {
    if (!quoteKey) return;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/shipping/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: quoteKey.split("|")[3].split(",").map((x) => ({ productId: x.split(":")[0], qty: Number(x.split(":")[1]) })), country: quoteKey.split("|")[0], state: quoteKey.split("|")[2], postcode: quoteKey.split("|")[1] }) });
        const json = await res.json();
        if (!alive) return;
        if (!res.ok) setQs({ key: quoteKey, quote: null, err: json.error ?? "We can't quote delivery to that address right now.", serviceId: "" });
        else setQs({ key: quoteKey, quote: json, err: null, serviceId: json.options[0]?.serviceId ?? "" });
      } catch { if (alive) setQs({ key: quoteKey, quote: null, err: "We can't quote delivery right now. Try again in a moment.", serviceId: "" }); }
    }, 700);
    return () => { alive = false; clearTimeout(t); };
  }, [quoteKey]);

  const fresh = qs.key === quoteKey && !!quoteKey;
  const quote = fresh ? qs.quote : null;
  const quoteErr = fresh ? qs.err : null;
  const quoting = !!quoteKey && !fresh;
  const serviceId = fresh ? qs.serviceId : "";
  const setServiceId = (id: string) => setQs((prev) => ({ ...prev, serviceId: id }));
  const selected = quote?.options.find((o) => o.serviceId === serviceId) ?? null;

  /* ---- pricing ----------------------------------------------------------- */
  const subtotal = items.reduce((s, i) => s + i.qty * unit(i), 0);
  const freeByThreshold = isMY && settings.freeShippingOver != null && subtotal >= settings.freeShippingOver;
  const region = isMY ? regionFor(f.state || "Selangor") : "overseas";
  const zoneShip = region === "east" ? settings.east : settings.west;
  const rawShip = needsCourier ? (selected ? selected.amountSen / 100 : 0) : zoneShip;

  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount_sen: number; free_shipping: boolean } | null>(null);
  const [codeErr, setCodeErr] = useState<string | null>(null);
  const [codeBusy, setCodeBusy] = useState(false);
  const discountRm = applied ? (applied.free_shipping ? 0 : applied.discount_sen / 100) : 0;
  const shippingRm = freeByThreshold || applied?.free_shipping ? 0 : rawShip;
  const total = subtotal - discountRm + shippingRm;
  const regionLabel = isMY ? CONFIG.shipping[region === "east" ? "east" : "west"].label : countryName(f.country);
  const shippingKnown = !needsCourier || !!selected || freeByThreshold;

  const applyCode = async () => {
    setCodeBusy(true); setCodeErr(null);
    try {
      const res = await fetch("/api/discounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, subtotalSen: Math.round(subtotal * 100), shippingSen: Math.round(rawShip * 100) }) });
      const json = await res.json();
      if (!res.ok) { setApplied(null); setCodeErr(json.error ?? "That code is not valid."); } else { setApplied(json); track("select_promotion", { promotion_name: json.code }); }
    } catch { setCodeErr("Could not check that code. Try again."); } finally { setCodeBusy(false); }
  };
  const top = () => box.current?.closest("#checkout")?.scrollTo(0, 0);

  const upd = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const setCountry = (e: React.ChangeEvent<HTMLSelectElement>) => { setF({ ...f, country: e.target.value, state: "", postcode: "" }); setErrs({}); };

  const next = () => {
    const e = validate(f);
    if (!Object.keys(e).length && needsCourier && !selected) e.courier = quoteErr ?? "Choose a delivery option to continue.";
    setErrs(e);
    if (Object.keys(e).length) { const first = box.current?.querySelector(`[data-f="${Object.keys(e)[0]}"]`); first?.scrollIntoView({ block: "center", behavior: "smooth" }); first?.querySelector<HTMLElement>("input,select")?.focus(); return; }
    setStep(2); top();
    track("add_shipping_info", { value: total, shipping_tier: region });
  };

  const pay = async () => {
    setBusy(true); setFail(null);
    track("add_payment_info", { payment_type: "billplz", value: total });
    try {
      const payload = {
        items, customer: { name: f.name, email: f.email, phone: f.phone },
        delivery: { country: f.country, line1: f.address1, line2: f.address2, city: f.city, postcode: f.postcode, state: f.state },
        notes: f.notes, discountCode: applied?.code ?? "", attribution: attribution(),
        ...(needsCourier && quote && selected ? { shipping: { quoteId: quote.quoteId, serviceId: selected.serviceId } } : {}),
      };
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
                <div className="f" data-f="country">
                  <label htmlFor="f-country">Country</label>
                  <select id="f-country" autoComplete="country" value={f.country} onChange={setCountry}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select>
                </div>
                {field("name", "Full name", "text", { autoComplete: "name" })}
                <div className="two">{field("phone", "Phone", "tel", { autoComplete: "tel", placeholder: isMY ? "012 345 6789" : "+65 8123 4567", hint: "For the courier only." })}{field("email", "Email", "email", { autoComplete: "email", hint: "Order confirmation and tracking." })}</div>
                {field("address1", "Address", "text", { autoComplete: "address-line1" })}
                {field("address2", "Unit, floor, landmark", "text", { autoComplete: "address-line2", optional: true })}
                <div className="two">{field("postcode", "Postcode", "text", { autoComplete: "postal-code", ...(isMY ? { inputMode: "numeric" as const, maxLength: 5 } : { maxLength: 12 }) })}{field("city", "City", "text", { autoComplete: "address-level2" })}</div>
                {isMY ? (
                  <div className={`f${errs.state ? " invalid" : ""}`} data-f="state">
                    <label htmlFor="f-state">State</label>
                    <select id="f-state" autoComplete="address-level1" value={f.state} onChange={upd("state")}><option value="">Choose your state</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
                    <p className="err">Please choose your state so we can price delivery.</p>
                  </div>
                ) : field("state", "State / province", "text", { autoComplete: "address-level1", optional: true })}
                {needsCourier && (
                  <div className={`f${errs.courier ? " invalid" : ""}`} data-f="courier">
                    <label>Delivery</label>
                    {!quotable && <p className="hint">Fill in your address to see delivery options and prices.</p>}
                    {quotable && quoting && <p className="hint">Checking couriers…</p>}
                    {quotable && !quoting && quoteErr && <p className="err" style={{ display: "block" }}>{quoteErr}</p>}
                    {quote && quote.options.length > 0 && (
                      <div className="pay-list" role="radiogroup" aria-label="Delivery options">
                        {quote.options.map((o) => (
                          <label key={o.serviceId} className={`pay-opt${serviceId === o.serviceId ? " on" : ""}`} onClick={() => setServiceId(o.serviceId)}>
                            <span className="pay-opt__top">
                              <input type="radio" name="courier" checked={serviceId === o.serviceId} readOnly />
                              <span><span className="nm">{o.courier}</span><br /><span className="sub">{o.label}{o.duration ? ` · ${o.duration}` : ""}</span></span>
                              <span className="marks"><span className="pay-mark">{freeByThreshold ? "Free" : money(o.amountSen / 100)}</span></span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    {freeByThreshold && selected && <p className="hint">Your order qualifies for free delivery. We still book {selected.courier} for you.</p>}
                    <p className="err">{errs.courier}</p>
                  </div>
                )}
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
              <div className="f" style={{ marginTop: "1.5rem", maxWidth: "24rem" }}>
                <label htmlFor="f-code">Discount code<span style={{ color: "var(--ink-35)" }}> · optional</span></label>
                <div style={{ display: "flex", gap: ".5rem", alignItems: "stretch" }}>
                  <input id="f-code" style={{ flex: 1, textTransform: "uppercase" }} value={code} onChange={(e) => { setCode(e.target.value); if (applied) { setApplied(null); } }} placeholder="Enter a code" autoComplete="off" />
                  <button type="button" className="btn" disabled={codeBusy || !code.trim()} onClick={applyCode}>{codeBusy ? "Checking…" : applied ? "Applied" : "Apply"}</button>
                </div>
                {codeErr && <p className="err" style={{ display: "block", marginTop: ".5rem", color: "var(--error)" }}>{codeErr}</p>}
                {applied && <p style={{ marginTop: ".5rem", fontSize: "var(--t-small)", color: "var(--ink-80)" }}>{applied.free_shipping ? "Free delivery applied." : `${money(discountRm)} off applied.`}</p>}
              </div>
              <div style={{ marginTop: "1.75rem", borderTop: "1px solid var(--line)", paddingTop: "1.25rem" }}>
                <span className="label" style={{ color: "var(--ink-55)" }}>Delivering to</span>
                <p style={{ marginTop: ".5rem", fontSize: "var(--t-small)", lineHeight: 1.5 }}><b>{f.name}</b><br />{f.address1}{f.address2 ? `, ${f.address2}` : ""}<br />{f.postcode} {f.city}{f.state ? `, ${f.state}` : ""}{!isMY ? `, ${countryName(f.country)}` : ""}<br />{f.phone} · {f.email}{selected ? <><br />{selected.courier} · {freeByThreshold ? "Free delivery" : money(selected.amountSen / 100)}</> : null}</p>
                <button className="co__back" style={{ marginTop: ".75rem" }} onClick={() => setStep(1)}>Edit details</button>
              </div>
              {fail && <p className="err" style={{ display: "block", marginTop: "1rem", color: "var(--error)" }}>{fail}</p>}
              <div className="co__actions"><button className="btn btn--solid" disabled={busy} onClick={pay}>{busy ? "Preparing payment…" : `Pay ${money(total)}`}</button><button className="co__back" onClick={() => setStep(1)}>Back</button></div>
              <p className="co__note">By paying you agree to HOOR&apos;s terms and return policy. You will get an order number and an email the moment payment clears.</p>
            </section>
          )}
        </div>
        <aside className="summary">
          <div className="summary__head"><h3>Your order</h3><span className="label">{count} item{count === 1 ? "" : "s"}</span></div>
          <div className="summary__items">{items.map((l) => <Line key={keyOf(l)} l={l} compact />)}</div>
          <div className="summary__totals">
            <Totals subtotal={subtotal} shipping={shippingKnown ? shippingRm : 0} pending={!shippingKnown} regionLabel={shippingKnown ? regionLabel : "picked at checkout"} discount={applied && !applied.free_shipping ? { label: applied.code, amount: discountRm } : applied ? { label: `${applied.code} · free delivery`, amount: 0 } : undefined} style={{ marginBottom: 0 }} />
            {!shippingKnown && <p className="hint" style={{ marginTop: ".5rem" }}>Delivery is added once you choose a courier above.</p>}
          </div>
          <ul className="summary__trust">
            <li><svg aria-hidden="true"><use href="#i-tick-s" /></svg>Dispatched within 24 hours, with tracking</li>
            <li><svg aria-hidden="true"><use href="#i-tick-s" /></svg>{CONFIG.policy.returnDays}-day exchange or return, unworn with tags</li>
            <li><svg aria-hidden="true"><use href="#i-tick-s" /></svg>Payment handled by HOOR&apos;s provider, never stored here</li>
          </ul>
        </aside>
      </div>
  );
}
