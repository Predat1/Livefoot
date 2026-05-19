-- Description: Create persistent cache table for API-Football calls to prevent daily quota exhaustion

CREATE TABLE IF NOT EXISTS public.api_football_cache (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_football_cache ENABLE ROW LEVEL SECURITY;

-- Policy to allow service_role to manage the cache table
CREATE POLICY "Allow service_role to manage api_football_cache" 
ON public.api_football_cache 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Index for expiration cleanup performance
CREATE INDEX IF NOT EXISTS idx_api_football_cache_expires_at ON public.api_football_cache (expires_at);

-- Grant privileges
GRANT ALL ON public.api_football_cache TO service_role;
GRANT ALL ON public.api_football_cache TO postgres;
