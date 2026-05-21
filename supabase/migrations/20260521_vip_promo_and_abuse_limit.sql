-- ═══════════════════════════════════════════════════════════════════
-- Migration: VIP Free Promo Trial + IP Anti-Abuse + Admin Metrics
-- Date: 2026-05-21
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. pre_signup_authorizations
--    Written by the Edge Function before Supabase creates the user.
--    The BEFORE INSERT trigger on auth.users validates this token.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pre_signup_authorizations (
  token      TEXT PRIMARY KEY,
  ip_hash    TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pre_signup_authorizations ENABLE ROW LEVEL SECURITY;
-- Only service_role may touch this table (edge functions use service_role key)
CREATE POLICY "service_role manages pre_signup_authorizations"
  ON public.pre_signup_authorizations FOR ALL
  TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON public.pre_signup_authorizations TO service_role;

-- Cleanup expired rows automatically (best-effort, no cron required)
CREATE INDEX IF NOT EXISTS idx_psa_expires_at ON public.pre_signup_authorizations (expires_at);

-- ─────────────────────────────────────────────────────────────────
-- 2. registration_ip_logs
--    Records hashed IPs of completed signups for anti-abuse checks.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.registration_ip_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash    TEXT NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.registration_ip_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role manages registration_ip_logs"
  ON public.registration_ip_logs FOR ALL
  TO service_role USING (true) WITH CHECK (true);
-- Admins can view
CREATE POLICY "admins can view registration_ip_logs"
  ON public.registration_ip_logs FOR SELECT
  USING (public.is_admin());

GRANT ALL ON public.registration_ip_logs TO service_role;
GRANT SELECT ON public.registration_ip_logs TO authenticated;

CREATE INDEX IF NOT EXISTS idx_reg_ip_hash ON public.registration_ip_logs (ip_hash, registered_at);

-- ─────────────────────────────────────────────────────────────────
-- 3. promo_trials
--    One row per user who has claimed (or been auto-granted) the
--    free 7-day VIP trial promotion.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promo_trials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  source      TEXT NOT NULL DEFAULT 'existing_user', -- 'new_signup' | 'existing_user'
  CONSTRAINT promo_trials_user_unique UNIQUE (user_id)
);

ALTER TABLE public.promo_trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own promo trial"
  ON public.promo_trials FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "service_role manages promo_trials"
  ON public.promo_trials FOR ALL
  TO service_role USING (true) WITH CHECK (true);
-- Admins can view all
CREATE POLICY "admins can view all promo trials"
  ON public.promo_trials FOR SELECT
  USING (public.is_admin());

GRANT ALL ON public.promo_trials TO service_role;
GRANT SELECT ON public.promo_trials TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 4. Promotion Settings (insert defaults into site_settings)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.site_settings (key, value, description)
VALUES
  ('promo_vip_enabled',  'true',  'Promotion VIP gratuite 7 jours activée'),
  ('promo_vip_duration_days', '7', 'Durée en jours du VIP gratuit promotionnel'),
  ('promo_vip_max_per_ip', '3', 'Nombre max de comptes par IP pendant la promo'),
  ('promo_vip_end_date', '2026-06-30T23:59:59Z', 'Date de fin de la promotion VIP')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 5. RPC: activate_existing_user_promo
--    Called from frontend for existing users who want to claim the
--    free trial.  One claim per user max.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.activate_existing_user_promo()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_enabled BOOLEAN;
  v_end_date TIMESTAMPTZ;
  v_duration INT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  -- Check promo is enabled
  SELECT (value = 'true') INTO v_enabled
  FROM public.site_settings WHERE key = 'promo_vip_enabled';
  IF NOT COALESCE(v_enabled, false) THEN
    RETURN json_build_object('success', false, 'error', 'Promotion non active');
  END IF;

  -- Check promo end date
  SELECT value::TIMESTAMPTZ INTO v_end_date
  FROM public.site_settings WHERE key = 'promo_vip_end_date';
  IF v_end_date IS NOT NULL AND NOW() > v_end_date THEN
    RETURN json_build_object('success', false, 'error', 'Promotion expirée');
  END IF;

  -- Check if already claimed
  IF EXISTS (SELECT 1 FROM public.promo_trials WHERE user_id = v_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Déjà réclamé');
  END IF;

  -- Get duration
  SELECT COALESCE(value::INT, 7) INTO v_duration
  FROM public.site_settings WHERE key = 'promo_vip_duration_days';
  v_expires_at := NOW() + (v_duration || ' days')::INTERVAL;

  -- Insert promo trial record
  INSERT INTO public.promo_trials (user_id, expires_at, source)
  VALUES (v_user_id, v_expires_at, 'existing_user');

  -- Update profile VIP status
  UPDATE public.profiles
  SET is_vip = true,
      vip_expires_at = v_expires_at::TEXT
  WHERE user_id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'expires_at', v_expires_at,
    'duration_days', v_duration
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_existing_user_promo() TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 6. RPC: get_promo_metrics  (admin only)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_promo_metrics()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_trials',            (SELECT COUNT(*) FROM public.promo_trials),
    'new_signup_trials',       (SELECT COUNT(*) FROM public.promo_trials WHERE source = 'new_signup'),
    'existing_user_trials',    (SELECT COUNT(*) FROM public.promo_trials WHERE source = 'existing_user'),
    'active_trials',           (SELECT COUNT(*) FROM public.promo_trials WHERE expires_at > NOW()),
    'expired_trials',          (SELECT COUNT(*) FROM public.promo_trials WHERE expires_at <= NOW()),
    'total_ip_logs',           (SELECT COUNT(*) FROM public.registration_ip_logs),
    'unique_ips',              (SELECT COUNT(DISTINCT ip_hash) FROM public.registration_ip_logs),
    'promo_enabled',           (SELECT value FROM public.site_settings WHERE key = 'promo_vip_enabled'),
    'promo_end_date',          (SELECT value FROM public.site_settings WHERE key = 'promo_vip_end_date'),
    'promo_duration_days',     (SELECT value FROM public.site_settings WHERE key = 'promo_vip_duration_days'),
    'recent_trials',           COALESCE((SELECT json_agg(t) FROM (
                                 SELECT pt.user_id, pt.claimed_at, pt.expires_at, pt.source, p.display_name
                                 FROM public.promo_trials pt
                                 LEFT JOIN public.profiles p ON p.user_id = pt.user_id
                                 ORDER BY pt.claimed_at DESC LIMIT 20
                               ) t), '[]'::json)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_promo_metrics() TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 7. RPC: increment_pwa_install  (anonymous-friendly counter)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_pwa_install()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.site_settings (key, value, description)
  VALUES ('pwa_install_count', '1', 'Nombre total d''installations PWA')
  ON CONFLICT (key) DO UPDATE
    SET value = (COALESCE(public.site_settings.value::INT, 0) + 1)::TEXT,
        updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_pwa_install() TO authenticated, anon;

-- ─────────────────────────────────────────────────────────────────
-- 8. Modified handle_new_user trigger to auto-grant promo trial
--    on new signup (if promo is active)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promo_enabled BOOLEAN;
  v_end_date TIMESTAMPTZ;
  v_duration INT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Create profile (original logic)
  INSERT INTO public.profiles (id, user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Auto-grant promo VIP if promotion is active
  BEGIN
    SELECT (value = 'true') INTO v_promo_enabled
    FROM public.site_settings WHERE key = 'promo_vip_enabled';

    SELECT value::TIMESTAMPTZ INTO v_end_date
    FROM public.site_settings WHERE key = 'promo_vip_end_date';

    IF COALESCE(v_promo_enabled, false) AND (v_end_date IS NULL OR NOW() <= v_end_date) THEN
      SELECT COALESCE(value::INT, 7) INTO v_duration
      FROM public.site_settings WHERE key = 'promo_vip_duration_days';
      v_expires_at := NOW() + (v_duration || ' days')::INTERVAL;

      INSERT INTO public.promo_trials (user_id, expires_at, source)
      VALUES (NEW.id, v_expires_at, 'new_signup')
      ON CONFLICT (user_id) DO NOTHING;

      UPDATE public.profiles
      SET is_vip = true,
          vip_expires_at = v_expires_at::TEXT
      WHERE user_id = NEW.id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Do not block signup on promo errors
    NULL;
  END;

  RETURN NEW;
END;
$$;

-- The trigger already exists from 20260505_init_schema.sql, just replace the function above.
-- (No need to drop/recreate the trigger since we used CREATE OR REPLACE FUNCTION)
