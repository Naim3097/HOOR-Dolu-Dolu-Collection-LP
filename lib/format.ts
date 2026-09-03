import { CONFIG } from "@/lib/products";
import data from "@/lib/lqip.json";

export const money = (n: number) => CONFIG.currencySymbol + (Number.isInteger(n) ? n : n.toFixed(2));
const LQ = data as unknown as { lqip: Record<string, string>; dims: Record<string, [number, number]> };
export const lqip = (name: string) => LQ.lqip[name];
export const dims = (name: string) => LQ.dims[name];
/**
 * Renders exist at the standard widths capped to each source's real width, plus
 * the source width itself when it falls below 900 (e.g. the premise photo at 765).
 * Build candidates from what is actually on disk.
 */
export const widthsFor = (name: string) => {
  const max = dims(name)?.[0] ?? Infinity;
  const ws = [480, 900, 1400].filter((w) => w <= max);
  if (Number.isFinite(max) && max < 900) ws.push(max);
  return ws.length ? ws : [480];
};
export const imgSrc = (name: string, w?: number) => `/assets/img/${name}-${w ?? widthsFor(name).at(-1)}.webp`;
export const srcset = (name: string) => widthsFor(name).map((w) => `${imgSrc(name, w)} ${w}w`).join(", ");
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
/** "seventeen" / "Seventeen" for small counts, digits beyond. */
export const numberWord = (n: number, cap = false) => { const w = WORDS[n] ?? String(n); return cap ? w[0].toUpperCase() + w.slice(1) : w; };
export const PAY_NAMES: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", unionpay: "UnionPay", fpx: "FPX", maybank: "Maybank", cimb: "CIMB", banktransfer: "Bank transfer" };
