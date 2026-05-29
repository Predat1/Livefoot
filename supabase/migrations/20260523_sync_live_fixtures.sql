-- Live fixture sync support.
-- Schedules sync-live-fixtures when pg_cron, pg_net, and Vault secrets exist.

CREATE INDEX IF NOT EXISTS idx_live_states_updated_at
  ON public.live_match_states (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_states_league_status
  ON public.live_match_states (league_id, status, updated_at DESC);

CREATE OR REPLACE FUNCTION public.get_live_sync_health()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'active_matches', (
      SELECT COUNT(*)
      FROM public.live_match_states
      WHERE status IN ('1H', '2H', 'HT', 'ET', 'P', 'BT', 'INT', 'LIVE')
    ),
    'stale_active_matches', (
      SELECT COUNT(*)
      FROM public.live_match_states
      WHERE status IN ('1H', '2H', 'HT', 'ET', 'P', 'BT', 'INT', 'LIVE')
        AND updated_at < NOW() - INTERVAL '45 seconds'
    ),
    'latest_update_at', (
      SELECT MAX(updated_at)
      FROM public.live_match_states
    ),
    'recent_events', (
      SELECT COUNT(*)
      FROM public.live_match_events
      WHERE created_at >= NOW() - INTERVAL '30 minutes'
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_live_sync_health() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_live_sync_health() TO authenticated;

DO $$
DECLARE
  has_cron boolean;
  has_net boolean;
  has_project_url boolean;
  has_publishable_key boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') INTO has_cron;
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') INTO has_net;
  SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'vault') INTO has_project_url;
  has_publishable_key := has_project_url;

  IF has_project_url THEN
    SELECT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'project_url') INTO has_project_url;
    SELECT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'publishable_key') INTO has_publishable_key;
  END IF;

  IF has_cron AND has_net AND has_project_url AND has_publishable_key THEN
    PERFORM cron.schedule(
      'sync-live-fixtures-15s',
      '15 seconds',
      $job$
        SELECT net.http_post(
          url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/sync-live-fixtures',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'publishable_key')
          ),
          body := jsonb_build_object('timezone', 'Africa/Douala'),
          timeout_milliseconds := 15000
        );
      $job$
    );
  ELSE
    RAISE NOTICE 'sync-live-fixtures cron not scheduled. Need pg_cron=%, pg_net=%, project_url secret=%, publishable_key secret=%',
      has_cron, has_net, has_project_url, has_publishable_key;
  END IF;
END $$;
