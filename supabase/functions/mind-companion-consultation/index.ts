import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "npm:zod@3.24.2";

const MAX_PDF_BYTES = 20 * 1024 * 1024;

const OptionalFieldsSchema = z.object({
  source: z.string().trim().min(1).max(100).optional(),
  mind_patient_id: z.string().trim().min(1).max(200).optional(),
  request_id: z.string().trim().min(1).max(200).optional(),
  reasonForVisit: z.string().trim().max(10_000).optional(),
  clinicalNotes: z.string().trim().max(20_000).optional(),
  terapie: z.string().trim().max(10_000).optional(),
});

type Installation = {
  id: string;
  active: boolean;
  professional_first_name: string;
  professional_last_name: string;
  professional_email: string;
};

function responseHeaders(contentType = "application/json") {
  return { ...corsHeaders, "Content-Type": contentType };
}

function jsonError(error: string, code: string, status: number) {
  return new Response(JSON.stringify({ success: false, error, code }), {
    status,
    headers: responseHeaders(),
  });
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonError("Metodo non consentito.", "method_not_allowed", 405);
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const installToken = match?.[1]?.trim() ?? "";
  if (!installToken) {
    return jsonError("Token installazione mancante.", "unauthorized", 401);
  }
  if (installToken.length < 24 || installToken.length > 512) {
    return jsonError("Token installazione non valido.", "unauthorized", 401);
  }

  const backendUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const upstreamUrl = Deno.env.get("MILA_UPSTREAM_URL");
  const upstreamToken = Deno.env.get("MILA_UPSTREAM_TOKEN") ?? Deno.env.get("EXTERNAL_API_KEY");
  if (!backendUrl || !serviceRoleKey || !upstreamUrl || !upstreamToken) {
    return jsonError("Servizio temporaneamente non configurato.", "service_unavailable", 503);
  }

  let parsedUpstreamUrl: URL;
  try {
    parsedUpstreamUrl = new URL(upstreamUrl);
    if (parsedUpstreamUrl.protocol !== "https:") throw new Error("HTTPS required");
  } catch {
    return jsonError("Servizio temporaneamente non configurato.", "service_unavailable", 503);
  }

  const admin = createClient(backendUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tokenHash = await sha256Hex(installToken);
  const { data: installationData, error: installationError } = await admin
    .from("mind_companion_installations")
    .select("id, active, professional_first_name, professional_last_name, professional_email")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (installationError) {
    console.error("[mind-companion-consultation] installation lookup failed");
    return jsonError("Errore temporaneo di autenticazione.", "authentication_error", 500);
  }
  const installation = installationData as Installation | null;
  if (!installation) {
    return jsonError("Token installazione non valido.", "unauthorized", 401);
  }
  if (!installation.active) {
    return jsonError("Questa installazione è stata disattivata.", "installation_disabled", 403);
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return jsonError("Invia la richiesta come multipart/form-data.", "invalid_content_type", 415);
  }

  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch {
    return jsonError("Dati del modulo non validi.", "invalid_payload", 400);
  }

  const file = incoming.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return jsonError("PDF mancante.", "missing_pdf", 400);
  }
  if (file.size > MAX_PDF_BYTES) {
    return jsonError("Il PDF supera il limite di 20 MB.", "pdf_too_large", 413);
  }
  const filenameIsPdf = file.name.toLowerCase().endsWith(".pdf");
  const mimeIsPdf = file.type === "application/pdf";
  if (!filenameIsPdf && !mimeIsPdf) {
    return jsonError("Il file deve essere un PDF.", "invalid_file_type", 400);
  }

  const rawOptionalFields: Record<string, string | undefined> = {};
  for (const key of ["source", "mind_patient_id", "request_id", "reasonForVisit", "clinicalNotes", "terapie"] as const) {
    const value = incoming.get(key);
    if (typeof value === "string" && value.trim()) rawOptionalFields[key] = value;
  }
  const parsedFields = OptionalFieldsSchema.safeParse(rawOptionalFields);
  if (!parsedFields.success) {
    return jsonError("Uno o più campi superano la lunghezza consentita.", "invalid_payload", 400);
  }

  const forwarded = new FormData();
  forwarded.append("file", file, file.name || "check-up.pdf");
  forwarded.append("tool", "diagnosis");
  forwarded.append("professional_first_name", installation.professional_first_name);
  forwarded.append("professional_last_name", installation.professional_last_name);
  forwarded.append("professional_email", installation.professional_email);
  forwarded.append("source", parsedFields.data.source ?? "mind_chrome_extension");
  for (const key of ["mind_patient_id", "request_id", "reasonForVisit", "clinicalNotes", "terapie"] as const) {
    const value = parsedFields.data[key];
    if (value) forwarded.append(key, value);
  }

  await admin
    .from("mind_companion_installations")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", installation.id);

  try {
    const upstream = await fetch(parsedUpstreamUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${upstreamToken}` },
      body: forwarded,
    });
    const upstreamContentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders(upstreamContentType),
    });
  } catch {
    console.error("[mind-companion-consultation] upstream request failed");
    return jsonError("MILA non è temporaneamente raggiungibile.", "upstream_unavailable", 502);
  }
});