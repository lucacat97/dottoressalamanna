
-- 1) Lock down SECURITY DEFINER function execution
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- Grant back only what the app truly needs from client (authenticated only)
GRANT EXECUTE ON FUNCTION public.get_monthly_ai_usage(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_course_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_user_plans() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_plan(text, public.subscription_plan) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_api_key_monthly_usage(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_email() TO authenticated;

-- Trigger / service functions: keep service_role only (implicit via ownership)
-- (No grants needed to anon/authenticated for: get_active_ai_knowledge, get_tool_feedback,
--  enqueue_email, delete_email, move_to_dlq, read_email_batch, email_queue_dispatch,
--  email_queue_wake, sync_user_plan_from_subscription, set_updated_at,
--  update_ai_knowledge_updated_at, user_can_access_material)

-- 2) Set immutable search_path on functions that were missing it
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = '';
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = '';
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = '';
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = '';

-- 3) Remove public read on web/ consultation attachments (signed URLs will be minted server-side)
DROP POLICY IF EXISTS "Anyone can read web consultation attachments" ON storage.objects;

-- 4) Force new public course registrations to start unconfirmed
DROP POLICY IF EXISTS "Anyone can register for courses" ON public.course_registrations;
CREATE POLICY "Anyone can register for courses"
ON public.course_registrations
FOR INSERT
TO public
WITH CHECK (
  ((registered_by IS NULL) OR (registered_by = 'user'::text))
  AND ((auth.uid() IS NULL) OR (email = get_auth_email()))
  AND (confirmed = false)
);
