"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fetchCourierRates, bookWithEasyparcel, refreshAwb, cancelEasyparcel, saveSender, disconnectEasyparcel, walletBalance, type CourierRate } from "@/app/admin/actions-shipping";
import type { ActionResult } from "@/app/admin/actions";
import type { Sender } from "@/lib/shipping/config";
import { rm } from "@/lib/money";
import { Card, CardHead, Field, inputCls, btnCls, btnGhostCls } from "@/components/admin/ui";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const run = <T extends ActionResult>(fn: () => Promise<T>, after?: (r: T) => void, msg = "Saved") => start(async () => { setError(null); setDone(null); const r = await fn(); if (!r.ok) setError(r.error); else { setDone(msg); after?.(r); router.refresh(); } });
  return { pending, error, done, run };
}
const Msg = ({ error, done }: { error: string | null; done: string | null }) => error ? <p className="text-[13px] text-rose-700">{error}</p> : done ? <p className="text-[13px] text-emerald-700">{done}</p> : null;

/** On the order page: quote live rates and book with one click. */
export function EasyparcelBooking({ orderRef, connected }: { orderRef: string; connected: boolean }) {
  const { pending, error, done, run } = useAction();
  const [rates, setRates] = useState<CourierRate[] | null>(null);
  const [weight, setWeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string>("");
  if (!connected) return <p className="text-[12px] text-[var(--ink-55)]">Connect EasyParcel under Shipping to book from here.</p>;
  const quote = async () => { setLoading(true); setQuoteErr(null); const r = await fetchCourierRates(orderRef); setLoading(false); if ("error" in r) { setQuoteErr(r.error); setRates(null); } else { setRates(r.rates); setWeight(r.weightGrams); setChosen(r.rates[0]?.serviceId ?? ""); } };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3"><button type="button" className={btnGhostCls} disabled={loading} onClick={quote}>{loading ? "Getting rates…" : rates ? "Refresh rates" : "Get courier rates"}</button>{weight > 0 && <span className="text-[12px] text-[var(--ink-55)]">{weight} g</span>}</div>
      {quoteErr && <p className="text-[13px] text-rose-700">{quoteErr}</p>}
      {rates && rates.length === 0 && <p className="text-[13px] text-[var(--ink-55)]">No courier serves this address.</p>}
      {rates && rates.length > 0 && (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (confirm("Book this parcel? EasyParcel charges the wallet now.")) run(() => bookWithEasyparcel(orderRef, chosen), () => setRates(null), "Booked"); }}>
          <ul className="divide-y divide-[var(--line-soft)] border border-[var(--line)]">
            {rates.map((r) => (
              <li key={r.serviceId}><label className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[13px] ${chosen === r.serviceId ? "bg-[var(--paper-2)]" : ""}`}>
                <span className="flex items-center gap-2"><input type="radio" name="svc" checked={chosen === r.serviceId} onChange={() => setChosen(r.serviceId)} /><span><b>{r.courierName}</b> <span className="text-[var(--ink-55)]">{r.serviceName}{r.pickup ? " · pickup" : " · drop-off"}{r.duration ? ` · ${r.duration}` : ""}</span></span></span>
                <span className="[font-variant-numeric:tabular-nums]">{rm(r.amountSen)}</span>
              </label></li>
            ))}
          </ul>
          <div className="flex items-center gap-3"><button className={btnCls} disabled={pending || !chosen}>{pending ? "Booking…" : "Book and pay"}</button><Msg error={error} done={done} /></div>
        </form>
      )}
    </div>
  );
}

export function EasyparcelParcelButtons({ orderRef, shipmentId, status, hasAwb }: { orderRef: string; shipmentId: number; status: string; hasAwb: boolean }) {
  const { pending, error, done, run } = useAction();
  return (
    <span className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.14em]">
      {!hasAwb && <button className="underline" disabled={pending} onClick={() => run(() => refreshAwb(orderRef, shipmentId), undefined, "AWB fetched")}>Fetch AWB</button>}
      {["booked", "shipped"].includes(status) && <button className="text-rose-700 underline" disabled={pending} onClick={() => { if (confirm("Cancel this booking with EasyParcel?")) run(() => cancelEasyparcel(orderRef, shipmentId), undefined, "Cancelled"); }}>Cancel booking</button>}
      <Msg error={error} done={done} />
    </span>
  );
}

/** On the Shipping page: connection state, wallet, pickup address. */
export function EasyparcelConnection({ configured, connected, refreshExpires, isOwner }: { configured: boolean; connected: boolean; refreshExpires: string | null; isOwner: boolean }) {
  const { pending, error, done, run } = useAction();
  const [wallet, setWallet] = useState<string | null>(null);
  useEffect(() => { if (connected) walletBalance().then((r) => setWallet("error" in r ? `Wallet: ${r.error}` : `Wallet balance ${rm(r.balanceSen)}`)); }, [connected]);
  return (
    <Card>
      <CardHead title="EasyParcel account" action={connected && isOwner ? <button className={btnGhostCls} disabled={pending} onClick={() => { if (confirm("Disconnect EasyParcel? Booking from orders stops until it is reconnected.")) run(() => disconnectEasyparcel(), undefined, "Disconnected"); }}>Disconnect</button> : undefined} />
      <div className="space-y-2 px-5 py-4 text-[13px]">
        {!configured && <p>Not set up yet. Add <code>EASYPARCEL_CLIENT_ID</code>, <code>EASYPARCEL_CLIENT_SECRET</code> and <code>EASYPARCEL_REDIRECT_URI</code> to the environment, then connect the merchant account here.</p>}
        {configured && !connected && <><p>Credentials are in place. Connect HOOR&apos;s EasyParcel merchant account to book parcels from orders and pull AWBs back automatically.</p><a href="/api/shipping/connect" className={`${btnCls} mt-2`}>Connect EasyParcel</a></>}
        {connected && <><p><span className="mr-2 inline-block rounded-sm bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-900">Connected</span>Parcels can be booked from an order.</p>{wallet && <p className="text-[var(--ink-55)]">{wallet}</p>}{refreshExpires && <p className="text-[var(--ink-55)]">Renews itself. Sign in again before {new Date(refreshExpires).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}.</p>}</>}
        <Msg error={error} done={done} />
      </div>
    </Card>
  );
}

export function SenderForm({ sender }: { sender: Sender }) {
  const { pending, error, done, run } = useAction();
  const [f, setF] = useState({ name: sender.name, phone: sender.phone, line1: sender.line1, line2: sender.line2 ?? "", city: sender.city, postcode: sender.postcode, state: sender.state });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Card>
      <CardHead title="Pickup address" />
      <form className="space-y-4 px-5 py-5" onSubmit={(e) => { e.preventDefault(); run(() => saveSender(f)); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sender name"><input className={inputCls} value={f.name} onChange={set("name")} required /></Field>
          <Field label="Phone"><input className={inputCls} value={f.phone} onChange={set("phone")} required /></Field>
          <Field label="Address line 1"><input className={inputCls} value={f.line1} onChange={set("line1")} required /></Field>
          <Field label="Address line 2"><input className={inputCls} value={f.line2} onChange={set("line2")} /></Field>
          <Field label="City"><input className={inputCls} value={f.city} onChange={set("city")} required /></Field>
          <div className="grid grid-cols-2 gap-4"><Field label="Postcode"><input className={inputCls} value={f.postcode} onChange={set("postcode")} required /></Field><Field label="State"><input className={inputCls} value={f.state} onChange={set("state")} required /></Field></div>
        </div>
        <div className="flex items-center gap-4"><button className={btnCls} disabled={pending}>Save pickup address</button><Msg error={error} done={done} /></div>
      </form>
    </Card>
  );
}
