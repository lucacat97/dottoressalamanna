
-- Admins full control over learning-materials objects
CREATE POLICY "Admins manage learning-materials objects"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'learning-materials' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'learning-materials' AND public.has_role(auth.uid(), 'admin'));

-- Authenticated users can read a file only if there's a matching material they can access
CREATE POLICY "Users read allowed learning-materials"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'learning-materials'
    AND EXISTS (
      SELECT 1 FROM public.learning_materials m
      WHERE m.file_path = storage.objects.name
        AND m.is_published = true
        AND public.get_user_plan(auth.uid()) = ANY (m.allowed_plans)
    )
  );
