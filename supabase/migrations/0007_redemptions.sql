-- Atomic redemption counter for discount codes.
create or replace function bump_redemption(p_code text) returns void
language sql security definer as $$
  update discount_codes set redeemed_count = redeemed_count + 1 where code = p_code;
$$;
revoke all on function bump_redemption(text) from public, anon, authenticated;
