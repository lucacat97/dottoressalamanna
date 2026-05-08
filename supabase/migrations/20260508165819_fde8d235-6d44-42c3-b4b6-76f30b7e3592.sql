-- Tabella inviti per onboarding professionisti con licenza pre-assegnata
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  tools text[] NOT NULL DEFAULT ARRAY[]::text[],
  monthly_limit integer NOT NULL DEFAULT 30,
  tool_limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid,
  note text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invitations"
  ON public.invitations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
