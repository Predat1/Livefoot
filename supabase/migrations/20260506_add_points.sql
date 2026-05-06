-- Add points and rank to profiles
alter table public.profiles add column if not exists points integer default 0;
alter table public.profiles add column if not exists rank_title text default 'Débutant';

-- Update predictions logic to reward points (optional, but good for backend logic)
-- For now we handle it on the frontend as requested, but a trigger is better.
