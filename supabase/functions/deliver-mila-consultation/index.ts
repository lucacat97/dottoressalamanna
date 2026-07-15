import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Rielaborazione con Claude Sonnet ──
const CLAUDE_EXEMPLAR = `CONSULENZA CHECK-UP ORTODONTICO POSTURALE

Disclaimer: Questo strumento fornisce esclusivamente un supporto all'analisi clinica e NON costituisce in alcun modo una diagnosi medica. La responsabilità diagnostica resta interamente in capo al professionista sanitario. L'utilizzo di questo strumento non sostituisce il giudizio clinico del medico.

Paziente: Crola Pietro
Età: 7 anni e 7 mesi
Data visita: 17/03/2026

Motivo della visita
Check-up ortodontico posturale. Pietro non riferisce sintomi.

Introduzione
Il check-up ortodontico posturale osserva l'organismo nella sua interezza: bocca, lingua, respirazione, postura, occhi e sistema neuromuscolare lavorano in rete. L'obiettivo è distinguere ciò che è primario da ciò che è compenso, così da guidare la crescita in modo più armonico e stabile.

Le cose che funzionano
Il sistema mostra buone risorse di base. La storia è lineare (parto spontaneo, sonno continuo, sport regolare, nessun trauma o intervento), l'igiene orale è buona e non c'è dolore a carico di muscoli masticatori o ATM. La cinematica mandibolare è pulita: apertura senza deviazione, lateralità senza precontatti. Le vie aeree sono ben rappresentate alla radiografia e il Romberg bipodalico è negativo, dato rassicurante rispetto a deficit neurologici o vestibolari maggiori.
Il reperto più significativo è la reattività posturale all'input linguale: portando la lingua allo spot palatino, il piede destro "corto" e la restrizione intrarotatoria d'anca si normalizzano. Il sistema risponde correttamente a una funzione corretta — è questo il vero punto di forza clinico e la base su cui costruire la terapia.

Le cose da correggere e il loro significato
Gli elementi critici si distribuiscono su tre piani coerenti fra loro:
- Occlusale: palato stretto, morso aperto e precontatti in protrusiva, che favoriscono adattamenti muscolari e una funzione meno stabile.
- Miofunzionale: lingua potenzialmente capace ma poco allenata — sa elevarsi su richiesta ma a riposo resta bassa, senza stimolare lo spot palatino.
- Posturale: assetto tipo sindrome discendente, con asimmetrie di bacino e spalle che si riducono quando si corregge la funzione linguale.
A questi si aggiunge una convergenza oculare non sincrona (ipodivergenza dell'occhio sinistro), che può alimentare le asimmetrie cervicali.
Il significato clinico è chiaro: la lingua e i recettori alti (bocca, cervicale, occhi) sono i driver funzionali dell'organizzazione posturale. Trattarli non serve soltanto a mettere in ordine i denti, ma a guidare una crescita più equilibrata, con effetti positivi anche sulla postura e sulla stabilità a lungo termine.

Analisi dettagliata dei risultati

Anamnesi
Parto spontaneo, sonno continuo, attività sportiva regolare; nessun trauma né intervento, nessun disturbo dell'orecchio o instabilità soggettiva. Non usa occhiali né plantari. È presente respirazione orale abituale, fattore che nel tempo può abbassare la posizione di riposo della lingua e orientare la crescita mascellare verso forme più strette. L'assenza di sintomi non esclude un lavoro in compenso.

Esame orale e occlusale
Dentizione mista, igiene buona. Palato stretto e morso aperto. In dinamica: nessuna deviazione in apertura, nessun precontatto in lateralità, precontatti presenti in protrusiva. La coordinazione mandibolare è valida ma la guida anteriore non è pienamente funzionale: i precontatti in protrusiva possono indurre lavoro selettivo degli pterigoidei e degli stabilizzatori anteriori.

Funzione linguale e frenulo
I test fonatori orientano verso una funzione migliorabile: farfalla non coordinata, MANN negativo, conta 60–70 poco efficiente. Il suono "III" è ben eseguito — la lingua può elevarsi, ma non lo fa in modo costante. Massima apertura orale inferiore a 4 cm che però non si riduce oltre il 50% con lingua allo spot; l'esame delle inserzioni frenulari e della protrusione non evidenzia restrizione frenulare. Il quadro depone per un freno muscolare funzionale, non strutturale: lingua da rieducare, non da liberare.

Respirazione e distretto ORL
Specchietto di Glatzel negativo al momento della prova, ma facies adenoidea e occhiaie suggeriscono una storia di respirazione prevalentemente orale. Le vie aeree sono ben rappresentate — elemento favorevole, che non esclude abitudini funzionali orali da rieducare.

Muscoli e ATM
Nessun dolore riferito. Alla palpazione: ipertono marcato degli pterigoidei (mediale e laterale) a sinistra (9/10), tono lieve-moderato su masseteri, temporali, trapezi e sternocleidomastoidei. L'apertura è rettilinea (buona coordinazione). L'assenza di dolore indica un compenso efficace, mentre l'ipertono segnala un surplus di lavoro della muscolatura accessoria, coerente con i precontatti in protrusiva e con la funzione linguale non ottimale.

Esame radiografico (OPT)
Condili asimmetrici ma di forma simmetrica; seni nella norma e simmetrici; vie aeree ben rappresentate. Iperlordosi cervicale. Osso ioide non compreso tra C2 e C3, indicatore di lingua bassa a riposo con mancata stimolazione abituale dello spot. Profilo vertebrale coerente con età prepuberale: finestra di crescita favorevole a un intervento intercettivo e funzionale.

Esame posturale
- Romberg bipodalico: negativo → buon controllo di base, nessun deficit vestibolare maggiore.
- Romberg monopodalico: positivo bilaterale → instabilità in appoggio singolo, migliorabile con rieducazione propriocettiva.
- Fukuda-Unterberger (testa neutra): rotazione a sinistra → asincronia funzionale prevalente a sinistra.
- Bacino / spalla / appoggi: bacino alto a sinistra, spalla alta a destra, piede "corto" a destra che normalizza con lingua allo spot → legame bocca-postura.
- Test di Bassani: sale a destra → retrazione della catena posteriore prevalente a destra.
- Test di Autet (rotatori d'anca): restrizione intrarotatoria che normalizza con lingua allo spot → conferma il driver alto.
- Rotazione del capo: minore rotazione a destra → asimmetria cervicale coerente con le differenze di tono.
Il pattern è coerente con una sindrome posturale discendente: l'origine funzionale sta nella parte alta (lingua, occlusione, cervicale, occhi) e si trasmette verso il basso. La normalizzazione di piede e anca con la lingua allo spot conferma il ruolo guida della funzione linguale.

Sistema visivo
Occhio dominante destro; convergenza non sincrona con ipodivergenza dell'occhio sinistro (non coincidente con il dominante). Poiché occhi, equilibrio cervicale e coordinazione mandibolare sono connessi, una dissincronia oculomotoria può alimentare le asimmetrie cervicali osservate: motivo in più per un inquadramento integrato.

Terapie consigliate

Terapia elastodontica
Indicata per accompagnare la crescita delle arcate, armonizzare i contatti e favorire un appoggio linguale stabile contro il palato. Nel caso in esame, palato stretto, morso aperto e precontatti in protrusiva beneficiano di un dispositivo morbido e funzionale che riduca le interferenze e offra un pattern neuromuscolare più equilibrato, con ricadute anche posturali.
Durata orientativa: circa 12 mesi, con controlli periodici e adattamenti secondo la risposta clinica e la crescita.
Utilizzo: 2 ore durante il giorno e tutta la notte.
Nota economica: in caso di perdita o danneggiamento, un nuovo dispositivo ha un costo di 350,00 euro, escluso dal preventivo.

Terapia miofunzionale
Centrale in questo quadro: insegna alla lingua a posizionarsi allo spot, a deglutire correttamente e a coordinarsi con labbra e mandibola. Poiché la postura si riequilibra già con la lingua allo spot, rieducare la funzione significa sostenere insieme espansione mascellare, stabilità occlusale e assetto cervicale.
Durata orientativa: 6–12 mesi, con esercizi quotidiani a casa e sedute di controllo per progressione e rinforzo.

Terapie di supporto
- Fotobiomodulazione: per modulare gli ipertoni (pterigoidei e distretto cervicale) e facilitare l'adattamento neuromuscolare; a cicli durante l'anno, secondo la risposta clinica.
- Valutazione optometrica funzionale: per lavorare sull'asimmetria di convergenza e stabilizzare l'integrazione oculo-posturale.
- Approfondimento ORL: da considerare se la respirazione orale persiste, per garantire pervietà e abitudini respiratorie nasali stabili a supporto della rieducazione linguale.

Messaggio conclusivo
Il corpo sta già facendo molto per restare in equilibrio, e la risposta della postura alla lingua allo spot lo dimostra. Con costanza e una guida adeguata — lingua alta e stabile, guida occlusale armonica, respirazione più corretta — possiamo accompagnare la crescita verso un equilibrio più naturale e duraturo, in cui bocca e postura si sostengono a vicenda.

Dott.ssa Lamanna Annarita
Odontoiatra — Ortodontista — Agopuntrice — Nanotectherapist
Studio Carella & Lamanna — Studio Dentistico Multidisciplinare, Occlusione e Postura`;

const CLAUDE_SYSTEM_PROMPT = `Sei un editor clinico. Ricevi un referto di check-up ortodontico posturale già
redatto e lo riscrivi in forma sintetica, professionale e coerente con il MODELLO
DI RIFERIMENTO qui sotto, SENZA alterare, aggiungere o rimuovere alcun dato clinico
del caso in ingresso.

REGOLE INVIOLABILI
- Non inventare reperti, valori, diagnosi o terapie. Non rimuovere dati clinici.
- Non copiare i dati anagrafici, i reperti o i valori del modello: il modello serve
  SOLO come guida di struttura, tono e livello di sintesi. I contenuti devono
  provenire esclusivamente dal referto in input.
- Mantieni invariati dal referto in input: disclaimer, dati anagrafici, valori
  numerici, nomi dei test, durate e note economiche delle terapie, firma del
  professionista.
- De-duplica e compatta, non ri-diagnosticare.

STRUTTURA (allineata al modello)
Segui l'ordine e i titoli del modello quando i dati corrispondenti sono presenti
nel referto in input (ometti la sezione se il dato manca del tutto):
1. Titolo
2. Disclaimer
3. Paziente / Età / Data visita
4. Motivo della visita
5. Introduzione (breve, di cornice)
6. Le cose che funzionano (interpretativa, niente elenco di test)
7. Le cose da correggere e il loro significato (interpretativa, con eventuale
   elenco a 3 piani: occlusale / miofunzionale / posturale, se pertinente)
8. Analisi dettagliata dei risultati (registro dei dati, un test = una riga
   sintetica; sottosezioni h3 come nel modello: Anamnesi, Esame orale e occlusale,
   Funzione linguale e frenulo, Respirazione e distretto ORL, Muscoli e ATM,
   Esame radiografico, Esame posturale, Sistema visivo — solo quelle pertinenti)
9. Terapie consigliate (con sotto-blocchi h3 per ciascuna terapia; conserva
   durate, modalità d'uso e note economiche testualmente dal referto in input)
10. Messaggio conclusivo (breve, incoraggiante, non pubblicitario)
11. Firma del professionista

STILE (come nel modello)
- Sezioni narrative = INTERPRETAZIONE; "Analisi dettagliata" = REGISTRO DEI DATI.
- Ogni concetto UNA sola volta (lingua allo spot, ioide non tra C2-C3, apertura
  <4 cm, farfalla/MANN, facies adenoidea/occhiaie, vie aeree, ecc.).
- Niente frasi-cornice generiche ("Osserviamo diversi segnali…"): entra subito
  nel merito.
- Elenchi puntati brevi dove i dati si prestano (test posturali, terapie di
  supporto). Tono professionale, italiano, non pubblicitario.

FORMATO DI OUTPUT (obbligatorio)
Restituisci SOLO frammento HTML, senza <html>, <head>, <style> né attributi di
colore o style inline. Usa esclusivamente questi tag:
- <h1> per il titolo (una sola volta)
- <div class="disclaimer">…</div> per il disclaimer
- <p class="meta"> per le righe Paziente / Età / Data visita
- <h2> per le sezioni principali
- <h3> per le sottosezioni dell'analisi dettagliata e delle terapie
- <p>, <ul>, <li> per il corpo
- <div class="signature">…</div> per la firma finale
Nessun commento tuo, nessuna spiegazione: solo il frammento HTML.

===== MODELLO DI RIFERIMENTO (SOLO PER STRUTTURA, TONO E SINTESI — NON COPIARE I DATI) =====
${CLAUDE_EXEMPLAR}
===== FINE MODELLO =====`;

async function refineWithClaude(markdown: string): Promise<string | null> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) {
    console.warn("[refineWithClaude] ANTHROPIC_API_KEY missing, skip refine");
    return null;
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      temperature: 0.2,
      system: CLAUDE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: markdown }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Anthropic HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const fragment = (data?.content ?? [])
    .filter((b: any) => b?.type === "text")
    .map((b: any) => b.text as string)
    .join("")
    .trim();
  // Rimuovi eventuali fence ```html
  const cleaned = fragment
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  if (!cleaned || cleaned.length < 50) return null;

  // Applica gli stili inline per il documento Word (il CSS del sito non serve qui).
  return applyInlineStyles(cleaned);
}

function applyInlineStyles(html: string): string {
  const ACCENT = "#1F3864";
  const DISC_BG = "#FBF3D9";
  const DISC_BORDER = "#E0C97A";
  const GREY = "#444444";
  return html
    .replace(/<h1(\s|>)/gi, `<h1 style="color:${ACCENT};font-family:Georgia,serif;font-size:20pt;margin:28px 0 12px;border-bottom:1px solid #eee;padding-bottom:8px;"$1`)
    .replace(/<h2(\s|>)/gi, `<h2 style="color:${ACCENT};font-family:Georgia,serif;font-size:16pt;margin:24px 0 10px;"$1`)
    .replace(/<h3(\s|>)/gi, `<h3 style="color:#333;font-size:12pt;margin:18px 0 6px;"$1`)
    .replace(/<div class="disclaimer"(\s|>)/gi, `<div style="background:${DISC_BG};border:1px solid ${DISC_BORDER};padding:12px 16px;border-radius:6px;margin:16px 0;color:#5b4708;font-size:11pt;line-height:1.5;"$1`)
    .replace(/<div class="signature"(\s|>)/gi, `<div style="color:${GREY};font-style:italic;margin-top:28px;padding-top:12px;border-top:1px solid #ddd;font-size:11pt;"$1`)
    .replace(/<p class="meta"(\s|>)/gi, `<p style="color:${GREY};font-size:11pt;margin:4px 0;"$1`);
}

function extractIntroFromHtml(html: string): string {
  // Estrai i primi 1-2 <p> "normali" (non meta, non dentro disclaimer/signature).
  const stripped = html
    .replace(/<div[^>]*(?:disclaimer|signature)[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<p[^>]*class="meta"[^>]*>[\s\S]*?<\/p>/gi, "");
  const paragraphs: string[] = [];
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) && paragraphs.length < 2) {
    const inner = m[1].trim();
    if (inner) paragraphs.push(`<p style="margin:8px 0;line-height:1.6;">${inner}</p>`);
  }
  return paragraphs.join("\n") || "<p>La consulenza completa è disponibile nel documento allegato.</p>";
}


// ── Markdown → HTML (allineato al sito) ──
function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tbl: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tbl.push(lines[i]); i++;
      }
      if (tbl.length >= 2) {
        let h = '<table style="width:100%;border-collapse:collapse;margin:16px 0;page-break-inside:avoid;">';
        let first = true;
        for (const tl of tbl) {
          const cells = tl.split("|").slice(1, -1);
          if (cells.every((c) => /^[\s:-]+$/.test(c.trim()))) continue;
          const tag = first ? "th" : "td";
          const bg = first ? "background:#f0f7f7;font-weight:600;" : "";
          h += `<tr>${cells.map((c) => `<${tag} style="padding:10px 14px;border:1px solid #ddd;text-align:left;${bg}">${c.replace(/\*\*/g, "").trim()}</${tag}>`).join("")}</tr>`;
          first = false;
        }
        h += "</table>";
        out.push(h);
      }
      continue;
    }
    out.push(line); i++;
  }
  let html = out.join("\n");
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote style="border-left:4px solid #f0b400;padding:12px 16px;margin:14px 0;background:#fff8e1;color:#5b4708;border-radius:6px;">$1</blockquote>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 style="font-size:14px;color:#333;margin:16px 0 8px;">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 style="font-size:15px;color:#333;margin:20px 0 8px;">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 style="font-size:17px;color:#2a6f6f;margin:24px 0 10px;font-family:Georgia,serif;">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 style="font-size:20px;color:#2a6f6f;margin:28px 0 12px;font-family:Georgia,serif;border-bottom:1px solid #eee;padding-bottom:8px;page-break-after:avoid;">$1</h1>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li style="margin:4px 0;">$1</li>');
  html = html.replace(/((<li[^>]*>.*<\/li>\n?)+)/g, '<ul style="margin:8px 0 8px 20px;padding:0;">$1</ul>');
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin:4px 0;">$1</li>');
  html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">');
  html = html.split("\n").map((l) => {
    const t = l.trim();
    if (!t) return "";
    if (t.startsWith("<")) return l;
    return `<p style="margin:8px 0;line-height:1.6;">${t}</p>`;
  }).join("\n");
  return html;
}

function extractIntroduction(md: string): string {
  const noDisclaimer = md.replace(/^>\s*\*\*Disclaimer:.*?(?=\n\n|\n#|$)/s, "").trim();
  const introMatch = noDisclaimer.match(/##?\s*Introduzione[^\n]*\n([\s\S]*?)(?=\n##?\s|\n#\s|$)/i);
  if (introMatch && introMatch[1].trim().length > 40) return introMatch[1].trim();
  const paragraphs = noDisclaimer.split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("#") && !p.startsWith(">"))
    .slice(0, 2);
  return paragraphs.join("\n\n") || "La consulenza completa è disponibile nel documento allegato.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // ── Auth: prende l'utente dal JWT ──
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userEmail = userData.user.email;
    const userMeta = (userData.user.user_metadata ?? {}) as Record<string, string>;
    const firstName = userMeta.first_name || userMeta.given_name || userMeta.name || "";
    const lastName = userMeta.last_name || userMeta.family_name || "";

    // ── Body ──
    const body = await req.json();
    const { markdown, consultationType } = body as { markdown?: string; consultationType?: string };
    if (!markdown || typeof markdown !== "string" || markdown.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Campo 'markdown' obbligatorio." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const type = (consultationType && typeof consultationType === "string") ? consultationType : "Consulenza sul caso";

    // ── Rielaborazione con Claude (solo Consulenza Clinica MILA) ──
    let refinedHtml: string | null = null;
    if (type === "Consulenza Clinica") {
      try {
        refinedHtml = await refineWithClaude(markdown);
      } catch (e) {
        console.error("[deliver-mila-consultation] Claude refine failed, falling back:", (e as Error)?.message);
        refinedHtml = null;
      }
    }

    // ── HTML + Word ──
    const bodyHtml = refinedHtml ?? mdToHtml(markdown);
    const introHtml = refinedHtml ? extractIntroFromHtml(refinedHtml) : mdToHtml(extractIntroduction(markdown));
    const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${type}</title>
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
</style></head><body>${bodyHtml}</body></html>`;

    // ── Upload ──
    const safeType = type.replace(/[^\w\-]+/g, "_");
    const fileName = `consulenza_${safeType}_${new Date().toISOString().slice(0, 10)}_${crypto.randomUUID().slice(0, 8)}.doc`;
    const filePath = `${userData.user.id}/${fileName}`;
    const { error: upErr } = await admin.storage
      .from("consultation-attachments")
      .upload(filePath, new Blob([wordHtml], { type: "application/msword" }), {
        contentType: "application/msword",
        upsert: false,
      });
    if (upErr) throw new Error(`storage upload: ${upErr.message}`);

    // ── Token ──
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const dlToken = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const { error: tokErr } = await admin.from("consultation_downloads").insert({
      token: dlToken,
      file_path: filePath,
      file_name: fileName,
      recipient_email: userEmail,
      api_key_id: null,
      consultation_type: type,
      max_downloads: 5,
      expires_at: expiresAt,
    });
    if (tokErr) throw new Error(`token insert: ${tokErr.message}`);

    const downloadUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/download-consultation?token=${dlToken}`;

    // ── Email via send-transactional-email ──
    const sendResp = await fetch(`${supabaseUrl.replace(/\/$/, "")}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({
        templateName: "consultation-delivery",
        recipientEmail: userEmail,
        idempotencyKey: `mila-${userData.user.id}-${crypto.randomUUID()}`,
        templateData: {
          professionalFirstName: firstName,
          professionalLastName: lastName,
          consultationType: type,
          introHtml,
          downloadUrl,
        },
      }),
    });
    if (!sendResp.ok) {
      const errText = await sendResp.text().catch(() => "");
      throw new Error(`send-transactional-email HTTP ${sendResp.status}: ${errText.slice(0, 200)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      recipient: userEmail,
      consultation_type: type,
      download_url: downloadUrl,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = (e as Error)?.message || String(e);
    console.error("[deliver-mila-consultation] error:", msg);
    return new Response(JSON.stringify({ error: "Invio email fallito", detail: msg.slice(0, 300) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
