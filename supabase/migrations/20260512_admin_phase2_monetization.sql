-- ═══════════════════════════════════════════════════════════════
-- PHASE 2 : Monétisation & VIP — Transactions, Partenaires, Stats revenus
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Table transactions (historique des paiements/abonnements) ─
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,                         -- snapshot au moment de la transaction
  type text not null,                      -- 'vip_subscription', 'tip', 'refund'
  amount_eur numeric(10, 2) not null,      -- montant en euros
  currency text default 'EUR',
  status text not null default 'pending',  -- 'pending', 'completed', 'failed', 'refunded'
  payment_method text,                     -- 'stripe', 'paypal', 'crypto', 'chariow'
  external_id text,                        -- ID externe (Stripe payment intent, etc.)
  metadata jsonb,                          -- { plan: 'monthly', duration_days: 30, license_key: 'xxx' }
  partner_id uuid references public.partners(id), -- si parrainage/partenaire
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index transactions_user_idx on public.transactions(user_id, created_at desc);
create index transactions_status_idx on public.transactions(status);
create index transactions_type_idx on public.transactions(type);
create index transactions_date_idx on public.transactions(created_at desc);
create index transactions_partner_idx on public.transactions(partner_id);

-- RLS transactions
alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Admins can view all transactions"
  on public.transactions for select
  using (public.is_admin());

create policy "Admins can insert transactions"
  on public.transactions for insert
  with check (public.is_admin());

create policy "Admins can update transactions"
  on public.transactions for update
  using (public.is_admin());

-- ─── 2. Table partners (affiliés, bookmakers, partenaires) ─────
create table if not exists public.partners (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null,                      -- 'affiliate', 'bookmaker', 'sponsor', 'content'
  logo_url text,
  website_url text,
  commission_rate numeric(5, 2),         -- % de commission (ex: 15.00 pour 15%)
  flat_amount_eur numeric(10, 2),        -- montant fixe par conversion
  tracking_code text unique,             -- code de tracking unique
  is_active boolean default true,
  click_count integer default 0,         -- nombre de clics (via edge function)
  conversion_count integer default 0,    -- nombre de conversions
  revenue_eur numeric(12, 2) default 0,  -- revenus générés
  contract_start timestamptz,
  contract_end timestamptz,
  contact_email text,
  contact_name text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index partners_type_idx on public.partners(type);
create index partners_active_idx on public.partners(is_active);
create index partners_tracking_idx on public.partners(tracking_code);

-- RLS partners
alter table public.partners enable row level security;

create policy "Anyone can view active partners"
  on public.partners for select
  using (is_active = true);

create policy "Admins can manage partners"
  on public.partners for all
  using (public.is_admin());

-- ─── 3. RPC admin_revenue_stats ───────────────────────────────
create or replace function public.admin_revenue_stats()
returns json
language sql
security definer
as $$
  select json_build_object(
    -- Recettes VIP
    'total_revenue_eur',      (select coalesce(sum(amount_eur), 0) from public.transactions where status = 'completed' and type = 'vip_subscription'),
    'revenue_7d_eur',         (select coalesce(sum(amount_eur), 0) from public.transactions where status = 'completed' and type = 'vip_subscription' and created_at >= now() - interval '7 days'),
    'revenue_30d_eur',        (select coalesce(sum(amount_eur), 0) from public.transactions where status = 'completed' and type = 'vip_subscription' and created_at >= now() - interval '30 days'),
    
    -- Stats partenaires
    'partner_revenue_eur',    (select coalesce(sum(revenue_eur), 0) from public.partners),
    'total_clicks',           (select coalesce(sum(click_count), 0) from public.partners),
    'total_conversions',      (select coalesce(sum(conversion_count), 0) from public.partners),
    
    -- Stats transactions
    'transactions_count',     (select count(*) from public.transactions),
    'transactions_7d',        (select count(*) from public.transactions where created_at >= now() - interval '7 days'),
    'pending_count',          (select count(*) from public.transactions where status = 'pending'),
    'failed_count',           (select count(*) from public.transactions where status = 'failed'),
    
    -- Répartition par méthode de paiement
    'stripe_revenue',         (select coalesce(sum(amount_eur), 0) from public.transactions where status = 'completed' and payment_method = 'stripe'),
    'paypal_revenue',         (select coalesce(sum(amount_eur), 0) from public.transactions where status = 'completed' and payment_method = 'paypal'),
    'crypto_revenue',         (select coalesce(sum(amount_eur), 0) from public.transactions where status = 'completed' and payment_method = 'crypto'),
    'chariow_revenue',        (select coalesce(sum(amount_eur), 0) from public.transactions where status = 'completed' and payment_method = 'chariow'),
    
    -- ARPU (Average Revenue Per User)
    'arpu_eur',               case 
                                when (select count(distinct user_id) from public.transactions where status = 'completed') = 0 
                                then 0 
                                else (
                                  select round(sum(amount_eur) / count(distinct user_id), 2) 
                                  from public.transactions 
                                  where status = 'completed'
                                ) 
                              end
  );
$$;

-- ─── 4. RPC admin_transactions_list ───────────────────────────
create or replace function public.admin_transactions_list(
  p_limit int default 50,
  p_offset int default 0,
  p_status text default null,
  p_type text default null
)
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  type text,
  amount_eur numeric,
  currency text,
  status text,
  payment_method text,
  external_id text,
  metadata jsonb,
  partner_name text,
  created_at timestamptz
)
language sql
security definer
as $$
  select 
    t.id,
    t.user_id,
    t.user_email,
    t.type,
    t.amount_eur,
    t.currency,
    t.status,
    t.payment_method,
    t.external_id,
    t.metadata,
    p.name as partner_name,
    t.created_at
  from public.transactions t
  left join public.partners p on t.partner_id = p.id
  where 
    (p_status is null or t.status = p_status)
    and (p_type is null or t.type = p_type)
  order by t.created_at desc
  limit p_limit offset p_offset;
$$;

-- ─── 5. RPC admin_partner_crud ──────────────────────────────
create or replace function public.admin_partner_create(
  p_name text,
  p_type text,
  p_website_url text default null,
  p_commission_rate numeric default null,
  p_flat_amount_eur numeric default null,
  p_tracking_code text default null,
  p_contact_email text default null,
  p_contact_name text default null,
  p_contract_start timestamptz default null,
  p_contract_end timestamptz default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  new_id uuid;
  new_tracking text;
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;
  
  -- Generation code tracking si non fourni
  new_tracking := coalesce(p_tracking_code, 'LF_' || substr(md5(random()::text), 1, 8));
  
  insert into public.partners (
    name, type, website_url, commission_rate, flat_amount_eur,
    tracking_code, contact_email, contact_name,
    contract_start, contract_end, notes
  ) values (
    p_name, p_type, p_website_url, p_commission_rate, p_flat_amount_eur,
    new_tracking, p_contact_email, p_contact_name,
    p_contract_start, p_contract_end, p_notes
  ) returning id into new_id;
  
  -- Log
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'partner_create', 'partner', new_id::text, jsonb_build_object(
    'name', p_name,
    'type', p_type,
    'tracking_code', new_tracking
  ));
  
  return new_id;
end;
$$;

create or replace function public.admin_partner_update(
  p_partner_id uuid,
  p_name text default null,
  p_type text default null,
  p_website_url text default null,
  p_commission_rate numeric default null,
  p_flat_amount_eur numeric default null,
  p_is_active boolean default null,
  p_contact_email text default null,
  p_contact_name text default null,
  p_contract_end timestamptz default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;
  
  update public.partners
  set
    name = coalesce(p_name, name),
    type = coalesce(p_type, type),
    website_url = coalesce(p_website_url, website_url),
    commission_rate = coalesce(p_commission_rate, commission_rate),
    flat_amount_eur = coalesce(p_flat_amount_eur, flat_amount_eur),
    is_active = coalesce(p_is_active, is_active),
    contact_email = coalesce(p_contact_email, contact_email),
    contact_name = coalesce(p_contact_name, contact_name),
    contract_end = coalesce(p_contract_end, contract_end),
    notes = coalesce(p_notes, notes),
    updated_at = now()
  where id = p_partner_id;
  
  -- Log
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'partner_update', 'partner', p_partner_id::text, '{}');
end;
$$;

create or replace function public.admin_partner_delete(p_partner_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;
  
  -- Soft delete : desactivation
  update public.partners set is_active = false, updated_at = now() where id = p_partner_id;
  
  -- Log
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'partner_delete', 'partner', p_partner_id::text, '{}');
end;
$$;

-- ─── 6. Trigger mise à jour updated_at ─────────────────────────
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.update_updated_at_column();

create trigger partners_updated_at
  before update on public.partners
  for each row execute function public.update_updated_at_column();

-- ─── NOTE : Seeding exemple ───────────────────────────────────
-- Exemple d'insertion d'un partenaire bookmaker :
-- 
-- select public.admin_partner_create(
--   '1xBet',
--   'bookmaker',
--   'https://1xbet.com',
--   25.00,    -- 25% commission
--   null,
--   null,     -- tracking auto-gen
--   'aff@1xbet.com',
--   'John Partner'
-- );
