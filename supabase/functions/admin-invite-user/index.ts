import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, fullName, redirectTo, license } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email richiesta" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
      data: fullName ? { full_name: fullName } : undefined,
      redirectTo: redirectTo || undefined,
    });

    if (error) {
      const msg = /already.*registered|email.*exists|already been registered/i.test(error.message)
        ? "Questa email è già registrata o è stata già invitata."
        : error.message;
      return new Response(JSON.stringify({ error: msg }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optionally pre-assign a license (api_keys row) for this email
    if (license && Array.isArray(license.tools) && license.tools.length > 0) {
      try {
        // Generate a random API key + sha-256 hash
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const arr = new Uint8Array(40);
        crypto.getRandomValues(arr);
        let plainKey = "sk_live_";
        for (const b of arr) plainKey += chars[b % chars.length];
        const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(plainKey));
        const keyHash = Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const toolLimits: Record<string, number> = license.toolLimits || {};
        const limitValues = Object.values(toolLimits).map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0);
        // Use the highest per-tool limit as the overall monthly_limit fallback
        // (per-tool limits in tool_limits take precedence at runtime).
        const monthlyLimit = limitValues.length > 0 ? Math.max(...limitValues) : 30;

        await admin.from("api_keys").insert({
          key_hash: keyHash,
          client_name: fullName || email.trim(),
          client_email: email.trim().toLowerCase(),
          tools: license.tools,
          monthly_limit: monthlyLimit,
          tool_limits: toolLimits,
        });
      } catch (licenseErr) {
        console.error("License creation failed:", licenseErr);
        // Invite already sent — surface a soft warning
        return new Response(
          JSON.stringify({
            success: true,
            user: data.user,
            warning: "Invito inviato ma creazione licenza fallita. Crea la licenza manualmente in API Keys.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(JSON.stringify({ success: true, user: data.user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
