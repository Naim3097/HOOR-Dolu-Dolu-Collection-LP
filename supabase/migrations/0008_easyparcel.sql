-- EasyParcel connection and the pickup address, on the settings singleton.
alter table store_settings
  add column if not exists easyparcel_enabled         boolean not null default false,
  add column if not exists easyparcel_access_token    text,
  add column if not exists easyparcel_refresh_token   text,
  add column if not exists easyparcel_token_expires   timestamptz,
  add column if not exists easyparcel_refresh_expires timestamptz,
  add column if not exists sender_name     text not null default 'HOOR',
  add column if not exists sender_phone    text not null default '+60 17-250 0323',
  add column if not exists sender_line1    text not null default 'Lot 2-5, Second Floor, The Linc KL',
  add column if not exists sender_line2    text,
  add column if not exists sender_city     text not null default 'Kuala Lumpur',
  add column if not exists sender_postcode text not null default '50400',
  add column if not exists sender_state    text not null default 'Kuala Lumpur';

-- Tokens are only ever read through the service role. The storefront's public
-- read of store_settings names its columns, so it never touches these.
revoke select (easyparcel_access_token, easyparcel_refresh_token, easyparcel_token_expires, easyparcel_refresh_expires) on store_settings from anon, authenticated;
