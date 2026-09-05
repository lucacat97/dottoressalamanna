CREATE TABLE public.mind_activation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  studio_label text NOT NULL CHECK (char_length(studio_label) BETWEEN 1 AND 200),
  professional_first_name text NOT NULL CHECK (char_length(professional_first_name) BETWEEN 1 AND 100),
  professional_last_name text NOT NULL CHECK (char_length(professional_last_name) BETWEEN 1 AND 100),
  professional_email text NOT NULL CHECK (professional_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  max_activations integer NOT NULL DEFAULT 1 CHECK (max_activations BETWEEN 1 AND 100),
  used_activations integer NOT NULL DEFAULT 0 CHECK (used_activations >= 0),
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.mind_activation_codes TO service_role;

ALTER TABLE public.mind_activation_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to MIND activation codes"
  ON public.mind_activation_codes
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE TRIGGER mind_activation_codes_set_updated_at
  BEFORE UPDATE ON public.mind_activation_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.mind_companion_installations
  ADD COLUMN activation_code_id uuid REFERENCES public.mind_activation_codes(id) ON DELETE SET NULL;

CREATE INDEX mind_companion_installations_activation_code_idx
  ON public.mind_companion_installations(activation_code_id);