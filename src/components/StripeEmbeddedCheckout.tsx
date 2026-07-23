import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  priceId: string;
  quantity?: number;
  returnUrl?: string;
}

export function StripeEmbeddedCheckoutView({ priceId, quantity, returnUrl }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const finalReturn = returnUrl || `${window.location.origin}/area-riservata?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId, quantity, returnUrl: finalReturn, environment: getStripeEnvironment() },
    });
    if (error || !data?.clientSecret) throw new Error(error?.message || "Checkout non disponibile");
    return data.clientSecret;
  };

  return (
    <div id="checkout" className="w-full">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
