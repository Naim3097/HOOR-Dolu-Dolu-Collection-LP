-- HOOR Batik Dolu-Dolu — schema, RLS, stock RPCs
create table if not exists variants (
  sku          text primary key,           -- PRODUCT:COLOURWAY:SIZE
  product_id   text not null,
  colourway_id text not null,
  size         text not null,
  stock        int  not null default 0 check (stock >= 0),
  updated_at   timestamptz not null default now()
);

create table if not exists orders (
  ref          text primary key,
  status       text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
  customer     jsonb not null,
  delivery     jsonb not null,
  attribution  jsonb not null default '{}',
  subtotal     numeric(10,2) not null,
  shipping     numeric(10,2) not null,
  total        numeric(10,2) not null,
  currency     text not null default 'MYR',
  payment_ref  text,
  paid_at      timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists order_items (
  id           bigserial primary key,
  order_ref    text not null references orders(ref) on delete cascade,
  sku          text not null references variants(sku),
  product_id   text not null,
  colourway_id text not null,
  size         text not null,
  qty          int  not null check (qty > 0),
  unit_price   numeric(10,2) not null
);
create index if not exists order_items_order_ref on order_items(order_ref);

-- RLS: public may read stock only; everything else is service-role.
alter table variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
create policy "public read stock" on variants for select using (true);

-- Atomic stock reservation. p_items: [{"sku":"...","qty":1}, ...]
create or replace function reserve_stock(p_items jsonb) returns void
language plpgsql security definer as $$
declare r record;
begin
  for r in select (e->>'sku') as sku, (e->>'qty')::int as qty from jsonb_array_elements(p_items) e loop
    update variants set stock = stock - r.qty, updated_at = now()
      where sku = r.sku and stock >= r.qty;
    if not found then raise exception 'insufficient stock for %', r.sku; end if;
  end loop;
end $$;

create or replace function release_stock(p_order_ref text) returns void
language plpgsql security definer as $$
begin
  update variants v set stock = v.stock + oi.qty, updated_at = now()
    from order_items oi where oi.order_ref = p_order_ref and oi.sku = v.sku;
end $$;

revoke all on function reserve_stock(jsonb) from public, anon, authenticated;
revoke all on function release_stock(text) from public, anon, authenticated;
