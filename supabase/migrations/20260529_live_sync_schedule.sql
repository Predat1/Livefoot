-- Keep the API-Football live sync cadence aligned with the realtime pipeline.

DO $$
DECLARE
  has_cron boolean;
  has_net boolean;
  has_vault boolean;
  has_project_url boolean := false;
  has_publishable_key boolean := false;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') INTO has_cron;
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') INTO has_net;
  SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'vault') INTO has_vault;

  IF has_vault THEN
    SELECT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'project_url') INTO has_project_url;
    SELECT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'publishable_key') INTO has_publishable_key;
  END IF;

  IF has_cron THEN
    PERFORM cron.unschedule('sync-live-fixtures-20s') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-live-fixtures-20s');
    PERFORM cron.unschedule('sync-live-fixtures-15s') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-live-fixtures-15s');
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
