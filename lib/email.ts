import "server-only";
import { rm } from "@/lib/money";

/**
 * Transactional email through Resend (provisioned via the Vercel Marketplace,
 * which sets RESEND_API_KEY). Plain HTTP: no SDK needed. Sending never throws
 * into the caller; a failed email is logged and the order flow carries on.
 *
 * EMAIL_FROM must be an address on a domain verified in Resend, e.g.
 * "HOOR <orders@hoor.my>". Until then Resend's onboarding sender works for
 * test sends to the account owner only.
 */
const API = "https://api.resend.com/emails";
const FROM = process.env.EMAIL_FROM ?? "HOOR <onboarding@resend.dev>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoor-dolu-dolu-collection-lp.vercel.app";

type Line = { product_name: string; colour_name: string; size: string; qty: number; unit_price_sen: number };
type Order = { ref: string; customer: { name: string; email: string }; delivery: { line1: string; line2?: string; postcode: string; city: string; state: string }; subtotal_sen: number; discount_sen: number; discount_code: string | null; shipping_sen: number; total_sen: number };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const SIZE: Record<string, string> = { SM: "S/M", LXL: "L/XL" };

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#FAF6F1;font-family:Karla,Helvetica,Arial,sans-serif;color:#1E1B18">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
  <p style="font-family:Georgia,serif;font-size:22px;letter-spacing:.25em;margin:0 0 4px">HOOR</p>
  <p style="font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#746C63;margin:0 0 28px">Batik Dolu-Dolu</p>
  <h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;line-height:1.2;margin:0 0 16px">${title}</h1>
  ${body}
  <p style="font-size:12px;color:#746C63;margin-top:32px;line-height:1.6">HOOR · Lot 2-5, Second Floor, The Linc KL, 360 Jalan Tun Razak, 50400 Kuala Lumpur<br>Questions? Reply to this email or WhatsApp +60 17-250 0323.</p>
</div></body></html>`;
}

function lines(items: Line[]) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${items.map((l) => `<tr><td style="padding:8px 0;border-bottom:1px solid #EAE3DA"><b>${esc(l.product_name)}</b><br><span style="color:#746C63">${esc(l.colour_name)} · ${SIZE[l.size] ?? l.size} · ×${l.qty}</span></td><td style="padding:8px 0;border-bottom:1px solid #EAE3DA;text-align:right;white-space:nowrap">${rm(l.unit_price_sen * l.qty)}</td></tr>`).join("")}</table>`;
}
function totals(o: Order) {
  const row = (k: string, v: string, bold = false) => `<tr><td style="padding:4px 0;color:${bold ? "#1E1B18" : "#746C63"};${bold ? "font-weight:700" : ""}">${k}</td><td style="padding:4px 0;text-align:right;${bold ? "font-weight:700" : ""}">${v}</td></tr>`;
  return `<table style="width:100%;font-size:14px;margin-top:12px">${row("Subtotal", rm(o.subtotal_sen))}${o.discount_sen ? row(`Discount${o.discount_code ? ` (${esc(o.discount_code)})` : ""}`, `−${rm(o.discount_sen)}`) : ""}${row("Delivery", o.shipping_sen ? rm(o.shipping_sen) : "Free")}${row("Total paid", rm(o.total_sen), true)}</table>`;
}
const address = (o: Order) => `<p style="font-size:14px;line-height:1.6;margin:0"><b>${esc(o.customer.name)}</b><br>${esc(o.delivery.line1)}${o.delivery.line2 ? `, ${esc(o.delivery.line2)}` : ""}<br>${esc(o.delivery.postcode)} ${esc(o.delivery.city)}, ${esc(o.delivery.state)}</p>`;

async function send(to: string, subject: string, html: string, tag: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.warn(`[email] RESEND_API_KEY not set; skipped "${subject}" to ${to}`); return false; }
  try {
    const res = await fetch(API, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: FROM, to: [to], subject, html, tags: [{ name: "type", value: tag }] }) });
    if (!res.ok) console.error(`[email] Resend ${res.status}: ${await res.text()}`);
    return res.ok;
  } catch (e) { console.error("[email] send failed", e); return false; }
}

export function orderConfirmation(o: Order, items: Line[]) {
  const html = shell(`Thank you, ${esc(o.customer.name.split(" ")[0])}. Order ${o.ref} is confirmed.`,
    `<p style="font-size:14px;line-height:1.6">Payment received. We pack within 24 hours and you will get another email with the tracking number the moment it leaves us.</p>
     ${lines(items)}${totals(o)}
     <p style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#746C63;margin:24px 0 6px">Delivering to</p>${address(o)}
     <p style="margin-top:24px"><a href="${SITE}/checkout/return?ref=${encodeURIComponent(o.ref)}" style="display:inline-block;background:#1E1B18;color:#FAF6F1;text-decoration:none;font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding:12px 20px">View your order</a></p>`);
  return send(o.customer.email, `Order ${o.ref} confirmed · HOOR`, html, "order_confirmation");
}

export function orderShipped(o: Order, items: Line[], s: { courier: string | null; tracking_no: string | null; tracking_url: string | null }) {
  const track = s.tracking_no ? (s.tracking_url ? `<a href="${s.tracking_url}" style="color:#1E1B18">${esc(s.tracking_no)}</a>` : esc(s.tracking_no)) : "coming shortly";
  const html = shell(`Order ${o.ref} is on its way.`,
    `<p style="font-size:14px;line-height:1.6">Handed to ${esc(s.courier ?? "the courier")}. Tracking number: <b>${track}</b>. Semenanjung usually arrives in 1–3 days, Sabah, Sarawak and Labuan in 3–7.</p>
     ${lines(items)}
     <p style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#746C63;margin:24px 0 6px">Delivering to</p>${address(o)}`);
  return send(o.customer.email, `Order ${o.ref} has shipped · HOOR`, html, "order_shipped");
}

export function orderRefunded(o: Order, amountSen: number) {
  const html = shell(`A refund of ${rm(amountSen)} is on its way.`,
    `<p style="font-size:14px;line-height:1.6">For order ${o.ref}. Refunds land back on the card or bank account you paid with, usually within 3–10 working days depending on your bank.</p>`);
  return send(o.customer.email, `Refund for order ${o.ref} · HOOR`, html, "order_refunded");
}
