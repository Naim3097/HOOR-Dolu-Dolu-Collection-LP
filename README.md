# HOOR — Batik Dolu-Dolu campaign landing page

A single-collection storefront for Meta Ads traffic: discover → choose → cart → checkout → confirmation, without leaving the page. No framework, no build step, no third-party requests.

## Run locally

```bash
node .claude/server.js
```

Then open <http://localhost:5273/landing/>.

## Read first

- **[HANDOVER.md](HANDOVER.md)** — every assumption to confirm before ad spend (⚑ list), the payment-gateway seam, tracking events, design-system decisions, performance numbers.
- **[ASSETS.md](ASSETS.md)** — full audit of the supplied photography and film, naming scheme, colour swatches sampled from the garments.

## Structure

| Path | What |
|---|---|
| `landing/` | The deployable page (`index.html` + `css/` + `js/` + optimised `assets/`) |
| `landing/js/data.js` | Products, prices, stock, sizes, copy — edit here, nothing else |
| `assets/` | Untouched originals from HOOR |
| `tools/` | Dev-only browser pipelines (image WebP renders, video WebM encodes). Never deploy |
| `.claude/server.js` | Loopback-only dev server used by the tools |

Deploy by hosting the `landing/` folder on any static host over HTTPS.
