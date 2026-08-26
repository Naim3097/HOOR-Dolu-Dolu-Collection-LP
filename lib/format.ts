import { CONFIG } from "@/lib/products";
import data from "@/lib/lqip.json";

export const money = (n: number) => CONFIG.currencySymbol + (Number.isInteger(n) ? n : n.toFixed(2));
const LQ = data as unknown as { lqip: Record<string, string>; dims: Record<string, [number, number]> };
export const lqip = (name: string) => LQ.lqip[name];
export const dims = (name: string) => LQ.dims[name];
export const srcset = (name: string) => [480, 900, 1400].map((w) => `/assets/img/${name}-${w}.webp ${w}w`).join(", ");
export const PAY_NAMES: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", unionpay: "UnionPay", fpx: "FPX", maybank: "Maybank", cimb: "CIMB", banktransfer: "Bank transfer" };
