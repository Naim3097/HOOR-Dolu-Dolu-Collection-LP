"use client";
export function PrintButton() {
  return <button type="button" onClick={() => print()} className="mt-2 text-[11px] uppercase tracking-[0.14em] underline print:hidden">Print</button>;
}
