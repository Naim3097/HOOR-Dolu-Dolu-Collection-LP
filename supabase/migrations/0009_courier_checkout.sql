-- Customer-picked couriers at checkout, worldwide delivery, frozen quotes.
-- Zone rates stay as the fallback mode: when EasyParcel is dark, Malaysian
-- sales continue at RM8/RM15 (the lesson from EasyParcel's 20 Aug outage).

alter table store_settings
  add column if not exists domestic_shipping_mode text not null default 'zone' check (domestic_shipping_mode in ('zone','courier')),
  add column if not exists domestic_allowed_couriers text[] not null default '{Ninja}',
  add column if not exists international_allowed_couriers text[] not null default '{}';

-- The price the browser never sees: options are frozen server-side for 30
-- minutes and the checkout carries only the uuid. Service-role only.
create table if not exists shipping_quotes (
  id         uuid primary key default gen_random_uuid(),
  options    jsonb not null,   -- [{ service_id, service_name, courier, amount_sen, delivery_duration }]
  inputs     jsonb not null,   -- { country, postcode, subdivision, weight_grams, parcel_value_rm }
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table shipping_quotes enable row level security;
revoke all on shipping_quotes from anon, authenticated;

-- What the customer chose, copied from the frozen quote, never from the form.
alter table orders
  add column if not exists shipping_quote_id    uuid,
  add column if not exists shipping_service_id  text,
  add column if not exists shipping_service_name text,
  add column if not exists shipping_courier     text;
