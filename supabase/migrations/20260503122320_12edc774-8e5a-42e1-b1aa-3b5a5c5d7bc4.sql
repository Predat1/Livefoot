
-- Predictions: restrict raw read to own rows
DROP POLICY IF EXISTS "Anyone can view predictions" ON public.match_predictions;
CREATE POLICY "Users can view own predictions"
  ON public.match_predictions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Aggregated stats function (no user identifiers leaked)
CREATE OR REPLACE FUNCTION public.get_prediction_stats(_fixture_id text)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total', COUNT(*),
    'home_wins', COUNT(*) FILTER (WHERE home_score > away_score),
    'draws', COUNT(*) FILTER (WHERE home_score = away_score),
    'away_wins', COUNT(*) FILTER (WHERE home_score < away_score),
    'avg_home', COALESCE(ROUND(AVG(home_score)::numeric, 1), 0),
    'avg_away', COALESCE(ROUND(AVG(away_score)::numeric, 1), 0),
    'top_scores', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT (home_score || '-' || away_score) AS score, COUNT(*) AS count
        FROM public.match_predictions
        WHERE fixture_id = _fixture_id
        GROUP BY home_score, away_score
        ORDER BY COUNT(*) DESC
        LIMIT 3
      ) t
    ), '[]'::json)
  )
  FROM public.match_predictions
  WHERE fixture_id = _fixture_id;
$$;

-- Ratings: restrict raw read to own rows
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.player_ratings;
CREATE POLICY "Users can view own ratings"
  ON public.player_ratings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_player_rating_stats(_fixture_id text, _player_id text)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'avg', COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
    'count', COUNT(*)
  )
  FROM public.player_ratings
  WHERE fixture_id = _fixture_id AND player_id = _player_id;
$$;

-- Profiles: allow authenticated users to view other profiles
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
