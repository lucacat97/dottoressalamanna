import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new Error("Unauthorized");

    const { environment } = await req.json();
    if (environment !== "sandbox" && environment !== "live") {
      throw new Error("Invalid environment");
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id,status,cancel_at_period_end")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_subscription_id) throw new Error("Nessun abbonamento trovato");
    if (sub.status === "canceled" || sub.cancel_at_period_end) {
      throw new Error("L'abbonamento è già in disdetta");
    }

    const stripe = createStripeClient(environment as StripeEnv);
    await stripe.subscriptions.update(sub.stripe_subscription_id as string, {
      cancel_at_period_end: true,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("cancel-stripe-subscription error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Cancellation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
