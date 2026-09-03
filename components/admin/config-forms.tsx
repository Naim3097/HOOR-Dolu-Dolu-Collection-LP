"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettings, saveDiscount, toggleDiscount, deleteDiscount, createStaff, resetStaffPassword, setStaffRole, removeStaff } from "@/app/admin/actions-config";
import type { ActionResult } from "@/app/admin/actions";
import type { Settings, Discount, StaffRow } from "@/lib/admin/config";
import { rm } from "@/lib/money";
import { Card, CardHead, Field, Pill, Table, Td, Tr, fmtDate, inputCls, btnCls, btnGhostCls } from "@/components/admin/ui";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const run = <T extends ActionResult>(fn: () => Promise<T>, after?: (r: T) => void, msg = "Saved") => start(async () => { setError(null); setDone(null); const r = await fn(); if (!r.ok) setError(r.error); else { setDone(msg); after?.(r); router.refresh(); } });
  return { pending, error, done, run };
}
const Msg = ({ error, done }: { error: string | null; done: string | null }) => error ? <p className="text-[13px] text-rose-700">{error}</p> : done ? <p className="text-[13px] text-emerald-700">{done}</p> : null;

/* ---------- settings ---------------------------------------------------- */
export function SettingsForm({ settings: s }: { settings: Settings }) {
  const { pending, error, done, run } = useAction();
  const [f, setF] = useState({ store_name: s.store_name, store_email: s.store_email, store_phone: s.store_phone, whatsapp: s.whatsapp, hours: s.hours, instagram: s.instagram, freeShippingRm: s.free_shipping_threshold_sen == null ? "" : String(s.free_shipping_threshold_sen / 100), westRm: s.west_rate_sen / 100, eastRm: s.east_rate_sen / 100, return_days: s.return_days });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value });
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(() => saveSettings(f)); }}>
      <Card>
        <CardHead title="Store" />
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <Field label="Store name"><input className={inputCls} value={f.store_name} onChange={set("store_name")} required /></Field>
          <Field label="Customer email"><input className={inputCls} type="email" value={f.store_email} onChange={set("store_email")} required /></Field>
          <Field label="Phone, as shown"><input className={inputCls} value={f.store_phone} onChange={set("store_phone")} /></Field>
          <Field label="WhatsApp number" hint="Digits only with country code, e.g. 60172500323"><input className={inputCls} value={f.whatsapp} onChange={set("whatsapp")} /></Field>
          <Field label="Opening hours"><input className={inputCls} value={f.hours} onChange={set("hours")} /></Field>
          <Field label="Instagram handle"><input className={inputCls} value={f.instagram} onChange={set("instagram")} /></Field>
        </div>
      </Card>
      <Card>
        <CardHead title="Delivery and returns" />
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-4">
          <Field label="Semenanjung (RM)"><input className={inputCls} type="number" step="0.01" min="0" value={f.westRm} onChange={set("westRm")} /></Field>
          <Field label="Sabah, Sarawak, Labuan (RM)"><input className={inputCls} type="number" step="0.01" min="0" value={f.eastRm} onChange={set("eastRm")} /></Field>
          <Field label="Free delivery from (RM)" hint="Leave empty to never ship free."><input className={inputCls} type="number" step="1" min="0" value={f.freeShippingRm} onChange={(e) => setF({ ...f, freeShippingRm: e.target.value })} /></Field>
          <Field label="Return window (days)"><input className={inputCls} type="number" min="0" value={f.return_days} onChange={set("return_days")} /></Field>
        </div>
      </Card>
      <div className="flex items-center gap-4"><button className={btnCls} disabled={pending}>Save settings</button><Msg error={error} done={done} /></div>
    </form>
  );
}

/* ---------- discounts --------------------------------------------------- */
const EMPTY = { code: "", kind: "percent" as Discount["kind"], amount: 10, minSpendRm: 0, maxRedemptions: "", startsAt: "", endsAt: "", active: true };
const local = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export function DiscountsTable({ codes }: { codes: Discount[] }) {
  const { pending, error, done, run } = useAction();
  const [editing, setEditing] = useState<(typeof EMPTY & { id?: number }) | null>(null);
  const describe = (d: Discount) => d.kind === "percent" ? `${d.amount}% off` : d.kind === "fixed" ? `${rm(d.amount)} off` : "Free delivery";
  return (
    <div className="space-y-4">
      {editing ? (
        <Card>
          <CardHead title={editing.id ? `Edit ${editing.code}` : "New code"} />
          <form className="space-y-4 px-5 py-5" onSubmit={(e) => { e.preventDefault(); run(() => saveDiscount(editing), () => setEditing(null)); }}>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Code"><input className={`${inputCls} uppercase`} value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} required /></Field>
              <Field label="Type"><select className={inputCls} value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value as Discount["kind"] })}><option value="percent">Percent off</option><option value="fixed">Amount off (RM)</option><option value="free_shipping">Free delivery</option></select></Field>
              {editing.kind !== "free_shipping" && <Field label={editing.kind === "percent" ? "Percent" : "Amount (RM)"}><input className={inputCls} type="number" step={editing.kind === "percent" ? "1" : "0.01"} min="0" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })} /></Field>}
              <Field label="Minimum spend (RM)"><input className={inputCls} type="number" step="1" min="0" value={editing.minSpendRm} onChange={(e) => setEditing({ ...editing, minSpendRm: Number(e.target.value) })} /></Field>
              <Field label="Max uses" hint="Empty for unlimited"><input className={inputCls} type="number" min="1" value={editing.maxRedemptions} onChange={(e) => setEditing({ ...editing, maxRedemptions: e.target.value })} /></Field>
              <Field label="Starts"><input className={inputCls} type="datetime-local" value={editing.startsAt} onChange={(e) => setEditing({ ...editing, startsAt: e.target.value })} /></Field>
              <Field label="Ends"><input className={inputCls} type="datetime-local" value={editing.endsAt} onChange={(e) => setEditing({ ...editing, endsAt: e.target.value })} /></Field>
              <label className="flex items-end gap-2 pb-2 text-[13px]"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Active</label>
            </div>
            <div className="flex items-center gap-3"><button className={btnCls} disabled={pending}>Save code</button><button type="button" className={btnGhostCls} onClick={() => setEditing(null)}>Cancel</button><Msg error={error} done={done} /></div>
          </form>
        </Card>
      ) : (
        <div className="flex items-center gap-4"><button className={btnCls} onClick={() => setEditing({ ...EMPTY })}>+ New code</button><Msg error={error} done={done} /></div>
      )}
      <Card>
        <CardHead title={`${codes.length} ${codes.length === 1 ? "code" : "codes"}`} />
        {codes.length === 0 ? <p className="px-5 py-10 text-center text-[13px] text-[var(--ink-55)]">No codes yet.</p> : (
          <Table head={["Code", "Gives", "Min spend", "Used", "Window", "Status", ""]}>
            {codes.map((d) => (
              <Tr key={d.id}>
                <Td className="font-mono font-bold">{d.code}</Td>
                <Td>{describe(d)}</Td>
                <Td className="text-[var(--ink-55)]">{d.min_spend_sen ? rm(d.min_spend_sen) : "—"}</Td>
                <Td>{d.redeemed_count}{d.max_redemptions != null && <span className="text-[var(--ink-55)]"> / {d.max_redemptions}</span>}</Td>
                <Td className="text-[12px] text-[var(--ink-55)]">{d.starts_at || d.ends_at ? `${d.starts_at ? fmtDate(d.starts_at) : "now"} → ${d.ends_at ? fmtDate(d.ends_at) : "no end"}` : "Always"}</Td>
                <Td><Pill value={d.active ? "active" : "inactive"} /></Td>
                <Td><span className="flex gap-3 text-[11px] uppercase tracking-[0.14em]">
                  <button className="underline" onClick={() => setEditing({ id: d.id, code: d.code, kind: d.kind, amount: d.kind === "fixed" ? d.amount / 100 : d.amount, minSpendRm: d.min_spend_sen / 100, maxRedemptions: d.max_redemptions == null ? "" : String(d.max_redemptions), startsAt: local(d.starts_at), endsAt: local(d.ends_at), active: d.active })}>Edit</button>
                  <button className="underline" disabled={pending} onClick={() => run(() => toggleDiscount(d.id, !d.active), undefined, d.active ? "Switched off" : "Switched on")}>{d.active ? "Switch off" : "Switch on"}</button>
                  <button className="text-rose-700 underline" disabled={pending} onClick={() => { if (confirm(`Delete ${d.code}?`)) run(() => deleteDiscount(d.id), undefined, "Deleted"); }}>Delete</button>
                </span></Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

/* ---------- staff ------------------------------------------------------- */
export function StaffTable({ staff, meId, isOwner }: { staff: StaffRow[]; meId: string; isOwner: boolean }) {
  const { pending, error, done, run } = useAction();
  const [f, setF] = useState({ email: "", fullName: "", role: "staff" as "owner" | "staff" });
  const [reveal, setReveal] = useState<{ email: string; password: string } | null>(null);
  return (
    <div className="space-y-4">
      {reveal && (
        <Card className="border-emerald-300">
          <div className="px-5 py-4 text-[13px]">
            <p className="font-bold">One-time password for {reveal.email}</p>
            <p className="my-2 font-mono text-base">{reveal.password}</p>
            <p className="text-[var(--ink-55)]">Pass it on privately. It is shown once and not stored anywhere; they can change it after signing in.</p>
            <button className={`${btnGhostCls} mt-3`} onClick={() => setReveal(null)}>Done</button>
          </div>
        </Card>
      )}
      {isOwner && (
        <Card>
          <CardHead title="Add staff" />
          <form className="grid items-end gap-3 px-5 py-4 sm:grid-cols-[1fr_1fr_8rem_auto]" onSubmit={(e) => { e.preventDefault(); run(() => createStaff(f), (r) => { if (r.password) setReveal({ email: f.email, password: r.password }); setF({ email: "", fullName: "", role: "staff" }); }, "Account created"); }}>
            <Field label="Email"><input className={inputCls} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Field>
            <Field label="Name"><input className={inputCls} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></Field>
            <Field label="Role"><select className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as "owner" | "staff" })}><option value="staff">Staff</option><option value="owner">Owner</option></select></Field>
            <button className={btnCls} disabled={pending}>Create login</button>
          </form>
          <div className="px-5 pb-4"><Msg error={error} done={done} /></div>
        </Card>
      )}
      <Card>
        <CardHead title={`${staff.length} ${staff.length === 1 ? "person" : "people"}`} />
        <Table head={["Person", "Role", "Last sign-in", "Added", ""]}>
          {staff.map((s) => (
            <Tr key={s.id}>
              <Td className="font-bold">{s.full_name ?? "—"}<span className="block text-[11px] font-normal text-[var(--ink-55)]">{s.email}{s.id === meId ? " · you" : ""}</span></Td>
              <Td><Pill value={s.role} /></Td>
              <Td className="text-[var(--ink-55)]">{fmtDate(s.last_sign_in_at)}</Td>
              <Td className="text-[var(--ink-55)]">{fmtDate(s.created_at)}</Td>
              <Td>{isOwner && s.id !== meId && (
                <span className="flex gap-3 text-[11px] uppercase tracking-[0.14em]">
                  <button className="underline" disabled={pending} onClick={() => run(() => setStaffRole(s.id, s.role === "owner" ? "staff" : "owner"), undefined, "Role updated")}>{s.role === "owner" ? "Make staff" : "Make owner"}</button>
                  <button className="underline" disabled={pending} onClick={() => run(() => resetStaffPassword(s.id), (r) => { if (r.password) setReveal({ email: s.email, password: r.password }); }, "Password reset")}>Reset password</button>
                  <button className="text-rose-700 underline" disabled={pending} onClick={() => { if (confirm(`Remove ${s.email}? They will not be able to sign in.`)) run(() => removeStaff(s.id), undefined, "Removed"); }}>Remove</button>
                </span>
              )}</Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
