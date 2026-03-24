
ALTER TABLE public.api_keys ADD COLUMN client_email text;
ALTER TABLE public.api_keys ADD COLUMN tool_limits jsonb DEFAULT '{}';

COMMENT ON COLUMN public.api_keys.client_email IS 'Email associata alla licenza per collegamento con account sito';
COMMENT ON COLUMN public.api_keys.tool_limits IS 'Limiti mensili per singolo strumento, es. {"diagnosis": 30, "orthodontic": 20, "mtc_sistemica": 15}';
