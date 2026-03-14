
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- user_roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for course_editions: admins can insert/update/delete
CREATE POLICY "Admins can insert editions" ON public.course_editions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update editions" ON public.course_editions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete editions" ON public.course_editions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for course_registrations: admins can delete
CREATE POLICY "Admins can delete registrations" ON public.course_registrations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for course_materials: admins can insert/delete
CREATE POLICY "Admins can insert materials" ON public.course_materials
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete materials" ON public.course_materials
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Assign admin role to existing user
INSERT INTO public.user_roles (user_id, role)
VALUES ('c5439d71-37f2-47b8-ba63-89dfe182e21e', 'admin');
