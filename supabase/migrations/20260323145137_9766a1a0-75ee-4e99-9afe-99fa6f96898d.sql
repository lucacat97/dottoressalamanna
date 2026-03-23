-- Fix: Restrict course_registrations SELECT to own data + admins
DROP POLICY IF EXISTS "Authenticated users can view registrations" ON public.course_registrations;

CREATE POLICY "Users can view own registrations" ON public.course_registrations
  FOR SELECT TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Fix: Add explicit admin-only INSERT/UPDATE/DELETE on user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));