
-- Tabella questionari Check Up Ortodontico Posturale
CREATE TABLE public.checkup_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  patient_first_name TEXT NOT NULL DEFAULT '',
  patient_last_name TEXT NOT NULL DEFAULT '',
  patient_birth_date DATE,
  patient_sex TEXT,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','completed')),
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_section TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.checkup_questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own checkups"
  ON public.checkup_questionnaires FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own checkups"
  ON public.checkup_questionnaires FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own checkups"
  ON public.checkup_questionnaires FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own checkups"
  ON public.checkup_questionnaires FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_checkup_updated_at
  BEFORE UPDATE ON public.checkup_questionnaires
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_checkup_user_status ON public.checkup_questionnaires(user_id, status, updated_at DESC);
