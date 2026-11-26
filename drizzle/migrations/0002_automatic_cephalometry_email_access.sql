CREATE TABLE public.automatic_cephalometry_access (
 email text PRIMARY KEY CHECK (email = lower(btrim(email)) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 enabled boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automatic_cephalometry_access TO authenticated;
GRANT ALL ON public.automatic_cephalometry_access TO service_role;
ALTER TABLE public.automatic_cephalometry_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own cephalometry authorization" ON public.automatic_cephalometry_access FOR SELECT TO authenticated USING (email = lower(btrim(public.get_auth_email())) OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage cephalometry authorizations" ON public.automatic_cephalometry_access FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE FUNCTION public.can_use_automatic_cephalometry() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.automatic_cephalometry_access WHERE email = lower(btrim(public.get_auth_email())) AND enabled = true);
$$;
REVOKE ALL ON FUNCTION public.can_use_automatic_cephalometry() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_use_automatic_cephalometry() TO authenticated, service_role;