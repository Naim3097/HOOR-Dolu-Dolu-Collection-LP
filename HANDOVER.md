# Batik Dolu-Dolu — campaign landing page

A single-collection storefront for Meta traffic: discover → choose → cart →
checkout → confirmation, without leaving the page.

No framework, no build step, no dependencies, no third-party requests. Open
`landing/index.html` on any static host and it runs.

```bash
node .claude/server.js
```

Then visit <http://localhost:5273/landing/>.

---

## 1. Read this first — every assumption on the page

Marked `⚑` in the code. Nothing here is a bug; each is a decision that needs
HOOR to confirm before money goes into ads.

| # | Assumption | Where | Why it matters |
|---|---|---|---|
| 1 | **Product names** — PUSAKA, SEMARAK, RIMBUN, RENDA, SENJA, ANGGERIK | `data.js` → `PRODUCTS` | Proposed, not given. They follow HOOR's live convention and each Malay word describes its own print. Swap freely. |
| 2 | **RM199 per piece** | `data.js` → `CONFIG.basePrice` | Matches HOOR's live abaya/kaftan price on hoor.my. Confirm campaign pricing and any launch offer. |
| 3 | **Stock numbers** | `data.js` → each colourway's `stock` | Placeholders. Wire to real inventory. Until you do, leave `showStockPressure: false` — see §5. |
| 4 | ~~Fabric~~ **Confirmed: premium cotton silk** (client instruction, Sep 2026) | `data.js` → `FABRIC` | Copy updated across hero, claims bar, The Cloth, FAQ. |
| 5 | **Care instructions** | `data.js` → `CARE` | Sensible default, not supplied. Confirm. |
| 6 | **Delivery RM8 / RM15, free over RM250** | `data.js` → `CONFIG.shipping`, `freeShippingOver` | Not supplied. Set `freeShippingOver: null` to remove the free-delivery nudge entirely. |
| 7 | **Colour swatches** | `data.js` → each `swatch` | Sampled from the photography. Check against physical fabric. |
| 8 | **The RIMBUN shawl** | `data.js` → `rimbun.note` | The page says only "Shown styled with a shawl" and claims nothing. If it is included, say so — it is a selling point. |
| 9 | **Payment gateway** | `app.js` → `createOrder()` | Simulated. One function to replace — see §4. |
| 10a | **Seventeen colours, not fifteen** | `data.js` → `PRODUCTS` | Every distinct look in the supplied assets is now purchasable: 16 products / 17 colourways (RENDA carries two). The client's stated count was fifteen; the folder verifiably holds seventeen (TENUN Monochrome and PUTERI Navy Blush are the two beyond fifteen). If any look is not for sale, remove its entry and restore the fifteen wording in the shop heading, closer and cart. |
| 10b | **Shipping promise** | FAQ, product sheet, checkout, confirmation | Client instruction: dispatched within 24 hours, doorstep in 1–3 days — this **overrides hoor.my's published max-10-working-days policy** and is stated as a blanket promise including East Malaysia. Make sure operations can honour it before ads run. |
| 10c | **Premise photo** | FAQ visit block | The store block shows a designed locator card (The Linc · Second Floor · Lot 2-5) plus a Google Maps link. Swap the card for a real premise photo when one exists. Address and phone came from hoor.my's own storefront config. |
| 10 | **WhatsApp number** | `data.js` → `CONFIG.support.whatsapp` | Set to `60172500323`, taken from hoor.my's own storefront configuration (`whatsapp_phone`). ⚑ Confirm this is the channel HOOR wants campaign enquiries on; emptying the field hides the button. |

Confirmed facts, taken from HOOR's own material and **not** invented: the
collection name and its hyphenation, the size chart, all product claims, the
7-day return window, the 14-day refund window, the 10-working-day dispatch
window, the support email and hours, and the payment methods offered.

---

## 1b. Design system, second revision (client feedback round)

- The hero facts line ("6 prints · S/M–4XL · From RM199 · Pockets included")
  was removed at client request — the claims bar below the hero carries it.
- **Hero** uses the two supplied group-shot masters (`HOOR Hero Section.png`
  16:9 for desktop, `HOOR Mobile Hero Section.png` for phones), art-directed
  separately: ink type sits in the photograph's own negative space, and the
  mobile build is a cover format (masthead top, one line + one button low over
  a soft scrim). Frames narrower than 16:9 crop from the right (`object-position
  40%`) so the group survives and the wall keeps room for the title.
- **CTAs are buttons only** (final client decision). Commitment actions
  (Add to bag, Checkout, Pay) are solid ink; every other action is the same
  button in a hairline frame, with the ink fill drawing across on hover.
  There is no text-link CTA style and no arrows anywhere.
- **"One Dress, Every Occasion" palette is constrained by the client to white
  plus the two brand codes** (#99A895, #F7EED2). Keep it that way.
- **Films sit inset and centred** in balanced two-column spreads on desktop
  (client rebalance), edge-to-edge on mobile. No rounded containers, no arrows.
  Encodes are per-placement: The Cloth runs the IMG_2806 master (SENJA) at
  900px / 2.4Mbps and starts at its bright passage via `data-start`;
  Occasions runs RENDA at 810px / 2.0Mbps. `tools/video.html` takes per-job
  `w`/`kbps`/`poster`; `tools/poster.html` re-grabs a poster frame alone.
- **The product grid is deliberately symmetrical** (client decision): equal
  cards, equal gaps. Editorial asymmetry is reserved for storytelling sections
  (the layered pair in the story block, the edge-bleed films, the image-led
  closer).

### Final-section (closer) artwork spec

The closing section is full-width at 72svh minimum. Supply two exports:

| Export | Size | Aspect | Notes |
|---|---|---|---|
| Desktop | **2560 × 1080 px** (21:9) | shows as a 2.2–2.5:1 slice | subject centre-right, faces in the top 60% |
| Mobile | **1080 × 1620 px** (2:3) | shows at ~0.64 | faces in the top half |

Keep critical content out of the bottom 35% (text scrim will sit there) and out
of the lower-left on desktop (headline block). Drop the files in /assets, add
both to `landing/assets/manifest.json`, re-run `tools/optimize.html`, and give
the closer a `<picture>` exactly like the hero. **The closer background is
deliberately blank for now** (client decision) — the section works without an
image until final artwork arrives.

## 2. Why the page is shaped the way it is

**The campaign line came from HOOR, not from a copywriter.** `IMG_2821.MOV`
carries the burned-in caption *One Dress, Every Occasion*, followed by Office
Wear, Special Occasions, Dinner Dates, Celebration Moments, Holiday Getaway.
That is the argument that converts: it reframes RM199 from a price into a
cost-per-wear, and it handles the biggest objection — *when would I actually
wear this* — before it is raised. It became the spine of the page.

**"Dolu-dolu" is the concept, not decoration.** It means the old days. The shoot
is a deliberately nostalgic Malaysian flat, and the prints are heritage batik
redrawn. The page says that plainly and then gets out of the way.

**Section order is a conversion decision.** Hero → claims → a short story →
**the products** → occasions → fabric → fit → FAQ → closing CTA. Products sit
about two screens in on a phone. Everything after them exists to answer someone
who scrolled past without buying, and the sticky bar returns them.

**Deliberately absent:** navigation, category browsing, countdown timers,
invented reviews, invented scarcity, and any link that sends a paid visitor
somewhere they cannot buy. Footer links to hoor.my open in a new tab so the
purchase path is never lost.

---

## 3. Where things live

```
landing/
  index.html          markup — every section, no copy hard-coded in JS
  css/hoor.css        design system, mobile-first, ~26 numbered sections
  js/data.js          ← products, prices, stock, sizes, copy. Change things HERE
  js/app.js           behaviour: grid, drawer, cart, checkout, tracking
  assets/
    img/              64 WebP renders at 480/900/1400
    video/            3 WebM + poster frames
    fonts/            8 self-hosted woff2 (Karla, Playfair Display)
    brand/            logo, SVG + PNG
    lqip.json         inline blur placeholders — this is why CLS is 0
    manifest.json     source → output map for the image pipeline
```

**To change a price, a name, an image, stock or any product copy, edit
`js/data.js` and nothing else.** The page renders entirely from it.

To add a colourway, add an object to that product's `colourways` array. The
swatches, the filter chips, the gallery and the deep links all pick it up.

---

## 4. Wiring the real payment gateway

The checkout is complete and production-shaped — validation, Malaysian state
handling, live delivery repricing, order summary, confirmation with an order
reference. Only the network call is simulated.

Replace one function in `app.js`:

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

Return a `redirectUrl` and the page sends the customer to it. Return none and it
falls through to the built-in confirmation screen.

`payload` already contains items with SKUs, customer, delivery (including the
derived `region`), payment method, amounts, and **`attribution`** — every URL
parameter the visitor arrived with, so `utm_*`, `fbclid` and ad-set IDs reach
your order record.

**On card payments.** The card option deliberately does not collect a card
number. It tells the customer their details are entered on the provider's own
encrypted page, which is exactly how HOOR's current stack (Boutir → FPX /
Stripe / iPay88) already works. Keep it that way: a hosted field or a redirect,
never a raw card input on this page.

**On the redirect return.** If the gateway redirects away, fire the `purchase`
event on the *return* URL rather than here, so a customer who abandons at the
bank is not counted as a sale.

Payment methods shown are exactly the ones hoor.my displays today: FPX
(Maybank2u, CIMB Clicks and other banks), card (Visa / Mastercard / UnionPay),
and manual bank transfer. FPX is preselected because it is the highest-converting
default in Malaysia. Change the order in `PAY_METHODS` in `app.js`.

---

## 5. Tracking

Every event pushes to `window.dataLayer` and mirrors to `fbq` when the Meta
Pixel is present. Add the Pixel and GTM to `<head>` and the funnel populates
with no further work.

| Event | Fires when | Meta equivalent |
|---|---|---|
| `page_view` | Load — includes all URL parameters | PageView |
| `scroll_depth` | 25 / 50 / 75 / 90 % | — |
| `cta_click` | Any tracked CTA, with its location | — |
| `filter_colour` | A colour chip is used | — |
| `select_colour` | A swatch changes the image | — |
| `view_item` | The product drawer opens | ViewContent |
| `select_size` | A size is chosen | — |
| `view_size_guide` / `size_finder` | Size guide opened / finder used | — |
| `faq_open` | An FAQ is expanded | — |
| `add_to_cart` | Added to bag | AddToCart |
| `view_cart` | Bag drawer opens | ViewCart |
| `begin_checkout` | Checkout opens | InitiateCheckout |
| `add_shipping_info` | Details step passes validation | — |
| `select_payment_method` / `add_payment_info` | Method chosen / pay pressed | AddPaymentInfo |
| `play_video` | A film is tapped on mobile | — |
| `contact_whatsapp` | The floating WhatsApp button is tapped | Contact |
| `purchase` | Order confirmed, with `transaction_id` | Purchase |

Append `?debug=1` to any URL to log every event to the console.

`size_finder`, `select_size` and `faq_open` are the diagnostic ones. If people
use the finder and still do not add to bag, the problem is sizing confidence,
not the product.

### Truthfulness switch

`CONFIG.showStockPressure` is **off**. Turn it on only when the numbers in
`data.js` are real live stock. It reveals "Low stock" on cards and "Only N left
in 2XL" in the product sheet — both honest when the data is, and corrosive when
it is not. There is no countdown timer and no fake urgency anywhere.

---

## 6. Deep links — one landing page, many ad angles

| URL | Opens |
|---|---|
| `/landing/` | Top of the campaign |
| `/landing/#shop` | Straight to the grid |
| `/landing/?p=renda` | RENDA's product sheet |
| `/landing/?p=renda:indigo` | RENDA in Indigo specifically |
| `/landing/?p=renda:indigo&size=2XL` | …with the size preselected |

A colourway-specific ad can land on that exact colourway with the buy panel
already open. Retargeting a size-abandoner can land on their size. UTM
parameters pass straight through into the order payload.

### Where real social proof goes

None is on the page because none was supplied and none was invented. When you
have real reviews, the natural home is between the product grid and the
occasions band — a short row of three, with names and the piece each person
bought. UGC in the campaign's own photographic register works; star ratings
alone do not.

---

## 7. Performance and accessibility

Measured in-browser, transfer size:

| | Phone (375 px) | Desktop (1280 px) |
|---|---|---|
| First screen | **415 KB**, 10 requests | ~650 KB |
| Whole page, scrolled to the footer | **566 KB** | ~1.2 MB (films autoplay) |
| Cumulative Layout Shift | **0** | **0** |
| Third-party requests | **0** | **0** |

Four things do most of that work:

- **Three WebP renders per photograph** (480 / 900 / 1400) with `sizes` that
  match the real layout, plus a `<picture>` that caps the hero at 900 px on
  phones so a high-DPR device never pulls the 1400 px plate.
- **Inline 20 px blur placeholders**, which is why nothing on the page reflows.
- **Card hover images wait for a real pointer.** The second photo on each card
  exists only for the desktop cross-fade; on a phone it never downloads.
- **Films are desktop-only autoplay.** Below 900 px they show their poster —
  which already carries the campaign's burned-in caption — with a *Play film*
  tap target. That is the difference between 678 KB and 5 MB for someone who
  scrolls the whole page on mobile data. Save-Data and reduced-motion get the
  poster and no video at all. The threshold is `AUTOPLAY_VIDEO` in `app.js`.

Accessibility: one `h1`, no skipped heading levels, labelled controls, focus
trapped in every drawer, Escape closes, focus returns to where it came from,
`prefers-reduced-motion` honoured throughout, 44 px minimum tap targets.

### Before you go live

- [ ] Confirm everything in §1
- [ ] Replace `createOrder()` with the real gateway (§4)
- [ ] Add the Meta Pixel and GTM to `<head>`
- [ ] Point the footer policy links at final URLs
- [ ] Set the canonical domain in the `og:image` meta tag
- [ ] Deploy: `vercel.json` is included — import the repo on Vercel and deploy with defaults. It serves only `landing/` (originals and dev tools stay private) and sets cache headers. Note: image/video renders reuse their filenames when the pipeline re-runs, so cache is 7 days, not immutable
- [ ] Re-run the image pipeline if any photography changes — the map is
      `landing/assets/manifest.json`, the tools are `tools/optimize.html` and
      `tools/video.html` (see `tools/README.md`). Do not deploy `tools/` or the dev server.

---

## 8. Honest limits

- **The gateway is simulated.** The UI, validation and confirmation are real; the
  network call is not. One function to swap.
- **Order confirmation emails** are described to the customer but not sent —
  that belongs on your server.
- **Stock is not live.** Two people can currently buy the last 2XL.
- **Videos are re-encoded from the supplied MOVs**, not from masters. They are
  good at the size they are shown. If you have the originals, re-encoding from
  those will look better at the same file size.
- **Product names, fabric and care copy are unconfirmed.** See §1.
