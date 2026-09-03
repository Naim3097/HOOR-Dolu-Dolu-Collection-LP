# Client feedback — 3 Sep 2026

Source: "Feedback Hoor Website.docx". Order follows the page top to bottom.
Tick as done. Items marked ⚠ need something from the client before they can be finished.

## Hero

- [x] **1. Hero image: prints do not match the real dresses**
  "Corak lari dari design sebenar, betulkan corak supaya sama." Replaced with the corrected masters: `raya-hero-desktop-textspace.png` (desktop) and `raya-hero-mobile.png` (mobile).
- [x] **2. Hero lead copy** — `components/hoor/hero.tsx`
  Change to: "Made from Premium Cotton Silk, in a comfortable A-Cutline for easy movement. Suitable for petite and plus size woman."
- [x] **3. Claims bar cut off on mobile** — `components/hoor/hero.tsx` (Claims), `app/hoor.css`
  On mobile the five claims scroll sideways and are not all visible. Client wants all of them visible at once without scrolling.

## Story

- [x] **4. Story copy rewritten** — `components/hoor/hero.tsx` (Story)
  Change to:
  > Dolu-dolu is what you say about the old days. Feeling nostalgic, just like 90s era.
  >
  > These prints come from memories from the old days. The flowers you grew up seeing on every painting, abstract and kain batik, redrawn on a beautiful Premium Cotton Silk dress.
  >
  > The fabric is soft, airy texture drapes naturally over the body without clinging, giving you that comfortable feeling from morning to night.
  >
  > **Why you'll love Cotton Silk:**
  > - Breathable & airy — perfect for Malaysia's warm weather
  > - Flowy & lightweight — moves beautifully as you walk
  > - Doesn't cling to the body — giving you a relaxed, comfortable fit
  > - Comfortable in the heat — ideal for everyday wear, kenduri, and umrah too
  > - Soft against the skin — for all-day comfort

## Collection

- [x] **5. Collection heading** — `components/hoor/shop.tsx`
  "Seventeen colours. One A-Cut." → "Different prints, all in One A-Cutline Dress"

## Occasions

- [x] **6. Occasions heading and sub** — `components/hoor/occasions.tsx`
  Heading → "365 Days of Comfort. 365 Days of Hoor. Kecantikan 360°"
  Sub → "Because your favourite dress should be styled everyday. Look pretty, feel pretty in 360° view."
- [x] **7. Occasions list: four items, new copy** — `lib/products.ts` (OCCASIONS)
  Drops "Dinner dates" and "Special occasions".
  1. Office wear — "Easy for movement at your desk, while sitting during meetings, pockets for your stationary and lanyard."
  2. Celebration moments — "Elegant for Raya, birthdays, kenduri, and even as Mak pengantin"
  3. Holiday getaway — "Weigh only 400g, making your travel bag light. Designs are perfect for your OOTD."
  4. Umrah friendly — "Modest, full coverage, and comfortable through long days of ibadah and travel."

## Fabric

- [x] **8. Fabric heading** — `components/hoor/occasions.tsx` (Fabric)
  "Made for 33°C and a full day." → label "THE FABRIC", heading "Made for 33°C Malaysian weather"
- [x] **9. "Flatters every figure" point**
  Body → "The A-Cutline Dress falls just nicely, looking like custom-made on your body"
- [x] **10. "Kind to pear shapes" point**
  Heading → "Kind to pear shape bodies". Body → "Neat at the shoulder, generous through the hip. It balances a pear body shape without clinging to your body"
- [ ] **11. "Opaque, no inner needed" point** ⚠
  Marked "Change to" twice but no replacement text was given. Ask the client whether to reword, drop it, or keep it. The same claim is covered in FAQ item 15.
- [x] **12. "Pockets, properly" point**
  Heading → "Pockets on both sides". Body → "Side seam pockets deep enough for your phone, keys, and your small purse"

## Size & fit

- [x] **13. Fit sub copy** — `components/hoor/fit.tsx`
  Change to: "Your bust size determines the fitting. The hips area is less concerned as the dress is A-Cutline giving you the freedom to move comfortably"
- [x] **14. Rename "A-Cut" to "A-Cutline Dress" everywhere** — site-wide
  Every occurrence of "A-Cut" in page copy, drawers, FAQ, size chart caption and product details.

## FAQ

- [x] **15. "Is it see-through?" answer** — `lib/products.ts` (FAQ)
  Change to: "The cotton silk is opaque and not see through, including light colors. The Premium Cotton Silk is light, breathable and made for Malaysian weather."
- [x] **16. "Can I see the dresses in person?" answer: two locations** — `lib/products.ts` (FAQ), and the Visit card / footer
  > Yes. Visit us at:
  > - Hoor Boutique: Lot 2-5, The Linc KL, 360 Jalan Tun Razak, 50400 Kuala Lumpur
  > - Hoor Pop-up Store: KL East Mall, LG
  >
  > Opens every day from 10am to 9pm. Call or WhatsApp +60 17-250 0323.

## Closer

- [ ] **17. Closer image: prints do not match the real dresses** ⚠
  "Check corak ada yang lari tak sama dengan corak sebenar baju." Same issue as item 1, on the closing banner. Needs a corrected image from the client.
- [ ] **18. Closer copy: remove "Seventeen colours"** — `components/hoor/tail.tsx`
  "Seventeen colours, sizes S/M to 4XL, RM199 each. Free delivery over RM250." → drop the colour count.
