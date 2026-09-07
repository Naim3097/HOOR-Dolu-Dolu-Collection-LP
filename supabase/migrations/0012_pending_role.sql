-- A self-served signup must never become staff. The 0005 trigger handed
-- 'staff' to every new auth user, so with public signups enabled anyone
-- could create an account and walk into the back office. Now only the very
-- first user becomes the owner; everyone else lands in 'pending', which the
-- app treats as no access. Owner-created accounts are unaffected —
-- createStaff sets the real role explicitly right after creating the user.
alter table profiles drop constraint profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('owner','staff','pending'));
alter table profiles alter column role set default 'pending';
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name',
          case when exists (select 1 from profiles) then 'pending' else 'owner' end);
  return new;
end $$;
