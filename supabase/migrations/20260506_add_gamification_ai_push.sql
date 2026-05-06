-- 1. Update Match Predictions for Gamification
alter table public.match_predictions add column if not exists points_earned integer default 0;
alter table public.match_predictions add column if not exists status text default 'pending' check (status in ('pending', 'evaluated'));

-- 2. Create AI Predictions Cache
create table if not exists public.ai_predictions_cache (
  fixture_id text primary key,
  data jsonb not null,
  match_status text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ai_predictions_cache enable row level security;
create policy "AI Cache is viewable by everyone" on public.ai_predictions_cache for select using (true);
-- Insert/Update managed by edge functions via service role

-- 3. Create Push Subscriptions Table
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.push_subscriptions enable row level security;
create policy "Users can view own subscriptions" on public.push_subscriptions for select using (auth.uid() = user_id);
create policy "Users can manage own subscriptions" on public.push_subscriptions for all using (auth.uid() = user_id);
-- Anonymous can also subscribe (if we want, but usually user_id is better). Let's allow anon to insert with null user_id
create policy "Anon can insert subscriptions" on public.push_subscriptions for insert with check (true);
