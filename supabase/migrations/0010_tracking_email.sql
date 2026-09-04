-- The shipped email goes out once per parcel, when its tracking number is
-- first known, whichever path delivered it (booking, AWB fetch, webhook,
-- manual entry). This stamp is what makes that idempotent.
alter table shipments add column if not exists tracking_email_sent_at timestamptz;
