
-- 1. Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Admin stats view (safe aggregates, no PII)
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'total_predictions', (SELECT count(*) FROM public.match_predictions),
    'total_ratings', (SELECT count(*) FROM public.player_ratings),
    'total_favorites', (SELECT count(*) FROM public.favorites),
    'users_with_predictions', (SELECT count(DISTINCT user_id) FROM public.match_predictions),
    'users_with_ratings', (SELECT count(DISTINCT user_id) FROM public.player_ratings),
    'recent_signups_7d', (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
    'recent_signups_30d', (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '30 days')
  ) INTO result;

  RETURN result;
END;
$$;
