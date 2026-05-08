CREATE TABLE public.consultation_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  api_key_id UUID,
  consultation_type TEXT,
  download_count INTEGER NOT NULL DEFAULT 0,
  max_downloads INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  last_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultation_downloads_token ON public.consultation_downloads(token);
CREATE INDEX idx_consultation_downloads_expires ON public.consultation_downloads(expires_at);

ALTER TABLE public.consultation_downloads ENABLE ROW LEVEL SECURITY;

-- Solo service role (edge functions) legge/scrive. Nessun accesso client.
CREATE POLICY "Service role manages consultation downloads"
ON public.consultation_downloads
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Admin può leggere per audit
CREATE POLICY "Admins can view consultation downloads"
ON public.consultation_downloads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));