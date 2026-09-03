# HOOR — Batik Dolu-Dolu campaign storefront

Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · Supabase · Billplz · Vercel.

See **[PROJECT.md](PROJECT.md)** for the full guide (stack → deployment, §10 for the migration status), **[HANDOVER.md](HANDOVER.md)** for business assumptions (⚑), **[ASSETS.md](ASSETS.md)** for the photo audit.

## Run

```bash
cp .env.example .env.local   # fill in Supabase + Billplz keys
npm install
npm run dev                  # http://localhost:3000
```

## Supabase

Run `supabase/migrations/*.sql` in order against your project (SQL editor or `supabase db push`).

## Layout

| Path | What |
|---|---|
| `app/` | routes: landing, `/checkout/return`, `/api/orders`, `/api/webhooks/billplz` |
| `components/hoor/` | page sections, drawers, checkout — React on the original `app/hoor.css` classes (design parity with the live site) |
| `components/ui/` | shadcn (installed, for new non-campaign UI) |
| `lib/products.ts` | products, prices, copy — edit here |
| `lib/billplz.ts`, `lib/settle.ts`, `lib/supabase/` | integrations (server-only where it matters) |
| `supabase/migrations/` | schema, RLS, stock RPCs, seed |
| `public/assets/` | optimised images, video, fonts, brand |
| `landing/`, `tools/`, `.claude/server.js` | **legacy static site** — kept for reference until parity; not deployed |

## Media

Images and video are not bundled with the app and never go through Vercel image optimisation. The Supabase `assets` bucket is the working copy. The original masters were removed from the repo on 3 Sep 2026 to keep it light; they are still in git history (`git checkout 94235fc -- assets` restores them) and `media/manifest.json` maps each to its output name and widths.

```bash
npm run media:build            # sharp + ffmpeg → media/dist (WebP renders, WebM + MP4 films, posters) and lib/lqip.json
npm run media:upload           # → the public "assets" bucket of the project in .env.local (creates it if missing)
npm run media:build -- images  # images only; `-- videos` for films only
npm run media:upload -- img    # one folder only
```

The app builds every media URL from `NEXT_PUBLIC_SUPABASE_URL` (see `lib/assets.ts`), so each environment serves media from its own project. To publish to production, run the upload once with that project's URL and service role key:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://mnxvffifdvcuuuqbtmqy.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run media:upload
```

Adding a photo: restore or create `assets/`, drop the original in, add a line to `media/manifest.json`, run build and upload, then reference it by output name in `lib/products.ts`. Do not commit `assets/`.

## Back office

`/admin` is HOOR's back office, gated by `proxy.ts` on a Supabase Auth session. Every auth user is staff; the first one created becomes the owner. Create the first login in the Supabase dashboard (Authentication → Users → Add user), then sign in at `/admin/login`. The owner adds further staff under **Staff**, which hands out a one-time password.

| Section | What it does |
|---|---|
| Dashboard | Sales today, orders, average order value, orders waiting to be packed, 14-day sales, top pieces |
| Orders | List with status filters and search; detail with status workflow, refunds, parcels, notes, history; packing slips |
| Products | Pieces, colours, photos (uploaded straight to the media bucket as WebP renders) and ledger-tracked stock |
| Customers | Built from orders, grouped by email |
| Discounts | Percent, fixed and free-delivery codes, applied at checkout |
| Shipping | Delivery charges, EasyParcel connection and wallet, pickup address |
| Settings | Store contact details, delivery charges, returns window (read live by the storefront) |
| Staff, Audit log | Logins and roles; every change, by whom, when |

Money is stored as integer sen. Stock only changes through the ledger (`stock_movements`): checkout reservations, releases, returns, restocks and corrections all leave a row with a reason. Pending orders unpaid after 24 hours are released by the `/api/orders/expire` cron.

Customer emails (order confirmed, shipped, refunded) go through Resend, provisioned from the Vercel Marketplace. EasyParcel booking needs an Open API OAuth app; without it, parcels are added by hand and still trigger the shipped email.
