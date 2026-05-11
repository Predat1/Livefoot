-- ═══════════════════════════════════════════════════════════════
-- PHASE 1 : Fondations Admin — Gestion utilisateurs avancée
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Helper function is_admin() ─────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ─── 2. Extension profiles : bannissement ──────────────────────
alter table public.profiles
  add column if not exists is_banned boolean default false,
  add column if not exists banned_at timestamptz,
  add column if not exists banned_reason text,
  add column if not exists banned_by uuid references auth.users(id);

-- Index pour rechercher les bannis rapidement
create index if not exists profiles_banned_idx on public.profiles(is_banned) where is_banned = true;

-- ─── 3. Table admin_audit_log ────────────────────────────────
create table if not exists public.admin_audit_log (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users(id) not null,
  action text not null,                    -- 'ban', 'unban', 'grant_vip', 'revoke_vip', 'delete_user', 'assign_role', etc.
  target_type text not null,               -- 'user', 'content', 'system'
  target_id text,                          -- user_id ou content_id
  details jsonb,                             -- { reason, previous_value, new_value, ... }
  created_at timestamptz default now()
);

create index audit_admin_idx on public.admin_audit_log(admin_id, created_at desc);
create index audit_target_idx on public.admin_audit_log(target_type, target_id);
create index audit_date_idx on public.admin_audit_log(created_at desc);

-- RLS: seuls les admins peuvent lire leurs logs
alter table public.admin_audit_log enable row level security;

create policy "Admins can view audit logs"
  on public.admin_audit_log for select
  using (public.is_admin());

create policy "Admins can insert audit logs"
  on public.admin_audit_log for insert
  with check (public.is_admin());

-- ─── 4. RPC admin_user_detail ───────────────────────────────
create or replace function public.admin_user_detail(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  result json;
  user_profile record;
  user_roles json;
  user_favorites_count int;
  user_predictions_count int;
  user_ratings_count int;
  user_referrals_count int;
  user_vip_status json;
begin
  -- Verif admin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  -- Profile
  select * into user_profile
  from public.profiles
  where id = p_user_id;

  if user_profile is null then
    return null;
  end if;

  -- Roles
  select json_agg(r.role) into user_roles
  from public.user_roles r
  where r.user_id = p_user_id;

  -- Stats
  select count(*) into user_favorites_count
  from public.favorites where user_id = p_user_id;

  select count(*) into user_predictions_count
  from public.match_predictions where user_id = p_user_id;

  select count(*) into user_ratings_count
  from public.match_ratings where user_id = p_user_id;

  select count(*) into user_referrals_count
  from public.referrals where referrer_id = p_user_id;

  -- VIP
  select json_build_object(
    'is_vip', is_vip,
    'expires_at', vip_expires_at,
    'license_key', last_license_key
  ) into user_vip_status
  from public.profiles where id = p_user_id;

  -- Assemblage
  select json_build_object(
    'id', user_profile.id,
    'email', (select email from auth.users where id = p_user_id),
    'display_name', user_profile.display_name,
    'username', user_profile.username,
    'avatar_url', user_profile.avatar_url,
    'bio', user_profile.bio,
    'favorite_team', user_profile.favorite_team,
    'created_at', user_profile.created_at,
    'updated_at', user_profile.updated_at,
    'is_banned', user_profile.is_banned,
    'banned_at', user_profile.banned_at,
    'banned_reason', user_profile.banned_reason,
    'roles', coalesce(user_roles, '[]'),
    'stats', json_build_object(
      'favorites', user_favorites_count,
      'predictions', user_predictions_count,
      'ratings', user_ratings_count,
      'referrals', user_referrals_count
    ),
    'vip', user_vip_status
  ) into result;

  return result;
end;
$$;

-- ─── 5. RPC admin_ban_user ───────────────────────────────────
create or replace function public.admin_ban_user(p_user_id uuid, p_reason text)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  -- Verifie qu'on ne ban pas soi-meme
  if p_user_id = auth.uid() then
    raise exception 'Impossible de bannir son propre compte';
  end if;

  -- Mise a jour
  update public.profiles
  set is_banned = true,
      banned_at = now(),
      banned_reason = p_reason,
      banned_by = auth.uid()
  where id = p_user_id;

  -- Log
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'ban', 'user', p_user_id::text, jsonb_build_object('reason', p_reason));
end;
$$;

-- ─── 6. RPC admin_unban_user ─────────────────────────────────
create or replace function public.admin_unban_user(p_user_id uuid)
returns void
language plpgsql
security definer
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
  where id = p_user_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'unban', 'user', p_user_id::text, '{}');
end;
$$;

-- ─── 7. RPC admin_set_vip ────────────────────────────────────
create or replace function public.admin_set_vip(p_user_id uuid, p_expires_at timestamptz, p_license_key text default null)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  update public.profiles
  set is_vip = true,
      vip_expires_at = p_expires_at,
      last_license_key = coalesce(p_license_key, last_license_key)
  where id = p_user_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'grant_vip', 'user', p_user_id::text, jsonb_build_object(
    'expires_at', p_expires_at,
    'license_key', p_license_key
  ));
end;
$$;

-- ─── 8. RPC admin_revoke_vip ─────────────────────────────────
create or replace function public.admin_revoke_vip(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  update public.profiles
  set is_vip = false,
      vip_expires_at = null,
      last_license_key = null
  where id = p_user_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'revoke_vip', 'user', p_user_id::text, '{}');
end;
$$;

-- ─── 9. RPC admin_delete_user ────────────────────────────────
create or replace function public.admin_delete_user(p_user_id uuid, p_hard_delete boolean default false)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Impossible de supprimer son propre compte';
  end if;

  -- Log avant suppression
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'delete_user', 'user', p_user_id::text, jsonb_build_object(
    'hard_delete', p_hard_delete,
    'email', (select email from auth.users where id = p_user_id)
  ));

  if p_hard_delete then
    -- Suppression cascade via FK (profiles, favorites, predictions, ratings, referrals, user_roles)
    delete from auth.users where id = p_user_id;
  else
    -- Soft delete : on ban et on marque comme supprime
    update public.profiles
    set is_banned = true,
        banned_at = now(),
        banned_reason = 'Compte supprime (soft)',
        banned_by = auth.uid(),
        display_name = '[Supprime]',
        username = null,
        avatar_url = null,
        bio = null
    where id = p_user_id;
  end if;
end;
$$;

-- ─── 10. RPC admin_audit_log_for_user ────────────────────────
create or replace function public.admin_audit_log_for_user(p_target_id text, p_limit int default 50)
returns table (
  id uuid,
  admin_id uuid,
  admin_email text,
  action text,
  details jsonb,
  created_at timestamptz
)
language sql
security definer
as $$
  select 
    l.id,
    l.admin_id,
    (select email from auth.users where id = l.admin_id) as admin_email,
    l.action,
    l.details,
    l.created_at
  from public.admin_audit_log l
  where l.target_id = p_target_id
  order by l.created_at desc
  limit p_limit;
$$;

-- ─── 11. Mise a jour admin_stats pour inclure bannis ───────────
-- Recreate pour ajouter les compteurs de bannis
create or replace function public.admin_stats()
returns json
language sql
security definer
as $$
  select json_build_object(
    'total_users',            (select count(*) from public.profiles),
    'banned_users',           (select count(*) from public.profiles where is_banned = true),
    'active_users_7d',        (select count(*) from public.profiles where updated_at >= now() - interval '7 days' and is_banned = false),
    'vip_users',              (select count(*) from public.profiles where is_vip = true and (vip_expires_at is null or vip_expires_at > now())),
    'total_predictions',      (select count(*) from public.match_predictions),
    'total_ratings',          (select count(*) from public.match_ratings),
    'total_favorites',        (select count(*) from public.favorites),
    'users_with_predictions', (select count(distinct user_id) from public.match_predictions),
    'users_with_ratings',     (select count(distinct user_id) from public.match_ratings),
    'recent_signups_7d',      (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    'recent_signups_30d',     (select count(*) from public.profiles where created_at >= now() - interval '30 days')
  );
$$;

-- ─── NOTE : First admin seeding ───────────────────────────────
-- Apres avoir execute cette migration, donne-toi le role admin :
--
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'
-- FROM auth.users
-- WHERE email = 'Mobifranck310@gmail.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
--
-- Si deja admin, tu peux immediatement utiliser toutes ces fonctions.
