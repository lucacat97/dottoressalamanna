-- Restrict course-materials storage bucket access
DROP POLICY IF EXISTS "Authenticated users can download materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload materials" ON storage.objects;

-- Only admins can upload course materials
CREATE POLICY "Admins can upload course materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-materials'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Only admins can delete course materials (so files don't get orphaned)
CREATE POLICY "Admins can delete course materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Only admins can update course materials metadata
CREATE POLICY "Admins can update course materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Users can download a file only if they have access to the corresponding course
CREATE POLICY "Users with course access can download materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.course_materials cm
      WHERE cm.file_path = storage.objects.name
        AND public.has_course_access(auth.uid(), cm.edition_id)
    )
  )
);

-- Restrict the public landings bucket to specific files only (no listing)
-- The bucket stays public for file access, but listing is no longer allowed.
DROP POLICY IF EXISTS "Public can read course landings" ON storage.objects;

CREATE POLICY "Public can read individual course landing files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'course-landings'
  AND name IS NOT NULL
);