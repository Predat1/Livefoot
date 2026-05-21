-- ═══════════════════════════════════════════════════════════════════════════
--  LIVEFOOT — SQL DE DÉPLOIEMENT COMPLET (Supabase SQL Editor)
--  Colle et exécute ce fichier dans : Dashboard > SQL Editor > New query
--
--  Ce script est IDEMPOTENT. Tu peux le relancer sans risque.
--  Il couvre TOUTE l'infrastructure nécessaire aux données temps réel.
--
--  Après exécution :
--    → Déploie l'Edge Function : supabase functions deploy api-football
--    → Configure le secret     : API_FOOTBALL_KEY dans Settings > Edge Functions
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- BLOC 1 — SCHÉMA DE BASE (profiles, favorites, predictions, ratings)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  user_id      uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  display_name text,
  username     text UNIQUE,
  avatar_url   text,
  bio          text,
  favorite_team text,
  created_at   timestamptz DEFAULT NOW() NOT NULL,
  updated_at   timestamptz DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  entity_id   text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('team', 'player', 'competition')),
  entity_name text,
  created_at  timestamptz DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, entity_id, entity_type)
);

CREATE TABLE IF NOT EXISTS public.match_predictions (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id text NOT NULL,
  user_id    uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  home_score integer NOT NULL,
  away_score integer NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  UNIQUE(fixture_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.match_ratings (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id text NOT NULL,
  player_id  text NOT NULL,
  user_id    uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  rating     numeric(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 10),
  created_at timestamptz DEFAULT NOW() NOT NULL,
  UNIQUE(fixture_id, player_id, user_id)
);

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_ratings     ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Public profiles are viewable by everyone.') THEN
    CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert their own profile.') THEN
    CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile.') THEN
    CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='favorites' AND policyname='Users can view own favorites') THEN
    CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='favorites' AND policyname='Users can manage own favorites') THEN
    CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='match_predictions' AND policyname='Predictions are viewable by everyone') THEN
    CREATE POLICY "Predictions are viewable by everyone" ON public.match_predictions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='match_predictions' AND policyname='Users can manage own predictions') THEN
    CREATE POLICY "Users can manage own predictions" ON public.match_predictions FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='match_ratings' AND policyname='Ratings are viewable by everyone') THEN
    CREATE POLICY "Ratings are viewable by everyone" ON public.match_ratings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='match_ratings' AND policyname='Users can manage own ratings') THEN
    CREATE POLICY "Users can manage own ratings" ON public.match_ratings FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_prediction_stats(_fixture_id text)
RETURNS json AS $$
DECLARE result json;
BEGIN
  SELECT json_build_object(
    'total',      COUNT(*),
    'home_wins',  COUNT(*) FILTER (WHERE home_score > away_score),
    'draws',      COUNT(*) FILTER (WHERE home_score = away_score),
    'away_wins',  COUNT(*) FILTER (WHERE home_score < away_score),
    'avg_home',   COALESCE(AVG(home_score), 0),
    'avg_away',   COALESCE(AVG(away_score), 0),
    'top_scores', (
      SELECT json_agg(t) FROM (
        SELECT (home_score || '-' || away_score) AS score, COUNT(*) AS count
        FROM public.match_predictions
        WHERE fixture_id = _fixture_id
        GROUP BY score ORDER BY COUNT(*) DESC LIMIT 3
      ) t
    )
  ) INTO result FROM public.match_predictions WHERE fixture_id = _fixture_id;
  RETURN COALESCE(result, json_build_object('total',0,'home_wins',0,'draws',0,'away_wins',0,'avg_home',0,'avg_away',0,'top_scores','[]'::json));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, display_name, avatar_url)
  VALUES (NEW.id, NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ───────────────────────────────────────────────────────────────────────────
-- BLOC 2 — CACHE API-FOOTBALL (évite d'épuiser le quota 7000 req/jour)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.api_football_cache (
  key        text PRIMARY KEY,
  data       jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.api_football_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='api_football_cache' AND policyname='Allow service_role to manage api_football_cache') THEN
    CREATE POLICY "Allow service_role to manage api_football_cache"
      ON public.api_football_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_api_football_cache_expires_at
  ON public.api_football_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_api_football_cache_key_expires
  ON public.api_football_cache (key, expires_at DESC);

GRANT ALL ON public.api_football_cache TO service_role;
GRANT ALL ON public.api_football_cache TO postgres;


-- ───────────────────────────────────────────────────────────────────────────
-- BLOC 3 — QUOTA & MONITORING API-FOOTBALL
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.api_football_daily_usage (
  day                   date PRIMARY KEY DEFAULT CURRENT_DATE,
  upstream_count        integer NOT NULL DEFAULT 0,
  cache_hits            integer NOT NULL DEFAULT 0,
  stale_hits            integer NOT NULL DEFAULT 0,
  quota_exceeded_count  integer NOT NULL DEFAULT 0,
  updated_at            timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.api_football_daily_usage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='api_football_daily_usage' AND policyname='Admins can view API football daily usage') THEN
    CREATE POLICY "Admins can view API football daily usage"
      ON public.api_football_daily_usage FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

GRANT ALL    ON public.api_football_daily_usage TO service_role;
GRANT SELECT ON public.api_football_daily_usage TO authenticated;

-- Table de logs bruts (une ligne par appel upstream)
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint         text NOT NULL,
  request_method   text DEFAULT 'POST',
  status_code      integer,
  response_time_ms integer,
  quota_used       integer DEFAULT 0,
  quota_remaining  integer,
  error_message    text,
  cache_status     text,
  cache_key        text,
  metadata         jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='api_usage_logs' AND policyname='service_role manages api_usage_logs') THEN
    CREATE POLICY "service_role manages api_usage_logs"
      ON public.api_usage_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON public.api_usage_logs TO service_role;

CREATE INDEX IF NOT EXISTS api_usage_logs_created_idx
  ON public.api_usage_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS api_usage_cache_status_idx
  ON public.api_usage_logs (cache_status, created_at DESC);

-- Fonction : consomme 1 appel du quota journalier
CREATE OR REPLACE FUNCTION public.consume_api_football_quota(p_day date, p_limit integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  current_count integer;
  remaining     integer;
BEGIN
  INSERT INTO public.api_football_daily_usage(day, upstream_count, updated_at)
  VALUES (p_day, 0, NOW())
  ON CONFLICT (day) DO NOTHING;

  SELECT upstream_count INTO current_count
  FROM public.api_football_daily_usage
  WHERE day = p_day FOR UPDATE;

  IF current_count >= p_limit THEN
    UPDATE public.api_football_daily_usage
    SET quota_exceeded_count = quota_exceeded_count + 1, updated_at = NOW()
    WHERE day = p_day;
    RETURN json_build_object('allowed', false, 'used', current_count, 'remaining', 0, 'limit', p_limit);
  END IF;

  UPDATE public.api_football_daily_usage
  SET upstream_count = upstream_count + 1, updated_at = NOW()
  WHERE day = p_day
  RETURNING upstream_count INTO current_count;

  remaining := GREATEST(p_limit - current_count, 0);
  RETURN json_build_object('allowed', true, 'used', current_count, 'remaining', remaining, 'limit', p_limit);
END;
$$;

-- Fonction : enregistre un événement de cache (HIT / MISS / STALE)
CREATE OR REPLACE FUNCTION public.record_api_football_cache_event(p_day date, p_cache_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.api_football_daily_usage(day, updated_at) VALUES (p_day, NOW())
  ON CONFLICT (day) DO NOTHING;

  UPDATE public.api_football_daily_usage
  SET cache_hits  = cache_hits  + CASE WHEN p_cache_status IN ('MEMORY_HIT', 'HIT') THEN 1 ELSE 0 END,
      stale_hits  = stale_hits  + CASE WHEN p_cache_status = 'STALE' THEN 1 ELSE 0 END,
      updated_at  = NOW()
  WHERE day = p_day;
END;
$$;

-- Fonction : stats admin quota
CREATE OR REPLACE FUNCTION public.admin_api_usage_stats(p_days int DEFAULT 7)
RETURNS json
LANGUAGE sql
SECURITY DEFINER AS $$
  SELECT json_build_object(
    'total_requests',    (SELECT COUNT(*) FROM public.api_usage_logs WHERE created_at >= NOW() - (p_days||' days')::interval),
    'total_errors',      (SELECT COUNT(*) FROM public.api_usage_logs WHERE status_code >= 400 AND created_at >= NOW() - (p_days||' days')::interval),
    'avg_response_time', COALESCE((SELECT ROUND(AVG(response_time_ms),0) FROM public.api_usage_logs WHERE created_at >= NOW() - (p_days||' days')::interval),0),
    'quota_used_today',  COALESCE((SELECT upstream_count FROM public.api_football_daily_usage WHERE day = CURRENT_DATE),0),
    'quota_remaining',   GREATEST(7000 - COALESCE((SELECT upstream_count FROM public.api_football_daily_usage WHERE day = CURRENT_DATE),0),0),
    'cache_hits_today',  COALESCE((SELECT cache_hits FROM public.api_football_daily_usage WHERE day = CURRENT_DATE),0),
    'stale_hits_today',  COALESCE((SELECT stale_hits FROM public.api_football_daily_usage WHERE day = CURRENT_DATE),0),
    'quota_by_day',      COALESCE((SELECT json_agg(row_to_json(t)) FROM (
                            SELECT day, upstream_count AS total FROM public.api_football_daily_usage
                            WHERE day >= CURRENT_DATE - (p_days||' days')::interval ORDER BY day DESC
                          ) t),'[]'::json)
  );
$$;


-- ───────────────────────────────────────────────────────────────────────────
-- BLOC 4 — INFRASTRUCTURE TEMPS RÉEL (live_match_states + live_match_events)
-- ───────────────────────────────────────────────────────────────────────────

-- 4a. États live des matchs (une ligne par match en cours)
CREATE TABLE IF NOT EXISTS public.live_match_states (
  fixture_id     text PRIMARY KEY,
  home_team_id   text,
  home_team      text,
  home_logo      text,
  away_team_id   text,
  away_team      text,
  away_logo      text,
  home_score     integer NOT NULL DEFAULT 0,
  away_score     integer NOT NULL DEFAULT 0,
  minute         integer,
  status         text NOT NULL DEFAULT 'NS',
  league_id      text,
  league_name    text,
  league_logo    text,
  league_country text,
  started_at     timestamptz,
  updated_at     timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.live_match_states ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='live_match_states' AND policyname='live_match_states_select_all') THEN
    CREATE POLICY "live_match_states_select_all" ON public.live_match_states FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='live_match_states' AND policyname='live_match_states_service_role') THEN
    CREATE POLICY "live_match_states_service_role" ON public.live_match_states FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT ON public.live_match_states TO anon;
GRANT SELECT ON public.live_match_states TO authenticated;
GRANT ALL    ON public.live_match_states TO service_role;

CREATE INDEX IF NOT EXISTS idx_live_states_status
  ON public.live_match_states (status)
  WHERE status NOT IN ('FT', 'AET', 'PEN', 'NS');

-- 4b. Événements en temps réel (buts, cartons, changements)
CREATE TABLE IF NOT EXISTS public.live_match_events (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id   text NOT NULL,
  event_type   text NOT NULL CHECK (event_type IN ('goal','yellow','red','substitution','var','penalty','kickoff','halftime','fulltime')),
  minute       integer,
  team_id      text,
  team_name    text,
  player_name  text,
  assist_name  text,
  home_score   integer,
  away_score   integer,
  detail       text,
  raw_payload  jsonb,
  detected_at  timestamptz NOT NULL DEFAULT NOW(),
  created_at   timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.live_match_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='live_match_events' AND policyname='live_match_events_select_all') THEN
    CREATE POLICY "live_match_events_select_all" ON public.live_match_events FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='live_match_events' AND policyname='live_match_events_service_role') THEN
    CREATE POLICY "live_match_events_service_role" ON public.live_match_events FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT ON public.live_match_events TO anon;
GRANT SELECT ON public.live_match_events TO authenticated;
GRANT ALL    ON public.live_match_events TO service_role;

CREATE INDEX IF NOT EXISTS idx_live_events_fixture
  ON public.live_match_events (fixture_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_events_recent
  ON public.live_match_events (detected_at DESC)
  WHERE detected_at > NOW() - INTERVAL '3 hours';

-- 4c. Activer Supabase Realtime sur les tables live
DO $$ BEGIN
  -- Supabase crée automatiquement supabase_realtime publication
  -- On ajoute les tables si elles n'y sont pas déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_match_states'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_match_states;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_match_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_match_events;
  END IF;
END $$;

-- 4d. Upsert état match live (appelé par Edge Function après chaque poll)
CREATE OR REPLACE FUNCTION public.upsert_live_match_state(
  p_fixture_id     text,
  p_home_team_id   text,
  p_home_team      text,
  p_home_logo      text,
  p_away_team_id   text,
  p_away_team      text,
  p_away_logo      text,
  p_home_score     integer,
  p_away_score     integer,
  p_minute         integer,
  p_status         text,
  p_league_id      text,
  p_league_name    text,
  p_league_logo    text,
  p_league_country text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.live_match_states (
    fixture_id, home_team_id, home_team, home_logo,
    away_team_id, away_team, away_logo,
    home_score, away_score, minute, status,
    league_id, league_name, league_logo, league_country,
    started_at, updated_at
  ) VALUES (
    p_fixture_id, p_home_team_id, p_home_team, p_home_logo,
    p_away_team_id, p_away_team, p_away_logo,
    p_home_score, p_away_score, p_minute, p_status,
    p_league_id, p_league_name, p_league_logo, p_league_country,
    CASE WHEN p_status IN ('1H','2H','ET','P') THEN NOW() ELSE NULL END,
    NOW()
  )
  ON CONFLICT (fixture_id) DO UPDATE SET
    home_score   = EXCLUDED.home_score,
    away_score   = EXCLUDED.away_score,
    minute       = EXCLUDED.minute,
    status       = EXCLUDED.status,
    home_logo    = EXCLUDED.home_logo,
    away_logo    = EXCLUDED.away_logo,
    league_logo  = EXCLUDED.league_logo,
    updated_at   = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_live_match_state TO service_role;

-- 4e. Nettoyage des matchs terminés
CREATE OR REPLACE FUNCTION public.cleanup_finished_matches()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE deleted integer;
BEGIN
  DELETE FROM public.live_match_states
  WHERE status IN ('FT','AET','PEN','AWD','WO')
    AND updated_at < NOW() - INTERVAL '2 hours';
  GET DIAGNOSTICS deleted = ROW_COUNT;

  DELETE FROM public.live_match_events
  WHERE created_at < NOW() - INTERVAL '24 hours';

  RETURN deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_finished_matches() TO service_role;

-- 4f. Purge manuelle du cache live (admin / debug)
CREATE OR REPLACE FUNCTION public.purge_live_fixtures_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE deleted integer;
BEGIN
  DELETE FROM public.api_football_cache
  WHERE key LIKE 'fixtures?live=%' OR key LIKE 'fixtures?date=%';
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_live_fixtures_cache() TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_live_fixtures_cache() TO authenticated;


-- ───────────────────────────────────────────────────────────────────────────
-- BLOC 5 — VUE : v_live_matches (lecture rapide de tous les matchs en cours)
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_live_matches AS
SELECT
  s.fixture_id,
  s.home_team,
  s.home_team_id,
  s.home_logo,
  s.away_team,
  s.away_team_id,
  s.away_logo,
  s.home_score,
  s.away_score,
  s.minute,
  s.status,
  s.league_id,
  s.league_name,
  s.league_logo,
  s.league_country,
  s.updated_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id',        e.id,
        'type',      e.event_type,
        'minute',    e.minute,
        'player',    e.player_name,
        'assist',    e.assist_name,
        'team_id',   e.team_id,
        'detail',    e.detail
      ) ORDER BY e.minute ASC
    ) FILTER (WHERE e.id IS NOT NULL),
    '[]'::json
  ) AS events
FROM public.live_match_states s
LEFT JOIN public.live_match_events e ON e.fixture_id = s.fixture_id
WHERE s.status IN ('1H','2H','HT','ET','P','BT','INT','LIVE')
GROUP BY
  s.fixture_id, s.home_team, s.home_team_id, s.home_logo,
  s.away_team, s.away_team_id, s.away_logo,
  s.home_score, s.away_score, s.minute, s.status,
  s.league_id, s.league_name, s.league_logo, s.league_country,
  s.updated_at;

GRANT SELECT ON public.v_live_matches TO anon;
GRANT SELECT ON public.v_live_matches TO authenticated;


-- ───────────────────────────────────────────────────────────────────────────
-- BLOC 6 — pg_cron (optionnel — activer dans Dashboard > Database > Extensions)
-- ───────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('cleanup-finished-matches',   '0 * * * *',    'SELECT public.cleanup_finished_matches()');
    PERFORM cron.schedule('cleanup-api-football-cache', '0 */6 * * *',  $$DELETE FROM public.api_football_cache WHERE expires_at < NOW() - INTERVAL '1 hour'$$);
    RAISE NOTICE 'pg_cron : 2 jobs planifiés.';
  ELSE
    RAISE NOTICE 'pg_cron non disponible — pas de cron automatique. Activez-le dans Dashboard > Database > Extensions si nécessaire.';
  END IF;
END $$;


-- ───────────────────────────────────────────────────────────────────────────
-- VÉRIFICATION FINALE
-- ───────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  t record;
  tables_ok boolean := true;
  required_tables text[] := ARRAY[
    'profiles','favorites','match_predictions','match_ratings',
    'api_football_cache','api_football_daily_usage','api_usage_logs',
    'live_match_states','live_match_events'
  ];
BEGIN
  FOREACH t.table_name IN ARRAY required_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN
      RAISE WARNING 'TABLE MANQUANTE : %', t.table_name;
      tables_ok := false;
    END IF;
  END LOOP;

  IF tables_ok THEN
    RAISE NOTICE '';
    RAISE NOTICE '╔══════════════════════════════════════════════════╗';
    RAISE NOTICE '║  LiveFoot — Déploiement SQL réussi ✓             ║';
    RAISE NOTICE '╠══════════════════════════════════════════════════╣';
    RAISE NOTICE '║  Tables créées : 9                               ║';
    RAISE NOTICE '║  Fonctions     : consume_quota, record_cache,    ║';
    RAISE NOTICE '║                  upsert_live_state, cleanup,     ║';
    RAISE NOTICE '║                  purge_cache, admin_stats        ║';
    RAISE NOTICE '║  Vue           : v_live_matches                  ║';
    RAISE NOTICE '║  Realtime      : live_match_states ✓             ║';
    RAISE NOTICE '║                  live_match_events ✓             ║';
    RAISE NOTICE '╠══════════════════════════════════════════════════╣';
    RAISE NOTICE '║  PROCHAINES ÉTAPES :                             ║';
    RAISE NOTICE '║  1. Ajouter API_FOOTBALL_KEY dans Secrets        ║';
    RAISE NOTICE '║     Dashboard > Settings > Edge Functions        ║';
    RAISE NOTICE '║  2. Déployer l''Edge Function :                   ║';
    RAISE NOTICE '║     supabase functions deploy api-football       ║';
    RAISE NOTICE '║  3. (Optionnel) Activer pg_cron                  ║';
    RAISE NOTICE '║     Dashboard > Database > Extensions            ║';
    RAISE NOTICE '╚══════════════════════════════════════════════════╝';
  END IF;
END $$;
