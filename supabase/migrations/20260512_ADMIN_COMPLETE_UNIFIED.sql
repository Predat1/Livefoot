-- ═══════════════════════════════════════════════════════════════════════════
-- LIVEFOOT ADMIN PANEL - MIGRATION COMPLÈTE UNIFIÉE
-- Toutes les 6 phases en un seul fichier
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 1: FONDATIONS (User Management, Ban, Audit Log)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1.1 Helper function is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 1.2 Extension profiles: bannissement
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT,
  ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS profiles_banned_idx ON public.profiles(is_banned) WHERE is_banned = TRUE;

-- 1.3 Table admin_audit_log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX audit_admin_idx ON public.admin_audit_log(admin_id, created_at DESC);
CREATE INDEX audit_target_idx ON public.admin_audit_log(target_type, target_id);
CREATE INDEX audit_date_idx ON public.admin_audit_log(created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (public.is_admin());

-- 1.4 RPC admin_user_detail
CREATE OR REPLACE FUNCTION public.admin_user_detail(p_user_id UUID)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  user_profile RECORD;
  user_roles JSON;
  user_favorites_count INT;
  user_predictions_count INT;
  user_ratings_count INT;
  user_referrals_count INT;
  user_vip_status JSON;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  SELECT * INTO user_profile FROM public.profiles WHERE id = p_user_id;
  IF user_profile IS NULL THEN RETURN NULL; END IF;

  SELECT JSON_AGG(r.role) INTO user_roles FROM public.user_roles r WHERE r.user_id = p_user_id;
  SELECT COUNT(*) INTO user_favorites_count FROM public.favorites WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO user_predictions_count FROM public.match_predictions WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO user_ratings_count FROM public.match_ratings WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO user_referrals_count FROM public.referrals WHERE referrer_id = p_user_id;

  SELECT JSON_BUILD_OBJECT('is_vip', is_vip, 'expires_at', vip_expires_at, 'license_key', last_license_key)
  INTO user_vip_status FROM public.profiles WHERE id = p_user_id;

  SELECT JSON_BUILD_OBJECT(
    'id', user_profile.id,
    'email', (SELECT email FROM auth.users WHERE id = p_user_id),
    'display_name', user_profile.display_name,
    'username', user_profile.username,
    'avatar_url', user_profile.avatar_url,
    'bio', user_profile.bio,
    'favorite_team', user_profile.favorite_team,
    'created_at', user_profile.created_at,
    'updated_at', user_profile.updated_at,
    'is_banned', user_profile.is_banned,
    'banned_at', user_profile.banned_at,
    'banned_reason', user_profile.banned_reason,
    'roles', COALESCE(user_roles, '[]'),
    'stats', JSON_BUILD_OBJECT('favorites', user_favorites_count, 'predictions', user_predictions_count, 'ratings', user_ratings_count, 'referrals', user_referrals_count),
    'vip', user_vip_status
  ) INTO result;

  RETURN result;
END;
$$;

-- 1.5 RPC admin_ban_user
CREATE OR REPLACE FUNCTION public.admin_ban_user(p_user_id UUID, p_reason TEXT)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acces refuse'; END IF;
  IF p_user_id = auth.uid() THEN RAISE EXCEPTION 'Impossible de bannir son propre compte'; END IF;

  UPDATE public.profiles SET is_banned = TRUE, banned_at = NOW(), banned_reason = p_reason, banned_by = auth.uid()
  WHERE id = p_user_id;

  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'ban', 'user', p_user_id::TEXT, JSONB_BUILD_OBJECT('reason', p_reason));
END;
$$;

-- 1.6 RPC admin_unban_user
CREATE OR REPLACE FUNCTION public.admin_unban_user(p_user_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acces refuse'; END IF;
  UPDATE public.profiles SET is_banned = FALSE, banned_at = NULL, banned_reason = NULL, banned_by = NULL
  WHERE id = p_user_id;
  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'unban', 'user', p_user_id::TEXT, '{}');
END;
$$;

-- 1.7 RPC admin_set_vip
CREATE OR REPLACE FUNCTION public.admin_set_vip(p_user_id UUID, p_expires_at TIMESTAMPTZ, p_license_key TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acces refuse'; END IF;
  UPDATE public.profiles SET is_vip = TRUE, vip_expires_at = p_expires_at, last_license_key = COALESCE(p_license_key, last_license_key)
  WHERE id = p_user_id;
  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'grant_vip', 'user', p_user_id::TEXT, JSONB_BUILD_OBJECT('expires_at', p_expires_at, 'license_key', p_license_key));
END;
$$;

-- 1.8 RPC admin_revoke_vip
CREATE OR REPLACE FUNCTION public.admin_revoke_vip(p_user_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acces refuse'; END IF;
  UPDATE public.profiles SET is_vip = FALSE, vip_expires_at = NULL, last_license_key = NULL WHERE id = p_user_id;
  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'revoke_vip', 'user', p_user_id::TEXT, '{}');
END;
$$;

-- 1.9 Mise à jour admin_stats
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT JSON_BUILD_OBJECT(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'banned_users', (SELECT COUNT(*) FROM public.profiles WHERE is_banned = TRUE),
    'active_users_7d', (SELECT COUNT(*) FROM public.profiles WHERE updated_at >= NOW() - INTERVAL '7 days' AND is_banned = FALSE),
    'vip_users', (SELECT COUNT(*) FROM public.profiles WHERE is_vip = TRUE AND (vip_expires_at IS NULL OR vip_expires_at > NOW())),
    'total_predictions', (SELECT COUNT(*) FROM public.match_predictions),
    'total_ratings', (SELECT COUNT(*) FROM public.match_ratings),
    'total_favorites', (SELECT COUNT(*) FROM public.favorites),
    'users_with_predictions', (SELECT COUNT(DISTINCT user_id) FROM public.match_predictions),
    'users_with_ratings', (SELECT COUNT(DISTINCT user_id) FROM public.match_ratings),
    'recent_signups_7d', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '7 days'),
    'recent_signups_30d', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '30 days')
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 2: MONÉTISATION
-- ═══════════════════════════════════════════════════════════════════════════

-- 2.1 Table transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  type TEXT NOT NULL,
  amount_eur NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  external_id TEXT,
  metadata JSONB,
  partner_id UUID REFERENCES public.partners(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX transactions_user_idx ON public.transactions(user_id, created_at DESC);
CREATE INDEX transactions_status_idx ON public.transactions(status);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (public.is_admin());

-- 2.2 Table partners
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  commission_rate NUMERIC(5, 2),
  flat_amount_eur NUMERIC(10, 2),
  tracking_code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  revenue_eur NUMERIC(12, 2) DEFAULT 0,
  contract_start TIMESTAMPTZ,
  contract_end TIMESTAMPTZ,
  contact_email TEXT,
  contact_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX partners_type_idx ON public.partners(type);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage partners"
  ON public.partners FOR ALL
  USING (public.is_admin());

-- 2.3 RPC admin_revenue_stats
CREATE OR REPLACE FUNCTION public.admin_revenue_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT JSON_BUILD_OBJECT(
    'total_revenue_eur', (SELECT COALESCE(SUM(amount_eur), 0) FROM public.transactions WHERE status = 'completed' AND type = 'vip_subscription'),
    'revenue_7d_eur', (SELECT COALESCE(SUM(amount_eur), 0) FROM public.transactions WHERE status = 'completed' AND type = 'vip_subscription' AND created_at >= NOW() - INTERVAL '7 days'),
    'revenue_30d_eur', (SELECT COALESCE(SUM(amount_eur), 0) FROM public.transactions WHERE status = 'completed' AND type = 'vip_subscription' AND created_at >= NOW() - INTERVAL '30 days'),
    'partner_revenue_eur', (SELECT COALESCE(SUM(revenue_eur), 0) FROM public.partners),
    'total_clicks', (SELECT COALESCE(SUM(click_count), 0) FROM public.partners),
    'total_conversions', (SELECT COALESCE(SUM(conversion_count), 0) FROM public.partners),
    'transactions_count', (SELECT COUNT(*) FROM public.transactions),
    'stripe_revenue', (SELECT COALESCE(SUM(amount_eur), 0) FROM public.transactions WHERE status = 'completed' AND payment_method = 'stripe'),
    'arpu_eur', CASE WHEN (SELECT COUNT(DISTINCT user_id) FROM public.transactions WHERE status = 'completed') = 0 THEN 0
                ELSE (SELECT ROUND(SUM(amount_eur) / COUNT(DISTINCT user_id), 2) FROM public.transactions WHERE status = 'completed') END
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 3: ANALYTICS
-- ═══════════════════════════════════════════════════════════════════════════

-- 3.1 Table page_views
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  country_code TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  lang TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX pageviews_session_idx ON public.page_views(session_id, created_at DESC);
CREATE INDEX pageviews_path_idx ON public.page_views(path);
CREATE INDEX pageviews_date_idx ON public.page_views(created_at DESC);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view page views"
  ON public.page_views FOR SELECT
  USING (public.is_admin());

-- 3.2 RPC admin_analytics_stats
CREATE OR REPLACE FUNCTION public.admin_analytics_stats(p_days INT DEFAULT 30)
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT JSON_BUILD_OBJECT(
    'internal_visitors', (SELECT COUNT(DISTINCT session_id) FROM public.page_views WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL),
    'internal_pageviews', (SELECT COUNT(*) FROM public.page_views WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL),
    'top_pages', (SELECT JSON_AGG(ROW_TO_JSON(t)) FROM (SELECT path, COUNT(*) AS views FROM public.page_views WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL GROUP BY path ORDER BY COUNT(*) DESC LIMIT 10) t),
    'device_breakdown', (SELECT JSON_OBJECT_AGG(device_type, cnt) FROM (SELECT COALESCE(device_type, 'unknown') AS device_type, COUNT(*) AS cnt FROM public.page_views WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL GROUP BY device_type) t)
  );
$$;

-- 3.3 RPC log_page_view
CREATE OR REPLACE FUNCTION public.log_page_view(
  p_session_id TEXT, p_path TEXT, p_referrer TEXT DEFAULT NULL,
  p_country_code TEXT DEFAULT NULL, p_device_type TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL, p_os TEXT DEFAULT NULL, p_lang TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.page_views (session_id, path, referrer, country_code, device_type, browser, os, lang)
  VALUES (p_session_id, p_path, p_referrer, p_country_code, p_device_type, p_browser, p_os, p_lang);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 4: CONTENT MODERATION & FEATURE FLAGS
-- ═══════════════════════════════════════════════════════════════════════════

-- 4.1 Table content_moderation_queue
CREATE TABLE IF NOT EXISTS public.content_moderation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_preview TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email TEXT,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_reason TEXT,
  report_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderation_notes TEXT,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX moderation_status_idx ON public.content_moderation_queue(status, created_at DESC);

ALTER TABLE public.content_moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view queue"
  ON public.content_moderation_queue FOR SELECT
  USING (public.is_admin());

-- 4.2 Table feature_flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100),
  allowed_roles TEXT[] DEFAULT '{}',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated, anon USING (TRUE);

CREATE POLICY "Only admins can manage"
  ON public.feature_flags FOR ALL
  USING (public.is_admin());

-- 4.3 Table site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings"
  ON public.site_settings FOR SELECT
  TO authenticated, anon USING (TRUE);

CREATE POLICY "Only admins can update"
  ON public.site_settings FOR ALL
  USING (public.is_admin());

-- 4.4 RPC admin_moderation_stats
CREATE OR REPLACE FUNCTION public.admin_moderation_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT JSON_BUILD_OBJECT(
    'pending_count', (SELECT COUNT(*) FROM public.content_moderation_queue WHERE status = 'pending'),
    'approved_today', (SELECT COUNT(*) FROM public.content_moderation_queue WHERE status = 'approved' AND moderated_at >= NOW() - INTERVAL '1 day'),
    'rejected_today', (SELECT COUNT(*) FROM public.content_moderation_queue WHERE status = 'rejected' AND moderated_at >= NOW() - INTERVAL '1 day')
  );
$$;

-- 4.5 RPC admin_set_feature_flag
CREATE OR REPLACE FUNCTION public.admin_set_feature_flag(
  p_key TEXT, p_enabled BOOLEAN, p_rollout_percentage INTEGER DEFAULT 100, p_config JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acces refuse'; END IF;
  INSERT INTO public.feature_flags (key, name, enabled, rollout_percentage, config)
  VALUES (p_key, p_key, p_enabled, p_rollout_percentage, COALESCE(p_config, '{}'))
  ON CONFLICT (key) DO UPDATE SET
    enabled = p_enabled, rollout_percentage = p_rollout_percentage,
    config = CASE WHEN p_config IS NOT NULL THEN p_config ELSE public.feature_flags.config END,
    updated_at = NOW();
END;
$$;

-- 4.6 RPC admin_set_maintenance_mode
CREATE OR REPLACE FUNCTION public.admin_set_maintenance_mode(
  p_enabled BOOLEAN,
  p_message TEXT DEFAULT 'Maintenance en cours...'
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acces refuse'; END IF;

  INSERT INTO public.site_settings (key, value, description)
  VALUES ('maintenance_mode', p_enabled::TEXT, 'Mode maintenance actif')
  ON CONFLICT (key) DO UPDATE SET value = p_enabled::TEXT, updated_at = NOW();

  INSERT INTO public.site_settings (key, value, description)
  VALUES ('maintenance_message', p_message, 'Message de maintenance')
  ON CONFLICT (key) DO UPDATE SET value = p_message, updated_at = NOW();

  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), CASE WHEN p_enabled THEN 'maintenance_on' ELSE 'maintenance_off' END, 'system', 'maintenance', '{}');
END;
$$;

-- 4.7 RPC is_feature_enabled
CREATE OR REPLACE FUNCTION public.is_feature_enabled(
  p_key TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  v_flag RECORD;
  v_user_roles TEXT[];
BEGIN
  SELECT * INTO v_flag FROM public.feature_flags WHERE key = p_key;
  IF v_flag IS NULL THEN RETURN FALSE; END IF;
  IF NOT v_flag.enabled THEN RETURN FALSE; END IF;
  
  IF p_user_id IS NOT NULL AND v_flag.rollout_percentage < 100 THEN
    IF ABS(('x' || SUBSTR(MD5(p_user_id::TEXT), 1, 8))::BIT(32)::INT) % 100 >= v_flag.rollout_percentage THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  IF ARRAY_LENGTH(v_flag.allowed_roles, 1) > 0 THEN
    IF p_user_id IS NULL THEN RETURN FALSE; END IF;
    SELECT ARRAY_AGG(role) INTO v_user_roles FROM public.user_roles WHERE user_id = p_user_id;
    IF NOT v_flag.allowed_roles && v_user_roles THEN RETURN FALSE; END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 4.8 Seed feature flags
INSERT INTO public.feature_flags (key, name, description, enabled, config) VALUES
  ('vip_pricing', 'Tarification VIP', 'Active l''achat de licences VIP', TRUE, '{"plans": ["monthly", "yearly"]}'),
  ('ai_predictions', 'Prédictions IA', 'Prédictions par intelligence artificielle', TRUE, '{}'),
  ('referral_system', 'Système de parrainage', 'Programme de parrainage VIP', TRUE, '{"reward_hours": 48}'),
  ('live_odds', 'Cotes en direct', 'Affichage des cotes temps réel', TRUE, '{}')
ON CONFLICT (key) DO NOTHING;

-- 4.9 Seed settings
INSERT INTO public.site_settings (key, value, description) VALUES
  ('maintenance_mode', 'false', 'Mode maintenance'),
  ('maintenance_message', 'Maintenance en cours, revenez bientôt !', 'Message de maintenance'),
  ('site_name', 'LiveFoot', 'Nom du site')
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 5: ENHANCEMENTS (Notifications, Export, Cache)
-- ═══════════════════════════════════════════════════════════════════════════

-- 5.1 Table admin_notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX admin_notifications_unread_idx ON public.admin_notifications(read, created_at DESC);
CREATE INDEX admin_notifications_type_idx ON public.admin_notifications(type);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications"
  ON public.admin_notifications FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications FOR UPDATE
  USING (public.is_admin());

-- 5.2 RPC admin_notifications_list
CREATE OR REPLACE FUNCTION public.admin_notifications_list(
  p_limit INT DEFAULT 50,
  p_unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  severity TEXT,
  title TEXT,
  message TEXT,
  data JSONB,
  read BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT n.id, n.type, n.severity, n.title, n.message, n.data, n.read, n.created_at
  FROM public.admin_notifications n
  WHERE public.is_admin() AND (NOT p_unread_only OR n.read = FALSE)
  ORDER BY n.created_at DESC
  LIMIT p_limit;
$$;

-- 5.3 RPC admin_mark_notification_read
CREATE OR REPLACE FUNCTION public.admin_mark_notification_read(p_notification_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acces refuse'; END IF;
  UPDATE public.admin_notifications SET read = TRUE, read_at = NOW() WHERE id = p_notification_id;
END;
$$;

-- 5.4 RPC admin_export_users_csv
CREATE OR REPLACE FUNCTION public.admin_export_users_csv()
RETURNS TEXT
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  result TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acces refuse'; END IF;

  SELECT STRING_AGG(
    u.email || ',' || COALESCE(p.display_name, '') || ',' || COALESCE(p.username, '') || ',' || 
    p.is_vip::TEXT || ',' || p.is_banned::TEXT || ',' || p.created_at::TEXT,
    E'\n'
  )
  INTO result
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  LIMIT 10000;

  RETURN 'email,display_name,username,is_vip,is_banned,created_at' || E'\n' || COALESCE(result, '');
END;
$$;

-- 5.5 RPC admin_purge_cache
CREATE OR REPLACE FUNCTION public.admin_purge_cache()
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acces refuse'; END IF;
  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'cache_purge', 'system', 'cache', JSONB_BUILD_OBJECT('timestamp', NOW()));
  RETURN JSON_BUILD_OBJECT('success', TRUE, 'message', 'Cache purge logged', 'timestamp', NOW());
END;
$$;

-- 5.6 Seed notifications
INSERT INTO public.admin_notifications (type, severity, title, message, data, read) VALUES
  ('system_alert', 'info', 'Migrations déployées', 'Les migrations sont actives', '{"version": "6.0"}', TRUE)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 6: FINAL FEATURES (Newsletter, API Monitoring, Backups)
-- ═══════════════════════════════════════════════════════════════════════════

-- 6.1 Table newsletter_subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  confirmed BOOLEAN DEFAULT FALSE,
  confirmation_token TEXT
);

CREATE INDEX newsletter_email_idx ON public.newsletter_subscribers(email);
CREATE INDEX newsletter_active_idx ON public.newsletter_subscribers(is_active) WHERE is_active = TRUE;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins can view subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (public.is_admin());

-- 6.2 Table api_usage_logs
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  request_method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  quota_used INTEGER DEFAULT 1,
  quota_remaining INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX api_usage_endpoint_idx ON public.api_usage_logs(endpoint, created_at DESC);
CREATE INDEX api_usage_user_idx ON public.api_usage_logs(user_id, created_at DESC);

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view API usage"
  ON public.api_usage_logs FOR SELECT
  USING (public.is_admin());

-- 6.3 Table backups
CREATE TABLE IF NOT EXISTS public.backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  file_url TEXT,
  file_size_bytes BIGINT,
  tables_included TEXT[],
  row_count INTEGER,
  error_message TEXT,
  triggered_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backups"
  ON public.backups FOR SELECT
  USING (public.is_admin());

-- 6.4 RPC admin_newsletter_stats
CREATE OR REPLACE FUNCTION public.admin_newsletter_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT JSON_BUILD_OBJECT(
    'total_subscribers', (SELECT COUNT(*) FROM public.newsletter_subscribers),
    'active_subscribers', (SELECT COUNT(*) FROM public.newsletter_subscribers WHERE is_active = TRUE),
    'new_this_week', (SELECT COUNT(*) FROM public.newsletter_subscribers WHERE subscribed_at >= NOW() - INTERVAL '7 days'),
    'unsubscribed', (SELECT COUNT(*) FROM public.newsletter_subscribers WHERE is_active = FALSE),
    'confirmed_rate', CASE WHEN (SELECT COUNT(*) FROM public.newsletter_subscribers) = 0 THEN 0
                      ELSE ROUND((SELECT COUNT(*) FROM public.newsletter_subscribers WHERE confirmed = TRUE)::NUMERIC / 
                                 (SELECT COUNT(*) FROM public.newsletter_subscribers) * 100, 1) END
  );
$$;

-- 6.5 RPC admin_api_usage_stats
CREATE OR REPLACE FUNCTION public.admin_api_usage_stats(p_days INT DEFAULT 7)
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT JSON_BUILD_OBJECT(
    'total_requests', (SELECT COUNT(*) FROM public.api_usage_logs WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL),
    'total_errors', (SELECT COUNT(*) FROM public.api_usage_logs WHERE status_code >= 400 AND created_at >= NOW() - (p_days || ' days')::INTERVAL),
    'avg_response_time', (SELECT ROUND(AVG(response_time_ms), 0) FROM public.api_usage_logs WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL)
  );
$$;

-- 6.6 RPC admin_trigger_backup
CREATE OR REPLACE FUNCTION public.admin_trigger_backup(p_type TEXT DEFAULT 'full')
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  backup_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acces refuse'; END IF;

  INSERT INTO public.backups (type, status, triggered_by, tables_included)
  VALUES (
    p_type,
    'running',
    auth.uid(),
    CASE p_type
      WHEN 'full' THEN ARRAY['profiles', 'transactions', 'partners', 'newsletter_subscribers']
      WHEN 'users' THEN ARRAY['profiles', 'user_roles']
      WHEN 'transactions' THEN ARRAY['transactions', 'partners']
      ELSE ARRAY['profiles']
    END
  )
  RETURNING id INTO backup_id;

  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'backup_triggered', 'system', backup_id::TEXT, JSONB_BUILD_OBJECT('type', p_type));

  RETURN backup_id;
END;
$$;

-- 6.7 RPC admin_export_newsletter_csv
CREATE OR REPLACE FUNCTION public.admin_export_newsletter_csv(p_active_only BOOLEAN DEFAULT TRUE)
RETURNS TEXT
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  result TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acces refuse'; END IF;

  SELECT STRING_AGG(
    email || ',' || COALESCE(name, '') || ',' || is_active::TEXT || ',' || confirmed::TEXT || ',' || subscribed_at::TEXT,
    E'\n'
  )
  INTO result
  FROM public.newsletter_subscribers
  WHERE (NOT p_active_only OR is_active = TRUE)
  LIMIT 50000;

  RETURN 'email,name,is_active,confirmed,subscribed_at' || E'\n' || COALESCE(result, '');
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- AUTO-SETUP: Attribuer le rôle admin à l'email principal
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'Mobifranck310@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'Migration Admin Panel complète exécutée avec succès !' AS status;
