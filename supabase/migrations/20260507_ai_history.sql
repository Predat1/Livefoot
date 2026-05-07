-- Create AI Predictions History Table
create table if not exists public.ai_predictions_history (
  id uuid default gen_random_uuid() primary key,
  fixture_id text not null,
  home_team text not null,
  away_team text not null,
  predicted_score text not null,
  actual_score text,
  is_correct boolean,
  market_1x2_correct boolean,
  prediction_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ai_predictions_history enable row level security;
create policy "History is viewable by everyone" on public.ai_predictions_history for select using (true);
