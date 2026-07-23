-- Subscriptions table (Stripe-managed)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid UUID,
  check_env TEXT DEFAULT 'live'
) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active','trialing') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;

-- Map price_id → plan and keep user_plans in sync with Stripe subscription state.
CREATE OR REPLACE FUNCTION public.sync_user_plan_from_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_plan public.subscription_plan;
  is_active BOOLEAN;
BEGIN
  is_active := (
    (NEW.status IN ('active','trialing') AND (NEW.current_period_end IS NULL OR NEW.current_period_end > now()))
    OR (NEW.status = 'canceled' AND NEW.current_period_end IS NOT NULL AND NEW.current_period_end > now())
  );

  IF is_active THEN
    target_plan := CASE
      WHEN NEW.price_id IN ('mila_platinum_monthly','mila_platinum_yearly') THEN 'platinum'::public.subscription_plan
      WHEN NEW.price_id IN ('mila_pro_monthly','mila_pro_yearly') THEN 'pro'::public.subscription_plan
      WHEN NEW.price_id IN ('mila_basic_monthly','mila_basic_yearly') THEN 'base'::public.subscription_plan
      ELSE NULL
    END;

    IF target_plan IS NOT NULL THEN
      INSERT INTO public.user_plans(user_id, plan, assigned_by)
      VALUES (NEW.user_id, target_plan, NEW.user_id)
      ON CONFLICT (user_id) DO UPDATE
        SET plan = EXCLUDED.plan, updated_at = now();
    END IF;
  ELSE
    -- Non-active (fully canceled/expired): downgrade to base
    UPDATE public.user_plans SET plan = 'base'::public.subscription_plan, updated_at = now()
      WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_user_plan_from_subscription
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.sync_user_plan_from_subscription();

CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();