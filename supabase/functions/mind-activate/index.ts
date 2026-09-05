import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "npm:zod@3.24.2";

const BodySchema = z.object({
  activation_code: z.string().trim().min(8).max(200),
  device_label: z.string().trim().min(1).max(200).optional(),
});

type ActivationCode = {
  id: string;
  active: boolean;
  expires_at: string | null;
  max_activations: number;
  used_activations: number;
  studio_label: string;
  professional_first_name: string;
  professional_last_name: string;
  professional_email: string;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(error: string, code: string, status: number) {
  return jsonResponse({ success: false, error, code }, status);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function generateInstallToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `mind_dev_${Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonError("Metodo non consentito.", "method_not_allowed", 405);
  }

  const backendUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!backendUrl || !serviceRoleKey) {
    return jsonError("Servizio temporaneamente non configurato.", "service_unavailable", 503);
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return jsonError("Corpo della richiesta non valido.", "invalid_payload", 400);
  }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError("Activation Code mancante o non valido.", "invalid_payload", 400);
  }

  const activationCode = parsed.data.activation_code.replace(/\s+/g, "");
  const deviceLabel = parsed.data.device_label?.trim() || "PC non identificato";

  const admin = createClient(backendUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const codeHash = await sha256Hex(activationCode);
  const { data: codeData, error: codeError } = await admin
    .from("mind_activation_codes")
    .select(
      "id, active, expires_at, max_activations, used_activations, studio_label, professional_first_name, professional_last_name, professional_email",
    )
    .eq("code_hash", codeHash)
    .maybeSingle();

  if (codeError) {
    console.error("[mind-activate] activation code lookup failed");
    return jsonError("Errore temporaneo di attivazione.", "activation_error", 500);
  }

  const code = codeData as ActivationCode | null;
  if (!code) {
    return jsonError("Activation Code non riconosciuto.", "invalid_activation_code", 401);
  }
  if (!code.active) {
    return jsonError("Questo Activation Code è stato disattivato.", "activation_code_disabled", 403);
  }
  if (code.expires_at && new Date(code.expires_at).getTime() < Date.now()) {
    return jsonError("Questo Activation Code è scaduto.", "activation_code_expired", 403);
  }
  if (code.used_activations >= code.max_activations) {
    return jsonError(
      "Questo Activation Code ha già raggiunto il numero massimo di attivazioni.",
      "activation_limit_reached",
      409,
    );
  }

  const installToken = generateInstallToken();
  const installTokenHash = await sha256Hex(installToken);

  const { error: insertError } = await admin.from("mind_companion_installations").insert({
    token_hash: installTokenHash,
    device_label: `${code.studio_label} — ${deviceLabel}`.slice(0, 200),
    professional_first_name: code.professional_first_name,
    professional_last_name: code.professional_last_name,
    professional_email: code.professional_email,
    active: true,
    activation_code_id: code.id,
  });

  if (insertError) {
    console.error("[mind-activate] installation insert failed");
    return jsonError("Attivazione non riuscita, riprova.", "activation_error", 500);
  }

  const { error: counterError } = await admin
    .from("mind_activation_codes")
    .update({ used_activations: code.used_activations + 1 })
    .eq("id", code.id)
    .eq("used_activations", code.used_activations);

  if (counterError) {
    console.error("[mind-activate] activation counter update failed");
  }

  return jsonResponse({
    success: true,
    install_token: installToken,
    device_label: deviceLabel,
    studio_label: code.studio_label,
    professional_first_name: code.professional_first_name,
    professional_last_name: code.professional_last_name,
    professional_email: code.professional_email,
    consultation_url: `${backendUrl}/functions/v1/mind-companion-consultation`,
  });
});
