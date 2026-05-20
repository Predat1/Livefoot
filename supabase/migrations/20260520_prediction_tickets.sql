-- ─── Prediction Tickets Table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.prediction_tickets (
  id              TEXT PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title           TEXT,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'saved', 'shared')),
  items           JSONB NOT NULL DEFAULT '[]'::jsonb,
  public_share_id TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_prediction_tickets_user ON public.prediction_tickets(user_id);
-- Index for fast public share lookup
CREATE INDEX IF NOT EXISTS idx_prediction_tickets_share ON public.prediction_tickets(public_share_id) WHERE public_share_id IS NOT NULL;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_prediction_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prediction_tickets_updated_at ON public.prediction_tickets;
CREATE TRIGGER trg_prediction_tickets_updated_at
  BEFORE UPDATE ON public.prediction_tickets
  FOR EACH ROW EXECUTE FUNCTION update_prediction_tickets_updated_at();

-- ─── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.prediction_tickets ENABLE ROW LEVEL SECURITY;

-- Owner: full access
DROP POLICY IF EXISTS "prediction_tickets_owner_all" ON public.prediction_tickets;
CREATE POLICY "prediction_tickets_owner_all" ON public.prediction_tickets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public share: read-only via public_share_id (no auth required)
DROP POLICY IF EXISTS "prediction_tickets_public_read" ON public.prediction_tickets;
CREATE POLICY "prediction_tickets_public_read" ON public.prediction_tickets
  FOR SELECT
  USING (public_share_id IS NOT NULL AND status IN ('saved', 'shared'));

-- Anonymous (no user): can insert with null user_id and read their own via ticket id
DROP POLICY IF EXISTS "prediction_tickets_anon_insert" ON public.prediction_tickets;
CREATE POLICY "prediction_tickets_anon_insert" ON public.prediction_tickets
  FOR INSERT
  WITH CHECK (user_id IS NULL);
