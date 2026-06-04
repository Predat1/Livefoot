-- Grant Premium/VIP access for 1 year to every existing user and
-- automatically grant the same 1-year access to every future signup.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_vip boolean DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vip_expires_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_license_key text;

INSERT INTO public.site_settings (key, value, description)
VALUES
  ('promo_vip_enabled', 'true', 'Premium gratuit 1 an active pour tous les inscrits'),
  ('promo_vip_duration_days', '365', 'Duree en jours du Premium gratuit universel'),
  ('promo_vip_max_per_ip', '999999', 'Limite IP des inscriptions pendant le Premium universel'),
  ('promo_vip_end_date', '2100-12-31T23:59:59Z', 'Date de fin du Premium universel automatique')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = now();

CREATE TABLE IF NOT EXISTS public.promo_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  source text NOT NULL DEFAULT 'existing_user',
  CONSTRAINT promo_trials_user_unique UNIQUE (user_id)
);

ALTER TABLE public.promo_trials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'promo_trials'
      AND policyname = 'Users can view own promo trial'
  ) THEN
    CREATE POLICY "Users can view own promo trial"
      ON public.promo_trials
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'promo_trials'
      AND policyname = 'service_role manages promo_trials'
  ) THEN
    CREATE POLICY "service_role manages promo_trials"
      ON public.promo_trials
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON public.promo_trials TO service_role;
GRANT SELECT ON public.promo_trials TO authenticated;

CREATE OR REPLACE FUNCTION public.grant_universal_premium_1y(
  p_user_id uuid,
  p_source text DEFAULT 'existing_user'
)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duration int := 365;
  v_expires_at timestamptz;
BEGIN
  SELECT COALESCE(value::int, 365)
  INTO v_duration
  FROM public.site_settings
  WHERE key = 'promo_vip_duration_days';

  v_expires_at := now() + (COALESCE(v_duration, 365) || ' days')::interval;

  INSERT INTO public.promo_trials (user_id, expires_at, source)
  VALUES (p_user_id, v_expires_at, p_source)
  ON CONFLICT (user_id) DO UPDATE
  SET expires_at = GREATEST(public.promo_trials.expires_at, EXCLUDED.expires_at),
      source = EXCLUDED.source;

  UPDATE public.profiles
  SET is_vip = true,
      vip_expires_at = GREATEST(
        COALESCE(vip_expires_at, '-infinity'::timestamptz),
        v_expires_at
      ),
      updated_at = now()
  WHERE user_id = p_user_id OR id = p_user_id;

  RETURN v_expires_at;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_universal_premium_1y(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_universal_premium_1y(uuid, text) TO service_role;

INSERT INTO public.profiles (id, user_id, display_name, avatar_url)
SELECT
  u.id,
  u.id,
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

SELECT public.grant_universal_premium_1y(u.id, 'universal_existing_1y')
FROM auth.users u;

CREATE OR REPLACE FUNCTION public.activate_existing_user_promo()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_expires_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Non authentifie');
  END IF;

  v_expires_at := public.grant_universal_premium_1y(v_user_id, 'existing_user');

  RETURN json_build_object(
    'success', true,
    'expires_at', v_expires_at,
    'duration_days', 365
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_existing_user_promo() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires_at timestamptz := now() + interval '365 days';
BEGIN
  INSERT INTO public.profiles (
    id,
    user_id,
    display_name,
    avatar_url,
    is_vip,
    vip_expires_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    true,
    v_expires_at
  )
  ON CONFLICT (id) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
      avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
      is_vip = true,
      vip_expires_at = GREATEST(
        COALESCE(public.profiles.vip_expires_at, '-infinity'::timestamptz),
        EXCLUDED.vip_expires_at
      ),
      updated_at = now();

  INSERT INTO public.promo_trials (user_id, expires_at, source)
  VALUES (NEW.id, v_expires_at, 'new_signup')
  ON CONFLICT (user_id) DO UPDATE
  SET expires_at = GREATEST(public.promo_trials.expires_at, EXCLUDED.expires_at),
      source = EXCLUDED.source;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
