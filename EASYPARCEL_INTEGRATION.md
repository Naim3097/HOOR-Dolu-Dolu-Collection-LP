# EasyParcel Integration — how it was built, step by step

How Kalima.my talks to EasyParcel, from the OAuth connection through live
courier rates at checkout, admin booking, AWB labels, cancellation and the
tracking webhook. Every path, column and behaviour below is what is in the
codebase on the `staging` branch as of 4 September 2026.

> **This file replaces an earlier version that described a different product.**
> The original `EASYPARCEL_INTEGRATION.md` was a reference document for a
> multi-tenant SaaS ("Nexova") where every store owner connected their own
> EasyParcel account. Kalima is **one store with one merchant account**, and
> the client was later rewritten against EasyParcel's published spec because
> four of the six endpoint paths in that document did not exist. Trust this
> file and `src/lib/shipping/easyparcel.ts`, not the old one, and check the
> spec (https://easyparcel.github.io/OpenAPI/) before extending anything.

Related:

- [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) — Phase 4 and Phase 4b, including the
  dated verification records.
- [`INSTRUCTION.md`](./INSTRUCTION.md) §1.3 — the `state`-carries-no-identity
  rule shared with the Meta OAuth flow.
- [`README.md`](./README.md) — environment variable table.

---

## 0. Where it stands today

| Piece | State |
| --- | --- |
| OAuth connect / disconnect | Live. Connected on staging 26 Aug 2026. Whether production is connected is not recorded in this repo; the Shipping screen shows it. |
| Live rates at checkout — overseas | Live. Frozen server-side, charged at cost. |
| Live rates at checkout — Malaysia | Built and verified on staging. It is a **mode** (`domestic_shipping_mode`); production was still in `zone` mode at the last record (26 Aug). |
| Admin booking → AWB → label | **Verified against the real API on staging, 26 Aug 2026** (order KLM-10272, ref `ES-2608-6CYA6`, AWB `632143239945`, RM6.04 debited, then cancelled and credited). |
| Cancel a booking | Verified the same day. |
| Tracking webhook | Code verified with synthetic pushes. **Not yet exercised by a real parcel** — the test booking was cancelled before collection. Whether the URL is registered in the EasyParcel dashboard is not recorded anywhere in this repo; confirm it there. |
| Daily connection check | Live, rides on the order-expiry cron. |

---

## 1. How it got this shape (timeline)

The integration was built in several passes. Knowing the order explains several
otherwise odd things in the code (a `shipping_quotes` table that was created,
dropped, and created again; a "fallback" flag nothing reads; a booking tool
that predates the checkout picker).

| Date | Commit | What changed |
| --- | --- | --- |
| 23 Jul 2026 | `f6cfe85` | Groundwork: `shipments` table, `product_variants.weight_grams`, courier registry with tracking-URL templates. Courier-agnostic so a hand-booked parcel worked before any API existed. |
| 23 Jul 2026 | `dbf7172` | Foundation: API client, OAuth token storage on `store_settings`, a `shipping_quotes` freeze table for a checkout courier picker. |
| 23 Jul 2026 | `c018843`, `931ca7e` | **Rescoped to an admin-only booking tool.** The client said customers do not choose a courier. `shipping_quotes` was dropped. Booking gained idempotency and a wallet pre-check. Webhook added. |
| 18 Aug 2026 | `cd6e1a8` | Shipping became a function of destination: Semenanjung RM10, Sabah/Sarawak RM15, overseas refused until a service is chosen. |
| 18–19 Aug 2026 | `3a6e70e`, `5fe1f9f` | **Overseas courier picker at checkout.** `shipping_quotes` re-created (new shape); `price_order` reads the amount by `(quote_id, service_id)`. |
| 19 Aug 2026 | `57d4664`, `7cb2632` | Renewal hardened (a missing rotated refresh token no longer kills the connection); refresh-token expiry recorded; daily connection check. |
| 20 Aug 2026 | `0491d00` | **Client rewritten against the published spec.** Wallet, booking, cancel and tracking paths were wrong; overseas orders were unbookable. Cart-quote failures now land in the audit log. EasyParcel's whole API 404'd that day. |
| 21 Aug 2026 | `250117f` | Transit-time parsing fixed (FedEx sends the object as a JSON string). |
| 26 Aug 2026 | `2628014`, `f94cf1f`, `cc38f92` | **Malaysian shoppers pick a courier too** (`domestic_shipping_mode`), courier allowlists, one-click pending parcel, AWB polling, cancel from the order page. Real booking verified. |

---

## 2. Architecture at a glance

```
 Shopper (checkout)                Kalima (Next.js on Vercel)                    EasyParcel
 ──────────────────                ─────────────────────────                     ──────────
 types postcode+state ──────────►  quoteShippingOptions (server action)
                                     └─ quoteForCart  ──────────────────────►  POST /shipment/quotations
                                     └─ issue_shipping_quote()  (freeze, 30 min)
 ◄─ quote_id + courier list ──────
 places order ─────────────────►   placeOrder → create_order → price_order
                                     └─ reads amount_sen from shipping_quotes

 Staff (admin)
 Connect EasyParcel ────────────►  GET /api/shipping/connect ─────────────────►  /oauth/login
 ◄─────────────────────────────── GET /api/shipping/callback ◄────────────────  code + state
                                     └─ POST /oauth/token, tokens → store_settings
 Book with EasyParcel ──────────►  createPendingParcel → fetchCourierRates ──►  POST /shipment/quotations
                                   bookShipment
                                     ├─ GET /wallet  (pre-check)
                                     ├─ claim shipments row (pending → booked)
                                     ├─ POST /shipment/submit_orders
                                     └─ POST /shipment/details ×3 (AWB poll)
 Fetch AWB / Cancel ────────────►  refreshShipmentAwb / cancelEasyparcelBooking ► /shipment/details, /shipment/cancel

 EasyParcel status push ────────►  POST /api/shipping/webhook  (shared secret)
 Vercel cron 04:00 UTC ─────────►  GET /api/orders/expire → checkConnection ──►  GET /wallet
```

### File map

| Layer | File | Responsibility |
| --- | --- | --- |
| API client | `src/lib/shipping/easyparcel.ts` | `EasyParcelClient` — one method per endpoint, response parsing, sen conversion, phone splitting, `formatDuration` |
| Tokens + config | `src/lib/shipping/config.ts` | `getShippingConfig`, OAuth exchange, `getValidAccessToken`, `easyparcelClient()`, `checkConnection` |
| Rates | `src/lib/shipping/rates.ts` | `quoteForCart` (checkout), `getRatesForOrder` (admin), filters, sender/receiver builders, failure audit rows |
| Reference data | `src/lib/shipping/states.ts`, `countries.ts`, `src/lib/couriers.ts` | State name → ISO 3166-2, shippable countries + dial codes + parcel size tiers, courier tracking-URL templates |
| OAuth routes | `src/app/api/shipping/connect/route.ts`, `callback/route.ts` | Start the round trip; verify state; store tokens |
| Webhook | `src/app/api/shipping/webhook/route.ts` | Status pushes → `shipments`, order completion, WhatsApp notifications |
| Cron lodger | `src/app/api/orders/expire/route.ts` | Daily `checkConnection`, failures to the audit log |
| Checkout | `src/app/checkout/actions.ts` (`quoteShippingOptions`, `placeOrder`), `src/components/checkout/CheckoutForm.tsx` | Courier list, quote id round trip |
| Admin actions | `src/app/admin/actions.ts` | `saveShippingPricing`, `saveSenderSettings`, `disconnectEasyparcel`, `getEasyparcelWallet`, `createPendingParcel`, `fetchCourierRates`, `bookShipment`, `refreshShipmentAwb`, `cancelEasyparcelBooking` |
| Admin UI | `src/app/admin/shipping/page.tsx`, `src/components/admin/ShippingSettingsForm.tsx`, `src/components/admin/ShipmentPanel.tsx` | Settings screen; per-order parcel panel with the booking picker |
| Storefront | `src/app/(storefront)/account/page.tsx`, `src/lib/cms.ts` (`getShippingPricing`) | Tracking links on order history; the mode/zone rates the checkout renders |
| Database | `supabase/migrations/*shipping*`, `*easyparcel*`, `*courier*`, `*quote*` | See §4 |

---

## 3. Step 1 — Register the app and set the environment

EasyParcel issues one OAuth client per application. Kalima has exactly one
merchant account, so there is one client id, one secret and one stored token
pair. Nothing is per user.

| Variable | Purpose |
| --- | --- |
| `EASYPARCEL_CLIENT_ID` / `EASYPARCEL_CLIENT_SECRET` | OAuth client. Sent as HTTP Basic on `/oauth/token`, never in the body. |
| `EASYPARCEL_REDIRECT_URI` | Must match the registered value **byte for byte**. Production: `https://www.kalima.my/api/shipping/callback`. Use `www` — the apex 308-redirects to it, and an OAuth callback that lands on a redirect fails. |
| `EASYPARCEL_WEBHOOK_SECRET` | Shared secret for inbound status pushes. The webhook **fails closed** without it (503). |
| `CRON_SECRET` | Bearer token Vercel Cron presents to `/api/orders/expire`, which hosts the daily connection check. |
| `SUPABASE_SERVICE_ROLE_KEY` | Every EasyParcel code path reads tokens and writes quotes through the service-role client. |
| `NEXT_PUBLIC_APP_URL` | Optional. When set, the OAuth callback redirects there; otherwise it uses the request's own host (the old `localhost:3000` fallback once sent a successful staging connection to a dead page). |

`easyparcelConfigured()` in `config.ts` is true only when the three OAuth
variables are all present. Without them the connect route answers 503 and the
settings screen shows "not connected"; nothing else breaks, because Malaysian
zone pricing does not touch EasyParcel.

API hosts are pinned constants in `easyparcel.ts`, on purpose:

- `https://api.easyparcel.com/open_api/2026-06` — versioned in the path, so a
  bump is a conscious decision after reading the changelog.
- `https://api.easyparcel.com/oauth` — login and token.

There is no sandbox switch. Every environment talks to the production host with
whichever account is connected.

---

## 4. Step 2 — Database

All state lives on the single `store_settings` row (`id = 1`), the `shipments`
table, the `shipping_quotes` table, and four columns on `orders`. Migrations,
in the order they apply:

| Migration | Adds |
| --- | --- |
| `20260720094446_catalog.sql` | `product_variants.weight_grams` (couriers price on weight) |
| `20260723051428_shipments.sql` | `shipments` table + `shipment_status` enum |
| `20260723103945_easyparcel_config_and_quotes.sql` | Token, sender-address and `shipping_fallback_enabled` columns on `store_settings`; narrows the public grant so the tokens are unreadable; a first `shipping_quotes` table |
| `20260723105012_drop_shipping_quotes.sql` | Drops that first `shipping_quotes` (the checkout picker was descoped) |
| `20260818060923_free_shipping_threshold_off_at_zero.sql` | Threshold `0` means "no free shipping" |
| `20260818080458_shipping_zones.sql` | `shipping_zone(country, state)` function; `shipping_west_sen`, `shipping_east_sen` |
| `20260818081500_public_settings_zone_rates.sql` | `shop_public_settings()` exposes both zone rates |
| `20260818091134_shipping_quotes.sql` | **The current `shipping_quotes`** + `issue_shipping_quote()`; `orders.shipping_quote_id / shipping_service_id / shipping_service_name / shipping_courier` |
| `20260818091204_price_order_from_quote.sql` | `price_order(…, p_quote_id, p_service_id)` |
| `20260818091229_create_order_from_quote.sql` | `create_order(…, p_quote_id, p_service_id)` |
| `20260818093000_security_audit_hardening.sql` | Revokes INSERT/UPDATE on the token columns from the browser roles too |
| `20260819050000_easyparcel_refresh_expiry.sql` | `store_settings.easyparcel_refresh_expires` |
| `20260826030000_domestic_courier_choice.sql` | `domestic_shipping_mode` (`zone` \| `courier`); `price_order` courier branch for Malaysia; mode in `shop_public_settings()` |
| `20260826040000_domestic_courier_allowlist.sql` | `domestic_allowed_couriers text[]`, default `{J&T}` |
| `20260826050000_international_courier_allowlist.sql` | `international_allowed_couriers text[]`, default `{Ninja, Aramex, UPS, DHL}` |

> Production's migration ledger is stamped differently from these files for
> ten versions. **Never `supabase db push` to production.** The three
> 26 Aug migrations were applied there by hand and the ledger aligned
> afterwards.

### 4.1 `store_settings` — the one merchant account

| Column | Notes |
| --- | --- |
| `easyparcel_enabled` | Staff toggle. Off means "do not quote or book", even with valid tokens. |
| `easyparcel_access_token` | About ten hours. Renewed silently with a five-minute margin. |
| `easyparcel_refresh_token` | About a year. When this lapses the connection is gone until someone clicks Connect. |
| `easyparcel_token_expires` | Access-token expiry. |
| `easyparcel_refresh_expires` | Refresh-token expiry, from `refresh_token_expires_in`. Null for connections made before 19 Aug 2026. The Shipping screen turns red inside the last 30 days. |
| `sender_name`, `sender_phone`, `sender_line1/2`, `sender_city`, `sender_postcode`, `sender_state` | Pickup address. `sender_state` may be a name ("Selangor") or an ISO code; it is mapped through `stateToIso` on every use. **Blank postcode, state or phone makes booking impossible** — both projects had these empty until the client filled them in on 26 Aug. |
| `shipping_fallback_enabled` | Stored and shown in settings, **but nothing in the quote path reads it**. Treat as informational. |
| `domestic_shipping_mode` | `zone` (RM10 / RM15) or `courier` (live pickup rates). Saving `courier` is refused unless EasyParcel is connected with a valid pickup address. |
| `domestic_allowed_couriers` | Names offered to Malaysian shoppers, matched case-insensitively as substrings of `courier_name + service_name`. Empty = every pickup courier. |
| `international_allowed_couriers` | Same rule for overseas. |
| `shipping_west_sen`, `shipping_east_sen` | Zone rates (defaults 1000 and 1500). `flat_shipping_sen` is kept equal to West for older readers. |
| `free_shipping_threshold_sen` | `0` = off. Applies to Malaysia in either mode; never overseas. |

**Grants.** `store_settings` is readable by the storefront (it renders the zone
rates), so the tokens would have been public. The blanket `SELECT` was
replaced with a column list that excludes every `easyparcel_*` column, and the
hardening migration revoked `INSERT`/`UPDATE` on them as well. Only the
service-role client can read or write tokens. `shop_public_settings()` is the
sanctioned public read.

### 4.2 `shipments` — one row per parcel

Courier-agnostic by design: a parcel dropped at a counter and a parcel booked
through EasyParcel are the same row.

| Column | Notes |
| --- | --- |
| `provider` | `manual` until EasyParcel books it, then `easyparcel`. |
| `provider_ref` | EasyParcel's `shipment_number` (`ES-XXXX-XXXXX`). **The webhook's join key.** Unique per provider. |
| `courier` | A code from `src/lib/couriers.ts` for manual parcels; EasyParcel's courier name for booked ones. |
| `tracking_no`, `tracking_url`, `label_url` | AWB number, EasyParcel's tracking page, the label PDF (A4 preferred). |
| `status` | `pending → booked → in_transit → delivered`, plus `returned`, `cancelled`. |
| `weight_grams`, `cost_sen` | What was booked and what the wallet was debited. |
| `shipped_at`, `delivered_at` | Set on booking / on the delivered push. |

RLS: a customer can read shipments on their own orders; staff manage all.

### 4.3 `shipping_quotes` — the price the browser never sees

```sql
create table shipping_quotes (
  id         uuid primary key default gen_random_uuid(),   -- the quote_id
  options    jsonb not null,  -- [{ service_id, service_name, courier, amount_sen, delivery_duration }]
  inputs     jsonb not null,  -- country, postcode, subdivision, weight_grams, parcel_value_rm
  created_at timestamptz not null default now(),
  expires_at timestamptz not null                           -- issued + 30 min
);
```

RLS is on with **no policies** and all grants are revoked, so only the service
role can touch it. `issue_shipping_quote(p_options, p_inputs, p_ttl_minutes)`
inserts a row, returns its id, and on the way through deletes rows that
expired more than a day ago (the only garbage collection there is).

`orders` records `shipping_quote_id`, `shipping_service_id`, and the
`shipping_service_name` / `shipping_courier` **copied from the frozen quote**,
never from the form, so an order cannot be mislabelled by whoever posted it.

---

## 5. Step 3 — The API client (`easyparcel.ts`)

`EasyParcelClient` takes an access token and exposes one method per endpoint.
The private `request()` helper adds the bearer header, disables caching, turns
a network failure into `EasyParcelError("EasyParcel unreachable: …")`, turns a
**401 into `EasyParcelTokenError`** (so callers can say "reconnect" rather than
"failed"), and any other non-2xx into `EasyParcelError` with the status and
body attached.

Rules the whole client follows:

- **Money becomes integer sen immediately.** EasyParcel returns ringgit as
  decimal strings; `toSen()` rounds them on arrival so a float never reaches
  order maths.
- **A 200 is not success.** Booking and cancellation carry a per-row `status`
  inside the envelope. Both methods check it and throw with the row's message.
- **Unknown shapes become null, not strings.** `formatDuration` accepts a
  sentence, an object `{type, value|min|max}`, or that object serialised as a
  string (FedEx), and returns words or null.

| Method | Endpoint | What it does |
| --- | --- | --- |
| `getQuotations(input)` | `POST /shipment/quotations` | Sends one `shipment[]` entry (sender/receiver postcode + `subdivision_code` + country, weight kg, dimensions cm, parcel value RM). Parses `data[].quotations[]` → `courier{service_id, service_name, courier_name, delivery_duration, service_tag[], is_pickup, is_dropoff}`, `pricing.total_amount`, `features[].cod`. Drops non-MYR and zero-priced rows. Sorts cheapest first. |
| `submitOrder(input)` | `POST /shipment/submit_orders` | One parcel per call. Body carries `reference` (our order reference), `service_id`, `collection_date` (defaults to today in Kuala Lumpur), weight, dimensions, a single `item[]` contents line, sender and receiver parties, and `feature.email_tracking` (only when the receiver has an email) plus optional COD. Reads `data[0].shipments[0]`; throws unless its `status` is `success`. Returns `shipment_number`, AWB (usually null this early), label URL (`awb_url` or `awb_urls_by_format.A4/A6/A5`), tracking URL, courier, and `pricing_breakdown.total_paid_amount`. |
| `getShipmentDetails(no)` | `POST /shipment/details` | Second half of AWB generation. Returns `awb_number`, `awb_url`, `tracking_url`, `shipment_status` from `data[0].shipment_details`. |
| `cancelOrder(no, remark)` | `POST /shipment/cancel` | `cancel_list: [{shipment_number, remark}]`. Throws if the row's status is not `success`. |
| `getWalletBalanceSen()` | `GET /wallet` | `data.wallet[]` is per currency; picks MYR. `free_credit_wallet` is deliberately excluded — it spends under its own rules. |
| `getTracking(awb)` | `POST /shipment/tracking_status` | `awb_numbers: [awb]` → `data.results[].status_log[]`. Present for completeness; the webhook is the live path. |

**Phone numbers.** EasyParcel wants the dialling country and the subscriber
number in separate fields with no trunk zero and no `+`. `phoneParts()` takes
the country from the **address**, strips `+`/`00` and the dial code only from
numbers that announced themselves as international, then drops a leading zero.
A Singapore landline starting with `65` is therefore left alone.

**Parcel size.** `parcelSizeFor(weightGrams)` in `countries.ts` picks one of
three tiers (25×5×20 up to 500 g, 35×10×25 up to 1.5 kg, 40×20×30 up to 3 kg,
else 45×30×35). The same tier is sent at quote time and at booking time so
the two never price a different box.

**Weight.** Sum of `product_variants.weight_grams × qty`. A variant with no
weight counts as 500 g, and the whole parcel is floored at 0.5 kg. Two
catalogue variants were still 0 g at the last check (Tiaraa Top, one Maya
Caftan variant).

---

## 6. Step 4 — Token storage and lifecycle (`config.ts`)

`getValidAccessToken()` is the **only** sanctioned way to get a token, and
`easyparcelClient()` is the only sanctioned way to build a client:

1. Read the three token columns from `store_settings` with the service role.
2. No access or refresh token → throw `EasyParcelTokenError` ("not connected").
3. If `easyparcel_token_expires − 5 min > now`, return the stored token.
4. Otherwise `POST /oauth/token` with `grant_type=refresh_token`, persist the
   new pair, and return the new access token.

Two rules in `exchange()` came from real incidents:

- **A rotated refresh token is an update, not a requirement.** EasyParcel
  returns a new refresh token only "depends if requested". The first version
  threw when one was absent, which would have killed a healthy connection at
  its first renewal. Now the refresh token that just worked is kept unless the
  response carries a new one. The *initial* code exchange still requires one.
- **`deriveExpiresAt` throws on an unparseable expiry** rather than storing
  `Invalid Date`, and `easyparcel_refresh_expires` is only overwritten when
  the response actually restates `refresh_token_expires_in`.

`disconnect()` nulls all five token/expiry columns and sets
`easyparcel_enabled = false`.

### 6.1 Daily proof the connection works

Renewal only happens when something asks for a token. In `zone` mode nothing
does for Malaysian orders, so a broken renewal could go unnoticed for weeks
until an overseas shopper hit it. `checkConnection()` therefore runs once a
day from the order-expiry cron (`vercel.json`: `/api/orders/expire` at
04:00 UTC; the Hobby plan allows two crons and both are taken):

1. Not configured, disabled or not connected → `not-connected` (a valid
   state, **not** a failure).
2. Read `easyparcel_token_expires`, call `easyparcelClient()` then
   `getWalletBalanceSen()` — the cheapest authenticated endpoint.
3. Compare the expiry before and after to report whether a real renewal ran.
   Because the access token lives ~10 h and the check runs every 24 h, it
   nearly always exercises the fragile step.
4. On failure only, write `admin_audit_log` action
   `shipping.connection_check_failed` with the upstream message. A daily "still
   fine" row would bury the log.

The check can never fail the sweep it rides on; its result is a field in the
cron's JSON body.

---

## 7. Step 5 — Connecting the account (OAuth)

```
Staff clicks "Connect EasyParcel" on /admin/shipping
   │
   ▼
GET /api/shipping/connect                         [staff session required, else 403]
   │  503 if the three OAuth env vars are missing
   │  state = 24 random bytes (hex)
   │  cookie ep_oauth_state (httpOnly, SameSite=Lax, 10 min)
   ▼
302 → https://api.easyparcel.com/oauth/login?client_id&redirect_uri&response_type=code&state
   │  staff signs into EasyParcel and approves
   ▼
GET /api/shipping/callback?code&state
   │  1. staff session re-checked                 else 403
   │  2. ?error= from EasyParcel                  → back to /admin/shipping?error=…
   │  3. cookie state === query state (constant-time, length-checked; cookie deleted first)
   │  4. POST /oauth/token  grant_type=authorization_code  (Basic client_id:secret)
   │  5. UPDATE store_settings SET tokens, expiries, easyparcel_enabled = true
   ▼
302 → /admin/shipping?connected=EasyParcel connected.
```

Two invariants, both load-bearing:

1. **`state` carries no identity.** It proves only that the round trip began
   in this browser. The reference integration once put a user id in `state`,
   which let an attacker attach their own merchant account to someone else's
   store and receive every shipment with the customers' addresses.
2. **Identity is the staff session**, checked in both routes. An anonymous
   caller cannot start the flow or finish it.

Both routes are on the `OPEN_DURING_MAINTENANCE` list in
`src/lib/maintenance.ts`, along with the webhook, so a closed shop can still
be reconnected and still receive status pushes.

---

## 8. Step 6 — Admin › Shipping settings

`/admin/shipping` renders `ShippingSettingsForm` from `getSenderSettings()`.
Two server actions save it, each with an audit entry:

**`saveShippingPricing`** — what the customer pays.

- Mode: **Flat zone rates** (Semenanjung / Sabah & Sarawak, RM) or **Courier
  the customer picks** (needs EasyParcel connected; the save is refused
  otherwise so a checkout can never be left unable to price itself).
- Free-shipping threshold in RM; `0` turns it off.
- Domestic and international courier allowlists, comma-separated, up to 20
  names each. Blank = all pickup couriers.
- Revalidates the storefront, because the checkout renders these figures.

**`saveSenderSettings`** — the pickup address and the `easyparcel_enabled`
toggle. Enabling requires a postcode and a state that `stateToIso` recognises.

Also on this screen: connection status chip, the **lapse date** (red inside
30 days; "unknown" for pre-19 Aug connections), a Disconnect button
(`disconnectEasyparcel`), and a wallet balance read (`getEasyparcelWallet`).

---

## 9. Step 7 — Checkout: quoting and charging

### 9.1 Who gets a courier list

`shipping_zone(country, state)` in the database classifies every address as
`west`, `east` (Sabah, Sarawak, **Labuan**) or `overseas`. Then:

| Destination | `domestic_shipping_mode = zone` | `domestic_shipping_mode = courier` |
| --- | --- | --- |
| West Malaysia | `shipping_west_sen`, no EasyParcel call | live pickup rates, shopper picks |
| East Malaysia | `shipping_east_sen`, no EasyParcel call | live pickup rates, shopper picks |
| Overseas (curated list in `countries.ts`) | live pickup rates, shopper picks | same |

A free-shipping discount code wins everywhere. The spend threshold, when on,
wins for Malaysia in either mode. The checkout learns the mode from
`shop_public_settings()` via `getShippingPricing()` in `cms.ts`.

### 9.2 Getting the list (`quoteShippingOptions` → `quoteForCart`)

In `CheckoutForm.tsx` the list appears **automatically** once the address is
quotable — Malaysia: a 5-digit postcode and a state from the list; overseas: a
postcode of at least 3 characters and a city — debounced 600 ms and re-run
whenever the postcode, state, country or cart changes. Changing the country
clears the previous quote, options and the state field (a leftover "Selangor"
on a Singapore address is what gets printed on the label). A fresh quote
always clears the previous selection. With exactly one option it is
pre-selected so the total is final at once.

The server action `quoteShippingOptions(cart, address)`:

1. Rate-limits to 20 calls a minute per caller (the endpoint is anonymous and
   each call spends the shop's API quota).
2. Refuses Malaysia unless the mode is `courier`; refuses unknown countries and
   blank postcodes.
3. Resolves the cart to variants and calls `quoteForCart` with the **goods
   subtotal** as the declared parcel value (not the total, which would include
   the delivery being quoted).
4. Returns `{ quoteId, options[] }` where each option is `serviceId`, a label
   with EasyParcel's "(From Door to Door)" suffix stripped, courier, amount in
   sen and a transit-time string or null. **Never a price the client can send
   back.**

`quoteForCart` in `rates.ts`:

1. `connectionProblem(cfg)` — disabled, not connected, no pickup address, or
   an unrecognised pickup state → the shopper sees one generic sentence
   ("We can't quote delivery to that address right now.") and the real reason
   is logged and written to the audit log (see 9.4).
2. Maps a Malaysian state to ISO 3166-2 (`Selangor → MY-10`); overseas sends
   the subdivision as typed. An unrecognised Malaysian state is refused rather
   than sent, because a wrong code silently prices the wrong lane.
3. Weighs the cart, calls `getQuotations`.
4. Filters: **pickup services only** (the shop never drops parcels at a
   counter), no service whose name carries a parcel minimum ("min 3
   parcel(s)"), and the destination's allowlist.
5. Freezes the survivors with `issue_shipping_quote` (30-minute TTL). **If the
   insert fails the rates are not returned** — offering an option the server
   could not price later is a worse failure than none.

### 9.3 Charging the frozen price (`placeOrder` → `create_order` → `price_order`)

The form submits `quoteId` and `serviceId`. `placeOrder` refuses a
courier-priced order without both, with a sentence a shopper can act on.
`create_order` passes them to `price_order`, which does:

```sql
select (opt->>'amount_sen')::integer, opt->>'service_name', opt->>'courier'
  from shipping_quotes q, lateral jsonb_array_elements(q.options) opt
 where q.id = p_quote_id
   and q.expires_at > now()
   and opt->>'service_id' = p_service_id
```

Found → that amount is the shipping charge and the name/courier are stored on
the order. Not found (unknown id, expired, or a service that was never in the
quote) → `requires_shipping_selection = true` with shipping at **zero, meaning
"not known yet", never "free"**, and `create_order` raises "Choose a delivery
service before placing this order." One refusal path for every bad input.

Both functions are `security definer`, executable only by `service_role`.

### 9.4 When quoting fails, staff can see why

`recordQuoteFailure` writes `admin_audit_log` action
`shipping.cart_quote_failed` with the upstream message and the inputs,
throttled to one row per distinct reason per 15 minutes. It exists because on
20 Aug 2026 EasyParcel's API answered every endpoint with 404 and the only
evidence in the shop was the one row the daily check happened to write. The
write is wrapped so it can never itself fail a quote.

---

## 10. Step 8 — Booking from the admin

All of this lives in `src/app/admin/actions.ts` and is driven by
`ShipmentPanel.tsx` on `/admin/orders/[reference]`. Every action starts with
`assertStaff()` and ends with an audit entry.

### 10.1 One-click parcel — `createPendingParcel(reference)`

Booking needs a `pending` shipments row to claim. The general Add-parcel form
defaults to `booked` (it exists for counter-dropped parcels with a consignment
number in hand), so an order with no parcel shows **Book with EasyParcel**
directly: it inserts `{ provider: 'manual', status: 'pending', weight_grams }`
and opens the picker.

### 10.2 Rates for staff — `fetchCourierRates` → `getRatesForOrder`

Same client, same filters as checkout (pickup only, no parcel minimum,
allowlist for the destination), but **nothing is frozen**: what the courier
costs is Kalima's cost from the wallet, and staff are trusted. Uses the order's
stored address, weight and `total_sen` as parcel value. The picker states the
figures are Kalima's own cost, lists them cheapest first, pre-selects the
service the customer paid for (chip "Customer's choice"), and warns if that
service is no longer offered for the parcel.

### 10.3 `bookShipment({ reference, shipmentId, serviceId, collectionDate? })`

This debits real money, so it is ordered carefully:

1. Load the order, config and live rates; the chosen `serviceId` must still be
   in the list ("no longer available — refresh the rates").
2. **Wallet pre-check** — `GET /wallet`; if the balance is below the rate,
   return "EasyParcel wallet is short — balance X, this booking costs Y. Top
   up and try again." A wallet *read* failure does not block the booking.
3. **Claim the row** — `update shipments set status='booked',
   provider='easyparcel' where id = ? and status = 'pending'`. If no row comes
   back, another request already has it: "This parcel is already booked or is
   being booked right now." This is what stops a double click debiting the
   wallet twice.
4. `submitOrder` with `senderFrom(cfg)`, `receiverFrom(address, order phone,
   order email)` (the receiver's **country travels** — omitting it once booked
   an overseas parcel as domestic), the same weight and parcel tier the rate
   was quoted for, the order total as declared value, and the item names as
   the contents line.
5. **AWB poll** — most couriers issue the AWB seconds after booking. Up to three
   `getShipmentDetails` calls four seconds apart, stopping once both the AWB
   and the label are present. A failed read never undoes the booking.
6. Write back `provider_ref`, courier, `tracking_no`, `tracking_url`,
   `label_url`, `cost_sen` (what EasyParcel actually took, else the quoted
   amount), weight, `status='booked'`, `shipped_at`.
7. A `paid` order becomes `fulfilled`.
8. Fire the **"Parcel on its way"** WhatsApp automation (`order_shipped`),
   which claims once per order and event so later pushes cannot re-send.
9. Audit `shipment.booked` with the courier, AWB and cost.

Any throw after the claim releases it (`status='pending', provider='manual'`)
and returns the upstream message, so the parcel can be retried.

### 10.4 `refreshShipmentAwb` — the "Fetch AWB" button

For a booked parcel with no AWB yet: one `getShipmentDetails` call, writes only
the fields that were issued (never blanks a column a later read came back
without), and says "not issued yet — try again in a minute" otherwise. Free
and idempotent. The AWB-update webhook writes the same columns unprompted.

### 10.5 `cancelEasyparcelBooking` — before the courier collects

Allowed on `booked` or `in_transit` EasyParcel parcels. Calls
`POST /shipment/cancel`; on success the row is **kept** and marked
`cancelled` (deleting it would erase the shipment number the wallet credit
refers to), `shipped_at` is cleared, and a `fulfilled` order with no other
live parcel goes back to `paid`. EasyParcel credits the wallet once the courier
confirms. Two clicks in the UI, no `confirm()` dialog.

This is also how a real booking is tested without a parcel leaving: book,
watch the AWB and label arrive, cancel.

---

## 11. Step 9 — The tracking webhook (`POST /api/shipping/webhook`)

EasyParcel publishes no HMAC scheme, so the endpoint uses a shared secret.

**Authentication**

- `EASYPARCEL_WEBHOOK_SECRET` unset → **503 for every request** (fails closed).
- Secret presented in `x-webhook-secret` or `x-easyparcel-secret`. A `?secret=`
  query fallback was removed because it put the secret in access logs and
  Referers. If EasyParcel's dashboard cannot send a header, the answer is a
  long random path segment, not a query string.
- Constant-time compare after a length check (`timingSafeEqual` throws on
  mismatched lengths). Wrong or missing → 401.

**Processing**

1. Read `shipment_number` (2026-06 payloads; older `shipment_id` /
   `order_number` shapes still accepted), `awb_number`, `awb_url`,
   `tracking_url`, `shipment_status` text and `shipment_status_code`.
2. Join `shipments` on `provider = 'easyparcel'` and `provider_ref`. Unknown →
   200 with a note.
3. Map the status. The **numeric code outranks the prose** because courier
   wording varies (`0 cancelled, 2/7 booked, 3/4/11 in_transit, 5 delivered,
   6 returned`; code 8 "On Hold" is deliberately unmapped). Fallback text map
   covers `collected`, `drop off`, `delivery in transit`, `completed`, etc.
   **An unmapped status is ignored, not written through.**
4. Patch only what arrived: status, AWB, label URL, tracking URL,
   `delivered_at`.
5. `booked` / `in_transit` / `delivered` → WhatsApp `order_shipped`;
   `delivered` additionally → `order_delivered`. Both are once-per-order.
6. `delivered` → order `completed`, **only if it is `paid` or `fulfilled`** (a
   refunded or cancelled order is never promoted), and loyalty points are
   awarded only for an order this push actually completed.

**Response discipline.** Always 200 once authenticated, even on an unknown
shipment or a thrown error, so EasyParcel stops retrying. Failures are logged,
not surfaced — watch the function logs, not the status code.

**Verified** on 23 Jul 2026 with synthetic pushes: no-secret, wrong-secret and
same-length-wrong-secret all 401; a push sequence rewrote the AWB, ignored an
unknown status, and moved `paid → completed` on delivery while leaving a
refunded order refunded. **Not yet verified with a real courier push** — see
§0.

---

## 12. Step 10 — What the customer sees

- **Checkout:** the courier list with courier name, cleaned service label,
  transit time when EasyParcel gives one, and the price. Place order is
  blocked until one is chosen when the order is courier-priced.
- **Order history (`/account`):** courier name and a tracking link.
  `trackingLink(courier, trackingNo, explicitUrl)` in `couriers.ts` uses
  EasyParcel's `tracking_url` when the booking returned one, otherwise a
  per-courier URL template with the consignment number substituted.
- **WhatsApp:** "Parcel on its way" on booking or the first in-transit push,
  "Delivered" on the delivered push, each only if that automation is switched
  on in Admin › Inbox and has an approved template.

---

## 13. Verification record

| Date | Environment | What was proven |
| --- | --- | --- |
| 23 Jul 2026 | local DB | Frozen quote returned 1450 sen on a valid pick; expired quote unusable; forged `service_id` matched nothing. The commit also reports 12 state-mapping unit tests passing, but no test file or runner is in the tree today. |
| 23 Jul 2026 | local | Webhook auth and status sequence (see §11). |
| 18 Aug 2026 | staging | Selangor RM10 / Sarawak RM15 live in the checkout as the state changes; overseas refused without a service, accepted at the passed amount. |
| 26 Aug 2026 | staging | Selangor address → J&T Express (Pick Up) RM6.49 auto-selected under the `{J&T}` allowlist. Order KLM-10272-31F69A placed with Best Express RM6.53 frozen and charged. |
| 26 Aug 2026 | staging, **real API** | KLM-10272 booked with J&T (Pick Up): ref `ES-2608-6CYA6`, AWB `632143239945`, A6 label URL within the booking poll, RM6.04 debited, order → fulfilled. Cancelled from the order page: parcel `cancelled`, order → paid, wallet credit pending courier confirmation. Audit log: created → booked → cancelled. |
| 26 Aug 2026 | production | Migrations `20260826030000/040000/050000` applied by hand; deployed; left in `zone` mode. |

---

## 14. Failure modes and where to look

| Symptom | Likely cause | Where to look |
| --- | --- | --- |
| Checkout says "We can't quote delivery to that address right now." | Not connected, disabled, pickup address missing, refresh token dead, or EasyParcel down | `admin_audit_log` action `shipping.cart_quote_failed` (one row per reason per 15 min) carries the upstream message |
| Courier list is empty but no error | Every service was filtered out — non-pickup, parcel minimum, or the allowlist matched nothing for that destination | Widen `domestic_allowed_couriers` / `international_allowed_couriers` in Admin › Shipping |
| Wrong price for an East Malaysian address | State typed in a way `states.ts` does not map, or Labuan filed as West | `stateToIso`, `shipping_zone()` |
| "Choose a delivery service before placing this order." | Quote older than 30 minutes, or the cart/address changed after the quote | The form re-quotes automatically; the shopper picks again |
| Booking: "wallet is short" | Real. Top up on easyparcel.com. | `getEasyparcelWallet` on the settings screen |
| Booking: "already booked or is being booked right now" | The claim lost a race, or a previous attempt threw *before* release ran | `shipments.status`; set back to `pending` by hand if it is stuck |
| Booking succeeded but no AWB/label | Courier has not issued it yet | "Fetch AWB" button; the `shipment.awb.update` push writes it too |
| Statuses never move past `booked` | Webhook URL not registered with EasyParcel, secret mismatch (401), or secret unset (503) | Function logs for the webhook route; EasyParcel dashboard |
| Shipping screen shows the connection lapses soon, or has lapsed | Refresh token (~1 year) is ending | Click Connect again; the new date is recorded |
| Cron body shows `shipping.status = "failed"` | Renewal failed or the API is down | `admin_audit_log` action `shipping.connection_check_failed` |
| Everything 404s at once | EasyParcel outage (happened 20 Aug 2026) | Switch Malaysia to `zone` mode in Admin › Shipping so local sales continue |

---

## 15. Adding a new EasyParcel capability

1. Read the endpoint in the published spec first. Add a method to
   `EasyParcelClient` using `request()`, convert money with `toSen`, and check
   the per-row `status` inside the 200.
2. Get a client only through `easyparcelClient()`. Never construct one from a
   raw token.
3. Public path (checkout) → rate-limit it, keep the customer message generic,
   write the real reason with `recordQuoteFailure`, and **never accept a price
   from the browser** — freeze it in `shipping_quotes` and charge by id.
4. Staff path → `assertStaff()`, an audit entry, and a claim-before-call if it
   spends money.
5. Inbound from EasyParcel → shared-secret check that fails closed, and 200 on
   every authenticated request.
6. New columns → a migration under `supabase/migrations/`, applied to staging
   with the CLI and to **production by hand**.
7. Keep Malaysian zone pricing independent of EasyParcel. It is the fallback
   when the API goes dark.

---

## 16. Setup checklist (fresh environment)

1. Register the OAuth app with EasyParcel; set `EASYPARCEL_CLIENT_ID`,
   `EASYPARCEL_CLIENT_SECRET`, `EASYPARCEL_REDIRECT_URI`
   (`https://www.kalima.my/api/shipping/callback` on production, `www` not apex).
2. Generate a long random `EASYPARCEL_WEBHOOK_SECRET`; register
   `https://www.kalima.my/api/shipping/webhook` with EasyParcel carrying it in
   the `x-webhook-secret` header.
3. Set `CRON_SECRET` so the daily connection check runs.
4. Apply the migrations in §4 (staging via CLI; production by hand).
5. In Admin › Shipping: **Connect EasyParcel**, fill in the full pickup
   address including phone, turn EasyParcel on, save.
6. Choose the Malaysian mode (`zone` until you want the courier picker), set
   the zone rates, and set the courier allowlists.
7. Fill in `weight_grams` on every variant; unmeasured ones quote at 500 g.
8. Top up the EasyParcel wallet.
9. Book one order, watch the AWB and label arrive, and cancel it if no parcel
   is really leaving. Then, on the first genuine parcel, watch the webhook
   move it to `delivered` and the order to `completed`.

---

## 17. Open items

- [ ] Confirm the webhook URL and secret are registered in the EasyParcel
      dashboard, then watch the first real parcel's pushes reach `delivered`
      → `completed`.
- [ ] Flip production to `courier` mode when the client wants it (Admin ›
      Shipping; the save is refused until EasyParcel is connected there).
- [ ] Fill the two remaining 0 g catalogue weights (Tiaraa Top, one Maya
      Caftan variant).
- [ ] `shipping_fallback_enabled` is stored and shown but read by nothing;
      either wire it or remove it from the settings screen.
- [ ] Not built: bulk booking, per-courier hide list, an owner notification
      when the daily check fails (it only writes the audit log), and a
      third cron slot so the connection check need not lodge in the
      order-expiry route.
