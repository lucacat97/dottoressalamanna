
INSERT INTO public.course_registrations (email, full_name, edition_id, confirmed, registered_by)
SELECT em.email, em.full_name, eds.ed, true, (SELECT id FROM auth.users WHERE email='dott.lamanna.a@gmail.com' LIMIT 1)
FROM (VALUES
  ('studiodentac@gmail.com', 'Studio Dentac'),
  ('lauraferrante79@gmail.com', 'Laura Ferrante'),
  ('dipietroannamaria83@libero.it', 'Anna Maria Di Pietro'),
  ('marcobalconi@yahoo.it', 'Marco Balconi'),
  ('simo.do@gmail.com', 'Simo Do'),
  ('magifra8@gmail.com', 'Magi Fra'),
  ('lauraferrante79@virgilio.it', 'Laura Ferrante')
) AS em(email, full_name)
CROSS JOIN (VALUES
  ('12e6e8f4-afc9-40ce-b6b4-42f521246226'::uuid),
  ('1fce666f-3aae-40c3-9394-3054ce6cdf0f'::uuid)
) AS eds(ed)
WHERE NOT EXISTS (
  SELECT 1 FROM public.course_registrations cr
  WHERE lower(cr.email) = lower(em.email) AND cr.edition_id = eds.ed
);
