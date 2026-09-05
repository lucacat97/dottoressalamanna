CREATE TABLE public.mind_companion_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  device_label text NOT NULL CHECK (char_length(btrim(device_label)) BETWEEN 1 AND 200),
  professional_first_name text NOT NULL CHECK (char_length(btrim(professional_first_name)) BETWEEN 1 AND 100),
  professional_last_name text NOT NULL CHECK (char_length(btrim(professional_last_name)) BETWEEN 1 AND 100),
  professional_email text NOT NULL CHECK (professional_email = lower(btrim(professional_email)) AND professional_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

GRANT ALL ON public.mind_companion_installations TO service_role;

ALTER TABLE public.mind_companion_installations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.mind_companion_installations IS 'Installazioni manuali della Chrome Extension MIND; contiene soltanto hash SHA-256 dei token.';
COMMENT ON COLUMN public.mind_companion_installations.token_hash IS 'SHA-256 esadecimale del token installazione; il token in chiaro non viene salvato.';