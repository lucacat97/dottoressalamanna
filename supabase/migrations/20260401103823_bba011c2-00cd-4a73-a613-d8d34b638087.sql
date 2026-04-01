
CREATE TABLE public.tool_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  feedback TEXT NOT NULL,
  submitted_by UUID NOT NULL,
  submitted_by_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_feedback ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert feedback
CREATE POLICY "Authenticated users can insert feedback"
ON public.tool_feedback
FOR INSERT
TO authenticated
WITH CHECK (submitted_by = auth.uid());

-- Users can view own feedback
CREATE POLICY "Users can view own feedback"
ON public.tool_feedback
FOR SELECT
TO authenticated
USING (submitted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Admins can manage all feedback
CREATE POLICY "Admins can manage feedback"
ON public.tool_feedback
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to get active feedback for a tool (used by edge functions)
CREATE OR REPLACE FUNCTION public.get_tool_feedback(_tool_name TEXT)
RETURNS TABLE(feedback TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT feedback, created_at
  FROM public.tool_feedback
  WHERE tool_name = _tool_name
    AND is_active = true
  ORDER BY created_at ASC;
$$;
