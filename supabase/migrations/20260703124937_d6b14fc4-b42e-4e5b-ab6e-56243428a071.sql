
-- ============================================================
-- USER PLANS
-- ============================================================
CREATE TYPE public.subscription_plan AS ENUM ('base', 'pro', 'platinum');

CREATE TABLE public.user_plans (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'base',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_plans TO authenticated;
GRANT ALL ON public.user_plans TO service_role;

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own plan" ON public.user_plans
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins read all plans" ON public.user_plans
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert plans" ON public.user_plans
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update plans" ON public.user_plans
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete plans" ON public.user_plans
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER user_plans_set_updated_at
  BEFORE UPDATE ON public.user_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: get plan (defaults to 'base' if no row)
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id UUID)
RETURNS public.subscription_plan
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT plan FROM public.user_plans WHERE user_id = _user_id),
    'base'::public.subscription_plan
  )
$$;

-- ============================================================
-- MATERIAL SECTIONS
-- ============================================================
CREATE TABLE public.material_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_sections TO authenticated;
GRANT ALL ON public.material_sections TO service_role;

ALTER TABLE public.material_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read sections" ON public.material_sections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage sections insert" ON public.material_sections
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage sections update" ON public.material_sections
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage sections delete" ON public.material_sections
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER material_sections_set_updated_at
  BEFORE UPDATE ON public.material_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- LEARNING MATERIALS
-- ============================================================
CREATE TYPE public.material_content_type AS ENUM ('video_link', 'video_upload', 'pdf', 'article');

CREATE TABLE public.learning_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.material_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type public.material_content_type NOT NULL,
  video_url TEXT,           -- for content_type = 'video_link' (YouTube/Vimeo URL)
  file_path TEXT,           -- storage path for video_upload / pdf
  file_size BIGINT,
  file_mime TEXT,
  article_content TEXT,     -- markdown for content_type = 'article'
  allowed_plans public.subscription_plan[] NOT NULL DEFAULT ARRAY['base','pro','platinum']::public.subscription_plan[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX learning_materials_section_sort_idx
  ON public.learning_materials(section_id, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_materials TO authenticated;
GRANT ALL ON public.learning_materials TO service_role;

ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;

-- Users see published materials whose allowed_plans include their current plan; admins see all
CREATE POLICY "Users read materials for their plan" ON public.learning_materials
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      is_published = true
      AND public.get_user_plan(auth.uid()) = ANY (allowed_plans)
    )
  );

CREATE POLICY "Admins insert materials" ON public.learning_materials
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update materials" ON public.learning_materials
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete materials" ON public.learning_materials
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER learning_materials_set_updated_at
  BEFORE UPDATE ON public.learning_materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper for the client: can a user access a specific material?
CREATE OR REPLACE FUNCTION public.user_can_access_material(_user_id UUID, _material_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.learning_materials m
      WHERE m.id = _material_id
        AND m.is_published = true
        AND public.get_user_plan(_user_id) = ANY (m.allowed_plans)
    )
$$;
