
CREATE OR REPLACE FUNCTION public.admin_list_user_plans()
RETURNS TABLE(user_id UUID, email TEXT, plan public.subscription_plan, assigned_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
    SELECT u.id AS user_id,
           u.email::text,
           COALESCE(p.plan, 'base'::public.subscription_plan) AS plan,
           p.assigned_at
    FROM auth.users u
    LEFT JOIN public.user_plans p ON p.user_id = u.id
    ORDER BY u.email;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_plan(_email TEXT, _plan public.subscription_plan)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  target UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  SELECT id INTO target FROM auth.users WHERE email = _email;
  IF target IS NULL THEN
    RAISE EXCEPTION 'Utente non trovato: %', _email;
  END IF;
  INSERT INTO public.user_plans(user_id, plan, assigned_by)
  VALUES (target, _plan, auth.uid())
  ON CONFLICT (user_id) DO UPDATE
    SET plan = EXCLUDED.plan,
        assigned_by = auth.uid(),
        updated_at = now();
  RETURN target;
END;
$$;
