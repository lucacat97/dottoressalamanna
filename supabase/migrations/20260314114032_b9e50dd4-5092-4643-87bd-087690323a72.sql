
-- Course editions table
CREATE TABLE public.course_editions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location TEXT,
  max_participants INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Registrations table
CREATE TABLE public.course_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  edition_id UUID REFERENCES public.course_editions(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  registered_by TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;

-- Course editions are publicly readable
CREATE POLICY "Anyone can view course editions" ON public.course_editions FOR SELECT USING (true);

-- Registrations: anyone can insert (public form)
CREATE POLICY "Anyone can register for courses" ON public.course_registrations FOR INSERT WITH CHECK (true);

-- Only authenticated users (admin) can view registrations
CREATE POLICY "Authenticated users can view registrations" ON public.course_registrations FOR SELECT TO authenticated USING (true);
