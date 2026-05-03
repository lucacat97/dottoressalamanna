
-- 1) Consultation requests
CREATE TABLE public.consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_full_name TEXT,
  notes TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consultation requests"
  ON public.consultation_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own consultation requests"
  ON public.consultation_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update consultation requests"
  ON public.consultation_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete consultation requests"
  ON public.consultation_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_consultation_requests_user ON public.consultation_requests(user_id, created_at DESC);

-- 2) Posturographic checkups
CREATE TABLE public.posturographic_checkups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  patient_first_name TEXT NOT NULL,
  patient_last_name TEXT NOT NULL,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posturographic_checkups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkups"
  ON public.posturographic_checkups FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own checkups"
  ON public.posturographic_checkups FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own checkups"
  ON public.posturographic_checkups FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own checkups"
  ON public.posturographic_checkups FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_checkups_user_date ON public.posturographic_checkups(user_id, exam_date DESC);

-- updated_at trigger function (reuse pattern)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_consultation_requests_updated
  BEFORE UPDATE ON public.consultation_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_posturographic_checkups_updated
  BEFORE UPDATE ON public.posturographic_checkups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Storage bucket for consultation attachments (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('consultation-attachments', 'consultation-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own consultation attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'consultation-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own consultation attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'consultation-attachments'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Users can delete own consultation attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'consultation-attachments'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
  );
