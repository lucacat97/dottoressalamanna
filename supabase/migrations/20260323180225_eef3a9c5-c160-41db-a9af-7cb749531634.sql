
-- Restrict get_monthly_ai_usage to caller's own data
CREATE OR REPLACE FUNCTION public.get_monthly_ai_usage(_user_id uuid, _tool_name text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.ai_usage_log
    WHERE user_id = _user_id
      AND tool_name = _tool_name
      AND created_at >= date_trunc('month', now())
  );
END;
$$;

-- Restrict get_api_key_monthly_usage to admins only
CREATE OR REPLACE FUNCTION public.get_api_key_monthly_usage(_api_key_id uuid, _tool_name text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.api_usage_log
    WHERE api_key_id = _api_key_id
      AND tool_name = _tool_name
      AND created_at >= date_trunc('month', now())
  );
END;
$$;

-- Revoke direct execute on has_role and has_course_access from public/anon/authenticated
-- They remain usable in RLS policy expressions (evaluated by the policy owner)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_course_access(uuid, uuid) FROM anon, authenticated;
