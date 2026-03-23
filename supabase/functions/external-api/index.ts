import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import metodologia from "../diagnosis-support/metodologia.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

// ── Markdown → HTML converter (lightweight, no deps) ──
function mdToHtml(md: string): string {
  let html = md;

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[\s:-]+\|)\n((?:\|.+\|\n?)+)/gm, (_m, header: string, _sep, body: string) => {
    const ths = header.split("|").filter((c: string) => c.trim()).map((c: string) => `<th style="border:1px solid #ccc;padding:6px 12px;background:#f5f5f5;">${c.trim()}</th>`).join("");
    const rows = body.trim().split("\n").map((row: string) => {
      const tds = row.split("|").filter((c: string) => c.trim()).map((c: string) => `<td style="border:1px solid #ccc;padding:6px 12px;">${c.trim()}</td>`).join("");
      return `<tr>${tds}</tr>`;
    }).join("");
    return `<table style="border-collapse:collapse;width:100%;margin:12px 0;"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Blockquotes
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote style="border-left:4px solid #2563eb;padding:8px 16px;margin:12px 0;background:#eff6ff;">$1</blockquote>');

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6 style="margin:8px 0;font-size:12px;">$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 style="margin:8px 0;font-size:13px;">$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 style="margin:10px 0;font-size:14px;">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 style="margin:12px 0;font-size:16px;">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 style="margin:14px 0;font-size:18px;color:#1e40af;">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 style="margin:16px 0;font-size:22px;color:#1e3a5f;">$1</h1>');

  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li style="margin:4px 0;">$1</li>');
  html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul style="margin:8px 0;padding-left:24px;">$1</ul>');

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin:4px 0;">$1</li>');

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:2px solid #ccc;margin:20px 0;">');

  // Paragraphs for remaining text lines
  html = html.split("\n").map(line => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<")) return line;
    return `<p style="margin:6px 0;line-height:1.6;">${trimmed}</p>`;
  }).join("\n");

  return html;
}

function wrapInHtmlDocument(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 20px; }
  h1 { color: #1e3a5f; border-bottom: 2px solid #2563eb; padding-bottom: 6px; }
  h2 { color: #1e40af; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 6px 12px; text-align: left; }
  th { background: #f5f5f5; }
  blockquote { border-left: 4px solid #2563eb; padding: 8px 16px; margin: 12px 0; background: #eff6ff; }
  strong { color: #1e3a5f; }
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

OUTPUT RICHIESTO (in italiano, formato markdown professionale):
1. Tabella con valore inserito, norma di riferimento e interpretazione
2. Classe scheletrica risultante con spiegazione dettagliata
3. Pattern di divergenza con spiegazione
4. Dispositivo consigliato con motivazione diagnostica dettagliata
5. Alert III classe evolutiva se applicabile
6. Significato dell'angolo goniaco in relazione alla classe trovata
7. Note cliniche e tempistica di rivalutazione

NON includere MAI disclaimer, avvisi legali o note sull'uso dell'intelligenza artificiale nell'output.
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

  // ── Auth: validate X-Api-Key header ──
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("EXTERNAL_API_KEY");
  if (!expectedKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured: missing API key" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!apiKey || apiKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized. Provide a valid X-Api-Key header." }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { tool, format } = body;
    const outputFormat = (format || "html").toLowerCase(); // "html", "markdown", "both"

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
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
