/* ============================================================================
   HOOR — BATIK DOLU-DOLU · campaign data
   ----------------------------------------------------------------------------
   Everything the page renders comes from this file. Nothing is hard-coded in
   the markup. To change a price, a name, or stock, change it here only.

   ⚑ = ASSUMPTION. Confirm with HOOR before the campaign goes live.
       Every ⚑ is also listed in HANDOVER.md.
   ============================================================================ */

export const CONFIG = {
  brand: 'HOOR',
  tagline: 'the most beautiful',            // from HOOR's own campaign video end-card
  collection: 'Batik Dolu-Dolu',            // spelling taken from the video title card
  currency: 'MYR',
  currencySymbol: 'RM',

  // ⚑ RM199 matches HOOR's live abaya/kaftan price point on hoor.my.
  //   Confirm campaign pricing (and any launch offer) before spending on ads.
  basePrice: 199,

  // Free-shipping threshold. Set to null to hide the shipping-progress nudge
  // entirely. ⚑ Confirm the real threshold — do not run this unconfirmed.
  freeShippingOver: 250,

  // ⚑ Confirm live rates. Shown in cart + checkout.
  shipping: {
    west: { label: 'Semenanjung Malaysia', rate: 8 },
    east: { label: 'Sabah / Sarawak / Labuan', rate: 15 }
  },

  // Exactly the methods hoor.my displays today.
  payments: ['visa', 'mastercard', 'unionpay', 'fpx', 'maybank', 'cimb', 'banktransfer'],

  support: {
    email: 'hooriemodestwear@gmail.com',     // from hoor.my return policy
    hours: 'Every day, 10am – 8pm',          // from hoor.my return policy
    instagram: '@we.are.hoor',
    whatsapp: ''                             // ⚑ add number to enable WhatsApp help
  },

  policy: {
    returnDays: 7,                           // hoor.my: within 7 days of receiving
    refundDays: 14,                          // hoor.my: max 14 working days
    dispatchDays: 10                         // hoor.my: max 10 working days
  },

  // Turn on ONLY when the numbers below are real live stock.
  showStockPressure: false
};

/* ---------------------------------------------------------------------------
   SIZES — HOOR A-Cut chart, transcribed from the supplied size-chart artwork.
   Inches. Garment (flat/finished) measurements, not body measurements.
   --------------------------------------------------------------------------- */
export const SIZES = ['SM', 'LXL', '2XL', '3XL', '4XL'];

export const SIZE_LABELS = {
  SM: 'S/M', LXL: 'L/XL', '2XL': '2XL', '3XL': '3XL', '4XL': '4XL'
};

export const SIZE_CHART = {
  note: 'HOOR A-Cut. Measurements in inches. Please allow 1–3cm variance; every piece is measured by hand.',
  rows: ['Shoulder', 'Bust', 'Sleeve', 'Arm hole', 'Hip', 'Length'],
  data: {
    SM:    [15.5, 40, 21.5, 21,   51, 53],
    LXL:   [16,   44, 22.5, 22,   54, 55],
    '2XL': [17,   46, 23,   23,   56, 56],
    '3XL': [18,   50, 23.5, 24.5, 60, 57],
    '4XL': [19,   54, 24,   25.5, 60, 57]
  }
};

/* Fit finder. Maps a body bust measurement to the smallest size that still
   leaves comfortable ease on an A-cut kaftan. Ranges are inclusive, inches. */
export const FIT_RULES = [
  { max: 37,       size: 'SM'  },
  { max: 41,       size: 'LXL' },
  { max: 43,       size: '2XL' },
  { max: 47,       size: '3XL' },
  { max: 51,       size: '4XL' },
  { max: Infinity, size: null  }   // → route to customer care
];

/* Length guidance, from the chart's own Length column. */
export const LENGTH_GUIDE = [
  { size: 'SM',  length: 53, suits: 'up to about 5\'3"' },
  { size: 'LXL', length: 55, suits: 'about 5\'3" – 5\'6"' },
  { size: '2XL', length: 56, suits: 'about 5\'5" – 5\'7"' },
  { size: '3XL', length: 57, suits: 'about 5\'6" – 5\'9"' },
  { size: '4XL', length: 57, suits: 'about 5\'6" – 5\'9"' }
];

/* ---------------------------------------------------------------------------
   PRODUCTS
   ⚑ Names are PROPOSED, not confirmed. They follow HOOR's live convention
     ("EGYPTIAN in Royal Blue", "THALIA in Teal Green") and each Malay word
     describes its own print. Swap freely — nothing else depends on them.
   ⚑ Stock numbers below are placeholders. Wire to real inventory before launch.
   --------------------------------------------------------------------------- */

const FABRIC =
  'Premium crepe: matte, opaque and fluid. It falls straight from the shoulder ' +
  'instead of clinging, and it does not crease across a long day.';   // ⚑ confirm exact fabric

const CARE = 'Hand wash cold or machine wash gentle, inside out. Hang dry in shade. Warm iron on reverse.'; // ⚑ confirm

const SHARED_DETAILS = [
  'A-cut silhouette that skims, never clings',
  'Notched V-neckline with a soft stand collar',
  'Wide turned-back cuffs',
  'Side seam pockets, deep enough for a phone',
  'Full length, unlined'
];

export const PRODUCTS = [
  {
    id: 'pusaka',
    name: 'PUSAKA',
    story: 'A tile-work medallion running the full length of the front panel, edged with the fine scrolling border you used to see on a good tablecloth.',
    print: 'Heirloom medallion batik',
    colourways: [
      {
        id: 'deep-teal',
        name: 'Deep Teal',
        swatch: '#2A4A58',
        images: ['pusaka_deep-teal_full_01', 'pusaka_deep-teal_detail_01', 'pusaka_deep-teal_detail_02'],
        video: 'pusaka_deep-teal',
        stock: { SM: 6, LXL: 9, '2XL': 7, '3XL': 4, '4XL': 3 }
      }
    ]
  },
  {
    id: 'semarak',
    name: 'SEMARAK',
    story: 'Blooms blown up large and laid over a fine geometric ground. The boldest print in the collection, and the one that photographs best.',
    print: 'Oversized floral batik',
    colourways: [
      {
        id: 'maroon',
        name: 'Maroon Rose',
        swatch: '#7E3340',
        images: ['semarak_maroon_full_01', 'semarak_maroon_full_02', 'semarak_maroon_detail_01'],
        video: null,
        stock: { SM: 5, LXL: 8, '2XL': 6, '3XL': 5, '4XL': 2 }
      }
    ]
  },
  {
    id: 'rimbun',
    name: 'RIMBUN',
    story: 'A quiet body scattered with small motifs, then a garden that climbs the hem and the cuffs. The one to wear when you want the print to arrive last.',
    print: 'Bordered botanical',
    // ⚑ 226 shows this look styled with a shawl. Confirm whether the shawl is
    //   included, sold separately, or stylist's own — the copy avoids claiming it.
    note: 'Shown styled with a shawl.',
    colourways: [
      {
        id: 'cocoa',
        name: 'Cocoa',
        swatch: '#58402E',
        images: ['rimbun_cocoa_full_01', 'rimbun_cocoa_back_01', 'rimbun_cocoa_detail_01'],
        video: null,
        stock: { SM: 4, LXL: 7, '2XL': 6, '3XL': 4, '4XL': 3 }
      }
    ]
  },
  {
    id: 'renda',
    name: 'RENDA',
    story: 'Lace redrawn as print: a scalloped border at the neck and cuff, acanthus scrolling down the panels. Reads as embroidery from across a room.',
    print: 'Lace-scroll placement print',
    colourways: [
      {
        id: 'camel',
        name: 'Camel Gold',
        swatch: '#8A6B37',
        images: ['renda_camel_full_01', 'renda_camel_full_02', 'renda_camel_detail_01'],
        video: 'renda_camel',
        stock: { SM: 5, LXL: 6, '2XL': 8, '3XL': 5, '4XL': 4 }
      },
      {
        id: 'indigo',
        name: 'Indigo',
        swatch: '#26406B',
        images: ['renda_indigo_full_01', 'renda_indigo_detail_01', 'renda_indigo_detail_02'],
        video: null,
        stock: { SM: 3, LXL: 7, '2XL': 6, '3XL': 4, '4XL': 2 }
      }
    ]
  },
  {
    id: 'senja',
    name: 'SENJA',
    story: 'Painted peonies and iris drifting up from the hem on near-black, with the same bloom carried across the sleeve. The evening piece.',
    print: 'Watercolour bloom',
    colourways: [
      {
        id: 'midnight',
        name: 'Midnight',
        swatch: '#1B2527',
        images: ['senja_midnight_full_01', 'senja_midnight_detail_01', 'senja_midnight_detail_02'],
        video: 'senja_midnight',
        stock: { SM: 6, LXL: 9, '2XL': 7, '3XL': 5, '4XL': 3 }
      }
    ]
  },
  {
    id: 'anggerik',
    name: 'ANGGERIK',
    story: 'Orchids loose on a pale lilac ground, painted rather than stamped. The lightest thing in the collection to look at.',
    print: 'Painted orchid',
    colourways: [
      {
        id: 'lilac',
        name: 'Lilac',
        swatch: '#D3BDCA',
        images: ['anggerik_lilac_full_01', 'anggerik_lilac_full_02', 'anggerik_lilac_detail_01'],
        video: null,
        stock: { SM: 5, LXL: 8, '2XL': 6, '3XL': 4, '4XL': 2 }
      }
    ]
  }
];

/* Apply the shared spec to every product without repeating it above. */
PRODUCTS.forEach(p => {
  p.price = CONFIG.basePrice;
  p.fabric = FABRIC;
  p.care = CARE;
  p.details = SHARED_DETAILS;
});

/* ---------------------------------------------------------------------------
   CAMPAIGN COPY
   Every claim below is HOOR's own, lifted from the burned-in captions on the
   three campaign videos they supplied. Nothing here is invented.
   --------------------------------------------------------------------------- */
export const CLAIMS = [
  'Pocket included',
  'Lightweight & flowy',
  'All-day comfy',
  'Petite friendly',
  'Sizes S/M – 4XL'
];

export const OCCASIONS = [
  { label: 'Office wear',        note: 'Long sleeve, full length, nothing to adjust at your desk.' },
  { label: 'Dinner dates',       note: 'The print does the dressing up. Add earrings, leave.' },
  { label: 'Special occasions',  note: 'Reads formal without a fitting or a fuss.' },
  { label: 'Celebration moments', note: 'Raya, kenduri, birthdays. It survives a long day of them.' },
  { label: 'Holiday getaway',    note: 'Packs flat, shakes out, needs no iron.' }
];

export const FAQ = [
  {
    q: 'How do I know which size to take?',
    a: 'Measure around the fullest part of your bust and use the finder above; it reads straight off HOOR\'s A-Cut chart. The cut is loose and A-line, so it hangs from the shoulder rather than fitting the waist. If you fall between two sizes, take the smaller one unless you want extra length.',
    cta: 'size'
  },
  {
    q: 'Is it see-through? Is it hot?',
    a: 'The crepe is opaque and unlined, and it sits away from the body instead of against it, which is why the campaign calls it lightweight and flowy. It is made for Malaysian weather, not for a European autumn.'
  },
  {
    q: 'Does it really have pockets?',
    a: 'Yes. Side seam pockets on every piece, set into the A-line so they disappear when you are not using them. Deep enough for a phone.'
  },
  {
    q: 'When will it arrive?',
    a: `Orders are dispatched within ${CONFIG.policy.dispatchDays} working days, then it is 1–3 days to Semenanjung and 3–7 days to Sabah, Sarawak and Labuan. You get a tracking number the moment it ships.`
  },
  {
    q: 'What if it does not fit?',
    a: `You have ${CONFIG.policy.returnDays} days from delivery to post it back for an exchange or refund, unworn and with tags on. Return postage is on you; refunds are processed within ${CONFIG.policy.refundDays} working days. Email ${CONFIG.support.email} with your order number to start.`
  },
  {
    q: 'Is my payment secure?',
    a: 'Payment is taken by HOOR\'s payment provider, not by this page. Card details are entered on the provider\'s own encrypted form and are never stored here. FPX sends you to your own bank\'s login.'
  }
];
