-- ═══════════════════════════════════════════════════════════════
-- PHASE 3 : Analytics hybride — Tracking audience + Import Plausible
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Table page_views (tracking interne anonymisé) ───────────
create table if not exists public.page_views (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,                -- ID de session (cookie)
  path text not null,                      -- /match/123, /live, etc.
  referrer text,                           -- referrer (sans query params)
  country_code text,                       -- FR, BE, etc. (depuis IP geoloc)
  device_type text,                        -- mobile, desktop, tablet
  browser text,                            -- Chrome, Firefox, etc.
  os text,                                 -- Windows, iOS, Android, etc.
  lang text,                               -- fr, en, es
  created_at timestamptz default now()
);

create index pageviews_session_idx on public.page_views(session_id, created_at desc);
create index pageviews_path_idx on public.page_views(path);
create index pageviews_date_idx on public.page_views(created_at desc);
create index pageviews_country_idx on public.page_views(country_code);

-- RLS page_views (lecture admin seulement)
alter table public.page_views enable row level security;

create policy "Admins can view page views"
  on public.page_views for select
  using (public.is_admin());

-- ─── 2. Table plausible_import (import historique Plausible) ───
create table if not exists public.plausible_import (
  id uuid default gen_random_uuid() primary key,
  date date not null,                      -- 2024-01-15
  visitors integer not null,               -- visiteurs uniques
  pageviews integer not null,              -- pages vues
  bounce_rate numeric(5, 2),               -- 45.50 = 45.5%
  avg_duration_seconds integer,            -- durée moyenne
  source text,                             -- Google, Direct, etc.
  medium text,                             -- organic, referral, etc.
  campaign text,                           -- nom de campagne
  country text,                            -- France, Belgique
  device_type text,                        -- Desktop, Mobile
  page_path text,                          -- /match/123
  imported_at timestamptz default now()
);

create index plausible_date_idx on public.plausible_import(date desc);
create index plausible_source_idx on public.plausible_import(source);

create unique index plausible_unique_stats on public.plausible_import(date, coalesce(source, ''), coalesce(country, ''), coalesce(device_type, ''));

-- RLS plausible_import
alter table public.plausible_import enable row level security;

create policy "Admins can view plausible import"
  on public.plausible_import for select
  using (public.is_admin());

create policy "Admins can insert plausible import"
  on public.plausible_import for insert
  with check (public.is_admin());

-- ─── 3. Table analytics_goals (objectifs/conversions) ─────────
create table if not exists public.analytics_goals (
  id uuid default gen_random_uuid() primary key,
  name text not null,                      -- "Inscription VIP", "Parrainage"
  path_pattern text,                       -- "/pricing" ou "/vip/*"
  event_type text not null,                -- "pageview", "click", "conversion"
  target_count integer default 1000,       -- objectif mensuel
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.analytics_conversions (
  id uuid default gen_random_uuid() primary key,
  goal_id uuid references public.analytics_goals(id),
  session_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  value_eur numeric(10, 2),               -- valeur si applicable
  metadata jsonb,
  created_at timestamptz default now()
);

create index conversions_goal_idx on public.analytics_conversions(goal_id, created_at desc);
create index conversions_user_idx on public.analytics_conversions(user_id);

-- RLS
alter table public.analytics_goals enable row level security;
alter table public.analytics_conversions enable row level security;

create policy "Admins can manage goals"
  on public.analytics_goals for all
  using (public.is_admin());

create policy "Admins can view conversions"
  on public.analytics_conversions for select
  using (public.is_admin());

-- ─── 4. RPC admin_analytics_stats ────────────────────────────
create or replace function public.admin_analytics_stats(p_days int default 30)
returns json
language sql
security definer
as $$
  select json_build_object(
    -- Données internes (page_views)
    'internal_visitors',      (select count(distinct session_id) from public.page_views where created_at >= now() - (p_days || ' days')::interval),
    'internal_pageviews',     (select count(*) from public.page_views where created_at >= now() - (p_days || ' days')::interval),
    'internal_avg_duration',  (select round(avg(extract(epoch from (created_at - lag(created_at) over (partition by session_id order by created_at))))::numeric, 0) 
                               from public.page_views 
                               where created_at >= now() - (p_days || ' days')::interval),
    'top_pages',              (select json_agg(row_to_json(t)) from (
                               select path, count(*) as views
                               from public.page_views
                               where created_at >= now() - (p_days || ' days')::interval
                               group by path
                               order by count(*) desc
                               limit 10
                             ) t),
    'top_countries',          (select json_agg(row_to_json(t)) from (
                               select country_code, count(distinct session_id) as visitors
                               from public.page_views
                               where created_at >= now() - (p_days || ' days')::interval and country_code is not null
                               group by country_code
                               order by count(distinct session_id) desc
                               limit 10
                             ) t),
    'device_breakdown',       (select json_object_agg(device_type, cnt) from (
                               select coalesce(device_type, 'unknown') as device_type, count(*) as cnt
                               from public.page_views
                               where created_at >= now() - (p_days || ' days')::interval
                               group by device_type
                             ) t),
    
    -- Données Plausible importées
    'plausible_visitors',     (select coalesce(sum(visitors), 0) from public.plausible_import where date >= current_date - p_days),
    'plausible_pageviews',    (select coalesce(sum(pageviews), 0) from public.plausible_import where date >= current_date - p_days),
    'plausible_avg_bounce',   (select round(avg(bounce_rate), 2) from public.plausible_import where date >= current_date - p_days),
    'plausible_sources',      (select json_agg(row_to_json(t)) from (
                               select source, sum(visitors) as visitors
                               from public.plausible_import
                               where date >= current_date - p_days and source is not null
                               group by source
                               order by sum(visitors) desc
                               limit 10
                             ) t),
    
    -- Conversions
    'total_conversions',      (select count(*) from public.analytics_conversions where created_at >= now() - (p_days || ' days')::interval),
    'conversion_value_eur',   (select coalesce(sum(value_eur), 0) from public.analytics_conversions where created_at >= now() - (p_days || ' days')::interval),
    
    -- Période
    'period_days', p_days
  );
$$;

-- ─── 5. RPC admin_import_plausible ─────────────────────────────
create or replace function public.admin_import_plausible(
  p_data jsonb
)
returns int
language plpgsql
security definer
as $$
declare
  inserted_count int := 0;
  row jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;
  
  for row in select jsonb_array_elements(p_data)
  loop
    insert into public.plausible_import (
      date, visitors, pageviews, bounce_rate, avg_duration_seconds,
      source, medium, campaign, country, device_type, page_path
    ) values (
      (row->>'date')::date,
      (row->>'visitors')::int,
      (row->>'pageviews')::int,
      (row->>'bounce_rate')::numeric,
      (row->>'avg_duration')::int,
      row->>'source',
      row->>'medium',
      row->>'campaign',
      row->>'country',
      row->>'device_type',
      row->>'page_path'
    )
    on conflict (date, coalesce(source, ''), coalesce(country, ''), coalesce(device_type, '')) 
    do update set
      visitors = excluded.visitors,
      pageviews = excluded.pageviews,
      bounce_rate = excluded.bounce_rate,
      avg_duration_seconds = excluded.avg_duration_seconds,
      imported_at = now();
      
    inserted_count := inserted_count + 1;
  end loop;
  
  return inserted_count;
end;
$$;

-- ─── 6. RPC log_page_view (appelée par Edge Function ou client) ─
create or replace function public.log_page_view(
  p_session_id text,
  p_path text,
  p_referrer text default null,
  p_country_code text default null,
  p_device_type text default null,
  p_browser text default null,
  p_os text default null,
  p_lang text default null
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.page_views (
    session_id, path, referrer, country_code, device_type, browser, os, lang
  ) values (
    p_session_id, p_path, p_referrer, p_country_code, p_device_type, p_browser, p_os, p_lang
  );
end;
$$;

-- ─── 7. RPC log_conversion ────────────────────────────────────
create or replace function public.log_conversion(
  p_goal_name text,
  p_session_id text,
  p_user_id uuid default null,
  p_value_eur numeric default null,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_goal_id uuid;
begin
  -- Trouver le goal par nom
  select id into v_goal_id from public.analytics_goals 
  where name = p_goal_name and is_active = true 
  limit 1;
  
  if v_goal_id is null then
    return; -- Goal non trouvé ou inactif
  end if;
  
  insert into public.analytics_conversions (goal_id, session_id, user_id, value_eur, metadata)
  values (v_goal_id, p_session_id, p_user_id, p_value_eur, p_metadata);
end;
$$;

-- ─── 8. Seed goals par défaut ────────────────────────────────
insert into public.analytics_goals (name, event_type, path_pattern, target_count)
values 
  ('Inscription', 'conversion', '/auth', 500),
  ('Abonnement VIP', 'conversion', '/pricing', 200),
  ('Parrainage', 'conversion', '/profile', 100),
  ('Favoris ajouté', 'click', '/match/*', 1000)
on conflict do nothing;

-- ─── NOTE : Utilisation ──────────────────────────────────────
-- 1. Tracking client : appeler log_page_view via RPC ou Edge Function
-- 2. Import Plausible : appeler admin_import_plausible avec un tableau JSON
-- 3. Dashboard : utiliser admin_analytics_stats(30) pour les stats du mois
