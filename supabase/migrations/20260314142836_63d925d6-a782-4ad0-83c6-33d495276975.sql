
-- Table for manual access overrides by admin
CREATE TABLE public.course_access_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES public.course_editions(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(edition_id, user_email)
);

ALTER TABLE public.course_access_overrides ENABLE ROW LEVEL SECURITY;

-- Only admins can manage overrides
CREATE POLICY "Admins can manage access overrides" ON public.course_access_overrides
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can view their own overrides
CREATE POLICY "Users can view own overrides" ON public.course_access_overrides
  FOR SELECT TO authenticated
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Function to check if user has access to an edition's materials
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid, _edition_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'admin')
    OR
    EXISTS (
      SELECT 1 FROM public.course_access_overrides
      WHERE edition_id = _edition_id
        AND user_email = (SELECT email FROM auth.users WHERE id = _user_id)
        AND granted = true
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.course_registrations
        WHERE edition_id = _edition_id
          AND email = (SELECT email FROM auth.users WHERE id = _user_id)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.course_access_overrides
        WHERE edition_id = _edition_id
          AND user_email = (SELECT email FROM auth.users WHERE id = _user_id)
          AND granted = false
      )
    )
$$;

-- Update RLS on course_materials: restrict SELECT to users with access
DROP POLICY IF EXISTS "Authenticated users can view materials" ON public.course_materials;

CREATE POLICY "Users can view materials for their courses" ON public.course_materials
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_course_access(auth.uid(), edition_id)
  );
