CREATE TABLE public.api_rate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  email text,
  tool text,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.api_rate_events TO authenticated;
GRANT ALL ON public.api_rate_events TO service_role;
ALTER TABLE public.api_rate_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read rate events" ON public.api_rate_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX api_rate_events_ip_idx ON public.api_rate_events (ip_hash, created_at);
CREATE INDEX api_rate_events_email_idx ON public.api_rate_events (email, tool, kind, created_at);

CREATE OR REPLACE FUNCTION public.api_rate_check_ip(_ip_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c10 int; c60 int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('ip:' || _ip_hash));
  SELECT count(*) FILTER (WHERE created_at > now() - interval '10 minutes'), count(*) INTO c10, c60
    FROM api_rate_events WHERE ip_hash = _ip_hash AND kind = 'request' AND created_at > now() - interval '1 hour';
  IF c10 >= 10 OR c60 >= 40 THEN RETURN false; END IF;
  INSERT INTO api_rate_events (ip_hash, kind) VALUES (_ip_hash, 'request');
  DELETE FROM api_rate_events WHERE created_at < now() - interval '30 days' AND random() < 0.01;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.api_rate_reserve_daily(_ip_hash text, _email text, _tool text, _limit int)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c int; day_start timestamptz := (date_trunc('day', now() AT TIME ZONE 'Europe/Rome')) AT TIME ZONE 'Europe/Rome';
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('daily:' || lower(_email) || ':' || _tool));
  SELECT count(*) INTO c FROM api_rate_events WHERE email = lower(_email) AND tool = _tool AND kind = 'daily' AND created_at >= day_start;
  IF c >= _limit THEN RETURN false; END IF;
  INSERT INTO api_rate_events (ip_hash, email, tool, kind) VALUES (_ip_hash, lower(_email), _tool, 'daily');
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION public.api_rate_check_ip(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.api_rate_reserve_daily(text, text, text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.api_rate_check_ip(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.api_rate_reserve_daily(text, text, text, int) TO service_role;