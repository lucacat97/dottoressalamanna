CREATE TABLE public.mind_extension_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  label text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  notes text
);
GRANT ALL ON public.mind_extension_tokens TO service_role;
ALTER TABLE public.mind_extension_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage mind extension tokens"
ON public.mind_extension_tokens FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mind_extension_tokens TO authenticated;

CREATE TABLE public.mila_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'processing',
  source text NOT NULL DEFAULT 'mind_chrome_extension',
  request_id text,
  mind_patient_id text,
  professional_email text NOT NULL,
  tool text NOT NULL,
  filename text,
  document_storage_path text,
  email_sent boolean,
  error_code text,
  error_message text,
  completed_at timestamptz,
  token_id uuid REFERENCES public.mind_extension_tokens(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX mila_consultations_request_id_key ON public.mila_consultations (request_id) WHERE request_id IS NOT NULL;
GRANT ALL ON public.mila_consultations TO service_role;
ALTER TABLE public.mila_consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view mila consultations"
ON public.mila_consultations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.mila_consultations TO authenticated;