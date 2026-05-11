-- ═══════════════════════════════════════════════════════════════
-- PHASE 4 : Content & Moderation — Modération, Feature Flags, Maintenance
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Table content_moderation_queue ─────────────────────────
create table if not exists public.content_moderation_queue (
  id uuid default gen_random_uuid() primary key,
  content_type text not null,              -- 'news', 'comment', 'prediction', 'profile'
  content_id text not null,                -- ID du contenu à modérer
  content_preview text,                    -- Aperçu du contenu (snapshot)
  author_id uuid references auth.users(id) on delete set null,
  author_email text,                       -- snapshot
  reported_by uuid references auth.users(id) on delete set null,
  report_reason text,                      -- 'spam', 'inappropriate', 'fake_news', 'other'
  report_details text,
  status text not null default 'pending',  -- 'pending', 'approved', 'rejected', 'escalated'
  moderator_id uuid references auth.users(id) on delete set null,
  moderation_notes text,
  moderated_at timestamptz,
  created_at timestamptz default now()
);

create index moderation_status_idx on public.content_moderation_queue(status, created_at desc);
create index moderation_type_idx on public.content_moderation_queue(content_type);
create index moderation_author_idx on public.content_moderation_queue(author_id);

-- RLS
alter table public.content_moderation_queue enable row level security;

create policy "Admins and moderators can view queue"
  on public.content_moderation_queue for select
  using (public.is_admin() or exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'moderator'
  ));

create policy "Admins and moderators can update"
  on public.content_moderation_queue for update
  using (public.is_admin() or exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'moderator'
  ));

create policy "Authenticated users can report"
  on public.content_moderation_queue for insert
  with check (auth.uid() is not null);

-- ─── 2. Table feature_flags ────────────────────────────────────
create table if not exists public.feature_flags (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,                -- 'vip_pricing', 'ai_predictions', 'referral_system'
  name text not null,                      -- nom affichable
  description text,
  enabled boolean default false,
  rollout_percentage integer default 100 check (rollout_percentage between 0 and 100),
  allowed_roles text[] default '{}',       -- ['vip', 'admin'] pour feature VIP
  config jsonb default '{}',               -- config spécifique
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.feature_flags enable row level security;

create policy "Anyone can view feature flags"
  on public.feature_flags for select
  to authenticated, anon
  using (true);

create policy "Only admins can manage"
  on public.feature_flags for all
  using (public.is_admin());

-- ─── 3. Table site_settings ──────────────────────────────────
create table if not exists public.site_settings (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text not null,
  description text,
  updated_at timestamptz default now()
);

-- RLS
alter table public.site_settings enable row level security;

create policy "Anyone can view settings"
  on public.site_settings for select
  to authenticated, anon
  using (true);

create policy "Only admins can update"
  on public.site_settings for all
  using (public.is_admin());

-- ─── 4. RPC admin_moderation_stats ────────────────────────────
create or replace function public.admin_moderation_stats()
returns json
language sql
security definer
as $$
  select json_build_object(
    'pending_count',        (select count(*) from public.content_moderation_queue where status = 'pending'),
    'approved_today',       (select count(*) from public.content_moderation_queue where status = 'approved' and moderated_at >= now() - interval '1 day'),
    'rejected_today',       (select count(*) from public.content_moderation_queue where status = 'rejected' and moderated_at >= now() - interval '1 day'),
    'total_reports',        (select count(*) from public.content_moderation_queue),
    'by_type',              (select json_object_agg(content_type, cnt) from (
                               select content_type, count(*) as cnt
                               from public.content_moderation_queue
                               where status = 'pending'
                               group by content_type
                             ) t),
    'by_reason',            (select json_object_agg(report_reason, cnt) from (
                               select report_reason, count(*) as cnt
                               from public.content_moderation_queue
                               where status = 'pending'
                               group by report_reason
                             ) t)
  );
$$;

-- ─── 5. RPC admin_moderation_action ───────────────────────────
create or replace function public.admin_moderation_action(
  p_report_id uuid,
  p_action text,                           -- 'approve', 'reject', 'escalate'
  p_notes text default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_report record;
begin
  if not (public.is_admin() or exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'moderator'
  )) then
    raise exception 'Acces refuse';
  end if;

  select * into v_report
  from public.content_moderation_queue
  where id = p_report_id;

  if v_report is null then
    raise exception 'Signalement non trouve';
  end if;

  -- Mise à jour du statut
  update public.content_moderation_queue
  set status = p_action,
      moderator_id = auth.uid(),
      moderation_notes = p_notes,
      moderated_at = now()
  where id = p_report_id;

  -- Action selon le type
  if p_action = 'reject' then
    -- Soft delete selon le type de contenu
    case v_report.content_type
      when 'news' then
        -- Marquer comme modéré (ajouter une colonne si besoin)
        null;
      when 'comment' then
        -- Supprimer le commentaire
        null;
      when 'profile' then
        -- Bannir l'utilisateur si récidive
        if (select count(*) from public.content_moderation_queue where author_id = v_report.author_id and status = 'rejected') >= 3 then
          update public.profiles set is_banned = true, banned_reason = 'Multiple violations', banned_at = now(), banned_by = auth.uid()
          where id = v_report.author_id;
        end if;
    end case;
  end if;

  -- Log
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'moderation_' || p_action, v_report.content_type, v_report.content_id, jsonb_build_object(
    'report_id', p_report_id,
    'notes', p_notes
  ));
end;
$$;

-- ─── 6. RPC admin_set_feature_flag ────────────────────────────
create or replace function public.admin_set_feature_flag(
  p_key text,
  p_enabled boolean,
  p_rollout_percentage integer default 100,
  p_config jsonb default null
)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  insert into public.feature_flags (key, name, enabled, rollout_percentage, config)
  values (p_key, p_key, p_enabled, p_rollout_percentage, coalesce(p_config, '{}'))
  on conflict (key) do update set
    enabled = p_enabled,
    rollout_percentage = p_rollout_percentage,
    config = case when p_config is not null then p_config else public.feature_flags.config end,
    updated_at = now();

  -- Log
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'feature_flag_set', 'system', p_key, jsonb_build_object(
    'enabled', p_enabled,
    'rollout', p_rollout_percentage
  ));
end;
$$;

-- ─── 7. RPC admin_set_maintenance_mode ───────────────────────
create or replace function public.admin_set_maintenance_mode(
  p_enabled boolean,
  p_message text default 'Maintenance en cours...'
)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  insert into public.site_settings (key, value, description)
  values ('maintenance_mode', p_enabled::text, 'Mode maintenance actif')
  on conflict (key) do update set value = p_enabled::text, updated_at = now();

  insert into public.site_settings (key, value, description)
  values ('maintenance_message', p_message, 'Message de maintenance')
  on conflict (key) do update set value = p_message, updated_at = now();

  -- Log
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), p_enabled ? 'maintenance_on' : 'maintenance_off', 'system', 'maintenance', '{}');
end;
$$;

-- ─── 8. RPC is_feature_enabled ───────────────────────────────
create or replace function public.is_feature_enabled(
  p_key text,
  p_user_id uuid default null
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_flag record;
  v_user_roles text[];
begin
  select * into v_flag
  from public.feature_flags
  where key = p_key;

  if v_flag is null then
    return false;
  end if;

  if not v_flag.enabled then
    return false;
  end if;

  -- Check rollout percentage (basé sur le hash de l'user_id)
  if p_user_id is not null and v_flag.rollout_percentage < 100 then
    if abs(('x' || substr(md5(p_user_id::text), 1, 8))::bit(32)::int) % 100 >= v_flag.rollout_percentage then
      return false;
    end if;
  end if;

  -- Check roles
  if array_length(v_flag.allowed_roles, 1) > 0 then
    if p_user_id is null then
      return false;
    end if;
    
    select array_agg(role) into v_user_roles
    from public.user_roles
    where user_id = p_user_id;
    
    if not v_flag.allowed_roles && v_user_roles then
      return false;
    end if;
  end if;

  return true;
end;
$$;

-- ─── 9. Seed feature flags par défaut ────────────────────────
insert into public.feature_flags (key, name, description, enabled, config)
values 
  ('vip_pricing', 'Tarification VIP', 'Active l''achat de licences VIP', true, '{"plans": ["monthly", "yearly"]}'),
  ('ai_predictions', 'Prédictions IA', 'Prédictions par intelligence artificielle', true, '{}'),
  ('referral_system', 'Système de parrainage', 'Programme de parrainage VIP', true, '{"reward_hours": 48}'),
  ('live_odds', 'Cotes en direct', 'Affichage des cotes temps réel', true, '{}'),
  ('community_predictions', 'Prédictions communautaire', 'Système de vote utilisateurs', false, '{}')
on conflict (key) do nothing;

-- ─── 10. Seed settings par défaut ─────────────────────────────
insert into public.site_settings (key, value, description)
values 
  ('maintenance_mode', 'false', 'Mode maintenance'),
  ('maintenance_message', 'Maintenance en cours, revenez bientôt !', 'Message affiché pendant maintenance'),
  ('site_name', 'LiveFoot', 'Nom du site'),
  ('support_email', 'support@livefoot.fun', 'Email support')
on conflict (key) do nothing;

-- ─── NOTE : Utilisation ──────────────────────────────────────
-- 1. Signalement contenu : INSERT INTO content_moderation_queue (...)
-- 2. Modération : SELECT admin_moderation_action('uuid', 'approve', 'notes')
-- 3. Feature flags : SELECT is_feature_enabled('vip_pricing', auth.uid())
-- 4. Maintenance : SELECT admin_set_maintenance_mode(true, 'Message...')
