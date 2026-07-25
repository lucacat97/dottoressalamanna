
CREATE TABLE public.newsletter_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'signup',
  user_id UUID,
  consented_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_newsletter_consents_email ON public.newsletter_consents(lower(email));

GRANT SELECT, INSERT ON public.newsletter_consents TO anon;
GRANT SELECT, INSERT ON public.newsletter_consents TO authenticated;
GRANT ALL ON public.newsletter_consents TO service_role;

ALTER TABLE public.newsletter_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert newsletter consent"
  ON public.newsletter_consents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view newsletter consents"
  ON public.newsletter_consents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.course_registrations
  ADD COLUMN IF NOT EXISTS newsletter_consent BOOLEAN NOT NULL DEFAULT false;
