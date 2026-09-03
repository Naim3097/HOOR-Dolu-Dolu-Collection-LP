"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, recordRefund, saveShipment, saveOrderNotes, type ActionResult } from "@/app/admin/actions";
import type { OrderStatus, ShipmentRow } from "@/lib/admin/orders";
import { Field, inputCls, btnCls, btnGhostCls } from "@/components/admin/ui";

const LABEL: Record<OrderStatus, string> = { pending: "Mark paid", paid: "Mark paid", fulfilled: "Mark fulfilled (packed and handed to courier)", completed: "Mark completed (delivered)", cancelled: "Cancel order", refunded: "Mark refunded", failed: "Mark failed" };
const DANGER = new Set<OrderStatus>(["cancelled", "refunded", "failed"]);

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<ActionResult>, after?: () => void) => start(async () => { setError(null); const r = await fn(); if (!r.ok) setError(r.error); else { after?.(); router.refresh(); } });
  return { pending, error, run };
}

export function StatusActions({ orderRef, next }: { orderRef: string; next: OrderStatus[] }) {
  const { pending, error, run } = useAction();
  if (next.length === 0) return <p className="text-[13px] text-[var(--ink-55)]">No further status changes for this order.</p>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {next.map((s) => (
        <button key={s} disabled={pending} className={DANGER.has(s) ? `${btnGhostCls} text-rose-700 border-rose-300 hover:border-rose-700` : btnCls}
          onClick={() => { if (DANGER.has(s) && !confirm(`${LABEL[s]}? Stock goes back on the shelf.`)) return; run(() => updateOrderStatus(orderRef, s)); }}>
          {LABEL[s]}
        </button>
      ))}
      {error && <span className="text-[13px] text-rose-700">{error}</span>}
    </div>
  );
}

export function RefundForm({ orderRef, maxRm }: { orderRef: string; maxRm: number }) {
  const { pending, error, run } = useAction();
  const [amount, setAmount] = useState(String(maxRm));
  const [reason, setReason] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(() => recordRefund(orderRef, Number(amount), reason), () => setReason("")); }}>
      <p className="text-[12px] text-[var(--ink-55)]">Move the money in Billplz first. This records it, and a full refund returns the pieces to stock.</p>
      <div className="grid grid-cols-[8rem_1fr] gap-3">
        <Field label="Amount (RM)"><input className={inputCls} type="number" step="0.01" min="0.01" max={maxRm} value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
        <Field label="Reason"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. size exchange, returned unworn" required /></Field>
      </div>
      {error && <p className="text-[13px] text-rose-700">{error}</p>}
      <button className={btnGhostCls} disabled={pending}>Record refund</button>
    </form>
  );
}

const COURIERS = ["J&T Express", "Pos Laju", "Ninja Van", "DHL eCommerce", "City-Link", "Other"];
const TRACK: Record<string, (n: string) => string> = {
  "J&T Express": (n) => `https://www.jtexpress.my/tracking?billcode=${n}`,
  "Pos Laju": (n) => `https://tracking.pos.com.my/tracking/${n}`,
  "Ninja Van": (n) => `https://www.ninjavan.co/en-my/tracking?id=${n}`,
  "DHL eCommerce": (n) => `https://ecommerceportal.dhl.com/track/?ref=${n}`,
  "City-Link": (n) => `https://www.citylinkexpress.com/tracking-result/?track0=${n}`,
};

export function ShipmentForm({ orderRef, existing }: { orderRef: string; existing?: ShipmentRow }) {
  const { pending, error, run } = useAction();
  const [f, setF] = useState({ courier: existing?.courier ?? "J&T Express", trackingNo: existing?.tracking_no ?? "", weightGrams: existing?.weight_grams ? String(existing.weight_grams) : "400", costRm: existing?.cost_sen ? String(existing.cost_sen / 100) : "", notes: existing?.notes ?? "", status: (existing?.status ?? "booked") as "pending" | "booked" | "shipped" | "delivered" | "cancelled" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(() => saveShipment({ ref: orderRef, id: existing?.id, courier: f.courier, trackingNo: f.trackingNo, trackingUrl: TRACK[f.courier]?.(f.trackingNo.trim()), weightGrams: Number(f.weightGrams), costRm: Number(f.costRm || 0), notes: f.notes, status: f.status })); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Courier"><select className={inputCls} value={f.courier} onChange={set("courier")}>{COURIERS.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Tracking number"><input className={inputCls} value={f.trackingNo} onChange={set("trackingNo")} /></Field>
        <Field label="Weight (g)"><input className={inputCls} type="number" min="0" value={f.weightGrams} onChange={set("weightGrams")} /></Field>
        <Field label="Cost to HOOR (RM)"><input className={inputCls} type="number" step="0.01" min="0" value={f.costRm} onChange={set("costRm")} /></Field>
        <Field label="Status"><select className={inputCls} value={f.status} onChange={set("status")}>{["pending", "booked", "shipped", "delivered", "cancelled"].map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Notes"><input className={inputCls} value={f.notes} onChange={set("notes")} /></Field>
      </div>
      {error && <p className="text-[13px] text-rose-700">{error}</p>}
      <button className={btnGhostCls} disabled={pending}>{existing ? "Save parcel" : "Add parcel"}</button>
    </form>
  );
}

export function NotesForm({ orderRef, notes }: { orderRef: string; notes: string }) {
  const { pending, error, run } = useAction();
  const [v, setV] = useState(notes);
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(() => saveOrderNotes(orderRef, v)); }}>
      <textarea className={`${inputCls} min-h-20`} value={v} onChange={(e) => setV(e.target.value)} placeholder="Only staff see this." />
      {error && <p className="text-[13px] text-rose-700">{error}</p>}
      <button className={btnGhostCls} disabled={pending}>Save notes</button>
    </form>
  );
}
