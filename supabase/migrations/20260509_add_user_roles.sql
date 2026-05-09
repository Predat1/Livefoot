-- ─── User Roles Table ─────────────────────────────────────────

create table if not exists public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('admin', 'moderator', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, role)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Only admins can view all roles, users can see their own
create policy "Users can view their own roles." on public.user_roles
  for select using (auth.uid() = user_id);

create policy "Admins can view all roles." on public.user_roles
  for select using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert roles." on public.user_roles
  for insert with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete roles." on public.user_roles
  for delete using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ─── Admin Stats RPC ──────────────────────────────────────────

create or replace function public.admin_stats()
returns json
language sql
security definer
as $$
  select json_build_object(
    'total_users',            (select count(*) from public.profiles),
    'total_predictions',      (select count(*) from public.match_predictions),
    'total_ratings',          (select count(*) from public.match_ratings),
    'total_favorites',        (select count(*) from public.favorites),
    'users_with_predictions', (select count(distinct user_id) from public.match_predictions),
    'users_with_ratings',     (select count(distinct user_id) from public.match_ratings),
    'recent_signups_7d',      (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    'recent_signups_30d',     (select count(*) from public.profiles where created_at >= now() - interval '30 days')
  );
$$;

-- ─── Assign first admin manually ──────────────────────────────
-- After running this migration, execute the following to give yourself admin:
--
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'
-- FROM auth.users
-- WHERE email = 'Mobifranck310@gmail.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
