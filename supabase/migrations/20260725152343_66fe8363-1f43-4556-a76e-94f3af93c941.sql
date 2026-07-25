ALTER TABLE public.course_materials ADD COLUMN IF NOT EXISTS material_type text NOT NULL DEFAULT 'file';
ALTER TABLE public.course_materials ADD COLUMN IF NOT EXISTS external_url text;
ALTER TABLE public.course_materials ALTER COLUMN file_path DROP NOT NULL;
ALTER TABLE public.course_materials DROP CONSTRAINT IF EXISTS course_materials_type_check;
ALTER TABLE public.course_materials ADD CONSTRAINT course_materials_type_check CHECK (material_type IN ('file','link','image'));
ALTER TABLE public.course_materials DROP CONSTRAINT IF EXISTS course_materials_link_url_check;
ALTER TABLE public.course_materials ADD CONSTRAINT course_materials_link_url_check CHECK (
  (material_type = 'file' AND file_path IS NOT NULL)
  OR (material_type IN ('link','image') AND external_url IS NOT NULL)
);