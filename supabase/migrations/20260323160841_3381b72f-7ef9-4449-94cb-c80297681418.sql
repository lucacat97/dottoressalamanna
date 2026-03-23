
-- Create a security definer function to get the current user's email
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid()
$$;

-- Drop old policies that reference auth.users directly
DROP POLICY IF EXISTS "Users can view own overrides" ON public.course_access_overrides;
DROP POLICY IF EXISTS "Users can view own registrations" ON public.course_registrations;

-- Recreate with security definer function
CREATE POLICY "Users can view own overrides"
  ON public.course_access_overrides
  FOR SELECT
  TO authenticated
  USING (user_email = public.get_auth_email());

CREATE POLICY "Users can view own registrations"
  ON public.course_registrations
  FOR SELECT
  TO authenticated
  USING (email = public.get_auth_email() OR has_role(auth.uid(), 'admin'::app_role));
