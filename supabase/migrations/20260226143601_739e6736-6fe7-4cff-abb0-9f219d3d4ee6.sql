
CREATE TABLE public.match_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fixture_id text NOT NULL,
  home_score integer NOT NULL DEFAULT 0,
  away_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, fixture_id)
);

ALTER TABLE public.match_predictions ENABLE ROW LEVEL SECURITY;

-- Users can view all predictions (community feature)
CREATE POLICY "Anyone can view predictions"
  ON public.match_predictions
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own predictions
CREATE POLICY "Users can insert own predictions"
  ON public.match_predictions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own predictions
CREATE POLICY "Users can update own predictions"
  ON public.match_predictions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own predictions
CREATE POLICY "Users can delete own predictions"
  ON public.match_predictions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER handle_match_predictions_updated_at
  BEFORE UPDATE ON public.match_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
