-- Ensure web push subscriptions exist in production.
-- The original table definition exists in older local migrations, but some
-- deployed databases may not have that migration recorded/applied.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  endpoint text UNIQUE NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'push_subscriptions'
      AND policyname = 'Users can view own subscriptions'
  ) THEN
    CREATE POLICY "Users can view own subscriptions"
      ON public.push_subscriptions
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'push_subscriptions'
      AND policyname = 'Users can manage own subscriptions'
  ) THEN
    CREATE POLICY "Users can manage own subscriptions"
      ON public.push_subscriptions
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'push_subscriptions'
      AND policyname = 'Anon can insert subscriptions'
  ) THEN
    CREATE POLICY "Anon can insert subscriptions"
      ON public.push_subscriptions
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'push_subscriptions'
      AND policyname = 'service_role manages push_subscriptions'
  ) THEN
    CREATE POLICY "service_role manages push_subscriptions"
      ON public.push_subscriptions
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT INSERT ON public.push_subscriptions TO anon;
GRANT ALL ON public.push_subscriptions TO service_role;
