
CREATE OR REPLACE FUNCTION public.top_rated_players(since timestamptz DEFAULT (now() - interval '7 days'), lim int DEFAULT 50)
RETURNS TABLE(
  player_id text,
  player_name text,
  team_id text,
  avg_rating numeric,
  total_ratings bigint,
  fixture_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT
    pr.player_id,
    pr.player_name,
    pr.team_id,
    ROUND(AVG(pr.rating)::numeric, 2) AS avg_rating,
    COUNT(*) AS total_ratings,
    COUNT(DISTINCT pr.fixture_id) AS fixture_count
  FROM player_ratings pr
  WHERE pr.created_at >= since
  GROUP BY pr.player_id, pr.player_name, pr.team_id
  HAVING COUNT(*) >= 2
  ORDER BY avg_rating DESC, total_ratings DESC
  LIMIT lim;
$$;
