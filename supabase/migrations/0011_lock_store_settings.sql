-- store_settings carries the EasyParcel OAuth tokens, and a PostgreSQL
-- column-level REVOKE cannot subtract from Supabase's table-level SELECT
-- grant — so the revoke in 0008 never actually hid them: any request with
-- the public anon key could read the tokens. Drop the table-level
-- privileges and grant back only the columns the storefront reads
-- (lib/catalog.ts loadCatalog). Every other reader uses the service role,
-- which keeps full access.
revoke all on store_settings from anon, authenticated;
grant select (store_email, store_phone, whatsapp, hours, instagram, free_shipping_threshold_sen, west_rate_sen, east_rate_sen, return_days, domestic_shipping_mode) on store_settings to anon, authenticated;
