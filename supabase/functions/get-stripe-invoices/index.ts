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

    const stripe = createStripeClient(environment as StripeEnv);

    // 1) prova a trovare stripe_customer_id nelle subscriptions (env corrente)
    let customerId: string | null = null;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sub?.stripe_customer_id) customerId = sub.stripe_customer_id as string;

    // 2) fallback: cerca customer su Stripe per metadata userId
    if (!customerId) {
      try {
        const byMeta = await stripe.customers.search({
          query: `metadata['userId']:'${user.id}'`,
          limit: 1,
        });
        if (byMeta.data[0]) customerId = byMeta.data[0].id;
      } catch (_) { /* search may be unavailable */ }
    }

    // 3) fallback: cerca customer per email
    if (!customerId && user.email) {
      const byEmail = await stripe.customers.list({ email: user.email, limit: 1 });
      if (byEmail.data[0]) customerId = byEmail.data[0].id;
    }

    if (!customerId) {
      return new Response(JSON.stringify({ invoices: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });

    const simplified = invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount_due: inv.amount_due,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      created: inv.created,
      period_start: inv.period_start,
      period_end: inv.period_end,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      description: inv.description,
    }));

    return new Response(JSON.stringify({ invoices: simplified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("get-stripe-invoices error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Invoice error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
