-- ─── Initialization of LiveFoot Schema v2 ──────────────────────

-- 1. Profiles Table (extending auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  user_id uuid references auth.users on delete cascade not null,
  display_name text,
  username text unique,
  avatar_url text,
  bio text,
  favorite_team text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Favorites Table
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  entity_id text not null,
  entity_type text not null check (entity_type in ('team', 'player', 'competition')),
  entity_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, entity_id, entity_type)
);

-- 3. Match Predictions Table
create table if not exists public.match_predictions (
  id uuid default gen_random_uuid() primary key,
  fixture_id text not null,
  user_id uuid references auth.users on delete cascade not null,
  home_score integer not null,
  away_score integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(fixture_id, user_id)
);

-- 4. Match Ratings Table (Player Performance)
create table if not exists public.match_ratings (
  id uuid default gen_random_uuid() primary key,
  fixture_id text not null,
  player_id text not null,
  user_id uuid references auth.users on delete cascade not null,
  rating numeric(3,1) not null check (rating >= 0 and rating <= 10),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(fixture_id, player_id, user_id)
);

-- ─── RLS Policies ─────────────────────────────────────────────

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.match_predictions enable row level security;
alter table public.match_ratings enable row level security;

-- Profiles: Users can view any profile, but only update their own
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Favorites: Users can only see and manage their own favorites
create policy "Users can view own favorites" on public.favorites for select using (auth.uid() = user_id);
create policy "Users can manage own favorites" on public.favorites for all using (auth.uid() = user_id);

-- Predictions: Everyone can see stats, users can manage own
create policy "Predictions are viewable by everyone" on public.match_predictions for select using (true);
create policy "Users can manage own predictions" on public.match_predictions for all using (auth.uid() = user_id);

-- Ratings: Everyone can see stats, users can manage own
create policy "Ratings are viewable by everyone" on public.match_ratings for select using (true);
create policy "Users can manage own ratings" on public.match_ratings for all using (auth.uid() = user_id);

-- ─── Functions & Aggregations ─────────────────────────────────

-- Function to get prediction statistics for a fixture
create or replace function public.get_prediction_stats(_fixture_id text)
returns json as $$
declare
    result json;
begin
    select json_build_object(
        'total', count(*),
        'home_wins', count(*) filter (where home_score > away_score),
        'draws', count(*) filter (where home_score = away_score),
        'away_wins', count(*) filter (where home_score < away_score),
        'avg_home', coalesce(avg(home_score), 0),
        'avg_away', coalesce(avg(away_score), 0),
        'top_scores', (
            select json_agg(t) from (
                select (home_score || '-' || away_score) as score, count(*) as count
                from public.match_predictions
                where fixture_id = _fixture_id
                group by score
                order by count(*) desc
                limit 3
            ) t
        )
    ) into result
    from public.match_predictions
    where fixture_id = _fixture_id;
    
    return coalesce(result, json_build_object('total', 0, 'home_wins', 0, 'draws', 0, 'away_wins', 0, 'avg_home', 0, 'avg_away', 0, 'top_scores', '[]'::json));
end;
$$ language plpgsql security definer;

-- Trigger for profile creation on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, user_id, display_name, avatar_url)
  values (new.id, new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
