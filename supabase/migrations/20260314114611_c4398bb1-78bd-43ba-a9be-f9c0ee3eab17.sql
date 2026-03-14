
-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', true);

-- Create materials table
CREATE TABLE public.course_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  edition_id UUID REFERENCES public.course_editions(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view materials
CREATE POLICY "Authenticated users can view materials" ON public.course_materials FOR SELECT TO authenticated USING (true);

-- Storage policies: authenticated users can read
CREATE POLICY "Authenticated users can download materials" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'course-materials');

-- Admin (authenticated) can upload
CREATE POLICY "Authenticated users can upload materials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-materials');
