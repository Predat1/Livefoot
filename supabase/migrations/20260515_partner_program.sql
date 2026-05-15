-- ─── Partner/Affiliate Program Migration ─────────────────────
-- Unifié: Parrainage + Programme Partenaire avec commissions

-- 1. Table: Referral Commissions (track earnings per referred subscription)
create table if not exists public.referral_commissions (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references auth.users on delete cascade not null,
  referred_id uuid references auth.users on delete cascade not null,
  subscription_amount numeric(10,2) not null,
  commission_rate numeric(5,2) not null, -- e.g., 10.00 for 10%
  commission_amount numeric(10,2) not null,
  status text default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  created_at timestamptz default now(),
  paid_at timestamptz,
  metadata jsonb default '{}'
);

-- 2. Table: Referral Balance (current balance per user)
create table if not exists public.referral_balance (
  user_id uuid references auth.users on delete cascade primary key,
  pending_balance numeric(10,2) default 0,
  available_balance numeric(10,2) default 0,
  total_earned numeric(10,2) default 0,
  total_paid numeric(10,2) default 0,
  last_paid_at timestamptz,
  updated_at timestamptz default now()
);

-- 3. Table: Referral Payouts (withdrawal requests)
create table if not exists public.referral_payouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount numeric(10,2) not null, -- in EUR
  amount_fcfa numeric(10,2) not null, -- converted amount
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  payment_method text not null,
  payment_details jsonb not null, -- { operator, phone_number, full_name, country, city }
  requested_at timestamptz default now(),
  processed_at timestamptz,
  processed_by uuid references auth.users,
  rejection_reason text,
  notes text
);

-- 4. Table: Partner Profiles (KYC/payment info)
create table if not exists public.partner_profiles (
  user_id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  country text not null,
  city text not null,
  whatsapp_number text, -- Required for communication (validated in app)
  payment_methods jsonb default '[]', -- array of { operator, phone_number, is_default }
  is_partner_approved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Add columns to existing tables
alter table public.profiles add column if not exists is_partner boolean default false;
alter table public.profiles add column if not exists partner_activated_at timestamptz;
alter table public.referrals add column if not exists converted_to_paid_at timestamptz;
alter table public.referrals add column if not exists total_commissions_earned numeric(10,2) default 0;

-- 6. Indexes for performance
create index if not exists commissions_referrer_idx on public.referral_commissions(referrer_id);
create index if not exists commissions_referred_idx on public.referral_commissions(referred_id);
create index if not exists commissions_status_idx on public.referral_commissions(status);
create index if not exists payouts_user_idx on public.referral_payouts(user_id);
create index if not exists payouts_status_idx on public.referral_payouts(status);
create index if not exists payouts_requested_at_idx on public.referral_payouts(requested_at);

-- 7. Enable RLS
alter table public.referral_commissions enable row level security;
alter table public.referral_balance enable row level security;
alter table public.referral_payouts enable row level security;
alter table public.partner_profiles enable row level security;

-- 8. RLS Policies

-- Referral Commissions: Users see their own commissions
CREATE POLICY "Users see own commissions" ON public.referral_commissions
  FOR SELECT USING (auth.uid() = referrer_id);

-- Referral Balance: Users see and update own balance (system updates mainly)
CREATE POLICY "Users see own balance" ON public.referral_balance
  FOR SELECT USING (auth.uid() = user_id);

-- Referral Payouts: Users see own payouts
CREATE POLICY "Users see own payouts" ON public.referral_payouts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own payouts" ON public.referral_payouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Partner Profiles: Users manage own profile
CREATE POLICY "Users manage own partner profile" ON public.partner_profiles
  FOR ALL USING (auth.uid() = user_id);

-- 9. Function to calculate commission rate based on referral count
CREATE OR REPLACE FUNCTION public.get_commission_rate(referral_count integer)
RETURNS numeric AS $$
BEGIN
  RETURN CASE
    WHEN referral_count >= 101 THEN 30.00
    WHEN referral_count >= 51 THEN 25.00
    WHEN referral_count >= 31 THEN 20.00
    WHEN referral_count >= 16 THEN 15.00
    WHEN referral_count >= 5 THEN 10.00
    ELSE 0.00
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function to convert EUR to FCFA (1 EUR = 655.957 FCFA, rounded)
CREATE OR REPLACE FUNCTION public.eur_to_fcfa(amount_eur numeric)
RETURNS numeric AS $$
BEGIN
  RETURN ROUND(amount_eur * 655.957, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger to update referral_balance when commission is inserted/updated
CREATE OR REPLACE FUNCTION public.update_referral_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update balance record
  INSERT INTO public.referral_balance (user_id, pending_balance, total_earned)
  VALUES (
    NEW.referrer_id,
    CASE WHEN NEW.status = 'pending' THEN NEW.commission_amount ELSE 0 END,
    NEW.commission_amount
  )
  ON CONFLICT (user_id) DO UPDATE SET
    pending_balance = public.referral_balance.pending_balance + 
      CASE WHEN NEW.status = 'pending' THEN NEW.commission_amount ELSE 0 END -
      CASE WHEN TG_OP = 'UPDATE' AND OLD.status = 'pending' THEN OLD.commission_amount ELSE 0 END,
    available_balance = public.referral_balance.available_balance + 
      CASE WHEN NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status != 'paid') THEN NEW.commission_amount ELSE 0 END,
    total_earned = public.referral_balance.total_earned + 
      CASE WHEN TG_OP = 'INSERT' THEN NEW.commission_amount ELSE 0 END,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_balance_on_commission ON public.referral_commissions;
CREATE TRIGGER update_balance_on_commission
  AFTER INSERT OR UPDATE ON public.referral_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_referral_balance();

-- 12. Function to process payout approval (move pending to available)
CREATE OR REPLACE FUNCTION public.approve_payout(payout_id uuid, admin_user_id uuid)
RETURNS void AS $$
DECLARE
  v_payout public.referral_payouts%ROWTYPE;
  v_user_id uuid;
BEGIN
  -- Get payout details
  SELECT * INTO v_payout FROM public.referral_payouts WHERE id = payout_id;
  
  IF v_payout.status != 'pending' THEN
    RAISE EXCEPTION 'Payout is not in pending status';
  END IF;

  -- Update payout status
  UPDATE public.referral_payouts SET
    status = 'approved',
    processed_at = now(),
    processed_by = admin_user_id
  WHERE id = payout_id;

  -- Update balance: subtract from available, add to total_paid
  UPDATE public.referral_balance SET
    available_balance = available_balance - v_payout.amount,
    total_paid = total_paid + v_payout.amount,
    last_paid_at = now(),
    updated_at = now()
  WHERE user_id = v_payout.user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. View for admin: partner statistics
CREATE OR REPLACE VIEW public.admin_partner_stats AS
SELECT 
  p.id,
  p.user_id,
  p.display_name,
  p.email,
  p.referral_code,
  p.is_partner,
  p.partner_activated_at,
  COALESCE(rb.total_earned, 0) as total_earned,
  COALESCE(rb.available_balance, 0) as available_balance,
  COALESCE(rb.pending_balance, 0) as pending_balance,
  COALESCE(rb.total_paid, 0) as total_paid,
  (SELECT COUNT(*) FROM public.referrals r WHERE r.referrer_id = p.user_id) as total_referrals,
  (SELECT COUNT(*) FROM public.referrals r WHERE r.referrer_id = p.user_id AND r.converted_to_paid_at IS NOT NULL) as paid_referrals,
  (SELECT COUNT(*) FROM public.referral_payouts rp WHERE rp.user_id = p.user_id AND rp.status = 'pending') as pending_payouts,
  pp.full_name as partner_full_name,
  pp.country as partner_country,
  pp.city as partner_city,
  pp.whatsapp_number as partner_whatsapp,
  pp.is_partner_approved
FROM public.profiles p
LEFT JOIN public.referral_balance rb ON rb.user_id = p.user_id
LEFT JOIN public.partner_profiles pp ON pp.user_id = p.user_id;

-- Grant access to the view for authenticated users (admin check in app layer)
GRANT SELECT ON public.admin_partner_stats TO authenticated;
