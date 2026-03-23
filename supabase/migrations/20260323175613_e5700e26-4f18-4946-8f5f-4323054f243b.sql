
-- Make course-materials bucket private
UPDATE storage.buckets SET public = false WHERE id = 'course-materials';

-- Fix user_roles SELECT policy: restrict from public to authenticated
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
