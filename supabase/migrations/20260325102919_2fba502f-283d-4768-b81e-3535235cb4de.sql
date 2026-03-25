
-- Add confirmed column to course_registrations (default false for new, set true for existing)
ALTER TABLE public.course_registrations ADD COLUMN confirmed boolean NOT NULL DEFAULT false;
UPDATE public.course_registrations SET confirmed = true;

-- Update has_course_access to require confirmed = true
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid, _edition_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
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
          AND confirmed = true
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.course_access_overrides
        WHERE edition_id = _edition_id
          AND user_email = (SELECT email FROM auth.users WHERE id = _user_id)
          AND granted = false
      )
    )
$$;
