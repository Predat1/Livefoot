-- ─── Referral / Parrainage System ────────────────────────────

-- Colonnes sur profiles
alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referral_vip_granted_at timestamptz;

-- Table des parrainages
create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references auth.users on delete cascade not null,
  referred_id uuid references auth.users on delete cascade,
  referral_code text not null,
  status text default 'accepted',
  created_at timestamptz default now()
);

-- Index pour compter rapidement les parrainages d'un utilisateur
create index if not exists referrals_referrer_idx on public.referrals(referrer_id);
create index if not exists referrals_code_idx on public.referrals(referral_code);

-- RLS
alter table public.referrals enable row level security;
create policy "Users see own referrals" on public.referrals
  for select using (auth.uid() = referrer_id);
create policy "Anyone can insert referral on signup" on public.referrals
  for insert with check (true);
