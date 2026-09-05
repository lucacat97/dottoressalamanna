CREATE POLICY "No client access to MIND installations"
ON public.mind_companion_installations
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);