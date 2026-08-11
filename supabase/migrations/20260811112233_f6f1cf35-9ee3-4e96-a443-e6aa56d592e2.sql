CREATE TABLE IF NOT EXISTS public.user_ai_credits (
  user_id UUID PRIMARY KEY,
  credits INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  granted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_ai_credits TO authenticated;
GRANT ALL ON public.user_ai_credits TO service_role;

ALTER TABLE public.user_ai_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.user_ai_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all credits" ON public.user_ai_credits
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER user_ai_credits_set_updated_at
  BEFORE UPDATE ON public.user_ai_credits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Admin: assegna/imposta crediti una tantum via email
CREATE OR REPLACE FUNCTION public.admin_set_ai_credits(_email TEXT, _credits INTEGER, _note TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE target UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF _credits < 0 THEN
    RAISE EXCEPTION 'Crediti non validi';
  END IF;
  SELECT id INTO target FROM auth.users WHERE email = _email;
  IF target IS NULL THEN
    RAISE EXCEPTION 'Utente non trovato: %', _email;
  END IF;
  INSERT INTO public.user_ai_credits(user_id, credits, note, granted_by)
  VALUES (target, _credits, _note, auth.uid())
  ON CONFLICT (user_id) DO UPDATE
    SET credits = EXCLUDED.credits,
        note = COALESCE(EXCLUDED.note, public.user_ai_credits.note),
        granted_by = auth.uid(),
        updated_at = now();
  RETURN _credits;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_ai_credits(TEXT, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_ai_credits(TEXT, INTEGER, TEXT) TO authenticated, service_role;

-- Elenco crediti per admin
CREATE OR REPLACE FUNCTION public.admin_list_ai_credits()
RETURNS TABLE(user_id UUID, email TEXT, credits INTEGER, note TEXT, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
    SELECT c.user_id, u.email::text, c.credits, c.note, c.updated_at
    FROM public.user_ai_credits c
    JOIN auth.users u ON u.id = c.user_id
    ORDER BY u.email;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_ai_credits() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_ai_credits() TO authenticated, service_role;

-- Stato disponibilità per l'utente corrente (solo lettura)
CREATE OR REPLACE FUNCTION public.get_ai_allowance(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
  plan public.subscription_plan;
  has_sub BOOLEAN;
  monthly_limit INTEGER;
  used INTEGER;
  oneoff INTEGER;
BEGIN
  IF _user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  is_admin := public.has_role(_user_id, 'admin');
  plan := public.get_user_plan(_user_id);
  has_sub := public.has_active_subscription(_user_id, 'live') OR public.has_active_subscription(_user_id, 'sandbox');
  SELECT COALESCE(credits, 0) INTO oneoff FROM public.user_ai_credits WHERE user_id = _user_id;
  oneoff := COALESCE(oneoff, 0);
  SELECT COUNT(*)::int INTO used FROM public.ai_usage_log
    WHERE user_id = _user_id AND created_at >= date_trunc('month', now());

  IF is_admin OR (has_sub AND plan = 'platinum') THEN
    RETURN jsonb_build_object('unlimited', true, 'plan', plan, 'used_this_month', used, 'oneoff_credits', oneoff);
  END IF;

  monthly_limit := CASE WHEN has_sub THEN 5 ELSE 0 END;
  RETURN jsonb_build_object(
    'unlimited', false,
    'plan', plan,
    'monthly_limit', monthly_limit,
    'used_this_month', used,
    'monthly_remaining', GREATEST(monthly_limit - used, 0),
    'oneoff_credits', oneoff,
    'total_remaining', GREATEST(monthly_limit - used, 0) + oneoff
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_ai_allowance(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_allowance(UUID) TO authenticated, service_role;

-- Consumo di una consulenza (solo backend / service_role)
CREATE OR REPLACE FUNCTION public.consume_ai_consultation(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
  plan public.subscription_plan;
  has_sub BOOLEAN;
  monthly_limit INTEGER;
  used INTEGER;
  remaining INTEGER;
BEGIN
  is_admin := public.has_role(_user_id, 'admin');
  plan := public.get_user_plan(_user_id);
  has_sub := public.has_active_subscription(_user_id, 'live') OR public.has_active_subscription(_user_id, 'sandbox');

  IF is_admin OR (has_sub AND plan = 'platinum') THEN
    RETURN jsonb_build_object('allowed', true, 'source', 'unlimited');
  END IF;

  monthly_limit := CASE WHEN has_sub THEN 5 ELSE 0 END;
  SELECT COUNT(*)::int INTO used FROM public.ai_usage_log
    WHERE user_id = _user_id AND created_at >= date_trunc('month', now());

  IF used < monthly_limit THEN
    RETURN jsonb_build_object('allowed', true, 'source', 'subscription');
  END IF;

  UPDATE public.user_ai_credits
    SET credits = credits - 1, updated_at = now()
    WHERE user_id = _user_id AND credits > 0
    RETURNING credits INTO remaining;

  IF remaining IS NOT NULL THEN
    RETURN jsonb_build_object('allowed', true, 'source', 'oneoff', 'remaining', remaining);
  END IF;

  RETURN jsonb_build_object('allowed', false, 'source', 'none');
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_consultation(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_consultation(UUID) TO service_role;

INSERT INTO public.user_ai_credits(user_id, credits, note)
SELECT id, 5, 'Consulti una tantum assegnati manualmente'
FROM auth.users WHERE email = 'maria.estera@yahoo.com'
ON CONFLICT (user_id) DO UPDATE SET credits = 5, updated_at = now();