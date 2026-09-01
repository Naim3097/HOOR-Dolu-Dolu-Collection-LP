# HOOR — Asset audit & categorisation

Every file in `/assets` was opened and identified. Nothing was renamed, moved or
altered; the originals are untouched. The landing page reads from optimised
copies in `landing/assets/`, generated from the map in
`landing/assets/manifest.json`.

---

## 1. The headline finding: there are two shoots in this folder

The 45 supplied files are not one collection.

| | Files | Format | Look |
|---|---|---|---|
| **A — Batik Dolu-Dolu campaign** | 21 stills + 3 videos | 1706×2560 (2:3) | Editorial. Shot on location in a Kuala Lumpur apartment — upright piano, corduroy wingback, teak sideboard, checkerboard rug. One unveiled model throughout. |
| **B — A different, earlier catalogue** | 17 stills | 965×1448 / 1086×1448 / 1254×1254 | Studio. Plain taupe or pink backdrops and terracotta tile floors. Hijabi models, several different faces. Different silhouettes and print families. |

**Correction (Sep 2026): the client confirmed shoot B is the same collection** —
its looks are the remaining colourways. Eight of them (the ones with matching
close-ups, plus KARANG) are now purchasable on the page, bringing the total to
the client's stated fifteen. Two files (`…503237`, `…503238`) appear to be a
different cut (buttoned jubah, no close-up pair) and were left out pending
confirmation. See §5 for the mapping.

The collection name is confirmed, not inferred: **"Batik Dolu-Dolu"** is burned
into the title card of `IMG_2806.MOV`, hyphenated exactly that way.

---

## 2. Recommended naming structure

`product_colourway_type_NN`

Lower-case, underscore-separated, hyphens inside multi-word values. It sorts
correctly, groups by colourway automatically, and maps 1:1 onto the variant
picker on the page.

```
renda_indigo_detail_02-900.webp
└─┬─┘ └─┬──┘ └─┬──┘ └┬┘ └┬┘
  │     │      │     │   └── render width (480 / 900 / 1400)
  │     │      │     └────── sequence within that type
  │     │      └──────────── image type (full · back · detail · lifestyle)
  │     └─────────────────── colourway
  └───────────────────────── product
```

Image types in use:

| Type | Means | Where it is used |
|---|---|---|
| `full` | Head-to-hem, model standing | Product card, first gallery slide |
| `back` | Rear view | Gallery — answers "what does the back look like" |
| `detail` | Neckline, cuff, pocket, print close-up | Gallery slides 2–3 |
| `lifestyle` | Seated or in-context | Card where it reads better than a standing shot |

---

## 3. Shoot A — the campaign, mapped

Six designs. One of them (**RENDA**) exists in two colourways, which is what the
colour swatches on the product card demonstrate. Seven looks in total.

⚑ **Product names are proposed, not confirmed.** They follow HOOR's live naming
convention on hoor.my (`EGYPTIAN in Royal Blue`, `THALIA in Teal Green`), and
each Malay word describes its own print. Change them in
`landing/js/data.js` — nothing else depends on them.

| Source file | Product | Colourway | Type | Role | Notes |
|---|---|---|---|---|---|
| `…503221.jpg` | PUSAKA | Deep Teal | full | **Hero + card** | Widest environment shot in the set — piano, sofa, windows. The strongest single frame you have. |
| `…503220.jpg` | PUSAKA | Deep Teal | detail | gallery | Neckline and centre panel, model in frame |
| `…503219.jpg` | PUSAKA | Deep Teal | detail | gallery | Hand in pocket — proves the pocket claim |
| `…503223.jpg` | SEMARAK | Maroon Rose | full | card | Hand to chest, lamp and sofa |
| `…503224.jpg` | SEMARAK | Maroon Rose | full | gallery | Three-quarter, shows the hem border |
| `…503222.jpg` | SEMARAK | Maroon Rose | detail | gallery | Neckline, sleeve, print scale |
| `…503225.jpg` | RIMBUN | Cocoa | lifestyle | card | Seated in the green wingback, skirt spread |
| `…503227.jpg` | RIMBUN | Cocoa | back | gallery | Only true back view in the collection |
| `…503226.jpg` | RIMBUN | Cocoa | detail | gallery | ⚑ Styled with a shawl — see §4 |
| `…503229.jpg` | RENDA | Camel Gold | full | card | Standing, warm room |
| `…503230.jpg` | RENDA | Camel Gold | full | gallery | Leaning on the table |
| `…503228.jpg` | RENDA | Camel Gold | detail | gallery | Lace-print neckline at scale |
| `…503233.jpg` | RENDA | Indigo | full | card | Standing, rug and sideboard |
| `…503232.jpg` | RENDA | Indigo | detail | gallery | Neckline — clearest read of the lace print |
| `…503231.jpg` | RENDA | Indigo | detail | gallery | Pocket and cuff |
| `…503236.jpg` | SENJA | Midnight | full | card | By the piano, mirror behind |
| `…503235.jpg` | SENJA | Midnight | detail | gallery | Neckline and printed sleeve panel |
| `…503234.jpg` | SENJA | Midnight | detail | gallery | Hem bloom, shoes in frame |
| `…503240.jpg` | ANGGERIK | Lilac | full | card | By the piano, candelabra |
| `…503241.jpg` | ANGGERIK | Lilac | full | gallery | Leaning on the piano |
| `…503239.jpg` | ANGGERIK | Lilac | detail | gallery | Bodice and orchid print |

### Colour swatches

Sampled from the photography, not guessed — the dominant mid-tone of the
garment area of each detail shot, with highlights and crushed shadows excluded.

| Colourway | Swatch | Sampled from |
|---|---|---|
| Deep Teal | `#2A4A58` | `pusaka_deep-teal_detail_01` |
| Maroon Rose | `#7E3340` | `semarak_maroon_detail_01` |
| Cocoa | `#58402E` | `rimbun_cocoa_detail_01` |
| Camel Gold | `#8A6B37` | `renda_camel_detail_01` |
| Indigo | `#26406B` | `renda_indigo_detail_01` |
| Midnight | `#1B2527` | `senja_midnight_detail_01` |
| Lilac | `#D3BDCA` | `anggerik_lilac_detail_01` |

⚑ Photography colour is not fabric colour. Check these against physical stock
before launch — a swatch that misleads is a return waiting to happen.

### Video

All three are 1072×1920 vertical H.264, which means they are almost certainly
the Meta ad masters. Each carries **burned-in captions in HOOR's own words** —
those captions are the source for every product claim on the page, so nothing
had to be invented.

| Source | Look | Duration | Burned-in copy |
|---|---|---|---|
| `IMG_2806.MOV` | SENJA in Midnight | 26.3s | *Batik Dolu-Dolu* · Premium cotton · Lightweight & flowy · All day comfy |
| `IMG_2815.MOV` | PUSAKA in Deep Teal | 17.7s | Custom print · Pocket included · Luxury flow · Petite friendly · Comfortable |
| `IMG_2821.MOV` | RENDA in Camel Gold | 17.2s | **One Dress, Every Occasion** · Office Wear · Special Occasions · Dinner Dates · Celebration Moments · Holiday Getaway |

All three end on the HOOR mark with the line **"the most beautiful"**.

`IMG_2821` gave the page its spine. *One dress, every occasion* is the argument
that turns RM199 from a price into a per-wear calculation, and it is HOOR's own
line, not a copywriter's.

### Reference

| Source | What it is |
|---|---|
| `…503289.jpg` | **HOOR A-Cut size chart.** Real data. Transcribed into `data.js` and now drives the size table, the fit finder and the per-size measurements in the product sheet. |

---

## 4. Flagged — needs a decision before launch

1. **The RIMBUN shawl.** `…503226.jpg` shows the cocoa piece styled with a
   sage-taupe scalloped shawl. It is not visible in the other two RIMBUN frames.
   Is it included, sold separately, or the stylist's own? The page currently says
   only *"Shown styled with a shawl"* and claims nothing — but if it is included,
   that is a selling point being left on the table.

2. **Fabric.** No fibre content was supplied. The page says *premium crepe*,
   inferred from the drape and from HOOR's own "PREMIUM CREEPE" category. One
   video caption appears to read *Premium Cotton*. These are not the same thing
   and a wrong fibre claim is a real customer-harm risk. Confirm and update the
   `FABRIC` constant in `data.js`.

3. **Care instructions.** Written to a sensible default. Not supplied. Confirm.

4. **No back views except RIMBUN.** "What does the back look like" is a common
   pre-purchase question for a kaftan. One flat-lay or rear shot per colourway
   would close it.

5. **No detail macro of the fabric hand.** The videos carry the drape; a still
   close enough to read the weave would strengthen the fabric section.

6. **No genuine social proof.** No reviews, ratings, UGC or press were supplied,
   so the page carries none — nothing is fabricated. See `HANDOVER.md` §6 for
   where real reviews slot in when you have them.

---

## 5. Shoot B — the remaining colourways (client-confirmed, now on the page)

Page names: 242=PUCUK Forest Green, 243=BAYU Steel Blue, 244=SERI Olive,
245=KARANG Royal Blue, 246=MAHSURI Emerald, 247=MALAM Black Iris,
248=DIRAJA Royal Purple, 260=MEKAR Lilac. 237/238 not used (different cut).

### Original catalogue notes

Studio catalogue photography of a different, earlier line. Seven products, each
with a full-length shot and a matching close-up. Kept out of the campaign, listed
here so the folder is fully accounted for.

| Full shot | Close-up | Description |
|---|---|---|
| `…503242.jpg` | `…962996.jpg` | Black / dark-green ornate batik, terracotta floor |
| `…503243.jpg` | `…962995.jpg` | Denim-blue paisley batik |
| `…503244.jpg` | `…962999.jpg` | Olive mandala batik, sage hijab |
| `…503245.jpg` | — | Royal blue with coral floral batik |
| `…503246.jpg` | `…963000.jpg` | Teal with cream and gold ornate floral |
| `…503247.jpg` | `…962998.jpg` | Black with blue floral batik |
| `…503248.jpg` | `…962997.jpg` | Purple and teal baroque scroll, pink wall |
| `…503260.jpg` | `…962994.jpg` | Lilac cherry-blossom watercolour, concrete storefront |
| `…503237.jpg` | — | Black and white batik jubah, grey hijab |
| `…503238.jpg` | — | Navy with pink floral sprays |

No duplicates and no unusable files were found. The two lowest-resolution files
(`…503238`, `…503245`, both under 100 KB) are still fine at catalogue size but
would not hold up as a hero — they are in shoot B and unused regardless.

---

## 5b. Hero masters (supplied later)

| Source file | Size | Used as |
|---|---|---|
| `HOOR Hero Section.png` | 1672×941 (16:9) | Desktop hero, rendered at 900/1400/1672 |
| `HOOR Mobile Hero Section.png` | 853×1844 (≈9:19.5) | Mobile hero, rendered at 480/853 |

Superseded Sep 2026 by v2 masters (`HOOR Hero Desktop v2.png` 1672×941,
`HOOR Hero Mobile v2.png` 930×1691) — a five-look group shot in a warmer room.
Same art direction: wall-left desktop, cover-format mobile.

Colourway names were renamed on client instruction: Deep Teal → **Teal Green**,
Lilac → **Soft Peach** (internal ids and filenames unchanged).

## 6. What was produced from these files

Originals were never modified. Derivatives live in `landing/assets/`:

| Output | Count | Total | How |
|---|---|---|---|
| WebP renders at 480 / 900 / 1400 px | 64 | 9.0 MB | Progressive box-downscale, quality 0.82 |
| Inline LQIP blur placeholders | 22 | 24 KB | 20 px WebP, base64 in `lqip.json` — this is why the page has a CLS of 0 |
| WebM video, 720×1290, VP9, silent | 3 | 8.2 MB | Re-encoded from the 47 MB of source MOV |
| Video poster frames | 3 | 140 KB | WebP, used as the `poster` attribute |

A phone loads roughly **414 KB** for the whole first screen, because it only ever
fetches the 480 and 900 px renders and no video until one scrolls into view.
