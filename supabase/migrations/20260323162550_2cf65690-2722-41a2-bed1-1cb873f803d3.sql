
-- Fix permissive INSERT policy on course_registrations
-- Replace WITH CHECK (true) with a more restrictive check
DROP POLICY IF EXISTS "Anyone can register for courses" ON public.course_registrations;

CREATE POLICY "Anyone can register for courses"
  ON public.course_registrations
  FOR INSERT
  TO public
  WITH CHECK (
    registered_by IS NULL OR registered_by = 'user'
  );
