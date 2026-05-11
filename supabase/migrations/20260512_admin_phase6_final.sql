-- ═══════════════════════════════════════════════════════════════
-- PHASE 6 : Final Features — Newsletter, Backup, API Monitoring
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Table newsletter_subscribers ─────────────────────────────
create table if not exists public.newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text,
  is_active boolean default true,
  subscribed_at timestamptz default now(),
  unsubscribed_at timestamptz,
  metadata jsonb default '{}',  -- { source: 'footer', campaign: 'launch' }
  confirmed boolean default false,
  confirmation_token text
);

create index newsletter_email_idx on public.newsletter_subscribers(email);
create index newsletter_active_idx on public.newsletter_subscribers(is_active) where is_active = true;

-- RLS
alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert
  with check (true);

create policy "Admins can view subscribers"
  on public.newsletter_subscribers for select
  using (public.is_admin());

create policy "Admins can manage subscribers"
  on public.newsletter_subscribers for all
  using (public.is_admin());

-- ─── 2. Table api_usage_logs ─────────────────────────────────
create table if not exists public.api_usage_logs (
  id uuid default gen_random_uuid() primary key,
  endpoint text not null,              -- 'api-football/fixtures', 'ai-prediction'
  user_id uuid references auth.users(id),
  request_method text not null,        -- GET, POST
  status_code integer,
  response_time_ms integer,
  quota_used integer default 1,
  quota_remaining integer,
  error_message text,
  created_at timestamptz default now()
);

create index api_usage_endpoint_idx on public.api_usage_logs(endpoint, created_at desc);
create index api_usage_user_idx on public.api_usage_logs(user_id, created_at desc);
create index api_usage_date_idx on public.api_usage_logs(created_at desc);

-- RLS
alter table public.api_usage_logs enable row level security;

create policy "Admins can view API usage"
  on public.api_usage_logs for select
  using (public.is_admin());

-- ─── 3. Table backups ──────────────────────────────────────────
create table if not exists public.backups (
  id uuid default gen_random_uuid() primary key,
  type text not null,                  -- 'full', 'users', 'transactions'
  status text default 'running',       -- 'running', 'completed', 'failed'
  started_at timestamptz default now(),
  completed_at timestamptz,
  file_url text,
  file_size_bytes bigint,
  tables_included text[],
  row_count integer,
  error_message text,
  triggered_by uuid references auth.users(id)
);

-- RLS
alter table public.backups enable row level security;

create policy "Admins can view backups"
  on public.backups for select
  using (public.is_admin());

create policy "Admins can create backups"
  on public.backups for insert
  with check (public.is_admin());

-- ─── 4. RPC admin_newsletter_stats ─────────────────────────────
create or replace function public.admin_newsletter_stats()
returns json
language sql
security definer
as $$
  select json_build_object(
    'total_subscribers', (select count(*) from public.newsletter_subscribers),
    'active_subscribers', (select count(*) from public.newsletter_subscribers where is_active = true),
    'new_this_week', (select count(*) from public.newsletter_subscribers where subscribed_at >= now() - interval '7 days'),
    'unsubscribed', (select count(*) from public.newsletter_subscribers where is_active = false),
    'confirmed_rate', case 
                        when (select count(*) from public.newsletter_subscribers) = 0 then 0
                        else round((select count(*) from public.newsletter_subscribers where confirmed = true)::numeric / 
                                   (select count(*) from public.newsletter_subscribers) * 100, 1)
                      end
  );
$$;

-- ─── 5. RPC admin_api_usage_stats ─────────────────────────────
create or replace function public.admin_api_usage_stats(p_days int default 7)
returns json
language sql
security definer
as $$
  select json_build_object(
    'total_requests', (select count(*) from public.api_usage_logs where created_at >= now() - (p_days || ' days')::interval),
    'total_errors', (select count(*) from public.api_usage_logs where status_code >= 400 and created_at >= now() - (p_days || ' days')::interval),
    'avg_response_time', (select round(avg(response_time_ms), 0) from public.api_usage_logs where created_at >= now() - (p_days || ' days')::interval),
    'top_endpoints', (select json_agg(row_to_json(t)) from (
                        select endpoint, count(*) as count
                        from public.api_usage_logs
                        where created_at >= now() - (p_days || ' days')::interval
                        group by endpoint
                        order by count(*) desc
                        limit 10
                      ) t),
    'quota_usage_by_day', (select json_agg(row_to_json(t)) from (
                            select date_trunc('day', created_at)::date as day, sum(quota_used) as total
                            from public.api_usage_logs
                            where created_at >= now() - (p_days || ' days')::interval
                            group by date_trunc('day', created_at)
                            order by day desc
                          ) t)
  );
$$;

-- ─── 6. RPC admin_trigger_backup ─────────────────────────────
create or replace function public.admin_trigger_backup(p_type text default 'full')
returns uuid
language plpgsql
security definer
as $$
declare
  backup_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  insert into public.backups (type, status, triggered_by, tables_included)
  values (
    p_type,
    'running',
    auth.uid(),
    case p_type
      when 'full' then array['profiles', 'transactions', 'partners', 'newsletter_subscribers']
      when 'users' then array['profiles', 'user_roles']
      when 'transactions' then array['transactions', 'partners']
      else array['profiles']
    end
  )
  returning id into backup_id;

  -- Log
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'backup_triggered', 'system', backup_id::text, jsonb_build_object('type', p_type));

  return backup_id;
end;
$$;

-- ─── 7. RPC admin_export_newsletter_csv ──────────────────────
create or replace function public.admin_export_newsletter_csv(p_active_only boolean default true)
returns text
language plpgsql
security definer
as $$
declare
  result text;
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  select string_agg(
    email || ',' || 
    coalesce(name, '') || ',' || 
    is_active::text || ',' || 
    confirmed::text || ',' ||
    subscribed_at::text,
    e'\n'
  )
  into result
  from public.newsletter_subscribers
  where (not p_active_only or is_active = true)
  limit 50000;

  return 'email,name,is_active,confirmed,subscribed_at' || e'\n' || coalesce(result, '');
end;
$$;

-- ─── 8. Seed newsletter test data ─────────────────────────
insert into public.newsletter_subscribers (email, name, is_active, confirmed, subscribed_at)
values 
  ('test1@example.com', 'Test User 1', true, true, now() - interval '5 days'),
  ('test2@example.com', 'Test User 2', true, true, now() - interval '3 days'),
  ('test3@example.com', null, false, true, now() - interval '10 days')
on conflict (email) do nothing;

-- ─── NOTE : Activer Realtime pour les tables si besoin ───────
-- Dashboard Supabase → Database → Replication
-- Ajouter : newsletter_subscribers, api_usage_logs, backups
