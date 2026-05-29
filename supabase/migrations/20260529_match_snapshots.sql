-- Central football match snapshots for reliable livescore coverage.
-- Stores today's scheduled, live, and finished matches independently of UI cache.

CREATE TABLE IF NOT EXISTS public.match_snapshots (
  fixture_id text PRIMARY KEY,
  provider text NOT NULL DEFAULT 'api-football',
  provider_fixture_id text NOT NULL,
  match_date date NOT NULL,
  kickoff_at timestamptz,
  home_team_id text,
  home_team text NOT NULL,
  home_logo text,
  away_team_id text,
  away_team text NOT NULL,
  away_logo text,
  home_score integer,
  away_score integer,
  minute integer,
  status text NOT NULL DEFAULT 'NS',
  league_id text,
  league_name text,
  league_logo text,
  league_country text,
  coverage_level text NOT NULL DEFAULT 'standard',
  source_priority integer NOT NULL DEFAULT 50,
  raw_payload jsonb,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.match_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'match_snapshots'
      AND policyname = 'match_snapshots_select_all'
  ) THEN
    CREATE POLICY "match_snapshots_select_all"
      ON public.match_snapshots FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'match_snapshots'
      AND policyname = 'match_snapshots_service_role'
  ) THEN
    CREATE POLICY "match_snapshots_service_role"
      ON public.match_snapshots FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT ON public.match_snapshots TO anon;
GRANT SELECT ON public.match_snapshots TO authenticated;
GRANT ALL ON public.match_snapshots TO service_role;

CREATE INDEX IF NOT EXISTS idx_match_snapshots_date_status
  ON public.match_snapshots (match_date DESC, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_snapshots_league_date
  ON public.match_snapshots (league_id, match_date DESC);

CREATE INDEX IF NOT EXISTS idx_match_snapshots_freshness
  ON public.match_snapshots (updated_at DESC, last_seen_at DESC);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_snapshots;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

CREATE OR REPLACE FUNCTION public.upsert_match_snapshot(
  p_fixture_id text,
  p_provider text,
  p_provider_fixture_id text,
  p_match_date date,
  p_kickoff_at timestamptz,
  p_home_team_id text,
  p_home_team text,
  p_home_logo text,
  p_away_team_id text,
  p_away_team text,
  p_away_logo text,
  p_home_score integer,
  p_away_score integer,
  p_minute integer,
  p_status text,
  p_league_id text,
  p_league_name text,
  p_league_logo text,
  p_league_country text,
  p_coverage_level text,
  p_source_priority integer,
  p_raw_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_priority integer;
  existing_updated timestamptz;
BEGIN
  SELECT source_priority, updated_at
    INTO existing_priority, existing_updated
  FROM public.match_snapshots
  WHERE fixture_id = p_fixture_id;

  IF existing_priority IS NOT NULL
     AND existing_priority > p_source_priority
     AND existing_updated > now() - interval '45 seconds' THEN
    UPDATE public.match_snapshots
      SET last_seen_at = now()
    WHERE fixture_id = p_fixture_id;
    RETURN;
  END IF;

  INSERT INTO public.match_snapshots (
    fixture_id, provider, provider_fixture_id, match_date, kickoff_at,
    home_team_id, home_team, home_logo,
    away_team_id, away_team, away_logo,
    home_score, away_score, minute, status,
    league_id, league_name, league_logo, league_country,
    coverage_level, source_priority, raw_payload,
    last_seen_at, updated_at
  ) VALUES (
    p_fixture_id, p_provider, p_provider_fixture_id, p_match_date, p_kickoff_at,
    p_home_team_id, p_home_team, p_home_logo,
    p_away_team_id, p_away_team, p_away_logo,
    p_home_score, p_away_score, p_minute, p_status,
    p_league_id, p_league_name, p_league_logo, p_league_country,
    p_coverage_level, p_source_priority, p_raw_payload,
    now(), now()
  )
  ON CONFLICT (fixture_id) DO UPDATE SET
    provider = EXCLUDED.provider,
    provider_fixture_id = EXCLUDED.provider_fixture_id,
    match_date = EXCLUDED.match_date,
    kickoff_at = EXCLUDED.kickoff_at,
    home_team_id = EXCLUDED.home_team_id,
    home_team = EXCLUDED.home_team,
    home_logo = EXCLUDED.home_logo,
    away_team_id = EXCLUDED.away_team_id,
    away_team = EXCLUDED.away_team,
    away_logo = EXCLUDED.away_logo,
    home_score = EXCLUDED.home_score,
    away_score = EXCLUDED.away_score,
    minute = EXCLUDED.minute,
    status = EXCLUDED.status,
    league_id = EXCLUDED.league_id,
    league_name = EXCLUDED.league_name,
    league_logo = EXCLUDED.league_logo,
    league_country = EXCLUDED.league_country,
    coverage_level = EXCLUDED.coverage_level,
    source_priority = EXCLUDED.source_priority,
    raw_payload = EXCLUDED.raw_payload,
    last_seen_at = now(),
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_match_snapshot TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_match_snapshots()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted integer;
BEGIN
  DELETE FROM public.match_snapshots
  WHERE (
      status IN ('FT', 'AET', 'PEN', 'AWD', 'WO')
      AND updated_at < now() - interval '24 hours'
    )
    OR (
      status NOT IN ('1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'INT', 'FT', 'AET', 'PEN', 'AWD', 'WO')
      AND match_date < current_date - interval '2 days'
    )
    OR (
      status IN ('1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'INT')
      AND updated_at < now() - interval '2 hours'
    );

  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_match_snapshots TO service_role;

CREATE OR REPLACE FUNCTION public.get_live_data_health()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'live_matches', (
      SELECT count(*)
      FROM public.match_snapshots
      WHERE status IN ('1H', '2H', 'HT', 'ET', 'P', 'BT', 'INT', 'LIVE')
    ),
    'finished_today', (
      SELECT count(*)
      FROM public.match_snapshots
      WHERE match_date = current_date
        AND status IN ('FT', 'AET', 'PEN', 'AWD', 'WO')
    ),
    'scheduled_today', (
      SELECT count(*)
      FROM public.match_snapshots
      WHERE match_date = current_date
        AND status NOT IN ('1H', '2H', 'HT', 'ET', 'P', 'BT', 'INT', 'LIVE', 'FT', 'AET', 'PEN', 'AWD', 'WO')
    ),
    'stale_live_matches', (
      SELECT count(*)
      FROM public.match_snapshots
      WHERE status IN ('1H', '2H', 'HT', 'ET', 'P', 'BT', 'INT', 'LIVE')
        AND updated_at < now() - interval '45 seconds'
    ),
    'latest_update_at', (
      SELECT max(updated_at)
      FROM public.match_snapshots
    ),
    'providers', (
      SELECT coalesce(jsonb_object_agg(provider, total), '{}'::jsonb)
      FROM (
        SELECT provider, count(*) AS total
        FROM public.match_snapshots
        WHERE updated_at >= now() - interval '24 hours'
        GROUP BY provider
      ) providers
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_live_data_health() TO anon;
GRANT EXECUTE ON FUNCTION public.get_live_data_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_live_data_health() TO service_role;
