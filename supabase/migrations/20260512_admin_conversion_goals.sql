create table if not exists public.analytics_goals (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  path_pattern text,
  event_type text not null,
  target_count integer default 1000,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.analytics_conversions (
  id uuid default gen_random_uuid() primary key,
  goal_id uuid references public.analytics_goals(id),
  session_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  value_eur numeric(10, 2),
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists conversions_goal_idx on public.analytics_conversions(goal_id, created_at desc);
create index if not exists conversions_user_idx on public.analytics_conversions(user_id);

alter table public.analytics_goals enable row level security;
alter table public.analytics_conversions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'analytics_goals' and policyname = 'Admins can manage goals') then
    create policy "Admins can manage goals" on public.analytics_goals for all using (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where tablename = 'analytics_conversions' and policyname = 'Admins can view conversions') then
    create policy "Admins can view conversions" on public.analytics_conversions for select using (public.is_admin());
  end if;
end $$;

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
  select id into v_goal_id from public.analytics_goals
  where name = p_goal_name and is_active = true
  limit 1;

  if v_goal_id is null then
    return;
  end if;

  insert into public.analytics_conversions (goal_id, session_id, user_id, value_eur, metadata)
  values (v_goal_id, p_session_id, p_user_id, p_value_eur, p_metadata);
end;
$$;

insert into public.analytics_goals (name, event_type, path_pattern, target_count)
values
  ('Inscription', 'conversion', '/auth', 500),
  ('Abonnement VIP', 'conversion', '/pricing', 200),
  ('Parrainage', 'conversion', '/profile', 100),
  ('Favoris ajouté', 'click', '/match/*', 1000),
  ('VIP CTA Click', 'click', '/*', 2000),
  ('VIP Checkout Started', 'conversion', '/pricing', 500),
  ('VIP Checkout Success', 'conversion', '/pricing', 200),
  ('VIP Checkout Cancel', 'conversion', '/pricing', 100),
  ('Affiliate CTA Click', 'click', '/*', 1000),
  ('Affiliate Promo Copied', 'click', '/*', 1000)
on conflict (name) do nothing;
