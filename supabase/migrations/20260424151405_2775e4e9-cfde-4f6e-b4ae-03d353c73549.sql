-- Tabella knowledge base IA
CREATE TABLE public.ai_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'global',
  source_type TEXT NOT NULL DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_knowledge_scope_active ON public.ai_knowledge(scope, is_active);

ALTER TABLE public.ai_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_knowledge"
ON public.ai_knowledge
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authenticated can view active ai_knowledge"
ON public.ai_knowledge
FOR SELECT
TO authenticated
USING (is_active = true);

-- Function per fetch dal lato edge function (security definer per essere sicuri)
CREATE OR REPLACE FUNCTION public.get_active_ai_knowledge(_scope TEXT)
RETURNS TABLE(title TEXT, content TEXT, scope TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT title, content, scope
  FROM public.ai_knowledge
  WHERE is_active = true
    AND (scope = 'global' OR scope = _scope)
  ORDER BY scope, created_at ASC;
$$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_ai_knowledge_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_ai_knowledge_timestamp
BEFORE UPDATE ON public.ai_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_ai_knowledge_updated_at();

-- Storage bucket per materiali (privato, solo admin)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-knowledge', 'ai-knowledge', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can read ai-knowledge files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ai-knowledge' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can upload ai-knowledge files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ai-knowledge' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete ai-knowledge files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ai-knowledge' AND public.has_role(auth.uid(), 'admin'::public.app_role));