-- Remove stale live state rows that were left stuck as 1H/2H/HT/etc.
-- Live rows older than this are not trustworthy as real-time state.

CREATE INDEX IF NOT EXISTS idx_live_states_status_updated_at
  ON public.live_match_states (status, updated_at DESC);

CREATE OR REPLACE FUNCTION public.cleanup_finished_matches()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted integer;
BEGIN
  DELETE FROM public.live_match_states
  WHERE (
      status IN ('FT', 'AET', 'PEN', 'AWD', 'WO')
      AND updated_at < NOW() - INTERVAL '2 hours'
    )
    OR (
      status IN ('1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'INT')
      AND updated_at < NOW() - INTERVAL '10 minutes'
    );
  GET DIAGNOSTICS deleted = ROW_COUNT;

  DELETE FROM public.live_match_events
  WHERE detected_at < NOW() - INTERVAL '24 hours';

  RETURN deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_finished_matches() TO service_role;

SELECT public.cleanup_finished_matches();
