-- Fix admin panel control paths.
-- Idempotent: safe to run after the previous admin phase migrations.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where lower(email) = 'mobifranck310@gmail.com'
on conflict (user_id, role) do nothing;

create or replace function public.admin_users_list(p_limit int default 500, p_offset int default 0)
returns table (
  id uuid,
  user_id uuid,
  email text,
  display_name text,
  username text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  is_banned boolean,
  banned_at timestamptz,
  banned_reason text,
  is_vip boolean,
  vip_expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.user_id,
    u.email,
    p.display_name,
    p.username,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    coalesce(p.is_banned, false) as is_banned,
    p.banned_at,
    p.banned_reason,
    coalesce(p.is_vip, false) as is_vip,
    p.vip_expires_at
  from public.profiles p
  left join auth.users u on u.id = p.user_id
  where public.is_admin()
  order by p.created_at desc
  limit p_limit offset p_offset;
$$;

create or replace function public.admin_user_detail(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
  user_profile record;
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  select * into user_profile
  from public.profiles
  where user_id = p_user_id or id = p_user_id
  limit 1;

  if user_profile is null then
    return null;
  end if;

  select json_build_object(
    'id', user_profile.user_id,
    'email', (select email from auth.users where id = user_profile.user_id),
    'display_name', user_profile.display_name,
    'username', user_profile.username,
    'avatar_url', user_profile.avatar_url,
    'bio', user_profile.bio,
    'favorite_team', user_profile.favorite_team,
    'created_at', user_profile.created_at,
    'updated_at', user_profile.updated_at,
    'is_banned', coalesce(user_profile.is_banned, false),
    'banned_at', user_profile.banned_at,
    'banned_reason', user_profile.banned_reason,
    'roles', coalesce((select json_agg(r.role) from public.user_roles r where r.user_id = user_profile.user_id), '[]'::json),
    'stats', json_build_object(
      'favorites', (select count(*) from public.favorites where user_id = user_profile.user_id),
      'predictions', (select count(*) from public.match_predictions where user_id = user_profile.user_id),
      'ratings', (select count(*) from public.match_ratings where user_id = user_profile.user_id),
      'referrals', (select count(*) from public.referrals where referrer_id = user_profile.user_id)
    ),
    'vip', json_build_object(
      'is_vip', coalesce(user_profile.is_vip, false),
      'expires_at', user_profile.vip_expires_at,
      'license_key', user_profile.last_license_key
    )
  ) into result;

  return result;
end;
$$;

create or replace function public.admin_ban_user(p_user_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Impossible de bannir son propre compte';
  end if;

  update public.profiles
  set is_banned = true,
      banned_at = now(),
      banned_reason = p_reason,
      banned_by = auth.uid()
  where user_id = p_user_id or id = p_user_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'ban', 'user', p_user_id::text, jsonb_build_object('reason', p_reason));
end;
$$;

create or replace function public.admin_unban_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  update public.profiles
  set is_banned = false,
      banned_at = null,
      banned_reason = null,
      banned_by = null
  where user_id = p_user_id or id = p_user_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'unban', 'user', p_user_id::text, '{}');
end;
$$;

create or replace function public.admin_set_vip(p_user_id uuid, p_expires_at timestamptz, p_license_key text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  update public.profiles
  set is_vip = true,
      vip_expires_at = p_expires_at,
      last_license_key = coalesce(p_license_key, last_license_key)
  where user_id = p_user_id or id = p_user_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'grant_vip', 'user', p_user_id::text, jsonb_build_object('expires_at', p_expires_at));
end;
$$;

create or replace function public.admin_revoke_vip(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  update public.profiles
  set is_vip = false,
      vip_expires_at = null,
      last_license_key = null
  where user_id = p_user_id or id = p_user_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'revoke_vip', 'user', p_user_id::text, '{}');
end;
$$;

create or replace function public.admin_delete_user(p_user_id uuid, p_hard_delete boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Impossible de supprimer son propre compte';
  end if;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'delete_user', 'user', p_user_id::text, jsonb_build_object(
    'hard_delete', p_hard_delete,
    'email', (select email from auth.users where id = p_user_id)
  ));

  if p_hard_delete then
    delete from auth.users where id = p_user_id;
  else
    update public.profiles
    set is_banned = true,
        banned_at = now(),
        banned_reason = 'Compte supprime (soft)',
        banned_by = auth.uid(),
        display_name = '[Supprime]',
        username = null,
        avatar_url = null,
        bio = null
    where user_id = p_user_id or id = p_user_id;
  end if;
end;
$$;

create or replace function public.admin_audit_log_for_user(p_target_id text default null, p_limit int default 50)
returns table (
  id uuid,
  admin_id uuid,
  admin_email text,
  action text,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    l.id,
    l.admin_id,
    (select email from auth.users where id = l.admin_id) as admin_email,
    l.action,
    l.target_type,
    l.target_id,
    l.details,
    l.created_at
  from public.admin_audit_log l
  where public.is_admin()
    and (p_target_id is null or l.target_id = p_target_id)
  order by l.created_at desc
  limit p_limit;
$$;

create or replace function public.admin_set_site_setting(p_key text, p_value text, p_description text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  insert into public.site_settings (key, value, description)
  values (p_key, p_value, coalesce(p_description, p_key))
  on conflict (key) do update
    set value = excluded.value,
        description = excluded.description,
        updated_at = now();

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'site_setting_update', 'setting', p_key, jsonb_build_object('value', p_value));
end;
$$;
