import { CONFIG } from "@/lib/products";
import data from "@/lib/lqip.json";
import { asset } from "@/lib/assets";

export const money = (n: number) => CONFIG.currencySymbol + (Number.isInteger(n) ? n : n.toFixed(2));
const LQ = data as unknown as { lqip: Record<string, string>; dims: Record<string, [number, number]>; widths?: Record<string, number[]> };
export type ImageMeta = { lqip: string; dims: [number, number]; widths: number[] };
/** Catalogue images come from the database at request time; hero, closer and visit stay in lqip.json. */
const REG: Record<string, ImageMeta> = {};
export function registerImageMeta(map: Record<string, ImageMeta>) { Object.assign(REG, map); }
export const lqip = (name: string) => REG[name]?.lqip ?? LQ.lqip[name];
export const dims = (name: string) => REG[name]?.dims ?? LQ.dims[name];
/**
 * The widths that exist for a render, as recorded by `npm run media:build`.
 * Falls back to the standard widths capped to the source's real width, plus
 * the source width itself when it falls below 900.
 */
export const widthsFor = (name: string) => {
  const known = REG[name]?.widths ?? LQ.widths?.[name];
  if (known?.length) return known;
  const max = dims(name)?.[0] ?? Infinity;
  const ws = [480, 900, 1400].filter((w) => w <= max);
  if (Number.isFinite(max) && max < 900) ws.push(max);
  return ws.length ? ws : [480];
};
export const imgSrc = (name: string, w?: number) => asset(`img/${name}-${w ?? widthsFor(name).at(-1)}.webp`);
export const srcset = (name: string) => widthsFor(name).map((w) => `${imgSrc(name, w)} ${w}w`).join(", ");
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
/** "seventeen" / "Seventeen" for small counts, digits beyond. */
export const numberWord = (n: number, cap = false) => { const w = WORDS[n] ?? String(n); return cap ? w[0].toUpperCase() + w.slice(1) : w; };
export const PAY_NAMES: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", unionpay: "UnionPay", fpx: "FPX", maybank: "Maybank", cimb: "CIMB", banktransfer: "Bank transfer" };
