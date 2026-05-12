import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    if (req.method === "GET") {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");
      if (!token) {
        return new Response(JSON.stringify({ error: "Missing token" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: inv } = await admin.from("invitations")
        .select("email, status, expires_at").eq("token", token).maybeSingle();
      if (!inv) {
        return new Response(JSON.stringify({ valid: false, reason: "not_found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (inv.status !== "pending") {
        return new Response(JSON.stringify({ valid: false, reason: "already_used", email: inv.email }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (new Date(inv.expires_at).getTime() < Date.now()) {
        return new Response(JSON.stringify({ valid: false, reason: "expired", email: inv.email }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ valid: true, email: inv.email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: accept
    const { token, password, fullName } = await req.json();
    if (!token || !password || password.length < 8) {
      return new Response(JSON.stringify({ error: "Token o password non validi (min 8 caratteri)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inv, error: invErr } = await admin.from("invitations")
      .select("id, email, status, expires_at").eq("token", token).maybeSingle();
    if (invErr || !inv) {
      return new Response(JSON.stringify({ error: "Invito non trovato" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (inv.status !== "pending") {
      return new Response(JSON.stringify({ error: "Invito già utilizzato" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Invito scaduto" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // L'utente ha già dimostrato di possedere l'email cliccando il link dell'invito
    // → confermiamo l'email automaticamente, niente doppia verifica.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: inv.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || null, invited: true },
    });

    if (createErr) {
      const msg = createErr.message?.toLowerCase().includes("already")
        ? "Esiste già un account con questa email — accedi normalmente."
        : createErr.message;
      return new Response(JSON.stringify({ error: msg }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("invitations").update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    }).eq("id", inv.id);

    return new Response(JSON.stringify({
      success: true,
      email: inv.email,
      userId: created.user?.id,
      message: "Account creato. Ora puoi accedere con la tua email e password.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("accept-invitation error", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
