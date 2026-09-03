import type { ReactNode } from "react";

/* Shared back-office primitives. Plain Tailwind on the HOOR palette tokens. */

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-[family-name:var(--serif)] text-3xl text-[var(--ink)]">{title}</h1>
        {sub && <p className="mt-1 text-[13px] text-[var(--ink-55)]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`border border-[var(--line)] bg-[var(--white)] ${className}`}>{children}</section>;
}

export function CardHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-[var(--line-soft)] px-5 py-3">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-80)]">{title}</h2>
      {action}
    </header>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] [font-variant-numeric:tabular-nums]">
        <thead>
          <tr className="border-b border-[var(--line-soft)] text-left text-[10px] uppercase tracking-[0.16em] text-[var(--ink-55)]">
            {head.map((h) => <th key={h} className="px-5 py-2.5 font-bold">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export const Tr = ({ children }: { children: ReactNode }) => <tr className="border-b border-[var(--line-soft)] last:border-0 hover:bg-[var(--paper-2)]">{children}</tr>;
export const Td = ({ children, className = "" }: { children: ReactNode; className?: string }) => <td className={`px-5 py-3 align-middle ${className}`}>{children}</td>;

const PILL: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  paid: "bg-sky-100 text-sky-900",
  fulfilled: "bg-indigo-100 text-indigo-900",
  completed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-rose-100 text-rose-900",
  refunded: "bg-stone-200 text-stone-800",
  failed: "bg-rose-100 text-rose-900",
  booked: "bg-sky-100 text-sky-900",
  shipped: "bg-indigo-100 text-indigo-900",
  delivered: "bg-emerald-100 text-emerald-900",
  active: "bg-emerald-100 text-emerald-900",
  inactive: "bg-stone-200 text-stone-800",
  owner: "bg-[var(--sage)] text-[var(--ink)]",
  staff: "bg-stone-200 text-stone-800",
};
export function Pill({ value }: { value: string }) {
  return <span className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${PILL[value] ?? "bg-stone-200 text-stone-800"}`}>{value}</span>;
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-[var(--line)] bg-[var(--white)] px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-55)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--serif)] text-2xl text-[var(--ink)] [font-variant-numeric:tabular-nums]">{value}</p>
      {sub && <p className="mt-0.5 text-[12px] text-[var(--ink-55)]">{sub}</p>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-55)]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-[var(--ink-55)]">{hint}</span>}
    </label>
  );
}
export const inputCls = "w-full border border-[var(--line)] bg-[var(--white)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--ink)]";
export const btnCls = "inline-flex items-center justify-center border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--paper)] hover:opacity-90 disabled:opacity-40";
export const btnGhostCls = "inline-flex items-center justify-center border border-[var(--line)] bg-transparent px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink)] hover:border-[var(--ink)] disabled:opacity-40";

export const dateFmt = new Intl.DateTimeFormat("en-MY", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" });
export const fmtDate = (d: string | null | undefined) => (d ? dateFmt.format(new Date(d)) : "—");
