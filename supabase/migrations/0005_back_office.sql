-- Back office foundation: money in sen, a real order lifecycle, payments and
-- shipments as their own records, a stock ledger, settings, staff and audit.

-- ---------- money: integer sen, never floats ------------------------------
alter table orders
  add column if not exists subtotal_sen  integer,
  add column if not exists discount_sen  integer not null default 0 check (discount_sen >= 0),
  add column if not exists shipping_sen  integer,
  add column if not exists total_sen     integer,
  add column if not exists discount_code text,
  add column if not exists admin_notes   text,
  add column if not exists fulfilled_at  timestamptz,
  add column if not exists completed_at  timestamptz,
  add column if not exists cancelled_at  timestamptz,
  add column if not exists refunded_at   timestamptz,
  add column if not exists refund_sen    integer not null default 0 check (refund_sen >= 0),
  add column if not exists updated_at    timestamptz not null default now();

update orders set
  subtotal_sen = round(subtotal * 100)::integer,
  shipping_sen = round(shipping * 100)::integer,
  total_sen    = round(total * 100)::integer
 where subtotal_sen is null;

alter table orders
  alter column subtotal_sen set not null,
  alter column shipping_sen set not null,
  alter column total_sen    set not null,
  drop column subtotal, drop column shipping, drop column total;

alter table orders add constraint orders_money_nonneg
  check (subtotal_sen >= 0 and shipping_sen >= 0 and total_sen >= 0);

alter table order_items add column if not exists unit_price_sen integer;
update order_items set unit_price_sen = round(unit_price * 100)::integer where unit_price_sen is null;
alter table order_items alter column unit_price_sen set not null, drop column unit_price;

-- ---------- order lifecycle ---------------------------------------------------
-- pending → paid → fulfilled → completed; any of paid/fulfilled/completed → refunded;
-- pending → cancelled | failed. Enforced in the app (lib/orders-admin.ts), listed here.
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending','paid','fulfilled','completed','cancelled','refunded','failed'));
create index if not exists orders_status_created on orders (status, created_at desc);
create index if not exists orders_created on orders (created_at desc);

-- ---------- payments: one row per attempt, raw webhook kept -------------------
create table if not exists payments (
  id           bigserial primary key,
  order_ref    text not null references orders(ref) on delete cascade,
  provider     text not null,                  -- 'billplz'
  provider_ref text,                           -- bill id
  status       text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  amount_sen   integer not null check (amount_sen >= 0),
  paid_at      timestamptz,
  raw          jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists payments_order on payments (order_ref);
create index if not exists payments_provider_ref on payments (provider, provider_ref);

-- ---------- shipments ------------------------------------------------------
create table if not exists shipments (
  id           bigserial primary key,
  order_ref    text not null references orders(ref) on delete cascade,
  provider     text not null default 'manual',  -- 'manual' | 'easyparcel'
  provider_ref text,
  courier      text,
  tracking_no  text,
  tracking_url text,
  label_url    text,
  status       text not null default 'pending' check (status in ('pending','booked','shipped','delivered','cancelled')),
  weight_grams integer not null default 0 check (weight_grams >= 0),
  cost_sen     integer not null default 0 check (cost_sen >= 0),
  notes        text,
  shipped_at   timestamptz,
  delivered_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists shipments_order on shipments (order_ref);

-- ---------- stock ledger ---------------------------------------------------
-- variants.stock stays the fast "on hand" number; every change to it is a row here.
create table if not exists stock_movements (
  id         bigserial primary key,
  sku        text not null references variants(sku) on delete cascade,
  type       text not null check (type in ('sale','release','return','adjustment','restock','import')),
  qty_delta  integer not null,                  -- negative = out
  order_ref  text references orders(ref) on delete set null,
  reason     text,
  actor      text,                              -- staff email, 'system', 'webhook'
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_sku on stock_movements (sku, created_at desc);

create or replace function reserve_stock(p_items jsonb, p_order_ref text default null) returns void
language plpgsql security definer as $$
declare r record;
begin
  for r in select (e->>'sku') as sku, (e->>'qty')::int as qty from jsonb_array_elements(p_items) e loop
    update variants set stock = stock - r.qty, updated_at = now()
      where sku = r.sku and stock >= r.qty;
    if not found then raise exception 'insufficient stock for %', r.sku; end if;
    insert into stock_movements (sku, type, qty_delta, order_ref, reason, actor)
      values (r.sku, 'sale', -r.qty, p_order_ref, 'reserved at checkout', 'system');
  end loop;
end $$;

create or replace function release_stock(p_order_ref text, p_type text default 'release', p_actor text default 'system') returns void
language plpgsql security definer as $$
declare r record;
begin
  for r in select sku, qty from order_items where order_ref = p_order_ref loop
    update variants set stock = stock + r.qty, updated_at = now() where sku = r.sku;
    insert into stock_movements (sku, type, qty_delta, order_ref, reason, actor)
      values (r.sku, p_type, r.qty, p_order_ref, case when p_type = 'return' then 'returned to stock' else 'order released' end, p_actor);
  end loop;
end $$;

create or replace function adjust_stock(p_sku text, p_delta integer, p_type text, p_reason text, p_actor text) returns integer
language plpgsql security definer as $$
declare v_new integer;
begin
  update variants set stock = stock + p_delta, updated_at = now() where sku = p_sku returning stock into v_new;
  if v_new is null then raise exception 'unknown sku %', p_sku; end if;
  if v_new < 0 then raise exception 'stock for % would go below zero', p_sku; end if;
  insert into stock_movements (sku, type, qty_delta, reason, actor) values (p_sku, p_type, p_delta, p_reason, p_actor);
  return v_new;
end $$;

revoke all on function reserve_stock(jsonb, text) from public, anon, authenticated;
revoke all on function release_stock(text, text, text) from public, anon, authenticated;
revoke all on function adjust_stock(text, integer, text, text, text) from public, anon, authenticated;
drop function if exists reserve_stock(jsonb);
drop function if exists release_stock(text);

-- ---------- discount codes ------------------------------------------------
create table if not exists discount_codes (
  id              bigserial primary key,
  code            text not null unique,
  kind            text not null check (kind in ('percent','fixed','free_shipping')),
  amount          integer not null default 0 check (amount >= 0),   -- percent, or sen for 'fixed'
  min_spend_sen   integer not null default 0 check (min_spend_sen >= 0),
  max_redemptions integer,
  redeemed_count  integer not null default 0,
  starts_at       timestamptz,
  ends_at         timestamptz,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);
create table if not exists discount_redemptions (
  id         bigserial primary key,
  code       text not null references discount_codes(code) on delete cascade,
  order_ref  text not null references orders(ref) on delete cascade,
  amount_sen integer not null,
  created_at timestamptz not null default now()
);

-- ---------- store settings (singleton) ------------------------------------
create table if not exists store_settings (
  id                          int primary key default 1 check (id = 1),
  store_name                  text not null default 'HOOR',
  store_email                 text not null default 'hooriemodestwear@gmail.com',
  store_phone                 text not null default '+60 17-250 0323',
  whatsapp                    text not null default '60172500323',
  hours                       text not null default 'Every day, 10am – 9pm',
  instagram                   text not null default '@we.are.hoor',
  free_shipping_threshold_sen integer check (free_shipping_threshold_sen >= 0),
  west_rate_sen               integer not null default 800 check (west_rate_sen >= 0),
  east_rate_sen               integer not null default 1500 check (east_rate_sen >= 0),
  return_days                 integer not null default 7,
  updated_at                  timestamptz not null default now()
);
insert into store_settings (id, free_shipping_threshold_sen) values (1, 25000) on conflict (id) do nothing;

-- ---------- staff ---------------------------------------------------------------
-- HOOR has no customer accounts, so every auth user is staff. The first one to
-- sign up becomes the owner; the rest are staff until an owner promotes them.
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'staff' check (role in ('owner','staff')),
  created_at timestamptz not null default now()
);
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name',
          case when exists (select 1 from profiles) then 'staff' else 'owner' end);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
-- Backfill anyone created before this migration.
insert into profiles (id, email, role)
  select u.id, u.email, case when exists (select 1 from profiles) then 'staff' else 'owner' end
  from auth.users u where not exists (select 1 from profiles p where p.id = u.id);

-- ---------- audit ---------------------------------------------------------------
create table if not exists audit_log (
  id          bigserial primary key,
  actor       text not null,                    -- staff email or 'system'
  action      text not null,                    -- 'order.status', 'stock.adjust', ...
  target      text,                             -- order ref, sku, code
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_log_created on audit_log (created_at desc);
create index if not exists audit_log_target on audit_log (target);

-- ---------- updated_at ----------------------------------------------------------
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
do $$ declare t text;
begin
  foreach t in array array['orders','payments','shipments','store_settings'] loop
    execute format('drop trigger if exists %I_touch on %I', t, t);
    execute format('create trigger %I_touch before update on %I for each row execute function touch_updated_at()', t, t);
  end loop;
end $$;

-- ---------- RLS ---------------------------------------------------------------------
-- Everything stays closed to anon. Signed-in staff read their own profile so the
-- request guard can check the role; all writes go through the service role.
alter table payments enable row level security;
alter table shipments enable row level security;
alter table stock_movements enable row level security;
alter table discount_codes enable row level security;
alter table discount_redemptions enable row level security;
alter table store_settings enable row level security;
alter table profiles enable row level security;
alter table audit_log enable row level security;
drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for select using (auth.uid() = id);
drop policy if exists "public read settings" on store_settings;
create policy "public read settings" on store_settings for select using (true);
