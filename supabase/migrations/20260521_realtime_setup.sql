-- ═══════════════════════════════════════════════════════════════════
-- Migration: Real-Time Match Data Infrastructure
-- Date: 2026-05-21
--
-- Ce fichier est IDEMPOTENT (IF NOT EXISTS / OR REPLACE partout).
-- Il peut être rejoué sans risque sur un projet existant.
--
-- Prérequis :
--   1. Table api_football_cache      (migration 20260519)
--   2. Table api_football_daily_usage (migration 20260520)
--   3. Fonctions consume_api_football_quota / record_api_football_cache_event (migration 20260520)
--   4. Secret Supabase : API_FOOTBALL_KEY (https://dashboard.supabase.com > Settings > Edge Functions)
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. INDEX supplémentaires sur api_football_cache
--    pour accélérer la lecture des entrées live (TTL court = beaucoup d'upserts)
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_api_football_cache_key_expires
  ON public.api_football_cache (key, expires_at DESC);

-- Index partiel : uniquement les entrées non expirées (hot path)
CREATE INDEX IF NOT EXISTS idx_api_football_cache_valid
  ON public.api_football_cache (key)
  WHERE expires_at > NOW();

-- ─────────────────────────────────────────────────────────────────
-- 2. Fonction : purge manuelle du cache pour forcer un refresh live
--    Utilisée par le panel admin ou via un cron (pg_cron optionnel)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.purge_live_fixtures_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted integer;
BEGIN
  DELETE FROM public.api_football_cache
  WHERE key LIKE 'fixtures?live=%'
     OR key LIKE 'fixtures?date=%';
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_live_fixtures_cache() TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_live_fixtures_cache() TO authenticated;

COMMENT ON FUNCTION public.purge_live_fixtures_cache IS
  'Vide le cache des fixtures live et par date. À appeler pour forcer un refresh immédiat depuis API-Football.';

-- ─────────────────────────────────────────────────────────────────
-- 3. Fonction : statut du cache pour une clé donnée
--    Utilisée par le panel admin pour diagnostiquer les TTL
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_cache_entry_status(p_key_pattern text DEFAULT 'fixtures%')
RETURNS TABLE(
  key          text,
  expires_at   timestamptz,
  updated_at   timestamptz,
  is_expired   boolean,
  ttl_seconds  integer,
  size_bytes   integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    key,
    expires_at,
    updated_at,
    expires_at < NOW() AS is_expired,
    GREATEST(0, EXTRACT(EPOCH FROM (expires_at - NOW()))::integer) AS ttl_seconds,
    LENGTH(data::text) AS size_bytes
  FROM public.api_football_cache
  WHERE key LIKE p_key_pattern
  ORDER BY updated_at DESC
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION public.get_cache_entry_status(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_cache_entry_status(text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 4. Table : live_match_events
--    Stocke les événements de matchs en cours détectés côté backend.
--    Permet les notifications push Supabase Realtime sans repoll API.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.live_match_events (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id    text NOT NULL,
  event_type    text NOT NULL CHECK (event_type IN ('goal', 'yellow', 'red', 'substitution', 'var', 'penalty', 'kickoff', 'halftime', 'fulltime')),
  minute        integer,
  team_id       text,
  team_name     text,
  player_name   text,
  assist_name   text,
  home_score    integer,
  away_score    integer,
  detail        text,
  raw_payload   jsonb,
  detected_at   timestamptz NOT NULL DEFAULT NOW(),
  created_at    timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.live_match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_match_events_select_all"
  ON public.live_match_events FOR SELECT
  USING (true);

CREATE POLICY "live_match_events_service_role"
  ON public.live_match_events FOR ALL
  TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON public.live_match_events TO anon;
GRANT SELECT ON public.live_match_events TO authenticated;
GRANT ALL    ON public.live_match_events TO service_role;

CREATE INDEX IF NOT EXISTS idx_live_events_fixture
  ON public.live_match_events (fixture_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_events_recent
  ON public.live_match_events (detected_at DESC)
  WHERE detected_at > NOW() - INTERVAL '3 hours';

-- Activer Supabase Realtime sur cette table
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_match_events;

-- ─────────────────────────────────────────────────────────────────
-- 5. Table : live_match_states
--    Une ligne par match en cours — score + minute courants.
--    Mise à jour par l'Edge Function à chaque poll.
--    Les clients s'abonnent via Realtime pour recevoir les updates.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.live_match_states (
  fixture_id    text PRIMARY KEY,
  home_team_id  text,
  home_team     text,
  home_logo     text,
  away_team_id  text,
  away_team     text,
  away_logo     text,
  home_score    integer NOT NULL DEFAULT 0,
  away_score    integer NOT NULL DEFAULT 0,
  minute        integer,
  status        text NOT NULL DEFAULT 'NS',  -- NS, 1H, HT, 2H, ET, P, FT, etc.
  league_id     text,
  league_name   text,
  league_logo   text,
  league_country text,
  started_at    timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.live_match_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_match_states_select_all"
  ON public.live_match_states FOR SELECT
  USING (true);

CREATE POLICY "live_match_states_service_role"
  ON public.live_match_states FOR ALL
  TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON public.live_match_states TO anon;
GRANT SELECT ON public.live_match_states TO authenticated;
GRANT ALL    ON public.live_match_states TO service_role;

CREATE INDEX IF NOT EXISTS idx_live_states_status
  ON public.live_match_states (status)
  WHERE status NOT IN ('FT', 'AET', 'PEN', 'NS');

-- Activer Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_match_states;

-- ─────────────────────────────────────────────────────────────────
-- 6. Fonction : upsert_live_match_state
--    Appelée par l'Edge Function api-football après chaque poll live.
--    Met à jour live_match_states et insère les nouveaux événements.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.upsert_live_match_state(
  p_fixture_id   text,
  p_home_team_id text,
  p_home_team    text,
  p_home_logo    text,
  p_away_team_id text,
  p_away_team    text,
  p_away_logo    text,
  p_home_score   integer,
  p_away_score   integer,
  p_minute       integer,
  p_status       text,
  p_league_id    text,
  p_league_name  text,
  p_league_logo  text,
  p_league_country text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    CASE WHEN p_status IN ('1H', '2H', 'ET', 'P') THEN NOW() ELSE NULL END,
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

-- ─────────────────────────────────────────────────────────────────
-- 7. Fonction : cleanup_finished_matches
--    Supprime les matchs terminés depuis plus de 2h de live_match_states.
--    À appeler via pg_cron (voir section 9) ou manuellement.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cleanup_finished_matches()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted integer;
BEGIN
  DELETE FROM public.live_match_states
  WHERE status IN ('FT', 'AET', 'PEN', 'AWD', 'WO')
    AND updated_at < NOW() - INTERVAL '2 hours';
  GET DIAGNOSTICS deleted = ROW_COUNT;

  -- Aussi nettoyer les événements vieux de plus de 24h
  DELETE FROM public.live_match_events
  WHERE created_at < NOW() - INTERVAL '24 hours';

  RETURN deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_finished_matches() TO service_role;

-- ─────────────────────────────────────────────────────────────────
-- 8. Vue : v_live_matches
--    Vue dénormalisée pour lire facilement tous les matchs en cours.
-- ─────────────────────────────────────────────────────────────────

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
        'id',          e.id,
        'type',        e.event_type,
        'minute',      e.minute,
        'player',      e.player_name,
        'assist',      e.assist_name,
        'team_id',     e.team_id,
        'detail',      e.detail
      ) ORDER BY e.minute ASC
    ) FILTER (WHERE e.id IS NOT NULL),
    '[]'::json
  ) AS events
FROM public.live_match_states s
LEFT JOIN public.live_match_events e ON e.fixture_id = s.fixture_id
WHERE s.status IN ('1H', '2H', 'HT', 'ET', 'P', 'BT', 'INT', 'LIVE')
GROUP BY
  s.fixture_id, s.home_team, s.home_team_id, s.home_logo,
  s.away_team, s.away_team_id, s.away_logo,
  s.home_score, s.away_score, s.minute, s.status,
  s.league_id, s.league_name, s.league_logo, s.league_country,
  s.updated_at;

GRANT SELECT ON public.v_live_matches TO anon;
GRANT SELECT ON public.v_live_matches TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 9. pg_cron : automatisation (optionnel — nécessite l'extension pg_cron)
--    Activez pg_cron dans : Supabase Dashboard > Database > Extensions
-- ─────────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Vérifie si pg_cron est disponible avant de tenter de créer les jobs
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Nettoyage des matchs terminés : toutes les heures
    PERFORM cron.schedule(
      'cleanup-finished-matches',
      '0 * * * *',
      'SELECT public.cleanup_finished_matches()'
    );

    -- Purge du cache api_football_cache expiré : toutes les 6 heures
    PERFORM cron.schedule(
      'cleanup-api-football-cache',
      '0 */6 * * *',
      $$DELETE FROM public.api_football_cache WHERE expires_at < NOW() - INTERVAL '1 hour'$$
    );

    RAISE NOTICE 'pg_cron jobs créés avec succès.';
  ELSE
    RAISE NOTICE 'pg_cron non disponible — nettoyage automatique désactivé. Activez-le dans Dashboard > Database > Extensions.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 10. Vérification finale : affiche l'état des tables créées
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  cache_count    integer;
  states_count   integer;
  events_count   integer;
BEGIN
  SELECT COUNT(*) INTO cache_count  FROM public.api_football_cache;
  SELECT COUNT(*) INTO states_count FROM public.live_match_states;
  SELECT COUNT(*) INTO events_count FROM public.live_match_events;

  RAISE NOTICE '══════════════════════════════════════════';
  RAISE NOTICE 'LiveFoot Real-Time Infrastructure — OK';
  RAISE NOTICE '  api_football_cache    : % entrées', cache_count;
  RAISE NOTICE '  live_match_states     : % matchs actifs', states_count;
  RAISE NOTICE '  live_match_events     : % événements', events_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes :';
  RAISE NOTICE '  1. Vérifier API_FOOTBALL_KEY dans Supabase Secrets';
  RAISE NOTICE '  2. Déployer Edge Function : supabase functions deploy api-football';
  RAISE NOTICE '  3. (Optionnel) Activer pg_cron dans Database > Extensions';
  RAISE NOTICE '══════════════════════════════════════════';
END $$;
