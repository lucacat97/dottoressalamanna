// Endpoint dedicato alla Chrome Extension "MIND - Interroga MILA".
// Non modifica il comportamento di external-api: lo riusa internamente
// così la generazione MILA, il consumo dei crediti e l'invio email restano identici.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const fail = (error: string, code: string, status: number) =>
  json({ success: false, error, code }, status);

function getServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function sha256Hex(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SIGNED_URL_TTL_SECONDS = 15 * 60;

async function signDocument(admin: ReturnType<typeof createClient>, path: string) {
  const { data, error } = await admin.storage
    .from("consultation-attachments")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) throw new Error(error?.message || "signed url non disponibile");
  return {
    document_url: data.signedUrl,
    document_url_expires_at: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return fail("Metodo non consentito.", "method_not_allowed", 405);

  const admin = getServiceClient();

  // ── 1. Token dell'estensione (Bearer) ──
  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!bearer) return fail("Token di autorizzazione mancante.", "unauthorized", 401);

  const { data: tokenRow } = await admin
    .from("mind_extension_tokens")
    .select("id, is_active")
    .eq("token_hash", await sha256Hex(bearer))
    .eq("is_active", true)
    .maybeSingle();
  if (!tokenRow) return fail("Token non valido o revocato.", "unauthorized", 401);

  // ── 2. Input (multipart/form-data oppure JSON con pdf_base64) ──
  let fields: Record<string, string> = {};
  let pdfBase64 = "";
  let pdfFilename = "documento.pdf";
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      for (const [k, v] of form.entries()) {
        if (v instanceof File) {
          const buf = new Uint8Array(await v.arrayBuffer());
          let bin = "";
          for (let i = 0; i < buf.length; i += 8192) bin += String.fromCharCode(...buf.subarray(i, i + 8192));
          pdfBase64 = btoa(bin);
          pdfFilename = v.name || pdfFilename;
        } else {
          fields[k] = String(v);
        }
      }
    } else {
      const body = await req.json();
      fields = Object.fromEntries(
        Object.entries(body).filter(([k]) => k !== "pdf_base64").map(([k, v]) => [k, v == null ? "" : String(v)]),
      );
      pdfBase64 = typeof body.pdf_base64 === "string" ? body.pdf_base64 : "";
      if (typeof body.pdf_filename === "string") pdfFilename = body.pdf_filename;
    }
  } catch {
    return fail("Payload non valido.", "invalid_payload", 400);
  }

  const tool = (fields.tool || "diagnosis").trim();
  if (tool !== "diagnosis") return fail("Questo endpoint supporta solo tool='diagnosis'.", "unsupported_tool", 400);

  const professionalEmail = (fields.professional_email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(professionalEmail)) {
    return fail("Campo 'professional_email' mancante o non valido.", "invalid_email", 400);
  }
  const firstName = (fields.professional_first_name || "").trim();
  const lastName = (fields.professional_last_name || "").trim();
  if (!firstName || !lastName) {
    return fail("Campi 'professional_first_name' e 'professional_last_name' obbligatori.", "missing_professional_name", 400);
  }
  const documentText = (fields.documentText || "").trim();
  if (!pdfBase64 && documentText.length < 20) {
    return fail("PDF mancante: invia il campo 'file' (multipart) oppure 'pdf_base64'.", "missing_pdf", 400);
  }

  const requestId = (fields.request_id || req.headers.get("x-request-id") || "").trim() || null;
  const mindPatientId = (fields.mind_patient_id || "").trim() || null;
  const source = (fields.source || "mind_chrome_extension").trim();

  // ── 3. Idempotenza: stesso request_id → nessuna nuova generazione ──
  if (requestId) {
    const { data: existing } = await admin
      .from("mila_consultations")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();
    if (existing) {
      if (existing.status === "completed" && existing.document_storage_path) {
        try {
          const signed = await signDocument(admin, existing.document_storage_path);
          return json({
            success: true,
            consultation_id: existing.id,
            tool: existing.tool,
            filename: existing.filename,
            ...signed,
            download_url: signed.document_url,
            email_delivery: { sent: !!existing.email_sent },
            idempotent_replay: true,
          });
        } catch (e) {
          return fail(`Documento non più disponibile: ${(e as Error).message}`, "document_unavailable", 410);
        }
      }
      if (existing.status === "processing") {
        return json({ success: true, consultation_id: existing.id, tool: existing.tool, status: "processing" }, 202);
      }
      return fail(existing.error_message || "La richiesta precedente è terminata in errore.", existing.error_code || "previous_error", 409);
    }
  }

  // ── 4. Riga di audit ──
  const { data: inserted, error: insertError } = await admin
    .from("mila_consultations")
    .insert({
      status: "processing",
      source,
      request_id: requestId,
      mind_patient_id: mindPatientId,
      professional_email: professionalEmail,
      tool,
      token_id: tokenRow.id,
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    console.error("[mind-mila-consultation] insert error:", insertError);
    return fail("Impossibile registrare la richiesta.", "db_error", 500);
  }
  const consultationId = inserted.id as string;

  await admin.from("mind_extension_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", tokenRow.id);

  const markError = async (code: string, message: string) => {
    await admin
      .from("mila_consultations")
      .update({ status: "error", error_code: code, error_message: message.slice(0, 500), completed_at: new Date().toISOString() })
      .eq("id", consultationId);
  };

  try {
    // ── 5. Generazione: riuso identico di external-api ──
    const supaUrl = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const payload: Record<string, unknown> = {
      tool: "diagnosis",
      professional_email: professionalEmail,
      professional_first_name: firstName,
      professional_last_name: lastName,
    };
    if (documentText.length >= 20) payload.documentText = documentText;
    else {
      payload.pdf_base64 = pdfBase64;
      payload.pdf_filename = pdfFilename;
    }
    for (const key of ["reasonForVisit", "clinicalNotes", "terapie"]) {
      const v = (fields[key] || "").trim();
      if (v) payload[key] = v;
    }

    const upstream = await fetch(`${supaUrl}/functions/v1/external-api`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify(payload),
    });
    const result = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const codeMap: Record<number, string> = {
        400: "invalid_payload", 401: "email_not_registered", 402: "no_credits",
        403: "forbidden", 422: "pdf_unreadable", 429: "rate_limited", 503: "ai_unavailable",
      };
      const code = codeMap[upstream.status] || "generation_failed";
      const message = (result as { error?: string }).error || "Generazione della consulenza non riuscita.";
      await markError(code, message);
      return fail(message, code, upstream.status);
    }

    // ── 6. Recupero del file Word generato → URL firmato temporaneo ──
    const downloadUrl = String((result as { download_url?: string }).download_url || "");
    const token = downloadUrl.split("token=")[1] || "";
    let storagePath = "";
    let filename = "";
    if (token) {
      const { data: dl } = await admin
        .from("consultation_downloads")
        .select("file_path, file_name")
        .eq("token", token)
        .maybeSingle();
      storagePath = dl?.file_path || "";
      filename = dl?.file_name || "";
    }
    if (!storagePath) {
      await markError("document_unavailable", "Documento generato ma non reperibile su storage.");
      return fail("Consulenza generata ma documento non reperibile.", "document_unavailable", 500);
    }

    const signed = await signDocument(admin, storagePath);
    const emailSent = !!(result as { email_delivery?: { sent?: boolean } }).email_delivery?.sent;

    await admin
      .from("mila_consultations")
      .update({
        status: "completed",
        filename,
        document_storage_path: storagePath,
        email_sent: emailSent,
        completed_at: new Date().toISOString(),
      })
      .eq("id", consultationId);

    return json({
      success: true,
      consultation_id: consultationId,
      tool: "diagnosis",
      filename,
      ...signed,
      download_url: signed.document_url,
      word_url: signed.document_url,
      email_delivery: { sent: emailSent },
    });
  } catch (e) {
    const msg = (e as Error)?.message || String(e);
    console.error("[mind-mila-consultation] error:", msg);
    await markError("internal_error", msg);
    return fail("Errore interno durante la generazione della consulenza.", "internal_error", 500);
  }
});
