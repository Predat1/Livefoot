-- Grant and preserve admin access for the site owner account.
-- Authentication credentials stay in Supabase Auth; no password is stored here.

insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where lower(email) = 'mobifranck310@gmail.com'
on conflict (user_id, role) do nothing;

create or replace function public.grant_owner_admin_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) = 'mobifranck310@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists grant_owner_admin_role_on_auth_user on auth.users;

create trigger grant_owner_admin_role_on_auth_user
  after insert or update of email on auth.users
  for each row
  execute function public.grant_owner_admin_role();
