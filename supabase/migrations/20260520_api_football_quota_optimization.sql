-- Persistent API-Football quota accounting and monitoring.

create table if not exists public.api_football_daily_usage (
  day date primary key default current_date,
  upstream_count integer not null default 0,
  cache_hits integer not null default 0,
  stale_hits integer not null default 0,
  quota_exceeded_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.api_football_daily_usage enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'api_football_daily_usage'
      and policyname = 'Admins can view API football daily usage'
  ) then
    create policy "Admins can view API football daily usage"
      on public.api_football_daily_usage
      for select
      using (public.is_admin());
  end if;
end $$;

grant all on public.api_football_daily_usage to service_role;
grant select on public.api_football_daily_usage to authenticated;

alter table public.api_usage_logs
  add column if not exists cache_status text,
  add column if not exists cache_key text,
  add column if not exists metadata jsonb not null default '{}';

create index if not exists api_usage_cache_status_idx
  on public.api_usage_logs(cache_status, created_at desc);

create or replace function public.consume_api_football_quota(
  p_day date,
  p_limit integer
)
returns json
language plpgsql
security definer
as $$
declare
  current_count integer;
  remaining integer;
begin
  insert into public.api_football_daily_usage(day, upstream_count, updated_at)
  values (p_day, 0, now())
  on conflict (day) do nothing;

  select upstream_count
    into current_count
  from public.api_football_daily_usage
  where day = p_day
  for update;

  if current_count >= p_limit then
    update public.api_football_daily_usage
      set quota_exceeded_count = quota_exceeded_count + 1,
          updated_at = now()
      where day = p_day;

    return json_build_object(
      'allowed', false,
      'used', current_count,
      'remaining', 0,
      'limit', p_limit
    );
  end if;

  update public.api_football_daily_usage
    set upstream_count = upstream_count + 1,
        updated_at = now()
    where day = p_day
    returning upstream_count into current_count;

  remaining := greatest(p_limit - current_count, 0);

  return json_build_object(
    'allowed', true,
    'used', current_count,
    'remaining', remaining,
    'limit', p_limit
  );
end;
$$;

create or replace function public.record_api_football_cache_event(
  p_day date,
  p_cache_status text
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.api_football_daily_usage(day, updated_at)
  values (p_day, now())
  on conflict (day) do nothing;

  update public.api_football_daily_usage
    set cache_hits = cache_hits + case when p_cache_status in ('MEMORY_HIT', 'HIT') then 1 else 0 end,
        stale_hits = stale_hits + case when p_cache_status = 'STALE' then 1 else 0 end,
        updated_at = now()
    where day = p_day;
end;
$$;

create or replace function public.admin_api_usage_stats(p_days int default 7)
returns json
language sql
security definer
as $$
  select json_build_object(
    'total_requests', (select count(*) from public.api_usage_logs where created_at >= now() - (p_days || ' days')::interval),
    'total_errors', (select count(*) from public.api_usage_logs where status_code >= 400 and created_at >= now() - (p_days || ' days')::interval),
    'avg_response_time', coalesce((select round(avg(response_time_ms), 0) from public.api_usage_logs where created_at >= now() - (p_days || ' days')::interval), 0),
    'top_endpoints', coalesce((select json_agg(row_to_json(t)) from (
                        select endpoint, count(*) as count
                        from public.api_usage_logs
                        where created_at >= now() - (p_days || ' days')::interval
                        group by endpoint
                        order by count(*) desc
                        limit 10
                      ) t), '[]'::json),
    'quota_usage_by_day', coalesce((select json_agg(row_to_json(t)) from (
                            select day, upstream_count as total
                            from public.api_football_daily_usage
                            where day >= current_date - (p_days || ' days')::interval
                            order by day desc
                          ) t), '[]'::json),
    'quota_limit', 7000,
    'quota_used_today', coalesce((select upstream_count from public.api_football_daily_usage where day = current_date), 0),
    'quota_remaining_today', greatest(7000 - coalesce((select upstream_count from public.api_football_daily_usage where day = current_date), 0), 0),
    'cache_hits_today', coalesce((select cache_hits from public.api_football_daily_usage where day = current_date), 0),
    'stale_hits_today', coalesce((select stale_hits from public.api_football_daily_usage where day = current_date), 0),
    'quota_exceeded_today', coalesce((select quota_exceeded_count from public.api_football_daily_usage where day = current_date), 0),
    'recent_api_events', coalesce((select json_agg(row_to_json(t)) from (
                            select created_at, endpoint, status_code, response_time_ms, quota_remaining, cache_status, error_message
                            from public.api_usage_logs
                            where endpoint like 'api-football/%'
                            order by created_at desc
                            limit 20
                          ) t), '[]'::json)
  );
$$;
