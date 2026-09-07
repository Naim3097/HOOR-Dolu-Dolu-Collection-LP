-- Order refs are short and guessable, and the return page shows the
-- customer's name, email and address. Each order now carries a secret
-- access token; the return page (and the email link) must present it
-- before any order detail is rendered or a settle/abandon is triggered.
alter table orders add column if not exists access_token text;
