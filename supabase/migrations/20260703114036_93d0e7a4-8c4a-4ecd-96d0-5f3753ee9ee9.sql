
-- 1) Restrict get_tool_feedback to service_role only (edge functions)
REVOKE EXECUTE ON FUNCTION public.get_tool_feedback(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_tool_feedback(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_tool_feedback(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_tool_feedback(text) TO service_role;

-- 2) Enforce ownership on course_registrations INSERT
DROP POLICY IF EXISTS "Anyone can register for courses" ON public.course_registrations;

CREATE POLICY "Anyone can register for courses"
ON public.course_registrations
FOR INSERT
WITH CHECK (
  ((registered_by IS NULL) OR (registered_by = 'user'::text))
  AND (
    -- Anonymous submissions still allowed
    auth.uid() IS NULL
    OR
    -- Authenticated users can only register with their own email
    email = public.get_auth_email()
  )
);
