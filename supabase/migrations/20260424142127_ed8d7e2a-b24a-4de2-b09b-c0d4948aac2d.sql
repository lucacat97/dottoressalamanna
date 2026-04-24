
-- Estendi course_editions con campi landing
ALTER TABLE public.course_editions
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS agenda text,
  ADD COLUMN IF NOT EXISTS objectives text,
  ADD COLUMN IF NOT EXISTS price text;

-- Tabella media (foto/video) per ogni edizione
CREATE TABLE IF NOT EXISTS public.course_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES public.course_editions(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('image','video')),
  url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course media"
  ON public.course_media FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert course media"
  ON public.course_media FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update course media"
  ON public.course_media FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete course media"
  ON public.course_media FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_course_media_edition ON public.course_media(edition_id, sort_order);

-- Bucket pubblico per i media delle landing
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-landings', 'course-landings', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read course landings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-landings');

CREATE POLICY "Admins can upload course landings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-landings' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update course landings"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-landings' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete course landings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-landings' AND has_role(auth.uid(), 'admin'::app_role));
