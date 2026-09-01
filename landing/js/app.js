/* ============================================================================
   HOOR · BATIK DOLU-DOLU — campaign app
   Vanilla ES modules. No build step, no dependencies.
   ============================================================================ */

import {
  CONFIG, PRODUCTS, SIZES, SIZE_LABELS, SIZE_CHART,
  FIT_RULES, LENGTH_GUIDE, CLAIMS, OCCASIONS, FAQ
} from './data.js';

/* ---------- 0. HELPERS --------------------------------------------------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const el = (tag, attrs = {}, html) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === false || v === undefined) continue;
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  if (html !== undefined) n.innerHTML = html;
  return n;
};

const money = n =>
  CONFIG.currencySymbol + (Number.isInteger(n) ? n : n.toFixed(2));

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAVE_DATA = navigator.connection?.saveData === true;

/* Flattened variant list — every product × colourway, in shop order. */
const VARIANTS = PRODUCTS.flatMap(p =>
  p.colourways.map(c => ({ product: p, cw: c, key: `${p.id}:${c.id}` }))
);

const findVariant = key => VARIANTS.find(v => v.key === key);
const inStock = (cw, size) => (cw.stock?.[size] ?? 0) > 0;
const anyStock = cw => SIZES.some(s => inStock(cw, s));

/* ---------- 1. IMAGES ---------------------------------------------------- */
let LQIP = {}, DIMS = {};

// Renders exist at the standard widths capped to each source's real width,
// plus the source width itself when it falls below 900 (e.g. the premise
// photo at 765). Build candidates from what is actually on disk.
const widthsFor = name => {
  const max = DIMS[name]?.[0] || Infinity;
  const ws = [480, 900, 1400].filter(w => w <= max);
  if (Number.isFinite(max) && max < 900) ws.push(max);
  return ws.length ? ws : [480];
};
const srcset = name =>
  widthsFor(name).map(w => `assets/img/${name}-${w}.webp ${w}w`).join(', ');

/**
 * Fill a .ph placeholder: LQIP background immediately, real image faded in.
 * @param {HTMLElement} box  element carrying data-img
 * @param {object} opts      { eager, sizes, alt, pos }
 */
function paint(box, opts = {}) {
  const name = box.dataset.img;
  if (!name || box.dataset.painted) return;
  box.dataset.painted = '1';

  if (LQIP[name]) box.style.backgroundImage = `url("${LQIP[name]}")`;
  // Aspect ratio comes from CSS, not from the source file — different contexts
  // (card, story, cart line) crop the same photograph differently.
  const d = DIMS[name];

  // srcset and sizes must be set BEFORE src. Assigning src first makes the
  // browser start fetching the fallback, then fetch again once srcset lands.
  const img = el('img', {
    srcset: srcset(name),
    sizes: opts.sizes || box.dataset.sizes || '(min-width:1240px) 25vw, (min-width:780px) 33vw, 50vw',
    alt: opts.alt ?? box.dataset.alt ?? '',
    decoding: 'async',
    loading: opts.eager ? 'eager' : 'lazy',
    fetchpriority: opts.eager ? 'high' : null,
    width: d?.[0], height: d?.[1],
    src: `assets/img/${name}-${widthsFor(name).at(-1)}.webp`
  });
  const pos = opts.pos || box.dataset.pos;
  if (pos) img.style.objectPosition = pos;

  if (img.complete) img.classList.add('loaded');
  else img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
  box.appendChild(img);
}

const imgObserver = new IntersectionObserver((entries, o) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    paint(e.target);
    o.unobserve(e.target);
  });
}, { rootMargin: '400px 0px' });

/* The hero <img> is in the markup so it can start downloading before this
   script parses. If it finished first, its inline onload never fires. */
function settleStaticImages() {
  $$('.ph > img:not(.loaded)').forEach(img => {
    if (img.complete && img.naturalWidth) img.classList.add('loaded');
  });
}

function hydrateImages(root = document) {
  $$('[data-img]', root).forEach(box => {
    if (box.dataset.painted) return;
    if (box.hasAttribute('data-eager')) {
      paint(box, { eager: true, sizes: '100vw' });
    } else {
      imgObserver.observe(box);
    }
  });
}

/* ---------- 2. VIDEO ----------------------------------------------------- */
/* Videos are never fetched until they scroll into view, never on Save-Data,
   and never auto-play when the visitor has asked for reduced motion. */
const videoObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    const v = e.target.querySelector('video');
    if (!v) return;
    if (e.isIntersecting) { v.play?.().catch(() => {}); }
    else { v.pause?.(); }
  });
}, { threshold: 0.35 });

/* Autoplay is a desktop-only affordance. On a phone these films are 2–4 MB
   each and mobile data in Malaysia is metered, so small screens get the poster
   — which already carries the campaign's burned-in caption — plus a tap to
   play. Save-Data and reduced-motion get the poster and nothing else. */
const AUTOPLAY_VIDEO = matchMedia('(min-width: 900px)').matches && !SAVE_DATA && !REDUCED;

function attachVideo(box, name, autoplay) {
  const v = el('video', {
    src: `assets/video/${name}.webm`,
    poster: `assets/video/${name}_poster.webp`,
    muted: true, loop: true, playsinline: true,
    preload: 'none',
    'aria-label': box.dataset.caption || 'Campaign film'
  });
  v.muted = true;                       // property, not just attribute (iOS)
  // Some films open on a dark scene; data-start begins playback at a brighter
  // passage. The loop still passes through the full edit.
  const start = parseFloat(box.dataset.start || '0');
  if (start) v.addEventListener('loadedmetadata', () => { v.currentTime = start; }, { once: true });
  box.appendChild(v);
  if (autoplay) videoObserver.observe(box);
  return v;
}

function mountVideo(box) {
  const name = box.dataset.video;
  if (!name || box.dataset.mounted) return;
  box.dataset.mounted = '1';

  const poster = `assets/video/${name}_poster.webp`;

  if (SAVE_DATA || REDUCED) {
    box.appendChild(el('img', { src: poster, alt: box.dataset.caption || '', loading: 'lazy' }));
    return;
  }

  if (AUTOPLAY_VIDEO) { attachVideo(box, name, true); return; }

  // Poster + a tap target. Nothing over the wire until it is asked for.
  box.appendChild(el('img', { src: poster, alt: box.dataset.caption || '', loading: 'lazy' }));
  const play = el('button', {
    class: 'play',
    type: 'button',
    'aria-label': `Play the film: ${box.dataset.caption || 'campaign film'}`
  }, '<svg viewBox="0 0 12 14" aria-hidden="true"><path d="M1 1v12l10-6z" fill="currentColor"/></svg><span>Play film</span>');

  play.addEventListener('click', () => {
    box.querySelector('img')?.remove();
    play.remove();
    const v = attachVideo(box, name, false);
    v.controls = false;
    v.play().catch(() => { v.controls = true; });
    v.addEventListener('click', () => (v.paused ? v.play() : v.pause()));
    track('play_video', { film: name });
  }, { once: true });

  box.appendChild(play);
}

const videoMountObserver = new IntersectionObserver((entries, o) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    mountVideo(e.target);
    o.unobserve(e.target);
  });
}, { rootMargin: '250px 0px' });

/* ---------- 3. STATE ----------------------------------------------------- */
const STORE_KEY = 'hoor_ddl_cart_v1';

const state = {
  cart: [],
  filter: null,          // colourway id or null
  cardColour: {},        // productId -> colourway id currently shown on the card
  pd: null,              // { variant, size, qty, slide }
  unit: 'in',
  region: 'west',
  order: null
};

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    // Drop anything that no longer exists or is now out of stock.
    state.cart = raw.filter(l => {
      const v = findVariant(l.key);
      return v && inStock(v.cw, l.size);
    });
  } catch { state.cart = []; }
}
const saveCart = () => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state.cart)); } catch {}
};

const cartCount = () => state.cart.reduce((n, l) => n + l.qty, 0);
const subtotal  = () => state.cart.reduce((n, l) => n + l.qty * l.price, 0);

function shippingCost() {
  if (!state.cart.length) return 0;
  if (CONFIG.freeShippingOver && subtotal() >= CONFIG.freeShippingOver) return 0;
  return CONFIG.shipping[state.region].rate;
}
const grandTotal = () => subtotal() + shippingCost();

/* ---------- 4. TRACKING -------------------------------------------------- */
/* One funnel, one shape. Wire GTM / Meta Pixel and every event below lands. */
function track(event, data = {}) {
  const payload = { event, currency: CONFIG.currency, ...data };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  const FB = {
    view_item: 'ViewContent', add_to_cart: 'AddToCart', view_cart: 'ViewCart',
    begin_checkout: 'InitiateCheckout', add_payment_info: 'AddPaymentInfo',
    purchase: 'Purchase', search: 'Search', contact_whatsapp: 'Contact'
  }[event];
  if (FB && typeof window.fbq === 'function') {
    window.fbq('track', FB, {
      value: data.value, currency: CONFIG.currency,
      content_ids: data.content_ids, content_type: 'product'
    });
  }
  if (location.search.includes('debug')) console.log('[track]', event, data);
}

const lineToItem = l => ({
  item_id: `${l.key}:${l.size}`, item_name: l.title,
  item_variant: `${l.cwName} / ${SIZE_LABELS[l.size]}`,
  price: l.price, quantity: l.qty
});

/* ---------- 5. STATIC SECTION RENDERERS ---------------------------------- */
function renderChrome() {
  $('[data-collection]').textContent = CONFIG.collection;
  $('[data-price-plain]').textContent = money(CONFIG.basePrice);
  $('[data-price-plain-2]').textContent = money(CONFIG.basePrice);
  const freeOver = $('[data-free-over]');
  if (CONFIG.freeShippingOver) freeOver.textContent = money(CONFIG.freeShippingOver);
  else freeOver.closest('p').textContent =
    `Seventeen colours, sizes S/M to 4XL, ${money(CONFIG.basePrice)} each.`;
  $('[data-sticky-sub]').textContent = `${money(CONFIG.basePrice)} · S/M – 4XL`;
  $('[data-tagline]').textContent = CONFIG.tagline;
  $('[data-year]').textContent = new Date().getFullYear();

  const mail = $('[data-support-email]');
  mail.href = `mailto:${CONFIG.support.email}`;
  mail.textContent = CONFIG.support.email;
  $('[data-support-hours]').textContent = CONFIG.support.hours;
  $('[data-support-ig]').textContent = CONFIG.support.instagram;

  // WhatsApp support: one config field turns it on. No number, no button.
  const waBtn = $('[data-wa]');
  const waNum = (CONFIG.support.whatsapp || '').replace(/[^0-9]/g, '');
  if (waNum) {
    const msg = `Hi HOOR! I'm looking at the ${CONFIG.collection} collection and have a question.`;
    waBtn.href = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
    waBtn.hidden = false;
    waBtn.addEventListener('click', () =>
      track('contact_whatsapp', { location: 'floating_button' }));
  }

  const NAMES = {
    visa: 'Visa', mastercard: 'Mastercard', unionpay: 'UnionPay',
    fpx: 'FPX', maybank: 'Maybank', cimb: 'CIMB', banktransfer: 'Bank transfer'
  };
  $('[data-payments]').append(
    ...CONFIG.payments.map(p => el('span', { class: 'pay-mark' }, NAMES[p] || p))
  );

  $('[data-claims]').append(...CLAIMS.map(c => el('li', {}, esc(c))));

  $('[data-occasions]').append(...OCCASIONS.map((o, i) => el('li', {}, `
    <span class="n">${String(i + 1).padStart(2, '0')}</span>
    <div>
      <h3>${esc(o.label)}</h3>
      <p>${esc(o.note)}</p>
    </div>`)));
}

function renderChart(recommended) {
  const t = $('[data-chart]');
  const head = `<thead><tr><th scope="col">Inches</th>${
    SIZES.map(s => `<th scope="col">${SIZE_LABELS[s]}</th>`).join('')
  }</tr></thead>`;
  const body = `<tbody>${
    SIZE_CHART.rows.map((row, i) => `<tr>
      <th scope="row">${row}</th>
      ${SIZES.map(s => `<td class="${s === recommended ? 'is-rec' : ''}">${SIZE_CHART.data[s][i]}</td>`).join('')}
    </tr>`).join('')
  }</tbody>`;
  t.innerHTML = `<caption class="sr">HOOR A-Cut size chart in inches</caption>${head}${body}`;
  $('[data-chart-note]').textContent = SIZE_CHART.note;
}

function renderFaq() {
  const wrap = $('[data-faq]');
  wrap.append(...FAQ.map((f, i) => {
    const d = el('details', { id: i === 3 ? 'faq-delivery' : null });
    d.innerHTML = `
      <summary><span>${esc(f.q)}</span><span class="pm" aria-hidden="true"></span></summary>
      <div class="faq__a"><p>${esc(f.a)}</p>${
        f.cta === 'size'
          ? `<button class="btn" data-open="size">Open the size guide</button>`
          : ''
      }</div>`;
    d.addEventListener('toggle', () => d.open && track('faq_open', { question: f.q }));
    return d;
  }));
}

/* ---------- 6. SHOP GRID ------------------------------------------------- */
function renderFilters() {
  const host = $('[data-filters]');
  host.innerHTML = '';

  const all = el('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(state.filter === null),
    onclick: () => setFilter(null)
  }, 'All');
  host.appendChild(all);

  VARIANTS.forEach(v => {
    const b = el('button', {
      class: 'chip', type: 'button',
      'aria-pressed': String(state.filter === v.cw.id),
      onclick: () => setFilter(v.cw.id)
    }, `<i class="dot" style="background:${v.cw.swatch}"></i>${esc(v.cw.name)}`);
    host.appendChild(b);
  });
}

function setFilter(id) {
  state.filter = id;
  renderFilters();
  $$('[data-grid] .card').forEach(card => {
    const shown = !id || card.dataset.colours.split(',').includes(id);
    card.classList.toggle('is-hidden', !shown);
    // When a filter picks a colourway, show that colourway on the card.
    if (shown && id && card.dataset.colours.split(',').includes(id)) {
      const btn = card.querySelector(`.swatch[data-cw="${id}"]`);
      if (btn) selectCardColour(card, btn);
    }
  });
  if (id) track('filter_colour', { colour: id });
}

function cardMarkup(p) {
  const cwId = state.cardColour[p.id] || p.colourways[0].id;
  const cw = p.colourways.find(c => c.id === cwId);
  const idx = String(PRODUCTS.indexOf(p) + 1).padStart(2, '0');

  const card = el('article', {
    class: 'card',
    'data-product': p.id,
    'data-colours': p.colourways.map(c => c.id).join(',')
  });

  card.innerHTML = `
    <a class="card__media" href="#${p.id}" data-open-product="${p.id}:${cw.id}"
       aria-label="${esc(p.name)} in ${esc(cw.name)}, view details">
      <span class="card__idx">${idx}</span>
      <span class="ph" data-img="${cw.images[0]}" data-alt="${esc(p.name)} in ${esc(cw.name)}"></span>
      ${cw.images[1] ? `<span class="ph" data-hover-img="${cw.images[1]}" data-alt="" aria-hidden="true"></span>` : ''}
      <span class="btn btn--light card__quick">Select size</span>
    </a>
    <div class="card__info">
      <div class="card__name">
        <h3>${esc(p.name)}</h3>
        <span class="price">${money(p.price)}</span>
      </div>
      <p class="card__cw"><i class="cw-dot" data-cw-dot style="background:${cw.swatch}"></i><span data-cw-name>${esc(cw.name)}</span></p>
      ${p.colourways.length > 1 ? `<div class="swatches" role="group" aria-label="Colour">${
        p.colourways.map(c => `
          <button class="swatch" type="button" data-cw="${c.id}"
                  aria-pressed="${String(c.id === cw.id)}"
                  aria-label="${esc(c.name)}" title="${esc(c.name)}">
            <i style="background:${c.swatch}"></i>
          </button>`).join('')
      }</div>` : ''}
      ${CONFIG.showStockPressure && lowStock(cw)
        ? `<p class="stock-note">Low stock</p>` : ''}
    </div>`;

  card.querySelectorAll('.swatch').forEach(b =>
    b.addEventListener('click', e => { e.preventDefault(); selectCardColour(card, b); }));

  // The second image only exists for the hover cross-fade. Fetching it up front
  // costs every phone a full extra image per card for an interaction it will
  // never perform — so it waits for a real pointer or keyboard focus.
  const wakeHover = () => {
    const box = card.querySelector('[data-hover-img]');
    if (!box) return;
    box.dataset.img = box.dataset.hoverImg;
    delete box.dataset.hoverImg;
    paint(box, { alt: '' });
  };
  card.addEventListener('pointerenter', wakeHover, { once: true });
  card.addEventListener('focusin', wakeHover, { once: true });

  return card;
}

const lowStock = cw => SIZES.reduce((n, s) => n + (cw.stock?.[s] || 0), 0) <= 6;

function selectCardColour(card, btn) {
  const p = PRODUCTS.find(x => x.id === card.dataset.product);
  const cw = p.colourways.find(c => c.id === btn.dataset.cw);
  if (!cw) return;

  state.cardColour[p.id] = cw.id;
  card.querySelectorAll('.swatch').forEach(b =>
    b.setAttribute('aria-pressed', String(b === btn)));
  card.querySelector('[data-cw-name]').textContent = cw.name;
  const dot = card.querySelector('[data-cw-dot]');
  if (dot) dot.style.background = cw.swatch;
  card.querySelector('.card__media').dataset.openProduct = `${p.id}:${cw.id}`;
  card.querySelector('.card__media').setAttribute('aria-label',
    `${p.name} in ${cw.name}, view details`);

  card.querySelectorAll('.card__media .ph').forEach((ph, i) => {
    const name = cw.images[i];
    if (!name) return;
    // A hover image that has never been woken stays asleep — just retarget it.
    if (ph.dataset.hoverImg) { ph.dataset.hoverImg = name; return; }
    ph.innerHTML = '';
    delete ph.dataset.painted;
    ph.dataset.img = name;
    paint(ph, { alt: i === 0 ? `${p.name} in ${cw.name}` : '' });
  });

  track('select_colour', { item_id: `${p.id}:${cw.id}`, colour: cw.name, item_name: p.name });
}

function renderGrid() {
  const g = $('[data-grid]');
  g.innerHTML = '';
  PRODUCTS.forEach(p => g.appendChild(cardMarkup(p)));
  hydrateImages(g);
}

/* ---------- 7. PRODUCT DRAWER -------------------------------------------- */
function openProduct(key, opts = {}) {
  const v = findVariant(key) || VARIANTS[0];
  const preferred = opts.size && inStock(v.cw, opts.size) ? opts.size : null;

  state.pd = { key: v.key, size: preferred, qty: 1, slide: 0 };
  renderProduct();
  openOverlay('dw-product');

  track('view_item', {
    content_ids: [v.key], value: v.product.price,
    item_name: v.product.name, item_variant: v.cw.name
  });
  history.replaceState(null, '', `?p=${v.key}${location.hash}`);
}

function renderProduct() {
  const { key, size, qty, slide } = state.pd;
  const { product: p, cw } = findVariant(key);
  const body = $('[data-pd]');
  const foot = $('[data-pd-foot]');
  const soldOut = !anyStock(cw);

  body.innerHTML = `
    <div class="pd">
      <div class="pd__gallery">
        <div class="pd__slides" data-slides>
          ${cw.images.map((n, i) => `
            <div class="ph" data-img="${n}" data-sizes="(min-width:860px) 46vw, 100vw"
                 data-alt="${esc(p.name)} in ${esc(cw.name)}, view ${i + 1}"></div>`).join('')}
          ${cw.video ? `<div class="ph" style="background:#000" data-video-slide="${cw.video}"></div>` : ''}
        </div>
        <div class="pd__dots" data-dots aria-hidden="true"></div>
      </div>

      <div class="pd__info">
        <span class="label eyebrow">${esc(p.print)}</span>
        <h3>${esc(p.name)}</h3>
        <p class="pd__cw">in ${esc(cw.name)}</p>
        <p class="pd__price">${money(p.price)}</p>

        ${p.colourways.length > 1 ? `
          <div class="pd__block">
            <span class="label">Colour <span class="val">${esc(cw.name)}</span></span>
            <div class="swatches" role="group" aria-label="Colour">
              ${p.colourways.map(c => `
                <button class="swatch" type="button" data-pd-cw="${c.id}"
                        aria-pressed="${String(c.id === cw.id)}" aria-label="${esc(c.name)}" title="${esc(c.name)}">
                  <i style="background:${c.swatch}"></i>
                </button>`).join('')}
            </div>
          </div>` : ''}

        <div class="pd__block">
          <span class="label">
            <span>Size <span class="val" data-size-val>${size ? SIZE_LABELS[size] : ''}</span></span>
            <button type="button" data-open="size">Size guide</button>
          </span>
          <div class="sizes" role="group" aria-label="Size">
            ${SIZES.map(s => {
              const ok = inStock(cw, s);
              return `<button class="size" type="button" data-size="${s}"
                        aria-pressed="${String(s === size)}" ${ok ? '' : 'disabled'}
                        aria-label="${SIZE_LABELS[s]}${ok ? '' : ', sold out'}">${SIZE_LABELS[s]}</button>`;
            }).join('')}
          </div>
          <p class="size-msg" data-size-msg>${
            soldOut ? 'This colourway is fully sold out.'
            : size
              ? (CONFIG.showStockPressure && cw.stock[size] <= 3
                  ? `Only ${cw.stock[size]} left in ${SIZE_LABELS[size]}.`
                  : `Bust ${SIZE_CHART.data[size][1]}″ · Length ${SIZE_CHART.data[size][5]}″`)
              : 'Choose a size to continue.'
          }</p>
        </div>

        <div class="pd__block">
          <span class="label">Quantity</span>
          <div class="qty">
            <button type="button" data-qty="-1" aria-label="Decrease" ${qty <= 1 ? 'disabled' : ''}>−</button>
            <output aria-live="polite">${qty}</output>
            <button type="button" data-qty="1" aria-label="Increase">+</button>
          </div>
        </div>

        <p class="pd__story">${esc(p.story)}</p>
        ${p.note ? `<p class="pd__story" style="color:var(--ink-55);font-size:var(--t-small);margin-top:.5rem">${esc(p.note)}</p>` : ''}

        <div class="acc">
          <details open>
            <summary>The details<span class="pm" aria-hidden="true"></span></summary>
            <div class="acc__body"><ul>${p.details.map(d => `<li>${esc(d)}</li>`).join('')}</ul></div>
          </details>
          <details>
            <summary>Fabric &amp; care<span class="pm" aria-hidden="true"></span></summary>
            <div class="acc__body"><p>${esc(p.fabric)}</p><p style="margin-top:.6rem">${esc(p.care)}</p></div>
          </details>
          <details>
            <summary>Size &amp; fit<span class="pm" aria-hidden="true"></span></summary>
            <div class="acc__body">
              <p>A-Cut, full length, hangs from the shoulder. Measurements are of the garment, in inches.</p>
              <p style="margin-top:.6rem"><button class="btn" data-open="size">Open the full chart</button></p>
            </div>
          </details>
          <details>
            <summary>Delivery &amp; returns<span class="pm" aria-hidden="true"></span></summary>
            <div class="acc__body">
              <p>Dispatched within 24 hours, at your doorstep in 1–3 days. ${money(CONFIG.shipping.west.rate)} to Semenanjung, ${money(CONFIG.shipping.east.rate)} to Sabah, Sarawak &amp; Labuan${
                CONFIG.freeShippingOver ? `, free over ${money(CONFIG.freeShippingOver)}` : ''}.</p>
              <p style="margin-top:.6rem">${CONFIG.policy.returnDays} days to exchange or return, unworn with tags. Return postage is not covered.</p>
            </div>
          </details>
        </div>
      </div>
    </div>`;

  foot.innerHTML = `
    <div class="pd__foot-price">
      <span class="k">${p.name} · ${cw.name}${size ? ` · ${SIZE_LABELS[size]}` : ''}</span>
      <span class="v">${money(p.price * qty)}</span>
    </div>
    <button class="btn btn--solid btn--block" data-add ${soldOut ? 'disabled' : ''}>
      ${soldOut ? 'Sold out' : 'Add to bag'}
    </button>`;

  hydrateImages(body);
  mountGallery();
  wireProduct();
}

function mountGallery() {
  const slides = $('[data-slides]');
  const dots = $('[data-dots]');
  if (!slides || !dots) return;

  const vs = slides.querySelector('[data-video-slide]');
  if (vs) {
    vs.dataset.video = vs.dataset.videoSlide;
    vs.dataset.caption = 'Campaign film';
    mountVideo(vs);
  }

  const n = slides.children.length;
  dots.innerHTML = Array.from({ length: n }, (_, i) =>
    `<i class="${i === 0 ? 'on' : ''}"></i>`).join('');

  slides.addEventListener('scroll', () => {
    const i = Math.round(slides.scrollLeft / slides.clientWidth);
    [...dots.children].forEach((d, j) => d.classList.toggle('on', j === i));
  }, { passive: true });
}

function wireProduct() {
  const body = $('[data-pd]');
  const foot = $('[data-pd-foot]');

  body.querySelectorAll('[data-pd-cw]').forEach(b => b.addEventListener('click', () => {
    const { product: p } = findVariant(state.pd.key);
    const cw = p.colourways.find(c => c.id === b.dataset.pdCw);
    state.pd.key = `${p.id}:${cw.id}`;
    if (state.pd.size && !inStock(cw, state.pd.size)) state.pd.size = null;
    state.cardColour[p.id] = cw.id;
    renderProduct();
    syncCardColour(p.id, cw.id);
    track('select_colour', { item_id: state.pd.key, colour: cw.name, item_name: p.name });
    history.replaceState(null, '', `?p=${state.pd.key}${location.hash}`);
  }));

  // Size and quantity update in place. Re-rendering the whole sheet would
  // reset the gallery scroll and tear down the video for no reason.
  body.querySelectorAll('[data-size]').forEach(b => b.addEventListener('click', () => {
    state.pd.size = b.dataset.size;
    state.pd.qty = 1;
    updateSelection();
    const { product: p, cw } = findVariant(state.pd.key);
    track('select_size', { item_id: state.pd.key, size: b.dataset.size, item_name: p.name, item_variant: cw.name });
  }));

  body.querySelectorAll('[data-qty]').forEach(b => b.addEventListener('click', () => {
    const { cw } = findVariant(state.pd.key);
    const cap = state.pd.size ? Math.max(1, cw.stock[state.pd.size]) : 9;
    state.pd.qty = Math.min(cap, Math.max(1, state.pd.qty + Number(b.dataset.qty)));
    updateSelection();
  }));

  foot.querySelector('[data-add]')?.addEventListener('click', addFromDrawer);
}

/* Repaints only the bits that depend on the chosen size and quantity. */
function updateSelection() {
  const { key, size, qty } = state.pd;
  const { product: p, cw } = findVariant(key);
  const body = $('[data-pd]');

  body.querySelectorAll('[data-size]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.size === size)));

  body.querySelector('[data-size-val]').textContent = size ? SIZE_LABELS[size] : '';

  const msg = body.querySelector('[data-size-msg]');
  msg.classList.remove('err');
  msg.textContent = size
    ? (CONFIG.showStockPressure && cw.stock[size] <= 3
        ? `Only ${cw.stock[size]} left in ${SIZE_LABELS[size]}.`
        : `Bust ${SIZE_CHART.data[size][1]}″ · Length ${SIZE_CHART.data[size][5]}″`)
    : 'Choose a size to continue.';

  const out = body.querySelector('.qty output');
  if (out) out.textContent = qty;
  const minus = body.querySelector('[data-qty="-1"]');
  if (minus) minus.disabled = qty <= 1;

  const foot = $('[data-pd-foot]');
  foot.querySelector('.k').textContent =
    `${p.name} · ${cw.name}${size ? ` · ${SIZE_LABELS[size]}` : ''}`;
  foot.querySelector('.v').textContent = money(p.price * qty);
}

function syncCardColour(pid, cwid) {
  const card = $(`[data-grid] .card[data-product="${pid}"]`);
  const btn = card?.querySelector(`.swatch[data-cw="${cwid}"]`);
  if (card && btn) selectCardColour(card, btn);
}

function addFromDrawer() {
  const { key, size, qty } = state.pd;
  if (!size) {
    const msg = $('[data-size-msg]');
    msg.textContent = 'Please choose a size first.';
    msg.classList.add('err');
    $('[data-pd] .sizes')?.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
    $('[data-pd] .size:not(:disabled)')?.focus();
    return;
  }
  addToCart(key, size, qty);
  closeOverlay();
  openOverlay('dw-cart');
}

/* ---------- 8. CART ------------------------------------------------------ */
function addToCart(key, size, qty = 1) {
  const { product: p, cw } = findVariant(key);
  const cap = cw.stock[size] ?? 0;
  const line = state.cart.find(l => l.key === key && l.size === size);

  if (line) line.qty = Math.min(cap, line.qty + qty);
  else state.cart.push({
    key, size, qty: Math.min(cap, qty),
    title: p.name, cwName: cw.name, price: p.price,
    img: cw.images[0], productId: p.id
  });

  saveCart();
  renderCart();
  updateCartCount();
  toast(`${p.name} in ${cw.name}, ${SIZE_LABELS[size]}`, cw.images[0]);

  track('add_to_cart', {
    content_ids: [key], value: p.price * qty,
    items: [{ item_id: `${key}:${size}`, item_name: p.name, item_variant: `${cw.name} / ${SIZE_LABELS[size]}`, price: p.price, quantity: qty }]
  });
}

function setQty(key, size, delta) {
  const line = state.cart.find(l => l.key === key && l.size === size);
  if (!line) return;
  const { cw } = findVariant(key);
  const next = line.qty + delta;
  if (next <= 0) state.cart = state.cart.filter(l => l !== line);
  else line.qty = Math.min(cw.stock[size] ?? next, next);
  saveCart(); renderCart(); updateCartCount(); renderCheckoutSummary();
}

function removeLine(key, size) {
  state.cart = state.cart.filter(l => !(l.key === key && l.size === size));
  saveCart(); renderCart(); updateCartCount(); renderCheckoutSummary();
}

function updateCartCount() {
  const n = cartCount();
  $('[data-cart-count]').textContent = n || '';
  $('[data-cart-count-label]').textContent = n ? `(${n})` : '';
}

function lineMarkup(l, compact = false) {
  const node = el('div', { class: 'ci' });
  node.innerHTML = `
    <div class="ci__media"><span class="ph" data-img="${l.img}" data-sizes="90px" data-alt=""></span></div>
    <div>
      <div class="ci__top">
        <div>
          <h4>${esc(l.title)}</h4>
          <p class="meta">${esc(l.cwName)} · ${SIZE_LABELS[l.size]}</p>
        </div>
        <span class="price">${money(l.price * l.qty)}</span>
      </div>
      ${compact ? `<p class="meta" style="margin-top:.35rem">Qty ${l.qty}</p>` : `
      <div class="ci__bot">
        <div class="qty">
          <button type="button" data-cq="-1" aria-label="Decrease quantity">−</button>
          <output>${l.qty}</output>
          <button type="button" data-cq="1" aria-label="Increase quantity">+</button>
        </div>
        <button class="rm" type="button" data-rm>Remove</button>
      </div>`}
    </div>`;

  if (!compact) {
    node.querySelectorAll('[data-cq]').forEach(b =>
      b.addEventListener('click', () => setQty(l.key, l.size, Number(b.dataset.cq))));
    node.querySelector('[data-rm]').addEventListener('click', () => removeLine(l.key, l.size));
  }
  return node;
}

function renderCart() {
  const body = $('[data-cart]');
  const foot = $('[data-cart-foot]');
  body.innerHTML = '';

  if (!state.cart.length) {
    foot.hidden = true;
    body.innerHTML = `
      <div class="cart__empty">
        <span class="serif">Your bag is empty.</span>
        <p>Seventeen colours are waiting. Everything is ${money(CONFIG.basePrice)}.</p>
        <p style="margin-top:1.5rem"><button class="btn" data-close-to-shop>See the collection</button></p>
      </div>`;
    body.querySelector('[data-close-to-shop]').addEventListener('click', () => {
      closeOverlay();
      $('#shop').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
    });
    return;
  }

  foot.hidden = false;

  if (CONFIG.freeShippingOver) {
    const away = CONFIG.freeShippingOver - subtotal();
    const pct = Math.min(100, subtotal() / CONFIG.freeShippingOver * 100);
    body.appendChild(el('div', { class: 'ship-nudge' }, `
      ${away > 0
        ? `Add <b>${money(away)}</b> for free delivery.`
        : `<b>Free delivery</b> unlocked.`}
      <div class="bar"><i style="width:${pct}%"></i></div>`));
  }

  state.cart.forEach(l => body.appendChild(lineMarkup(l)));

  foot.innerHTML = `
    <div class="totals">
      <div><span>Subtotal</span><span>${money(subtotal())}</span></div>
      <div><span>Delivery <span class="muted">· ${CONFIG.shipping[state.region].label}</span></span>
           <span>${shippingCost() === 0 ? 'Free' : money(shippingCost())}</span></div>
      <div class="grand"><span>Total</span><span>${money(grandTotal())}</span></div>
    </div>
    <button class="btn btn--solid btn--block" data-checkout>Checkout · ${money(grandTotal())}</button>
    <p class="co__note" style="margin-top:.75rem;text-align:center">
      Delivery is confirmed at checkout once we know your state.
    </p>`;

  foot.querySelector('[data-checkout]').addEventListener('click', beginCheckout);
  hydrateImages(body);
}

function toast(text, img) {
  const t = $('[data-toast]');
  t.innerHTML = `
    <span class="ph" data-img="${img}" data-sizes="40px" data-alt=""></span>
    <span>Added: ${esc(text)}</span>
    <button type="button" data-view-bag>View bag</button>`;
  hydrateImages(t);
  t.querySelector('[data-view-bag]').addEventListener('click', () => {
    t.classList.remove('is-shown');
    openOverlay('dw-cart');
  });
  t.classList.add('is-shown');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('is-shown'), 4200);
}

/* ---------- 9. SIZE DRAWER + FIT FINDER ---------------------------------- */
function recommend(valueIn) {
  if (!valueIn || Number.isNaN(valueIn)) return undefined;
  return FIT_RULES.find(r => valueIn <= r.max)?.size ?? null;
}

function fitOutput(raw, unit) {
  const out = $('[data-fit-out]');
  const inches = unit === 'cm' ? raw / 2.54 : raw;

  if (!raw) {
    out.innerHTML = `<p class="muted">Measure around the fullest part, over a light layer, tape level and not pulled tight.</p>`;
    renderChart(null);
    return;
  }
  if (inches < 24 || inches > 70) {
    out.innerHTML = `<p class="muted">That looks off. Check whether you are in inches or centimetres.</p>`;
    renderChart(null);
    return;
  }

  const size = recommend(inches);
  if (!size) {
    out.innerHTML = `
      <p class="rec">Let us check for you.</p>
      <p>You are just past our largest listed size. Email
        <a href="mailto:${CONFIG.support.email}" style="text-decoration:underline">${CONFIG.support.email}</a>
        with your measurement; 4XL runs 54″ at the bust and there is usually room.</p>`;
    renderChart(null);
    return;
  }

  const g = LENGTH_GUIDE.find(l => l.size === size);
  const garmentBust = SIZE_CHART.data[size][1];
  out.innerHTML = `
    <p class="rec">We would put you in <b>${SIZE_LABELS[size]}</b>.</p>
    <p>The garment measures ${garmentBust}″ at the bust, which leaves you about
       ${Math.round(garmentBust - inches)}″ of room to move. Length is ${g.length}″ from the shoulder,
       which suits ${g.suits}.</p>
    <p style="margin-top:1rem"><button class="btn" data-close>Back to the collection</button></p>`;
  renderChart(size);
  track('size_finder', { size, bust_in: Math.round(inches) });
}

function wireFinder() {
  const input = $('#bust');
  const run = () => fitOutput(parseFloat(input.value), state.unit);

  input.addEventListener('input', run);
  $$('[data-unit]').forEach(b => b.addEventListener('click', () => {
    const next = b.dataset.unit;
    if (next === state.unit) return;
    const v = parseFloat(input.value);
    if (!Number.isNaN(v)) {
      input.value = next === 'cm' ? Math.round(v * 2.54) : Math.round(v / 2.54 * 2) / 2;
    }
    state.unit = next;
    $$('[data-unit]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.unit === next)));
    input.placeholder = next === 'cm' ? 'e.g. 96' : 'e.g. 38';
    run();
  }));
}

function renderSizeDrawer() {
  const body = $('[data-size-body]');
  body.innerHTML = `
    <div style="padding:1.5rem var(--gut) 2rem">
      <p style="color:var(--ink-80);max-width:44ch">
        Every piece is the same A-Cut. It hangs from the shoulder, so the bust
        measurement is the one that decides your size.
      </p>
      <div class="chart-scroll" style="margin-top:1.5rem">
        <table class="chart" data-chart-2></table>
      </div>
      <p class="chart__note">${esc(SIZE_CHART.note)}</p>
      <div style="margin-top:2rem;border-top:1px solid var(--line);padding-top:1.5rem">
        <h3 style="font-family:var(--serif);font-weight:400;font-size:1.3rem;margin-bottom:.75rem">Length, by size</h3>
        <ul style="font-size:var(--t-small);color:var(--ink-80)">
          ${LENGTH_GUIDE.map(l => `<li style="display:flex;justify-content:space-between;gap:1rem;padding:.5rem 0;border-bottom:1px solid var(--line-soft)">
            <b>${SIZE_LABELS[l.size]}</b><span>${l.length}″ · ${esc(l.suits)}</span></li>`).join('')}
        </ul>
      </div>
      <p style="margin-top:1.75rem"><button class="btn" data-jump-finder>Use the size finder</button></p>
    </div>`;

  const t = $('[data-chart-2]');
  t.innerHTML = `
    <thead><tr><th scope="col">Inches</th>${SIZES.map(s => `<th scope="col">${SIZE_LABELS[s]}</th>`).join('')}</tr></thead>
    <tbody>${SIZE_CHART.rows.map((row, i) => `<tr><th scope="row">${row}</th>${
      SIZES.map(s => `<td>${SIZE_CHART.data[s][i]}</td>`).join('')}</tr>`).join('')}</tbody>`;

  body.querySelector('[data-jump-finder]').addEventListener('click', () => {
    closeOverlay();
    $('#fit').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
    setTimeout(() => $('#bust').focus(), REDUCED ? 0 : 650);
  });
}

/* ---------- 10. OVERLAY MANAGER ------------------------------------------ */
let openId = null, lastFocus = null;

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

function openOverlay(id) {
  if (openId === id) return;
  if (openId) closeOverlay({ keepLock: true });

  lastFocus = document.activeElement;
  openId = id;
  const node = document.getElementById(id);
  node.classList.add('is-open');
  node.setAttribute('aria-hidden', 'false');
  $('[data-scrim]').classList.add('is-open');
  document.body.classList.add('is-locked');

  if (id === 'dw-cart') track('view_cart', { value: subtotal(), content_ids: state.cart.map(l => l.key) });
  if (id === 'dw-size') track('view_size_guide');

  requestAnimationFrame(() => node.querySelector(FOCUSABLE)?.focus());
}

function closeOverlay(opts = {}) {
  if (!openId) return;
  const node = document.getElementById(openId);
  node.classList.remove('is-open');
  node.setAttribute('aria-hidden', 'true');
  node.querySelectorAll('video').forEach(v => v.pause());
  openId = null;

  if (!opts.keepLock) {
    $('[data-scrim]').classList.remove('is-open');
    document.body.classList.remove('is-locked');
    lastFocus?.focus?.();
  }
  if (location.search.includes('p=')) history.replaceState(null, '', location.pathname + location.hash);
}

function trapFocus(e) {
  if (e.key !== 'Tab' || !openId) return;
  const node = document.getElementById(openId);
  const items = [...node.querySelectorAll(FOCUSABLE)].filter(x => x.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ---------- 11. CHECKOUT ------------------------------------------------- */
const STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang',
  'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor',
  'Terengganu', 'W.P. Kuala Lumpur', 'W.P. Labuan', 'W.P. Putrajaya'
];
const EAST = new Set(['Sabah', 'Sarawak', 'W.P. Labuan']);

const PAY_METHODS = [
  {
    id: 'fpx', name: 'Online banking (FPX)',
    sub: 'Maybank2u, CIMB Clicks and every major Malaysian bank.',
    marks: ['FPX', 'Maybank', 'CIMB'],
    body: 'You will be sent to your own bank to approve the payment, then brought straight back here.'
  },
  {
    id: 'card', name: 'Credit or debit card',
    sub: 'Visa, Mastercard, UnionPay.',
    marks: ['Visa', 'Mastercard', 'UnionPay'],
    body: 'Card details are entered on our payment provider\'s own encrypted page. They are never seen or stored by this site.'
  },
  {
    id: 'transfer', name: 'Bank transfer',
    sub: 'Pay manually, we hold your order.',
    marks: ['Bank transfer'],
    body: 'We email you our account details and keep your size reserved for 24 hours. Send us the receipt and we dispatch.'
  }
];

let coStep = 1;
const form = {
  name: '', phone: '', email: '',
  address1: '', address2: '', postcode: '', city: '', state: '',
  notes: '', pay: 'fpx'
};

function beginCheckout() {
  if (!state.cart.length) return;
  closeOverlay();
  coStep = 1;
  renderCheckout();
  const co = $('#checkout');
  co.classList.add('is-open');
  co.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  co.scrollTop = 0;

  track('begin_checkout', {
    value: grandTotal(), num_items: cartCount(),
    content_ids: state.cart.map(l => l.key), items: state.cart.map(lineToItem)
  });
}

function closeCheckout() {
  const co = $('#checkout');
  co.classList.remove('is-open');
  co.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-locked');
}

function renderCheckout() {
  const co = $('#checkout');
  co.innerHTML = `
    <div class="co__head">
      <button class="x" data-co-close aria-label="Back to the collection"><svg><use href="#i-x"></use></svg></button>
      <svg class="logo" viewBox="0 0 1281.9 424.49" role="img" aria-label="HOOR"><use href="#i-hoor"></use></svg>
      <span class="co__secure"><svg aria-hidden="true"><use href="#i-lock"></use></svg>Secure checkout</span>
    </div>

    <div class="co__wrap">
      <div>
        <ol class="steps" data-steps>
          <li>Details</li><li>Payment</li><li>Done</li>
        </ol>
        <div data-co-steps></div>
      </div>
      <aside class="summary">
        <div class="summary__head">
          <h3>Your order</h3>
          <span class="label" data-summary-count></span>
        </div>
        <div class="summary__items" data-summary-items></div>
        <div class="summary__totals" data-summary-totals></div>
        <ul class="summary__trust">
          <li><svg aria-hidden="true"><use href="#i-tick-s"></use></svg>Dispatched within 24 hours, with tracking</li>
          <li><svg aria-hidden="true"><use href="#i-tick-s"></use></svg>${CONFIG.policy.returnDays}-day exchange or return, unworn with tags</li>
          <li><svg aria-hidden="true"><use href="#i-tick-s"></use></svg>Payment handled by HOOR's provider, never stored here</li>
        </ul>
      </aside>
    </div>`;

  co.querySelector('[data-co-close]').addEventListener('click', closeCheckout);
  renderStep();
  renderCheckoutSummary();
}

function stepMarkup() {
  if (coStep === 1) return `
    <section class="co__step on">
      <h2>Where are we sending it?</h2>
      <div class="fields">
        ${field('name', 'Full name', 'text', { autocomplete: 'name' })}
        <div class="two">
          ${field('phone', 'Phone', 'tel', { autocomplete: 'tel', placeholder: '012 345 6789', hint: 'For the courier only.' })}
          ${field('email', 'Email', 'email', { autocomplete: 'email', hint: 'Order confirmation and tracking.' })}
        </div>
        ${field('address1', 'Address', 'text', { autocomplete: 'address-line1' })}
        ${field('address2', 'Unit, floor, landmark', 'text', { autocomplete: 'address-line2', optional: true })}
        <div class="two">
          ${field('postcode', 'Postcode', 'text', { autocomplete: 'postal-code', inputmode: 'numeric', maxlength: 5 })}
          ${field('city', 'City', 'text', { autocomplete: 'address-level2' })}
        </div>
        <div class="f" data-f="state">
          <label for="f-state">State</label>
          <select id="f-state" autocomplete="address-level1">
            <option value="">Choose your state</option>
            ${STATES.map(s => `<option ${form.state === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <p class="err">Please choose your state so we can price delivery.</p>
        </div>
        ${field('notes', 'Anything we should know?', 'textarea', { optional: true })}
      </div>
      <div class="co__actions">
        <button class="btn btn--solid" data-next>Continue to payment</button>
        <button class="co__back" data-co-close>Keep shopping</button>
      </div>
    </section>`;

  if (coStep === 2) return `
    <section class="co__step on">
      <h2>How would you like to pay?</h2>
      <div class="pay-list" data-pay>
        ${PAY_METHODS.map(m => `
          <label class="pay-opt ${form.pay === m.id ? 'on' : ''}" data-pay-opt="${m.id}">
            <span class="pay-opt__top">
              <input type="radio" name="pay" value="${m.id}" ${form.pay === m.id ? 'checked' : ''}>
              <span>
                <span class="nm">${m.name}</span><br>
                <span class="sub">${m.sub}</span>
              </span>
              <span class="marks">${m.marks.map(x => `<span class="pay-mark">${x}</span>`).join('')}</span>
            </span>
            <span class="pay-opt__body">${m.body}</span>
          </label>`).join('')}
      </div>

      <div style="margin-top:1.75rem;border-top:1px solid var(--line);padding-top:1.25rem">
        <span class="label" style="color:var(--ink-55)">Delivering to</span>
        <p style="margin-top:.5rem;font-size:var(--t-small);line-height:1.5">
          <b>${esc(form.name)}</b><br>
          ${esc(form.address1)}${form.address2 ? `, ${esc(form.address2)}` : ''}<br>
          ${esc(form.postcode)} ${esc(form.city)}, ${esc(form.state)}<br>
          ${esc(form.phone)} · ${esc(form.email)}
        </p>
        <button class="co__back" data-back style="margin-top:.75rem">Edit details</button>
      </div>

      <div class="co__actions">
        <button class="btn btn--solid" data-pay-now>Pay ${money(grandTotal())}</button>
        <button class="co__back" data-back>Back</button>
      </div>
      <p class="co__note">
        By paying you agree to HOOR's terms and return policy. You will get an
        order number and an email the moment payment clears.
      </p>
    </section>`;

  return `<section class="co__step on" data-done></section>`;
}

function field(key, label, type, opts = {}) {
  const id = 'f-' + key;
  const input = type === 'textarea'
    ? `<textarea id="${id}" ${opts.autocomplete ? `autocomplete="${opts.autocomplete}"` : ''}>${esc(form[key])}</textarea>`
    : `<input id="${id}" type="${type}" value="${esc(form[key])}"
         ${opts.autocomplete ? `autocomplete="${opts.autocomplete}"` : ''}
         ${opts.inputmode ? `inputmode="${opts.inputmode}"` : ''}
         ${opts.maxlength ? `maxlength="${opts.maxlength}"` : ''}
         ${opts.placeholder ? `placeholder="${opts.placeholder}"` : ''}>`;
  return `
    <div class="f" data-f="${key}">
      <label for="${id}">${label}${opts.optional ? ' <span style="color:var(--ink-35)">· optional</span>' : ''}</label>
      ${input}
      ${opts.hint ? `<p class="hint">${opts.hint}</p>` : ''}
      <p class="err"></p>
    </div>`;
}

const VALIDATORS = {
  name:     v => v.trim().length >= 2 || 'Please tell us who to address it to.',
  phone:    v => /^(\+?6?0)[0-9]{8,10}$/.test(v.replace(/[\s-]/g, '')) || 'Use a Malaysian number, e.g. 012 345 6789.',
  email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'We need a working email for your tracking number.',
  address1: v => v.trim().length >= 5 || 'Please give us a street address.',
  postcode: v => /^\d{5}$/.test(v.trim()) || 'Malaysian postcodes are 5 digits.',
  city:     v => v.trim().length >= 2 || 'Which city or town?',
  state:    v => STATES.includes(v) || 'Please choose your state so we can price delivery.'
};

function readForm() {
  ['name', 'phone', 'email', 'address1', 'address2', 'postcode', 'city', 'notes'].forEach(k => {
    const n = $('#f-' + k);
    if (n) form[k] = n.value;
  });
  const s = $('#f-state');
  if (s) form.state = s.value;
  state.region = EAST.has(form.state) ? 'east' : 'west';
}

function validateStep1() {
  readForm();
  let ok = true, firstBad = null;
  for (const [key, fn] of Object.entries(VALIDATORS)) {
    const wrap = $(`[data-f="${key}"]`);
    if (!wrap) continue;
    const res = fn(form[key] || '');
    const bad = res !== true;
    wrap.classList.toggle('invalid', bad);
    if (bad) {
      wrap.querySelector('.err').textContent = res;
      ok = false;
      firstBad = firstBad || wrap;
    }
  }
  if (firstBad) {
    firstBad.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
    firstBad.querySelector('input,select,textarea')?.focus();
  }
  return ok;
}

function renderStep() {
  $('[data-co-steps]').innerHTML = stepMarkup();

  $$('[data-steps] li').forEach((li, i) => {
    li.classList.toggle('on', i === coStep - 1);
    li.classList.toggle('done', i < coStep - 1);
  });

  const host = $('[data-co-steps]');

  host.querySelector('[data-next]')?.addEventListener('click', () => {
    if (!validateStep1()) return;
    coStep = 2;
    renderStep();
    renderCheckoutSummary();
    $('#checkout').scrollTop = 0;
    track('add_shipping_info', { value: grandTotal(), shipping_tier: state.region });
  });

  host.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => {
    coStep = 1; renderStep(); renderCheckoutSummary(); $('#checkout').scrollTop = 0;
  }));

  host.querySelectorAll('[data-co-close]').forEach(b => b.addEventListener('click', closeCheckout));

  host.querySelectorAll('[data-pay-opt]').forEach(opt => opt.addEventListener('click', () => {
    form.pay = opt.dataset.payOpt;
    host.querySelectorAll('[data-pay-opt]').forEach(o => o.classList.toggle('on', o === opt));
    track('select_payment_method', { payment_type: form.pay, value: grandTotal() });
  }));

  host.querySelector('[data-pay-now]')?.addEventListener('click', pay);

  // Re-price delivery live when the state changes.
  host.querySelector('#f-state')?.addEventListener('change', () => {
    readForm();
    renderCheckoutSummary();
  });
}

function renderCheckoutSummary() {
  const items = $('[data-summary-items]');
  if (!items) return;

  items.innerHTML = '';
  state.cart.forEach(l => items.appendChild(lineMarkup(l, true)));
  hydrateImages(items);

  $('[data-summary-count]').textContent = `${cartCount()} item${cartCount() === 1 ? '' : 's'}`;
  $('[data-summary-totals]').innerHTML = `
    <div class="totals" style="margin-bottom:0">
      <div><span>Subtotal</span><span>${money(subtotal())}</span></div>
      <div><span>Delivery <span class="muted">· ${CONFIG.shipping[state.region].label}</span></span>
           <span>${shippingCost() === 0 ? 'Free' : money(shippingCost())}</span></div>
      <div class="grand"><span>Total</span><span>${money(grandTotal())}</span></div>
    </div>`;

  const btn = $('[data-pay-now]');
  if (btn) btn.textContent = `Pay ${money(grandTotal())}`;
}

/* ---------------------------------------------------------------------------
   ⚑ PAYMENT GATEWAY SEAM
   This is the only place that needs to change to go live.

   Replace the body of createOrder() with a call to your own server, which
   should create the order, then hand back the gateway's redirect URL:

     const res = await fetch('/api/orders', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload)
     });
     const { orderRef, redirectUrl } = await res.json();
     return { orderRef, redirectUrl };

   For FPX and hosted card pages you then do `location.href = redirectUrl`,
   and fire the purchase event on the return URL instead of here.
   Card numbers must never be collected by this page — the hosted page does it.
   --------------------------------------------------------------------------- */
async function createOrder(payload) {
  await new Promise(r => setTimeout(r, 1400));            // stands in for the network
  const ref = 'HR' + Date.now().toString(36).toUpperCase().slice(-6);
  return { orderRef: ref, redirectUrl: null, demo: true, payload };
}

async function pay() {
  const btn = $('[data-pay-now]');
  btn.disabled = true;

  const method = PAY_METHODS.find(m => m.id === form.pay);
  // Fires here too, so the default method still registers when nobody clicks it.
  track('add_payment_info', { payment_type: form.pay, value: grandTotal() });
  $('[data-co-steps]').innerHTML = `
    <div class="redirecting">
      <div class="spin" aria-hidden="true"></div>
      <h3>${form.pay === 'transfer' ? 'Reserving your order' : `Connecting to ${esc(method.name.toLowerCase())}`}</h3>
      <p>${form.pay === 'transfer'
        ? 'Holding your size while we prepare the transfer details.'
        : 'Do not close this window. We are handing you to the payment page.'}</p>
    </div>`;

  const payload = {
    items: state.cart.map(l => ({
      sku: `${l.key}:${l.size}`, name: `${l.title} in ${l.cwName}`,
      size: l.size, qty: l.qty, unitPrice: l.price
    })),
    customer: { name: form.name, phone: form.phone, email: form.email },
    delivery: {
      address1: form.address1, address2: form.address2,
      postcode: form.postcode, city: form.city, state: form.state,
      region: state.region, notes: form.notes
    },
    payment: { method: form.pay },
    amounts: { subtotal: subtotal(), shipping: shippingCost(), total: grandTotal(), currency: CONFIG.currency },
    attribution: Object.fromEntries(new URLSearchParams(location.search))
  };

  let result;
  try { result = await createOrder(payload); }
  catch {
    $('[data-co-steps]').innerHTML = `
      <section class="co__step on">
        <h2>That did not go through.</h2>
        <p style="color:var(--ink-80);max-width:44ch">
          Nothing was charged and your bag is untouched. Try again, or email
          <a href="mailto:${CONFIG.support.email}" style="text-decoration:underline">${CONFIG.support.email}</a>
          and we will take the order by hand.</p>
        <div class="co__actions"><button class="btn" data-retry>Try again</button></div>
      </section>`;
    $('[data-retry]').addEventListener('click', () => { coStep = 2; renderStep(); });
    return;
  }

  if (result.redirectUrl) { location.href = result.redirectUrl; return; }

  // ---- demo path: land on the confirmation we would show on return
  track('purchase', {
    transaction_id: result.orderRef,
    value: grandTotal(), shipping: shippingCost(),
    payment_type: form.pay,
    content_ids: state.cart.map(l => l.key),
    items: state.cart.map(lineToItem)
  });

  state.order = {
    ref: result.orderRef,
    lines: state.cart.slice(),
    total: grandTotal(), shipping: shippingCost(), subtotal: subtotal(),
    method, form: { ...form }, region: state.region
  };

  state.cart = [];
  saveCart(); updateCartCount(); renderCart();

  coStep = 3;
  renderConfirmation();
}

function renderConfirmation() {
  const o = state.order;
  const co = $('#checkout');

  co.innerHTML = `
    <div class="co__head">
      <svg class="logo" viewBox="0 0 1281.9 424.49" role="img" aria-label="HOOR"><use href="#i-hoor"></use></svg>
      <span class="co__secure">Order ${esc(o.ref)}</span>
    </div>

    <div class="done done__wrap">
      <div class="done__tick"><svg aria-hidden="true"><use href="#i-tick"></use></svg></div>
      <h1>Thank you. That's yours.</h1>
      <p class="done__lead">
        We have emailed a confirmation to <b>${esc(o.form.email)}</b>. Keep the
        order number below; it is the fastest way for us to find you.
      </p>

      <div class="done__ref">
        <div><span class="label">Order number</span><span class="v">${esc(o.ref)}</span></div>
        <div><span class="label">Paid</span><span class="v">${money(o.total)}</span></div>
        <div><span class="label">Method</span><span class="v" style="font-size:1rem">${esc(o.method.name)}</span></div>
      </div>

      <div style="margin-top:2rem;border:1px solid var(--line);background:var(--white)">
        <div class="summary__head"><h3>What you ordered</h3></div>
        <div data-done-items></div>
        <div class="summary__totals">
          <div class="totals" style="margin-bottom:0">
            <div><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
            <div><span>Delivery · ${CONFIG.shipping[o.region].label}</span><span>${o.shipping === 0 ? 'Free' : money(o.shipping)}</span></div>
            <div class="grand"><span>Total paid</span><span>${money(o.total)}</span></div>
          </div>
        </div>
        <div class="summary__trust">
          <p style="line-height:1.5">
            <b style="color:var(--ink)">Delivering to</b><br>
            ${esc(o.form.name)}, ${esc(o.form.address1)}${o.form.address2 ? `, ${esc(o.form.address2)}` : ''},
            ${esc(o.form.postcode)} ${esc(o.form.city)}, ${esc(o.form.state)}
          </p>
        </div>
      </div>

      <ol class="done__next">
        <li><span class="n">01</span><div>
          <h3>We pack it</h3>
          <p>Within 24 hours. You get an email with a tracking number the moment it leaves us.</p>
        </div></li>
        <li><span class="n">02</span><div>
          <h3>It arrives</h3>
          <p>At your doorstep within 1–3 days of dispatch.</p>
        </div></li>
        <li><span class="n">03</span><div>
          <h3>Try it on the same day</h3>
          <p>If the size is wrong you have ${CONFIG.policy.returnDays} days to post it back, unworn with tags. Email ${CONFIG.support.email} with your order number and we will sort it.</p>
        </div></li>
      </ol>

      <div class="co__actions">
        <button class="btn" data-done-close>Back to the collection</button>
        <a class="co__back" href="mailto:${CONFIG.support.email}?subject=Order%20${encodeURIComponent(o.ref)}">Email us about this order</a>
      </div>
    </div>`;

  const host = co.querySelector('[data-done-items]');
  o.lines.forEach(l => host.appendChild(lineMarkup(l, true)));
  hydrateImages(host);

  co.querySelector('[data-done-close]').addEventListener('click', () => {
    closeCheckout();
    coStep = 1;
    $('#shop').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
  });
  co.scrollTop = 0;
}

/* ---------- 12. SCROLL BEHAVIOURS ---------------------------------------- */
function wireScroll() {
  const header = $('#header');
  const bar = $('#stickybar');
  const hero = $('.hero');
  let depthHit = new Set();

  const onScroll = () => {
    const y = window.scrollY;
    const past = y > innerHeight * 0.7;
    header.classList.toggle('is-shown', past);
    $('[data-wa]')?.classList.toggle('is-shown', past);

    // The mobile bar hides once the shop grid is on screen — the cards have
    // their own buttons and a second CTA there is just noise.
    const shop = $('#shop').getBoundingClientRect();
    bar.classList.toggle('is-shown', past && (shop.top > innerHeight * 0.6 || shop.bottom < 0));

    const pct = Math.round((y + innerHeight) / document.body.scrollHeight * 100);
    [25, 50, 75, 90].forEach(m => {
      if (pct >= m && !depthHit.has(m)) { depthHit.add(m); track('scroll_depth', { percent: m }); }
    });
  };

  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const rv = new IntersectionObserver((entries, o) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      o.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(n => rv.observe(n));

  $$('[data-video]').forEach(n => videoMountObserver.observe(n));
}

/* ---------- 13. GLOBAL EVENTS -------------------------------------------- */
function wireGlobal() {
  document.addEventListener('click', e => {
    const open = e.target.closest('[data-open]');
    if (open) {
      e.preventDefault();
      openOverlay({ cart: 'dw-cart', size: 'dw-size', product: 'dw-product' }[open.dataset.open]);
      return;
    }
    if (e.target.closest('[data-close]')) { e.preventDefault(); closeOverlay(); return; }

    const card = e.target.closest('[data-open-product]');
    if (card) { e.preventDefault(); openProduct(card.dataset.openProduct); return; }

    if (e.target.closest('[data-scrim]')) closeOverlay();

    const t = e.target.closest('[data-track]');
    if (t) track('cta_click', { location: t.dataset.track });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($('#checkout').classList.contains('is-open') && coStep !== 3) closeCheckout();
      else closeOverlay();
    }
    trapFocus(e);
  });
}

/* ---------- 14. DEEP LINKS ----------------------------------------------- */
/* Lets each ad point at its own colourway:
     ?p=renda:indigo            → opens that piece
     ?p=renda:indigo&size=2XL   → and preselects the size
     #shop                      → jumps straight to the grid                  */
function applyDeepLink() {
  const q = new URLSearchParams(location.search);
  const p = q.get('p');
  if (!p) return;

  const key = p.includes(':') ? p : (VARIANTS.find(v => v.product.id === p)?.key);
  if (!key || !findVariant(key)) return;

  const { product, cw } = findVariant(key);
  state.cardColour[product.id] = cw.id;
  renderGrid();

  requestAnimationFrame(() => {
    $('#shop').scrollIntoView({ behavior: 'auto' });
    openProduct(key, { size: q.get('size')?.toUpperCase() });
  });
}

/* ---------- 15. BOOT ----------------------------------------------------- */
async function boot() {
  settleStaticImages();

  try {
    const r = await fetch('assets/lqip.json');
    if (r.ok) ({ lqip: LQIP, dims: DIMS } = await r.json());
  } catch { /* placeholders are a nicety, not a requirement */ }

  renderChrome();
  renderChart(null);
  renderFaq();
  renderFilters();
  renderGrid();
  renderSizeDrawer();
  wireFinder();
  loadCart();
  renderCart();
  updateCartCount();
  hydrateImages();
  wireScroll();
  wireGlobal();
  applyDeepLink();

  track('page_view', {
    collection: CONFIG.collection,
    items: VARIANTS.length,
    ...Object.fromEntries(new URLSearchParams(location.search))
  });
}

boot();
