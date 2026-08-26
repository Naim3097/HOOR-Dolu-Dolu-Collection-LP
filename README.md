# HOOR — Batik Dolu-Dolu campaign storefront

Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · Supabase · LeanX.io · Vercel.

See **[PROJECT.md](PROJECT.md)** for the full guide (stack → deployment, §10 for the migration status), **[HANDOVER.md](HANDOVER.md)** for business assumptions (⚑), **[ASSETS.md](ASSETS.md)** for the photo audit.

## Run

```bash
cp .env.example .env.local   # fill in Supabase + LeanX keys
npm install
npm run dev                  # http://localhost:3000
```

## Supabase

Run `supabase/migrations/*.sql` in order against your project (SQL editor or `supabase db push`).

## Layout

| Path | What |
|---|---|
| `app/` | routes: landing, `/checkout/return`, `/api/orders`, `/api/webhooks/leanx` |
| `components/` | page sections; `components/ui/` is shadcn |
| `lib/products.ts` | products, prices, copy — edit here |
| `lib/leanx.ts`, `lib/supabase/` | integrations (server-only where it matters) |
| `supabase/migrations/` | schema, RLS, stock RPCs, seed |
| `public/assets/` | optimised images, video, fonts, brand |
| `landing/`, `tools/`, `.claude/server.js` | **legacy static site** — kept for reference until parity; not deployed |
