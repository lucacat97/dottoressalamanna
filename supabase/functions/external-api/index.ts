import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import metodologia from "./metodologia.json" with { type: "json" };
import courseKnowledge from "./course-knowledge.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

// ── Supabase service client for key validation ──
function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

// ── Hash API key using Web Crypto (SHA-256) ──
async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function normalizeApiKey(value: string): string {
  return value
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

// ── Markdown → HTML converter (matches site PDF styling) ──
function mdToHtml(md: string): string {
  // First, process tables block by block
  const lines = md.split("\n");
  const processedLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Detect start of a markdown table
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      // Collect all table lines
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      // Parse table: first row is header, second row is separator, rest are body
      if (tableLines.length >= 2) {
        let tableHtml = '<table style="width:100%;border-collapse:collapse;margin:16px 0;page-break-inside:avoid;">';
        let isFirstDataRow = true;
        for (const tl of tableLines) {
          const cells = tl.split("|").slice(1, -1); // remove empty first/last from split
          if (cells.every((c: string) => /^[\s:-]+$/.test(c.trim()))) continue; // skip separator row
          const tag = isFirstDataRow ? "th" : "td";
          const bgStyle = isFirstDataRow ? "background:#f0f7f7;font-weight:600;" : "";
          const cellsHtml = cells.map((c: string) =>
            `<${tag} style="padding:10px 14px;border:1px solid #ddd;text-align:left;${bgStyle}">${c.replace(/\*\*/g, "").trim()}</${tag}>`
          ).join("");
          tableHtml += `<tr>${cellsHtml}</tr>`;
          isFirstDataRow = false;
        }
        tableHtml += "</table>";
        processedLines.push(tableHtml);
      }
      continue;
    }
    processedLines.push(line);
    i++;
  }

  let html = processedLines.join("\n");

  // Blockquotes
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote style="border-left:4px solid #f0b400;padding:12px 16px;margin:14px 0;background:#fff8e1;color:#5b4708;border-radius:6px;">$1</blockquote>');

  // Headers
  html = html.replace(/^####\s+(.+)$/gm, '<h4 style="font-size:14px;color:#333;margin:16px 0 8px;">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 style="font-size:15px;color:#333;margin:20px 0 8px;">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 style="font-size:17px;color:#2a6f6f;margin:24px 0 10px;font-family:Georgia,serif;">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 style="font-size:20px;color:#2a6f6f;margin:28px 0 12px;font-family:Georgia,serif;border-bottom:1px solid #eee;padding-bottom:8px;page-break-after:avoid;">$1</h1>');

  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li style="margin:4px 0;">$1</li>');
  html = html.replace(/((<li[^>]*>.*<\/li>\n?)+)/g, '<ul style="margin:8px 0 8px 20px;padding:0;">$1</ul>');

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin:4px 0;">$1</li>');

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">');

  // Paragraphs for remaining text lines
  html = html.split("\n").map(line => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<")) return line;
    return `<p style="margin:8px 0;line-height:1.6;">${trimmed}</p>`;
  }).join("\n");

  return html;
}

function wrapInHtmlDocument(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #222; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
  table { page-break-inside: avoid; border-collapse: collapse; width: 100%; }
  h1 { color: #2a6f6f; font-family: Georgia, serif; page-break-after: avoid; }
  h2 { color: #2a6f6f; font-family: Georgia, serif; }
  th { background: #f0f7f7; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  blockquote { border-left: 4px solid #f0b400; padding: 12px 16px; margin: 14px 0; background: #fff8e1; color: #5b4708; border-radius: 6px; }
  strong { color: #2a6f6f; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

// ── System prompts (reused from existing functions) ──
import { DIAGNOSIS_SYSTEM_PROMPT, ORTHODONTIC_SYSTEM_PROMPT, MTC_SISTEMICA_PROMPT, MTC_ORGANICA_PROMPT } from "../_shared/ai-prompts.ts";



// ── Helper: call AI (non-streaming) with KB + retro-feedback injection ──

async function callAI(systemPrompt: string, userMessage: string, opts?: { scope?: string; toolName?: string; serviceClient?: ReturnType<typeof createClient> }): Promise<string> {
  // Inject Knowledge Base and retro-feedback the same way the site does
  let augmented = systemPrompt + `\n\n=== METODOLOGIA DI RIFERIMENTO ===\n${JSON.stringify(metodologia)}\n=== FINE METODOLOGIA ===\n\n=== MATERIALE DIDATTICO DEI CORSI (KNOWLEDGE BASE) ===\n${JSON.stringify(courseKnowledge)}\n=== FINE MATERIALE DIDATTICO ===`;
  if (opts?.scope && opts?.serviceClient) {
    try {
      const { data: knowledgeRows } = await opts.serviceClient.rpc("get_active_ai_knowledge", { _scope: opts.scope });
      if (knowledgeRows && knowledgeRows.length > 0) {
        augmented += `\n\n=== KNOWLEDGE BASE AGGIUNTIVA ===\n${knowledgeRows.map((r: { title: string; content: string }, i: number) => `${i + 1}. [${r.title}]\n${r.content}`).join("\n\n")}\n=== FINE KNOWLEDGE BASE ===`;
      }
    } catch (e) { console.warn("[external-api] KB fetch failed:", (e as Error).message); }
  }
  if (opts?.toolName && opts?.serviceClient) {
    try {
      const { data: feedbackRows } = await opts.serviceClient.rpc("get_tool_feedback", { _tool_name: opts.toolName });
      if (feedbackRows && feedbackRows.length > 0) {
        augmented += `\n\n=== RETRO-FEEDBACK DAL PROFESSIONISTA (CORREZIONI ACCUMULATE) ===\nQueste sono indicazioni fornite dal professionista dopo aver analizzato consulenze precedenti. DEVI tenerne conto SEMPRE:\n${feedbackRows.map((r: { feedback: string }, i: number) => `${i + 1}. ${r.feedback}`).join("\n")}\n=== FINE RETRO-FEEDBACK ===`;
      }
    } catch (e) { console.warn("[external-api] feedback fetch failed:", (e as Error).message); }
  }
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          messages: [
            { role: "system", content: augmented },
            { role: "user", content: userMessage },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const isRetryable = response.status === 502 || response.status === 503 || response.status === 504 || response.status === 429;
        const snippet = errorText.slice(0, 300);
        if (isRetryable && attempt < maxAttempts) {
          console.warn(`[external-api] AI gateway ${response.status} (tentativo ${attempt}/${maxAttempts}), retry...`);
          await new Promise(r => setTimeout(r, 1500 * attempt));
          lastError = new Error(`AI gateway ${response.status}: ${snippet}`);
          continue;
        }
        throw new Error(`AI gateway ${response.status}: ${snippet}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      lastError = err as Error;
      if (attempt >= maxAttempts) throw err;
      console.warn(`[external-api] errore chiamata AI (tentativo ${attempt}/${maxAttempts}): ${(err as Error).message}, retry...`);
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastError || new Error("AI gateway: errore sconosciuto");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Auth: validate X-Api-Key against database ──
  const rawApiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("apikey") ||
    req.headers.get("authorization") ||
    "";
  const apiKey = normalizeApiKey(rawApiKey);
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Unauthorized. Provide a valid X-Api-Key header." }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = getServiceClient();
  const keyHash = await hashKey(apiKey);

  const { data: keyRecord, error: keyError } = await supabaseAdmin
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .maybeSingle();

  if (keyError || !keyRecord) {
    console.warn("[external-api] invalid api key", {
      fingerprint: keyHash.slice(0, 12),
      length: apiKey.length,
      hasXApiKey: Boolean(req.headers.get("x-api-key")),
      hasApiKeyHeader: Boolean(req.headers.get("apikey")),
      hasAuthorization: Boolean(req.headers.get("authorization")),
      dbError: keyError?.message,
    });
    return new Response(JSON.stringify({ error: "Unauthorized. Invalid or revoked API key." }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { tool, format, professional_first_name, professional_last_name, professional_email } = body;
    const outputFormat = (format || "html").toLowerCase();

    // ── Validate professional identity (required: name, surname, email) ──
    const profFirst = typeof professional_first_name === "string" ? professional_first_name.trim() : "";
    const profLast = typeof professional_last_name === "string" ? professional_last_name.trim() : "";
    const profEmail = typeof professional_email === "string" ? professional_email.trim().toLowerCase() : "";
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profEmail);

    if (!emailValid) {
      return new Response(
        JSON.stringify({
          error: "Campo obbligatorio mancante o non valido: 'professional_email'. La consulenza viene inviata via email a questo indirizzo.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Verifica: l'email deve coincidere con quella associata alla chiave API (se registrata) ──
    const keyClientEmail = typeof keyRecord.client_email === "string"
      ? keyRecord.client_email.trim().toLowerCase()
      : "";
    if (keyClientEmail && keyClientEmail !== profEmail) {
      console.warn("[external-api] email mismatch", {
        api_key_id: keyRecord.id,
        provided: profEmail,
        expected_fingerprint: keyClientEmail.slice(0, 3) + "***",
      });
      return new Response(
        JSON.stringify({
          error: "L'indirizzo email fornito ('professional_email') non coincide con l'email registrata sulla chiave di licenza. Per motivi di sicurezza la consulenza può essere inviata SOLO all'email associata alla chiave.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tool || !["diagnosis", "orthodontic", "mtc_sistemica", "mtc_organica"].includes(tool)) {
      return new Response(
        JSON.stringify({
          error: "Campo 'tool' obbligatorio. Valori: 'diagnosis', 'orthodontic', 'mtc_sistemica', 'mtc_organica'.",
          required_professional_fields: ["professional_first_name", "professional_last_name", "professional_email"],
          usage: {
            diagnosis: { tool: "diagnosis", professional_first_name: "Mario", professional_last_name: "Rossi", professional_email: "mario.rossi@example.com", documentText: "Testo del documento clinico...", reasonForVisit: "(opzionale) Motivo della visita riferito dal paziente", clinicalNotes: "(opzionale) Considerazioni del professionista", terapie: "(opzionale) Terapie consigliate" },
            orthodontic: { tool: "orthodontic", professional_first_name: "Mario", professional_last_name: "Rossi", professional_email: "mario.rossi@example.com", age: 10, sex: "F", angolo_sellare: 125, anb: 3, wits: 1, angolo_articolare: 145, angolo_goniaco: 132 },
            mtc_sistemica: { tool: "mtc_sistemica", professional_first_name: "Mario", professional_last_name: "Rossi", professional_email: "mario.rossi@example.com", sex: "F", painPoints: [{ region: "Zona lombare", description: "Dolore lombare cronico" }] },
            mtc_organica: { tool: "mtc_organica", professional_first_name: "Mario", professional_last_name: "Rossi", professional_email: "mario.rossi@example.com", sex: "F", age: 45, symptoms: [{ category: "Fegato", name: "Irritabilità" }] },
          },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Check tool permission ──
    const allowedTools: string[] = keyRecord.tools || [];
    if (!allowedTools.includes(tool)) {
      return new Response(
        JSON.stringify({ error: `Accesso negato allo strumento '${tool}'. Strumenti abilitati: ${allowedTools.join(", ")}` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Check rate limit (per-tool if tool_limits exists) ──
    // Count directly via service role: the RPC `get_api_key_monthly_usage`
    // requires admin auth.uid() and would return NULL when called from an
    // edge function (no user context), silently bypassing the limit.
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { count: usageCount, error: countError } = await supabaseAdmin
      .from("api_usage_log")
      .select("id", { count: "exact", head: true })
      .eq("api_key_id", keyRecord.id)
      .eq("tool_name", tool)
      .gte("created_at", monthStart.toISOString());

    if (countError) {
      console.error("[external-api] usage count error:", countError);
    }

    const toolLimits = keyRecord.tool_limits as Record<string, number> | null;
    const effectiveLimit = toolLimits?.[tool] ?? keyRecord.monthly_limit;

    if (typeof usageCount === "number" && usageCount >= effectiveLimit) {
      return new Response(
        JSON.stringify({ error: `Limite mensile raggiunto (${effectiveLimit} chiamate/mese per ${tool}). Contatta l'amministratore.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let markdown: string;

    if (tool === "diagnosis") {
      const { documentText, clinicalNotes, terapie, reasonForVisit } = body;
      if (!documentText || typeof documentText !== "string" || documentText.trim().length < 20) {
        return new Response(
          JSON.stringify({ error: "Campo 'documentText' obbligatorio (min 20 caratteri)." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const reasonSection = reasonForVisit && typeof reasonForVisit === "string" && reasonForVisit.trim().length > 0
        ? `\n\n--- MOTIVO DELLA VISITA (fornito dal professionista) ---\n${reasonForVisit.trim()}\n--- FINE MOTIVO ---\nIncludi OBBLIGATORIAMENTE questo motivo della visita all'inizio della consulenza, nella sezione "# Motivo della visita", subito dopo i dati anagrafici e prima dell'Introduzione.`
        : "";
      const notesSection = clinicalNotes && typeof clinicalNotes === "string" && clinicalNotes.trim().length > 0
        ? `\n\n--- CONSIDERAZIONI CLINICHE DEL PROFESSIONISTA ---\n${clinicalNotes.trim()}\n--- FINE CONSIDERAZIONI ---\nTieni conto di queste considerazioni nell'analisi.`
        : "";
      const terapieSection = terapie && typeof terapie === "string" && terapie.trim().length > 0
        ? `\n\n--- TERAPIE CONSIGLIATE DAL PROFESSIONISTA ---\nIncludi nella consulenza SOLO le seguenti terapie: ${terapie.trim()}\nNon aggiungere altre terapie non elencate qui.\n--- FINE TERAPIE ---`
        : "";
      markdown = await callAI(
        DIAGNOSIS_SYSTEM_PROMPT,
        `Analizza il seguente documento clinico e genera un CONSULENZA CLINICA COMPLETA:\n\n---\n${documentText}${reasonSection}${notesSection}${terapieSection}\n---`,
        { scope: "diagnosis", toolName: "diagnosis-support", serviceClient: supabaseAdmin }
      );
    } else if (tool === "orthodontic") {
      const { nome, cognome, age, sex, angolo_sellare, anb, wits, angolo_articolare, angolo_goniaco, ns_mm, gome_mm, rapporto_ns_gome, classe_dentale, clinicalNotes } = body;
      if (!age || !sex || angolo_sellare == null || anb == null || wits == null || angolo_articolare == null || angolo_goniaco == null) {
        return new Response(
          JSON.stringify({ error: "Campi obbligatori: age, sex, angolo_sellare, anb, wits, angolo_articolare, angolo_goniaco" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const ratio = rapporto_ns_gome ?? (ns_mm && gome_mm ? (gome_mm / ns_mm) : null);
      const patientName = nome && cognome ? `${nome} ${cognome}` : (nome || cognome || "Paziente");
      const notesSection = clinicalNotes && typeof clinicalNotes === "string" && clinicalNotes.trim().length > 0
        ? `\n\n--- CONSIDERAZIONI CLINICHE DEL PROFESSIONISTA ---\n${clinicalNotes.trim()}\n--- FINE CONSIDERAZIONI ---\nTieni conto di queste considerazioni nell'analisi.`
        : "";
      const userMsg = `Analizza i seguenti valori cefalometrici:
- Paziente: ${patientName}
- Età: ${age} anni
- Sesso: ${sex}
- Angolo Sellare (N-S-Ar): ${angolo_sellare}°
- ANB: ${anb}°
- Wits: ${wits} mm
- Angolo Articolare (S-Ar-Go): ${angolo_articolare}°
- Angolo Goniaco (Ar-Go-Me): ${angolo_goniaco}°
${ratio ? `- Rapporto NS/GoMe: ${ratio}` : ""}
${classe_dentale ? `- Classe dentale/funzionale confermata: ${classe_dentale}` : ""}${notesSection}`;
      markdown = await callAI(ORTHODONTIC_SYSTEM_PROMPT, userMsg, { scope: "orthodontic", toolName: "orthodontic-diagnosis", serviceClient: supabaseAdmin });
    } else if (tool === "mtc_sistemica") {
      const { sex, painPoints } = body;
      if (!painPoints || !Array.isArray(painPoints) || painPoints.length === 0) {
        return new Response(
          JSON.stringify({ error: "Campo 'painPoints' obbligatorio (array di {region, description})." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const pointsList = painPoints.map((p: { region: string; description: string }, i: number) => `${i+1}. Regione: ${p.region} — Descrizione: ${p.description}`).join("\n");
      markdown = await callAI(
        MTC_SISTEMICA_PROMPT,
        `Paziente: Sesso ${sex || "non specificato"}\n\nPunti dolorosi segnalati:\n${pointsList}`,
        { scope: "mtc", toolName: "mtc_sistemica", serviceClient: supabaseAdmin }
      );
    } else {
      // mtc_organica
      const { sex, age, symptoms } = body;
      if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return new Response(
          JSON.stringify({ error: "Campo 'symptoms' obbligatorio (array di {category, name})." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const symptomsList = symptoms.map((s: { category: string; name: string }) => `- [${s.category}] ${s.name}`).join("\n");
      markdown = await callAI(
        MTC_ORGANICA_PROMPT,
        `Paziente: Sesso ${sex || "non specificato"}, Età ${age || "non specificata"}\n\nSintomi riportati:\n${symptomsList}`,
        { scope: "mtc", toolName: "mtc_organica", serviceClient: supabaseAdmin }
      );
    }

    // ── Log usage ──
    await supabaseAdmin.from("api_usage_log").insert({ api_key_id: keyRecord.id, tool_name: tool });
    await supabaseAdmin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);

    // ── Disclaimer obbligatorio in intestazione ad OGNI consulenza ──
    // Aggiunto a monte se il modello non lo ha già incluso (controllo case-insensitive su una keyphrase univoca).
    const DISCLAIMER_BLOCK = `> **Disclaimer:** Questo strumento fornisce esclusivamente un supporto all'analisi clinica e NON costituisce in alcun modo una diagnosi medica. La responsabilità diagnostica resta interamente in capo al professionista sanitario. L'utilizzo di questo strumento non sostituisce il giudizio clinico del medico.\n\n`;
    if (!/non\s+costituisce\s+in\s+alcun\s+modo\s+una\s+diagnosi\s+medica/i.test(markdown)) {
      markdown = DISCLAIMER_BLOCK + markdown;
    }

    // Build response based on format
    const htmlBody = mdToHtml(markdown);
    const fullHtml = wrapInHtmlDocument(htmlBody);

    // ── Send the consulenza by email to the professional via send-transactional-email ──
    const consultationTypeMap: Record<string, string> = {
      diagnosis: "Consulenza sul caso",
      orthodontic: "Consulenza Cefalometrica",
      mtc_sistemica: "Consulenza MTC Sistemica",
      mtc_organica: "Consulenza MTC Organica",
    };
    const consultationType = consultationTypeMap[tool] || "Consulenza sul caso";

    // ── Estrai introduzione dal markdown (sezione "Introduzione" o primi paragrafi dopo il disclaimer) ──
    function extractIntroduction(md: string): string {
      // Rimuovi disclaimer (blockquote iniziale)
      const noDisclaimer = md.replace(/^>\s*\*\*Disclaimer:.*?(?=\n\n|\n#|$)/s, "").trim();
      // Cerca sezione Introduzione
      const introMatch = noDisclaimer.match(/##?\s*Introduzione[^\n]*\n([\s\S]*?)(?=\n##?\s|\n#\s|$)/i);
      if (introMatch && introMatch[1].trim().length > 40) {
        return introMatch[1].trim();
      }
      // Fallback: primi 2-3 paragrafi non-heading
      const paragraphs = noDisclaimer.split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p && !p.startsWith("#") && !p.startsWith(">"))
        .slice(0, 2);
      return paragraphs.join("\n\n") || "La consulenza completa è disponibile nel documento allegato.";
    }
    const introMarkdown = extractIntroduction(markdown);
    const introHtml = mdToHtml(introMarkdown);

    // ── Genera documento Word (HTML-as-Word) ──
    const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${consultationType}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: 'Calibri', Arial, sans-serif; font-size: 11pt; color: #222; line-height: 1.5; }
  h1 { color: #2a6f6f; font-family: Georgia, serif; font-size: 18pt; }
  h2 { color: #2a6f6f; font-family: Georgia, serif; font-size: 14pt; }
  h3 { color: #333; font-size: 12pt; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
  th { background: #f0f7f7; }
  blockquote { border-left: 4px solid #f0b400; padding: 10px 14px; margin: 12px 0; background: #fff8e1; }
  strong { color: #2a6f6f; }
</style></head><body>${htmlBody}</body></html>`;

    // ── Upload del documento Word su storage privato + token monouso ──
    let downloadUrl = "";
    try {
      const safeType = consultationType.replace(/[^\w\-]+/g, "_");
      const fileName = `consulenza_${safeType}_${new Date().toISOString().slice(0,10)}_${crypto.randomUUID().slice(0,8)}.doc`;
      const filePath = `${keyRecord.id}/${fileName}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("consultation-attachments")
        .upload(filePath, new Blob([wordHtml], { type: "application/msword" }), {
          contentType: "application/msword",
          upsert: false,
        });
      if (uploadError) {
        console.error("[external-api] storage upload error:", uploadError);
      } else {
        // Genera token sicuro (~256 bit) e registra l'autorizzazione di download
        const tokenBytes = new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");
        const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 giorni

        const { error: tokenError } = await supabaseAdmin
          .from("consultation_downloads")
          .insert({
            token,
            file_path: filePath,
            file_name: fileName,
            recipient_email: profEmail,
            api_key_id: keyRecord.id,
            consultation_type: consultationType,
            max_downloads: 5,
            expires_at: expiresAt,
          });

        if (tokenError) {
          console.error("[external-api] token insert error:", tokenError);
        } else {
          const supaUrl = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
          downloadUrl = `${supaUrl}/functions/v1/download-consultation?token=${token}`;
        }
      }
    } catch (storageErr) {
      console.error("[external-api] storage exception:", storageErr);
    }

    // ── Invio email al professionista (corpo: solo introduzione + link al documento Word) ──
    let emailDelivery: { sent: boolean; error?: string } = { sent: false };
    try {
      const supaUrl2 = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
      const anonJwt = Deno.env.get("SUPABASE_ANON_KEY")!;
      const sendRespRaw = await fetch(`${supaUrl2}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${anonJwt}`,
          "apikey": anonJwt,
        },
        body: JSON.stringify({
          templateName: "consultation-delivery",
          recipientEmail: profEmail,
          idempotencyKey: `consultation-${tool}-${keyRecord.id}-${crypto.randomUUID()}`,
          templateData: {
            professionalFirstName: profFirst,
            professionalLastName: profLast,
            consultationType,
            introHtml,
            downloadUrl,
          },
        }),
      });
      if (!sendRespRaw.ok) {
        const errText = await sendRespRaw.text().catch(() => "");
        console.error("[external-api] email send error:", sendRespRaw.status, errText);
        emailDelivery = { sent: false, error: `HTTP ${sendRespRaw.status}: ${errText.slice(0, 200)}` };
      } else {
        await sendRespRaw.text().catch(() => "");
        emailDelivery = { sent: true };
      }
    } catch (mailErr) {
      console.error("[external-api] email send exception:", mailErr);
      emailDelivery = { sent: false, error: String((mailErr as Error)?.message || mailErr) };
    }

    return new Response(JSON.stringify({
      success: true,
      tool,
      consultation_type: consultationType,
      professional: { first_name: profFirst, last_name: profLast, email: profEmail },
      email_delivery: emailDelivery,
      download_url: downloadUrl,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = (e as Error)?.message || String(e);
    console.error("external-api error:", msg);
    const isAiGateway = /AI gateway/i.test(msg);
    const userError = isAiGateway
      ? "Il servizio AI è temporaneamente non disponibile (errore upstream). Riprova tra qualche secondo."
      : "Si è verificato un errore interno. Riprova più tardi.";
    return new Response(
      JSON.stringify({ error: userError, detail: msg.slice(0, 300) }),
      { status: isAiGateway ? 503 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
