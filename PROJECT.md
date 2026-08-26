# HOOR — Batik Dolu-Dolu Landing Page: Project Guide

End-to-end reference for the campaign landing page: what it is, what it is built with, how it is structured, how to run it, and how it ships. Companion documents: [README.md](README.md) (quick start), [HANDOVER.md](HANDOVER.md) (business assumptions, tracking, payment seam), [ASSETS.md](ASSETS.md) (photo/film audit).

---

## 1. What this is

A single-page storefront for the **Batik Dolu-Dolu** collection by HOOR (hoor.my), built to receive Meta (Facebook/Instagram) ad traffic. The full purchase funnel — discover → choose colour/size → cart → checkout → confirmation — happens on one page with no navigation away.

Key product decisions:
- 6 prints (PUSAKA, SEMARAK, RIMBUN, RENDA, SENJA, ANGGERIK), one at two colourways; RM199 per piece; sizes S/M–4XL.
- No nav, no category browsing, no countdown timers, no invented reviews or scarcity.
- Payment call is **simulated** — one function to swap for the real gateway (see §7).

Repository: <https://github.com/Naim3097/HOOR-Dolu-Dolu-Collection-LP>

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Markup | Plain HTML5 (`landing/index.html`, ~400 lines) | One `h1`, semantic sections, `<picture>` for art-directed hero |
| Styling | Hand-written CSS (`landing/css/hoor.css`, ~1,240 lines) | Mobile-first design system in ~26 numbered sections; no preprocessor |
| Behaviour | Vanilla JavaScript ES modules (`landing/js/app.js` ~1,580 lines, `landing/js/data.js` ~280 lines) | No framework, no bundler, no npm dependencies |
| Fonts | Self-hosted WOFF2 — Karla, Playfair Display | 8 files in `landing/assets/fonts/`; zero Google Fonts requests |
| Images | WebP renders at 480 / 900 / 1400 px + inline blur placeholders (`lqip.json`) | 64 renders; CLS = 0 |
| Video | Silent VP9 WebM + poster frames | Desktop autoplay only; posters on mobile |
| Tracking | `window.dataLayer` push, mirrored to `fbq` when Meta Pixel is present | GTM/Pixel are added to `<head>` at launch — not yet present |
| Dev server | `node .claude/server.js` (Node.js, no deps) | Loopback-only; exposes `POST /__save` for the asset tools |
| Asset pipeline | Browser-based tools in `tools/` (`optimize.html`, `video.html`, `poster.html`) | Dev-only; never deployed |
| Hosting | Vercel static (`vercel.json`, `framework: null`, `outputDirectory: landing`) | Any HTTPS static host works |
| Build step | **None** | What is in `landing/` is what ships |
| Third-party runtime requests | **Zero** | Until Pixel/GTM are added |

Why no framework: the page is content-heavy, must load fast on Malaysian mobile data, and has one job. Everything renders from `data.js`; a build tool would add cost without benefit.

---

## 3. Repository layout

```
.
├── README.md              quick start
├── HANDOVER.md            assumptions (⚑), design decisions, tracking, gateway seam, perf
├── ASSETS.md              audit of supplied photography/film
├── PROJECT.md             this file
├── vercel.json            deployment config (serves landing/ only, cache headers)
├── .claude/
│   └── server.js          loopback dev server on :5273
├── assets/                UNTOUCHED originals from HOOR (45 files, two shoots) — not deployed
├── tools/                 dev-only browser pipelines — not deployed
│   ├── optimize.html      originals → WebP renders + lqip.json
│   ├── video.html         MOV → WebM + poster
│   ├── poster.html        regrab a poster frame
│   └── README.md
└── landing/               ← THE DEPLOYABLE SITE
    ├── index.html         all markup and copy
    ├── css/hoor.css       design system
    ├── js/
    │   ├── data.js        products, prices, stock, sizes, copy — EDIT HERE
    │   └── app.js         grid, drawer, cart, checkout, tracking
    └── assets/
        ├── img/           64 WebP renders
        ├── video/         3 WebM + posters
        ├── fonts/         8 woff2
        ├── brand/         logo SVG + PNG
        ├── lqip.json      blur placeholders + dimensions
        └── manifest.json  source → output map for the image pipeline
```

---

## 4. Architecture

### Data-driven rendering
`landing/js/data.js` exports `CONFIG` (base price, shipping, free-shipping threshold, WhatsApp number, `showStockPressure` flag), `PRODUCTS` (each with `colourways[]` → images, swatch, stock per size), `FABRIC`, `CARE`, size chart and copy. `app.js` builds the product grid, product drawer, colour filters, gallery and deep links entirely from it. **To change a price, name, image or stock, edit `data.js` and nothing else.**

### Page flow (`app.js`)
1. **Grid** — cards with hover cross-fade (second image only loads on real pointer devices).
2. **Product drawer** — gallery, swatches, size selector, size guide/finder, add to bag.
3. **Cart drawer** — line items, delivery estimate, free-shipping nudge.
4. **Checkout** — customer details, Malaysian state → region → delivery repricing, payment method (FPX preselected, card, bank transfer), order summary.
5. **`createOrder(payload)`** — currently simulated; returns `{ orderRef, redirectUrl }`.
6. **Confirmation** — built-in screen, or redirect if the gateway returns a URL.

All drawers trap focus, close on Escape, and return focus. `prefers-reduced-motion` and Save-Data are honoured.

### Deep links
| URL | Result |
|---|---|
| `/#shop` | Jump to grid |
| `/?p=renda` | Open RENDA's sheet |
| `/?p=renda:indigo` | RENDA in Indigo |
| `/?p=renda:indigo&size=2XL` | …with size preselected |

All arriving URL params (`utm_*`, `fbclid`, etc.) are carried into the order payload as `attribution`.

### Tracking
Events: `page_view`, `scroll_depth`, `cta_click`, `filter_colour`, `select_colour`, `view_item`, `select_size`, `view_size_guide`, `size_finder`, `faq_open`, `add_to_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `select_payment_method`, `add_payment_info`, `play_video`, `contact_whatsapp`, `purchase`. Standard Meta equivalents are mirrored (ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase, Contact). Add `?debug=1` to log every event to the console.

### Performance (measured)
| | Phone 375px | Desktop 1280px |
|---|---|---|
| First screen | 415 KB / 10 requests | ~650 KB |
| Full page | 566 KB | ~1.2 MB (films autoplay) |
| CLS | 0 | 0 |
| Third-party requests | 0 | 0 |

---

## 5. Local development

Requirements: Node.js (any recent LTS) and a modern browser. No `npm install`.

```bash
git clone https://github.com/Naim3097/HOOR-Dolu-Dolu-Collection-LP.git
cd HOOR-Dolu-Dolu-Collection-LP
node .claude/server.js
```

Open <http://localhost:5273/landing/>. The server binds to loopback only.

Any static server also works for the page alone (e.g. `npx serve landing`), but the asset tools need `.claude/server.js` because they write files back via `POST /__save`.

---

## 6. Asset pipeline (when photography or film changes)

1. Drop the new original into `assets/`.
2. Add a row to `landing/assets/manifest.json` (source file → output name, using the `product_colourway_type_NN` scheme from ASSETS.md).
3. With the dev server running, open <http://localhost:5273/tools/optimize.html> — it writes 480/900/1400 WebP renders to `landing/assets/img/` and refreshes `lqip.json`.
4. For video, edit `JOBS` at the top of `tools/video.html` and open <http://localhost:5273/tools/video.html> — writes WebM + poster to `landing/assets/video/`. `tools/poster.html` regrabs a poster only.
5. Reference the new image name in `landing/js/data.js`.
6. Commit the generated files — there is no build on deploy.

---

## 7. Integrations to wire before launch

### Payment gateway
Replace `createOrder()` in `landing/js/app.js`:

```js
async function createOrder(payload) {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const { orderRef, redirectUrl } = await res.json();
  return { orderRef, redirectUrl };
}
```

`payload` includes items with SKUs, customer, delivery (with `region`), payment method, amounts, and `attribution`. The backend (`/api/orders`) does not exist in this repo — it can be a Vercel Function or an external service. Never collect raw card numbers on this page; use the provider's hosted page/redirect (as HOOR's current Boutir → FPX/Stripe/iPay88 stack does). If redirecting, fire `purchase` on the return URL, not before.

### Meta Pixel + GTM
Add the snippets to `<head>` in `landing/index.html`. The `dataLayer`/`fbq` pushes already exist — the funnel populates with no further code.

### Other
- Order confirmation emails — server-side, not in scope here.
- Live stock — `data.js` stock numbers are placeholders; keep `CONFIG.showStockPressure: false` until real.
- Confirm every ⚑ item in HANDOVER.md §1 (names, price, fabric, care, shipping, WhatsApp number).

---

## 8. Deployment

### Vercel (configured)
`vercel.json`:
- `framework: null`, no build command — static output.
- `outputDirectory: "landing"` — only the landing folder is served; `assets/` originals, `tools/` and `.claude/` are never public.
- Headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` on everything.
- Cache-Control: fonts 1 year immutable; images/video 7 days + stale-while-revalidate; CSS/JS 1 hour + SWR.
- `trailingSlash: false`.

Steps:
1. Push to GitHub (`main`).
2. In Vercel: **Add New → Project → Import** the repo. Accept defaults (Vercel reads `vercel.json`). Deploy.
3. Every push to `main` = production deploy; every branch/PR = preview URL.
4. Add the custom domain under Project → Settings → Domains; update the `og:image` canonical domain in `index.html`.

CLI alternative:
```bash
npm i -g vercel@latest
vercel          # preview
vercel --prod   # production
```

### Any other static host
Upload the contents of `landing/` to any HTTPS host (Netlify, Cloudflare Pages, S3+CloudFront, nginx). Reproduce the cache headers from `vercel.json` if you want the same caching behaviour. Nothing else is required.

### Pre-launch checklist
- [ ] All ⚑ assumptions confirmed (HANDOVER.md §1)
- [ ] `createOrder()` replaced with real gateway
- [ ] Meta Pixel + GTM in `<head>`
- [ ] Footer policy links pointed at final URLs
- [ ] `og:image` domain set
- [ ] Custom domain attached on Vercel
- [ ] Test deep links and a full checkout on a real phone
- [ ] Verify `purchase` fires only after successful payment

---

## 9. Known limits

- Gateway simulated; no backend in this repo.
- No order emails, no live inventory (two customers can buy the last unit).
- Videos are re-encoded from supplied MOVs, not masters.
- Product names, fabric and care copy are unconfirmed proposals.
- Closing section background is intentionally blank pending final artwork (spec in HANDOVER.md §1b).

---

## 10. Migration plan — Next.js + Supabase + LeanX

The static site is being rebuilt on a full stack. Content, design tokens, assets, tracking events and every HANDOVER decision carry over; the delivery mechanism changes.

### Target stack

| Layer | Target | Replaces |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | `landing/index.html`, `app.js` |
| Styling | Tailwind CSS (tokens from `hoor.css` as CSS variables) | `hoor.css` |
| UI | shadcn/ui — Sheet, Dialog, Accordion, Form, Input, Select, RadioGroup, Button, Sonner, Skeleton | custom drawers/accordions |
| Data | Supabase Postgres — `products`, `colourways`, `variants`, `orders`, `order_items` | `data.js` |
| Media | Supabase Storage public bucket + `next/image` (LQIP values kept as `blurDataURL`) | `tools/` pipeline, `landing/assets/img` |
| Backend | Next.js Route Handlers + Supabase (service role, server-only) | simulated `createOrder()` |
| Payment | LeanX.io hosted bill → redirect → webhook | simulated gateway |
| Tracking | same `dataLayer` / `fbq` event map, Pixel + GTM via `next/script` | inline script |
| Deploy | Vercel, Next.js preset, env vars | `vercel.json` static |

### Project structure

```
app/
  layout.tsx, page.tsx              landing (server component, fetches products)
  checkout/return/page.tsx          LeanX return → confirmation, fires `purchase`
  api/orders/route.ts               validate → insert order → decrement stock → create LeanX bill → { orderRef, redirectUrl }
  api/webhooks/leanx/route.ts       verify signature → mark paid / release stock
components/                         hero, claims, story, product-grid, product-sheet, cart-sheet, checkout-form, occasions, fabric, fit, faq, closer
components/ui/                      shadcn
lib/supabase/{client,server}.ts
lib/leanx.ts                        bill creation + signature verification
lib/tracking.ts                     typed event helpers
lib/products.ts                     types + seed data (ported from data.js)
supabase/migrations/                schema, RLS, seed
```

### Order flow

1. Client posts cart + customer + attribution to `/api/orders`.
2. Route validates (zod), inserts `orders` + `order_items` with status `pending`, reserves stock, creates a LeanX bill, stores the bill reference, returns `redirectUrl`.
3. Customer pays on LeanX's hosted page (FPX / card / e-wallet).
4. LeanX calls `/api/webhooks/leanx` → signature verified → order `paid` (or `failed`, stock released).
5. LeanX redirects to `/checkout/return?ref=…` → page reads order status → shows confirmation → fires `purchase` only when status is `paid`.

### Environment variables

| Name | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | read-only product access (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | server | orders, stock, webhooks |
| `LEANX_AUTH_TOKEN` | server | LeanX API auth |
| `LEANX_HASH_KEY` | server | webhook signature verification |
| `LEANX_COLLECTION_UUID` | server | LeanX collection to bill against |
| `LEANX_BASE_URL` | server | sandbox vs production API host |
| `NEXT_PUBLIC_SITE_URL` | public | absolute return/callback URLs |

### Steps

1. [x] Scaffold Next.js + TS + Tailwind + shadcn
2. [x] Port design tokens and fonts (`next/font/local`)
3. [x] Port `data.js` → `lib/products.ts` (typed) + Supabase seed migration
4. [~] Build sections as components — hero, claims, product grid done; product sheet, cart, checkout, occasions, fabric, fit, FAQ, closer pending; wire product sheet / cart / checkout with shadcn
5. [ ] Supabase project: run migrations, upload assets to Storage, set RLS
6. [~] LeanX: `lib/leanx.ts`, `/api/orders`, webhook and return page scaffolded (⚑ verify field names/hash against LeanX docs) — sandbox test pending; original: implement `lib/leanx.ts`, `/api/orders`, webhook, return page
7. [ ] Tracking helpers + Pixel/GTM
8. [ ] Vercel: import repo, set env vars, attach domain
9. [ ] Retire `landing/`, `tools/`, `.claude/server.js`, `vercel.json` once parity is verified

### Decisions pending from HOOR
- LeanX: hosted redirect (assumed) vs. embedded; sandbox credentials.
- Stock: reserve on order creation and release on failed webhook (assumed).
- Whether originals in `assets/` move to a private Supabase bucket.
