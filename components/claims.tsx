import { CLAIMS } from "@/lib/products";
export function Claims() {
  return (
    <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 border-y border-line px-gut py-5 text-label uppercase tracking-[0.2em] text-ink-55">
      {CLAIMS.map((c) => <li key={c}>{c}</li>)}
    </ul>
  );
}
