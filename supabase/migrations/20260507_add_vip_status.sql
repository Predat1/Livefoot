-- Add VIP status to profiles
alter table public.profiles add column if not exists is_vip boolean default false;
alter table public.profiles add column if not exists vip_expires_at timestamp with time zone;
alter table public.profiles add column if not exists last_license_key text;
