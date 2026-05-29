-- Reset live data infrastructure to API-Football only.
-- This intentionally removes the temporary multi-provider snapshot table.

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.match_snapshots;
  EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

DROP FUNCTION IF EXISTS public.upsert_match_snapshot(
  text, text, text, date, timestamptz,
  text, text, text,
  text, text, text,
  integer, integer, integer, text,
  text, text, text, text,
  text, integer, jsonb
);
DROP FUNCTION IF EXISTS public.cleanup_match_snapshots();
DROP TABLE IF EXISTS public.match_snapshots;

CREATE OR REPLACE FUNCTION public.get_live_data_health()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'provider', 'api-football',
    'active_matches', (
      SELECT count(*)
      FROM public.live_match_states
      WHERE status IN ('1H', '2H', 'HT', 'ET', 'P', 'BT', 'INT', 'LIVE')
    ),
    'stale_active_matches', (
      SELECT count(*)
      FROM public.live_match_states
      WHERE status IN ('1H', '2H', 'HT', 'ET', 'P', 'BT', 'INT', 'LIVE')
        AND updated_at < now() - interval '45 seconds'
    ),
    'finished_recent', (
      SELECT count(*)
      FROM public.live_match_states
      WHERE status IN ('FT', 'AET', 'PEN', 'AWD', 'WO')
        AND updated_at >= now() - interval '24 hours'
    ),
    'latest_update_at', (
      SELECT max(updated_at)
      FROM public.live_match_states
    ),
    'recent_events', (
      SELECT count(*)
      FROM public.live_match_events
      WHERE detected_at >= now() - interval '30 minutes'
    ),
    'recent_api_calls', (
      SELECT count(*)
      FROM public.api_usage_logs
      WHERE endpoint LIKE 'api-football/%'
        AND created_at >= now() - interval '30 minutes'
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_live_data_health() TO anon;
GRANT EXECUTE ON FUNCTION public.get_live_data_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_live_data_health() TO service_role;
