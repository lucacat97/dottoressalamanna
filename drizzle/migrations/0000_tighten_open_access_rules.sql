DROP POLICY IF EXISTS "Anyone can upload web consultation attachments" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view course media" ON public.course_media;
CREATE POLICY "Anyone can view media of listed courses" ON public.course_media
FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.course_editions e WHERE e.id = course_media.edition_id AND e.status IN ('upcoming','completed'))
       OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated read sections" ON public.material_sections;
CREATE POLICY "Users read sections with accessible materials" ON public.material_sections
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR EXISTS (
  SELECT 1 FROM public.learning_materials m
  WHERE m.section_id = material_sections.id AND m.is_published = true
    AND public.get_user_plan(auth.uid()) = ANY (m.allowed_plans)));

DROP POLICY IF EXISTS "Anyone can insert newsletter consent" ON public.newsletter_consents;
CREATE POLICY "Anyone can insert valid newsletter consent" ON public.newsletter_consents
FOR INSERT TO anon, authenticated
WITH CHECK (
  source IN ('signup','course_registration')
  AND length(email) <= 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (user_id IS NULL OR user_id = auth.uid())
);