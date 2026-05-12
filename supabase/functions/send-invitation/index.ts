import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOOL_LABELS: Record<string, string> = {
  diagnosis: "Supporto Diagnosi",
  orthodontic: "Consulenza Ortodontica",
  mtc_sistemica: "MTC Sistemica",
  mtc_organica: "MTC Organica",
};

function generateToken(prefix = ""): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return prefix + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const tools: string[] = Array.isArray(body.tools) ? body.tools : [];
    const monthlyLimit = Number(body.monthlyLimit) || 30;
    const toolLimits = body.toolLimits && typeof body.toolLimits === "object" ? body.toolLimits : {};
    const note = typeof body.note === "string" ? body.note : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Email non valida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (tools.length === 0) {
      return new Response(JSON.stringify({ error: "Seleziona almeno uno strumento" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Crea licenza (api_keys) collegata all'email
    const plainKey = generateToken("sk_inv_");
    const keyHash = await sha256Hex(plainKey);
    const filteredLimits = Object.fromEntries(
      tools.map(t => [t, Number(toolLimits[t]) || monthlyLimit])
    );
    const { data: keyRow, error: keyErr } = await admin.from("api_keys").insert({
      key_hash: keyHash,
      client_name: email,
      client_email: email,
      tools,
      monthly_limit: monthlyLimit,
      tool_limits: filteredLimits,
    }).select("id").single();

    if (keyErr) {
      return new Response(JSON.stringify({ error: keyErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Crea invito
    const token = generateToken();
    const { error: invErr } = await admin.from("invitations").insert({
      email,
      token,
      tools,
      monthly_limit: monthlyLimit,
      tool_limits: filteredLimits,
      api_key_id: keyRow.id,
      invited_by: user.id,
      note,
    });
    if (invErr) {
      return new Response(JSON.stringify({ error: invErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Invia email
    const origin = req.headers.get("origin") || "https://dottoressalamanna.com";
    const inviteUrl = `${origin}/auth?invite=${token}`;
    const toolsLabel = tools.map(t => TOOL_LABELS[t] || t).join(", ");

    // Inoltra il JWT dell'utente (admin) per superare verify_jwt della funzione email
    const { error: mailErr } = await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "invitation",
        recipientEmail: email,
        templateData: { inviteUrl, recipientEmail: email, toolsLabel },
      },
      headers: { Authorization: authHeader },
    });
    if (mailErr) {
      console.error("send-transactional-email error", mailErr);
    }

    return new Response(JSON.stringify({ success: true, inviteUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-invitation error", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
