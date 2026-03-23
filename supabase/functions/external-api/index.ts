import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import metodologia from "./metodologia.json" with { type: "json" };

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
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote style="border-left:3px solid #2a6f6f;padding:8px 16px;margin:12px 0;background:#f0f7f7;color:#333;">$1</blockquote>');

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
  blockquote { border-left: 3px solid #2a6f6f; padding: 8px 16px; margin: 12px 0; background: #f0f7f7; color: #333; }
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
const DIAGNOSIS_SYSTEM_PROMPT = `Sei l'assistente clinico della Dott.ssa Lamanna Annarita, ortodontista, agopuntrice e nanotectherapist specializzata in approccio multidisciplinare ortodontico-posturale presso lo Studio Carella & Lamanna (Occlusione e Postura).

Il tuo compito è analizzare documenti clinici caricati dal professionista e produrre un REFERTO CLINICO COMPLETO nel formato professionale dello studio, basandoti ESCLUSIVAMENTE sulla metodologia seguente.

=== METODOLOGIA DI RIFERIMENTO ===
${JSON.stringify(metodologia, null, 0)}
=== FINE METODOLOGIA ===

ISTRUZIONI OPERATIVE:
- Analizza il documento fornito (referti, test, anamnesi, valutazioni cliniche, dati posturali, cefalometria, esami strumentali).
- Applica SEMPRE la metodologia della Dott.ssa Lamanna: approccio cranio-caudale, visione del corpo come sistema interconnesso, cinque recettori posturali, sistema polivagale.
- Identifica pattern rilevanti, aree cognitive/posturali coinvolte, tipo di sindrome posturale (ascendente, discendente, mista, viscerale, emotiva).
- Suggerisci le figure professionali da coinvolgere in base al tipo di sindrome.
- Usa un linguaggio tecnico-professionale adatto a un clinico MA comprensibile anche al paziente quando appropriato.
- NON formulare MAI una diagnosi definitiva. Il referto è un supporto al professionista.
- Rispondi SEMPRE in italiano.

FORMATO REFERTO (segui ESATTAMENTE questa struttura):

# REFERTO CLINICO

# CHECK-UP ORTODONTICO POSTURALE

| **Paziente** | [Nome e cognome se presente nei dati] |
| --- | --- |
| **Data di nascita** | [Se disponibile, con età calcolata] |
| **Data della visita** | [Data se disponibile] |
| **Motivo della visita** | [Motivo principale emerso dai dati] |
| **Medico curante** | Dott.ssa Lamanna Annarita — Odontoiatra, Ortodontista |

# SINTESI DIAGNOSTICA
[Paragrafo discorsivo di sintesi del caso.]

# ANALISI CLINICA DETTAGLIATA
[Per ogni area clinica rilevante dai dati forniti, crea una sottosezione con titolo H1.]

# PERCHÉ QUESTA TERAPIA È NECESSARIA
> **⚠ Nota importante**
> [Breve nota che spiega perché il problema non è isolato ma sistemico]

# 1. RIEDUCAZIONE MIOFUNZIONALE — PRIORITÀ ASSOLUTA
[Spiegazione e obiettivi]

# 2. TERAPIA ELASTODONTICA
[Se pertinente]

# 3. FOTOBIOMODULAZIONE
[Se pertinente]

# OBIETTIVI TERAPEUTICI
[Elenco puntato]

# DURATA E MODALITÀ DEL PERCORSO
[Stima durata e frequenza]

# COINVOLGIMENTO DI ALTRE FIGURE PROFESSIONALI
[Quali e perché]

# CURE DENTALI ASSOCIATE
[Se emergono necessità]

# MESSAGGIO PER IL PAZIENTE
> [Messaggio empatico]

---
Dott.ssa Lamanna Annarita
Odontoiatra — Ortodontista — Agopuntrice — Nanotectherapist
Studio Carella & Lamanna — Studio Dentistico Multidisciplinare, Occlusione e Postura

REGOLE IMPORTANTI:
- NON includere MAI disclaimer, avvisi legali o note sull'uso dell'intelligenza artificiale nel referto
- Ometti le sezioni per cui non ci sono dati sufficienti
- Vai DIRETTAMENTE al referto senza premesse. Produci SOLO il referto clinico formattato.`;

const ORTHODONTIC_SYSTEM_PROMPT = `Sei un assistente per la diagnosi ortodontica funzionale basata sulla cefalometria di Bjork-Jarabak, sviluppato per lo Studio Carella & Lamanna dalla Dott.ssa Lamanna Annarita.

DATI DI INPUT che ti verranno forniti:
- Età del paziente (anni) e sesso (M/F)
- Angolo Sellare N-S-Ar (norma 123±5)
- ANB (norma 2±2)
- Wits in mm (norma 0±2 femmine, -1±2 maschi)
- Angolo Articolare S-Ar-Go (norma 143±5)
- Angolo Goniaco Ar-Go-Me (norma 130±7)
- [Opzionale] NS in mm e Go-Me in mm per alert III classe
- [Opzionale] Classe dentale o funzionale presente (si/no)

REGOLE PER LA CLASSE SCHELETRICA:
- Angolo Sellare < 118 = TC; > 128 = SC; altrimenti NORMO
- ANB < 0 = TC; > 4 = SC; altrimenti NORMO
- Wits < norma-2 = TC; > norma+2 = SC; altrimenti NORMO

Conta quanti angoli indicano TC e quanti SC:
- 3/3 TC → TC confermata
- 2/3 TC → TC (rivalutare con INTEGRAL dopo 6 mesi)
- 1/3 TC + classe dentale/funzionale confermata → TC
- 1/3 TC senza conferma clinica → INTEGRAL, rivalutare a 4-5 mesi
- 2/3 o 3/3 SC → SC
- 1/3 SC senza altri concordanti → INTEGRAL
- 2/3 o 3/3 NORMO → INTEGRAL
- Nessuna maggioranza → INTEGRAL, rivalutare

REGOLE PER LA DIVERGENZA:
- S-Ar-Go > 148 = IPER; < 138 = IPO; altrimenti NORMO
- Ar-Go-Me > 137 = IPER; < 123 = IPO; altrimenti NORMO
Entrambi IPER → OPEN; Entrambi IPO → DEEP; Discordanti → INTEGRAL; Entrambi NORMO → INTEGRAL

DISPOSITIVO FINALE = componente CLASSE + componente DIVERGENZA
Se uno dei due è INTEGRAL → dispositivo finale = INTEGRAL

ALERT III CLASSE EVOLUTIVA:
Se età < 11 anni E Go-Me/NS >= 1 → ALERT ROSSO
Se età < 11 anni E Go-Me/NS tra 0.95 e 1.0 → ALERT ARANCIO

REGOLE ANB-WITS DISCORDANTI:
- ANB aumentato + Wits neutro/negativo: possibile rotazione mandibolare, ANB sovrastima la classe. Preferire INTEGRAL prima di SC.
- ANB nella norma + Wits molto positivo: II classe occlusale, rivalutare.
- ANB e Wits discordanti in generale: INTEGRAL, rivalutare a 4-5 mesi.

SIGNIFICATO ANGOLO GONIACO PER CLASSE:
| Classe | Angolo goniaco | Significato | Prognosi |
|--------|----------------|-------------|----------|
| I Classe | Ipodivergente (<123°) | Mandibola forte e compatta. Muscoli ipertonici. | Stabile ma attenzione a compressione |
| I Classe | Iperdivergente (>137°) | Mandibola che scende. Sistema verticalmente instabile. | Rischio affollamento, open bite. Rischio recidiva |
| II Classe | Iperdivergente (>137°) | Mandibola ruota indietro e in basso. Altezza facciale aumentata. | Classe II scheletrica vera. Muscoli deboli. Prognosi più delicata. |
| II Classe | Ipodivergente (<123°) | Mandibola forte ma bloccata. Spesso funzionale o compensata. | Buona risposta a terapia funzionale |
| III Classe | Ipodivergente (<123°) | Crescita orizzontale dominante. Rotazione antioraria. | Più impegnativa se non intercettata presto |
| III Classe | Iperdivergente (>137°) | Componente verticale prevalente. | Controllo verticale difficile ma meno aggressiva in avanzamento |

SPIEGAZIONI PER SCENARIO:
- TC + OPEN: III Classe iperdivergente. Mandibola avanzata con crescita verticale. TC per sagittale, OPEN per verticale. ~1 anno.
- TC + DEEP: III Classe ipodivergente. Mandibola propulsiva con forze muscolari elevate. Pattern più impegnativo. Rivalutare dopo 6 mesi.
- SC + OPEN: II Classe iperdivergente (la più frequente). Mandibola ruota indietro/basso, muscoli deboli. Prognosi delicata.
- SC + DEEP: II Classe ipodivergente. Mandibola forte ma bloccata, spesso funzionale/compensata. Buona risposta attesa.
- INTEGRAL: Classe discordante o normorelazione. Osservare risposta del morso 4-5 mesi.

=== FORMATO OUTPUT OBBLIGATORIO ===

Devi SEMPRE produrre il report con ESATTAMENTE questa struttura e queste sezioni, nello stesso ordine. Non aggiungere sezioni extra, non cambiare i titoli delle sezioni, non omettere sezioni.

## 1. Tabella dei Valori, Norme e Interpretazioni

| **Misura** | **Valore Inserito** | **Norma di Riferimento** | **Interpretazione** |
|---|---|---|---|
| Angolo Sellare (N-S-Ar) | [valore]° | 123° ± 5° | [NORMO/TC/SC] |
| ANB | [valore]° | 2° ± 2° | [NORMO/TC/SC] |
| Wits | [valore] mm | [0 mm ± 2 mm o -1 mm ± 2 mm in base al sesso] | [NORMO/TC/SC] |
| Angolo Articolare (S-Ar-Go) | [valore]° | 143° ± 5° | [NORMO/IPER/IPO] |
| Angolo Goniaco (Ar-Go-Me) | [valore]° | 130° ± 7° | [NORMO/IPER/IPO] |

Se forniti NS e Go-Me, aggiungi una riga:
| Rapporto Go-Me/NS | [valore calcolato] | < 1.0 | [NORMO/ALERT] |

## 2. Classe Scheletrica

[Indica la classe risultante (I Classe / II Classe SC / III Classe TC / INTEGRAL) e spiega il ragionamento basato sui 3 indicatori (Sellare, ANB, Wits). Specifica quanti su 3 indicano TC, SC, NORMO e come si arriva alla conclusione.]

## 3. Pattern di Divergenza

[Indica il pattern (OPEN / DEEP / INTEGRAL) e spiega basandoti sui valori di Angolo Articolare e Angolo Goniaco.]

## 4. Dispositivo Consigliato

**Dispositivo: [NOME DISPOSITIVO]**

[Motivazione diagnostica dettagliata. Includi lo scenario clinico corrispondente dalla tabella degli scenari. Indica la durata stimata del trattamento.]

## 5. Alert III Classe Evolutiva

[Se età < 11 e sono forniti NS e Go-Me: indica il livello di alert (ROSSO/ARANCIO/NESSUNO) con spiegazione. Se non applicabile scrivi "Non applicabile (età ≥ 11 anni o dati NS/Go-Me non forniti)."]

## 6. Significato dell'Angolo Goniaco

[Interpreta il valore dell'angolo goniaco in relazione alla classe scheletrica trovata, usando la tabella di riferimento fornita.]

## 7. Note Cliniche e Rivalutazione

[Indicazioni cliniche specifiche e tempistica di rivalutazione consigliata.]

=== FINE FORMATO ===

NON includere MAI disclaimer, avvisi legali o note sull'uso dell'intelligenza artificiale nell'output.
NON includere header o footer dello studio (nome dottoressa, firma, data, indirizzo).
Vai DIRETTAMENTE all'analisi. Produci SOLO il report formattato, nient'altro.`;

// ── Helper: call AI (non-streaming) ──
async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI gateway error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Auth: validate X-Api-Key against database ──
  const apiKey = req.headers.get("x-api-key");
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
    return new Response(JSON.stringify({ error: "Unauthorized. Invalid or revoked API key." }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { tool, format } = body;
    const outputFormat = (format || "html").toLowerCase();

    if (!tool || !["diagnosis", "orthodontic"].includes(tool)) {
      return new Response(
        JSON.stringify({
          error: "Campo 'tool' obbligatorio. Valori: 'diagnosis' o 'orthodontic'.",
          usage: {
            diagnosis: { tool: "diagnosis", documentText: "Testo del documento clinico..." },
            orthodontic: { tool: "orthodontic", age: 10, sex: "F", angolo_sellare: 125, anb: 3, wits: 1, angolo_articolare: 145, angolo_goniaco: 132 },
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

    // ── Check rate limit ──
    const { data: usageCount } = await supabaseAdmin.rpc("get_api_key_monthly_usage", {
      _api_key_id: keyRecord.id,
      _tool_name: tool,
    });

    if (usageCount !== null && usageCount >= keyRecord.monthly_limit) {
      return new Response(
        JSON.stringify({ error: `Limite mensile raggiunto (${keyRecord.monthly_limit} chiamate/mese). Contatta l'amministratore.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let markdown: string;

    if (tool === "diagnosis") {
      const { documentText } = body;
      if (!documentText || typeof documentText !== "string" || documentText.trim().length < 20) {
        return new Response(
          JSON.stringify({ error: "Campo 'documentText' obbligatorio (min 20 caratteri)." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      markdown = await callAI(
        DIAGNOSIS_SYSTEM_PROMPT,
        `Analizza il seguente documento clinico e genera un REFERTO CLINICO COMPLETO:\n\n---\n${documentText}\n---`
      );
    } else {
      // orthodontic
      const { age, sex, angolo_sellare, anb, wits, angolo_articolare, angolo_goniaco, ns_mm, gome_mm, classe_dentale } = body;
      if (!age || !sex || angolo_sellare == null || anb == null || wits == null || angolo_articolare == null || angolo_goniaco == null) {
        return new Response(
          JSON.stringify({ error: "Campi obbligatori: age, sex, angolo_sellare, anb, wits, angolo_articolare, angolo_goniaco" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const userMsg = `Analizza i seguenti valori cefalometrici:
- Età: ${age} anni
- Sesso: ${sex}
- Angolo Sellare (N-S-Ar): ${angolo_sellare}°
- ANB: ${anb}°
- Wits: ${wits} mm
- Angolo Articolare (S-Ar-Go): ${angolo_articolare}°
- Angolo Goniaco (Ar-Go-Me): ${angolo_goniaco}°
${ns_mm ? `- NS: ${ns_mm} mm` : ""}
${gome_mm ? `- Go-Me: ${gome_mm} mm` : ""}
${classe_dentale ? `- Classe dentale/funzionale confermata: ${classe_dentale}` : ""}`;

      markdown = await callAI(ORTHODONTIC_SYSTEM_PROMPT, userMsg);
    }

    // ── Log usage ──
    await supabaseAdmin.from("api_usage_log").insert({ api_key_id: keyRecord.id, tool_name: tool });
    await supabaseAdmin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);

    // Build response based on format
    const htmlBody = mdToHtml(markdown);
    const fullHtml = wrapInHtmlDocument(htmlBody);

    const result: Record<string, string> = {};
    if (outputFormat === "markdown" || outputFormat === "both") result.markdown = markdown;
    if (outputFormat === "html" || outputFormat === "both") result.html = fullHtml;
    if (!result.markdown && !result.html) result.html = fullHtml;

    return new Response(JSON.stringify({ success: true, tool, ...result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("external-api error:", e);
    return new Response(
      JSON.stringify({ error: "Si è verificato un errore interno. Riprova più tardi." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
