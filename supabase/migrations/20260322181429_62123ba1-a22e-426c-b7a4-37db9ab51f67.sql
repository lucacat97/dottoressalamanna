CREATE TABLE public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name text NOT NULL DEFAULT 'diagnosis-support',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.ai_usage_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own usage" ON public.ai_usage_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_monthly_ai_usage(_user_id uuid, _tool_name text)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.ai_usage_log
  WHERE user_id = _user_id
    AND tool_name = _tool_name
    AND created_at >= date_trunc('month', now())
$$;