import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_MONTHLY_LIMIT = 30;
const TOOL_NAME = "orthodontic-diagnosis";
const API_TOOL_KEY = "orthodontic";

const SYSTEM_PROMPT = `Sei un assistente per l'interpretazione cefalometrica funzionale (Bjork-Jarabak), sviluppato per lo Studio Carella & Lamanna dalla Dott.ssa Lamanna Annarita.

REGOLE LINGUISTICHE TASSATIVE — DA RISPETTARE SEMPRE:
- NON usare MAI le parole: "Referto", "referti", "Diagnosi", "diagnosi", "diagnostico", "diagnostica", "clinico", "clinica", "cliniche", "clinici" o qualunque loro variazione/derivato.
- Sostituiscile sempre con: "Studio del caso", "Approccio", "Analisi", "Valutazione", "Lettura del caso", "Considerazioni", "Inquadramento" o formule equivalenti NON cliniche/diagnostiche.
- Anche nei titoli, intestazioni e disclaimer: NESSUNA delle parole vietate sopra.

DATI DI INPUT che ti verranno forniti:
- Nome e Cognome del paziente
- Età del paziente (anni) e sesso (M/F)
- Angolo Sellare N-S-Ar (norma 123±5)
- ANB (norma 2±2)
- Wits in mm (norma 0±2 femmine, -1±2 maschi)
- Angolo Articolare S-Ar-Go (norma 143±5)
- Angolo Goniaco Ar-Go-Me (norma 130±7)
- [Opzionale] Rapporto NS/GoMe (se fornito, per alert III classe)
- [Opzionale] Classe dentale o funzionale: II classe / III classe

LEGENDA DEI DISPOSITIVI (deve comparire nel report):
- **TC** = Terza Classe (dispositivo per III classe scheletrica)
- **SC** = Seconda Classe (dispositivo per II classe scheletrica)
- **IC** = Prima Classe (dispositivo per I classe scheletrica)

Per la divergenza:
- **Dispositivo con rialzo posteriore** = pattern iperdivergente (ex OPEN)
- **Dispositivo con rialzo anteriore** = pattern ipodivergente (ex DEEP)
- **Dispositivo con Piano neutro** = pattern normodivergente o discordante

IMPORTANTE: Non usare MAI la parola "INTEGRAL" nel report. Usa sempre "IC" (Prima Classe) o "Dispositivo con Piano neutro" a seconda del contesto.

REGOLE PER LA CLASSE SCHELETRICA:
- Angolo Sellare < 118 = TC; > 128 = SC; altrimenti NORMO
- ANB < 0 = TC; > 4 = SC; altrimenti NORMO
- Wits < norma-2 = TC; > norma+2 = SC; altrimenti NORMO

Conta quanti angoli indicano TC e quanti SC:
- 3/3 TC → TC confermata
- 2/3 TC → TC (rivalutare dopo 6 mesi)
- 1/3 TC → SEMPRE indicare la presenza di un indicatore di III classe e suggerire di valutare un dispositivo TC nel quadro complessivo. La classe scheletrica deve riportare la componente di Terza Classe.
- 2/3 o 3/3 SC → SC
- 1/3 SC senza altri concordanti → IC (Prima Classe), rivalutare
- 2/3 o 3/3 NORMO → IC (Prima Classe)
- Nessuna maggioranza → IC (Prima Classe), rivalutare

REGOLA CRITICA PER LA III CLASSE:
Se ANCHE SOLO UNO dei tre indicatori (Angolo Sellare, ANB, Wits) risulta TC (III classe), il dispositivo suggerito DEVE essere un dispositivo di Terza Classe (TC). La classe scheletrica nel risultato complessivo deve indicare "Terza Classe" o "Componente di Terza Classe da valutare". NON sottovalutare MAI un singolo indicatore di III classe.

Se è presente un ALERT di III classe (da Rapporto NS/GoMe) O qualche misura di III classe, il Risultato Complessivo della Classe Scheletrica DEVE essere: **Terza Classe**.

REGOLE PER LA DIVERGENZA:
- S-Ar-Go > 148 = IPER; < 138 = IPO; altrimenti NORMO
- Ar-Go-Me > 137 = IPER; < 123 = IPO; altrimenti NORMO

Entrambi IPER → Dispositivo con rialzo posteriore
Entrambi IPO → Dispositivo con rialzo anteriore
Entrambi NORMO → Dispositivo con Piano neutro

REGOLA PER PATTERN DI DIVERGENZA CONTRASTANTE (IPO/NORMO/IPER discordanti tra S-Ar-Go e Ar-Go-Me):
Quando i due angoli di divergenza sono discordanti (uno IPO e l'altro IPER, oppure uno NORMO e l'altro IPO/IPER), la scelta del rialzo dipende dal tipo di morso dentale:
- **Morso coperto (deep bite)** → Dispositivo con **rialzo anteriore** per 4-6 mesi, poi rivalutare.
- **Morso dentale aperto (open bite)** → Dispositivo con **rialzo posteriore** per 4-6 mesi, poi rivalutare.
- Se il tipo di morso non è specificato nei dati, usa il **Piano neutro** e indica chiaramente che la rivalutazione a 4-6 mesi è obbligatoria e che la scelta definitiva del rialzo dipenderà dal tipo di morso (coperto/aperto).

REGOLA PRIORITARIA TC E DIVERGENZA:
Quando la priorità terapeutica è TC (Terza Classe), il pattern di divergenza DEVE essere SEMPRE a rialzo posteriore, indipendentemente dai valori degli angoli di divergenza e indipendentemente dal tipo di morso. Il dispositivo finale per un TC è quindi SEMPRE: TC + Dispositivo con rialzo posteriore.

DISPOSITIVO FINALE = componente CLASSE + componente DIVERGENZA
Esempi: TC + Dispositivo con rialzo posteriore (SEMPRE per TC), SC + Dispositivo con rialzo anteriore, IC + Dispositivo con Piano neutro

ALERT III CLASSE EVOLUTIVA:
Se età < 11 anni E Rapporto NS/GoMe >= 1 → ALERT ROSSO (intercettare subito)
Se età < 11 anni E Rapporto NS/GoMe tra 0.95 e 1.0 → ALERT ARANCIO (monitorare)

ALERT ETÀ ADULTA (PAZIENTE > 20 ANNI) — OBBLIGATORIO:
Tutte le indicazioni terapeutiche e diagnostiche di questo strumento sono pensate per pazienti in **età evolutiva (fino ai 20 anni)**. Se il paziente ha più di 20 anni, DEVI inserire in modo evidente nel report (sezione apposita "Alert Età Adulta") il seguente alert per il professionista:

> ⚠️ **ALERT — Paziente in età adulta (oltre 20 anni)**
> Il paziente non è più in età evolutiva: l'aspetto scheletrico è già consolidato. Le indicazioni di questo strumento (dispositivi funzionali, intercettiva, guida alla crescita) sono calibrate sull'età evolutiva e NON sono direttamente trasferibili all'adulto. Il professionista deve adattare l'approccio clinico per tutelare l'assetto scheletrico già strutturato, valutando soluzioni alternative (ortodonzia fissa, chirurgia ortognatica, terapia funzionale di mantenimento, gestione miofunzionale e posturale). Il dispositivo eventualmente suggerito va inteso come spunto orientativo e non come indicazione terapeutica diretta.

INTEGRAZIONE CON CHECK-UP ORTODONTICO POSTURALE:
Se nei dati o nelle note cliniche emergono elementi posturali, miofunzionali, respiratori o ORL (es. respirazione orale, deglutizione atipica, postura linguale, asimmetrie posturali, otiti ricorrenti, frenulo corto), tieni conto di questi elementi nell'interpretazione cefalometrica e nella scelta del dispositivo. La cefalometria non va letta in modo isolato ma integrata col quadro funzionale globale (funzione → forma).

REGOLE ANB-WITS DISCORDANTI:
- ANB aumentato + Wits neutro/negativo: possibile rotazione mandibolare, ANB sovrastima la classe. Preferire IC prima di SC.
- ANB nella norma + Wits molto positivo: II classe occlusale, rivalutare.
- ANB e Wits discordanti in generale: IC (Prima Classe), rivalutare a 4-5 mesi.

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
- TC + Dispositivo con rialzo posteriore: III Classe iperdivergente. Mandibola avanzata con crescita verticale. TC per sagittale, rialzo posteriore per verticale. ~1 anno.
- TC + Dispositivo con rialzo anteriore: III Classe ipodivergente. Mandibola propulsiva con forze muscolari elevate. Pattern più impegnativo. Rivalutare dopo 6 mesi.
- SC + Dispositivo con rialzo posteriore: II Classe iperdivergente (la più frequente). Mandibola ruota indietro/basso, muscoli deboli. Prognosi delicata.
- SC + Dispositivo con rialzo anteriore: II Classe ipodivergente. Mandibola forte ma bloccata, spesso funzionale/compensata. Buona risposta attesa.
- IC + Dispositivo con Piano neutro: Prima classe o classe discordante. Osservare risposta del morso 4-5 mesi.

OUTPUT RICHIESTO (in italiano, formato markdown professionale):
Il report deve iniziare con il nome e cognome del paziente come intestazione.
Devi SEMPRE produrre il report con ESATTAMENTE questa struttura e queste sezioni, nello stesso ordine. Non aggiungere sezioni extra, non cambiare i titoli delle sezioni, non omettere sezioni.

## Disclaimer
> **Disclaimer:** Questo strumento fornisce esclusivamente un supporto all'analisi clinica e NON costituisce in alcun modo una diagnosi medica. La responsabilità diagnostica resta interamente in capo al professionista sanitario. L'utilizzo di questo strumento non sostituisce il giudizio clinico del medico.

## Analisi Cefalometrica — [Nome Cognome del paziente]

## Legenda
- **TC** = Terza Classe (dispositivo per III classe scheletrica)
- **SC** = Seconda Classe (dispositivo per II classe scheletrica)
- **IC** = Prima Classe (dispositivo per I classe scheletrica)
- **Dispositivo con rialzo posteriore** = pattern iperdivergente / morso aperto in caso di divergenza discordante
- **Dispositivo con rialzo anteriore** = pattern ipodivergente / morso coperto in caso di divergenza discordante
- **Dispositivo con Piano neutro** = pattern normodivergente

## 1. Tabella dei Valori, Norme e Interpretazioni

| **Misura** | **Valore Inserito** | **Norma di Riferimento** | **Interpretazione** |
|---|---|---|---|
| Angolo Sellare (N-S-Ar) | [valore]° | 123° ± 5° | [NORMO/TC/SC] |
| ANB | [valore]° | 2° ± 2° | [NORMO/TC/SC] |
| Wits | [valore] mm | [0 mm ± 2 mm o -1 mm ± 2 mm in base al sesso] | [NORMO/TC/SC] |
| Angolo Articolare (S-Ar-Go) | [valore]° | 143° ± 5° | [NORMO/IPER/IPO] |
| Angolo Goniaco (Ar-Go-Me) | [valore]° | 130° ± 7° | [NORMO/IPER/IPO] |

Se fornito il Rapporto NS/GoMe, aggiungi una riga:
| Rapporto NS/GoMe | [valore] | < 1.0 | [NORMO/ALERT] |

## 2. Classe Scheletrica
[Indica la classe risultante e spiega il ragionamento basato sui 3 indicatori. Se anche solo 1 indicatore è TC, il risultato complessivo deve indicare Terza Classe.]

## 3. Pattern di Divergenza
[Indica il pattern e il dispositivo corrispondente. Se i due angoli di divergenza sono discordanti, applica la regola morso coperto → rialzo anteriore / morso aperto → rialzo posteriore (4-6 mesi, poi rivalutare). Se la priorità è TC, sempre rialzo posteriore.]

## 4. Dispositivo Consigliato
**Dispositivo: [NOME composto da classe + divergenza]**
[Motivazione diagnostica dettagliata con scenario clinico e durata stimata.]

## 5. Alert III Classe Evolutiva
[Se applicabile indica alert ROSSO/ARANCIO. Altrimenti "Non applicabile."]

## 6. Alert Età Adulta
[Se età > 20 anni inserisci l'alert obbligatorio per l'età adulta come specificato sopra. Altrimenti scrivi "Non applicabile — paziente in età evolutiva."]

## 7. Significato dell'Angolo Goniaco
[Interpreta in relazione alla classe scheletrica trovata.]

## 8. Note Cliniche e Rivalutazione
[Indicazioni cliniche e tempistica. Se nelle note cliniche emergono elementi posturali/miofunzionali/ORL, considerali implicitamente nell'interpretazione e nella scelta del dispositivo, SENZA creare una sezione dedicata e SENZA scrivere frasi generiche del tipo "la cefalometria va integrata con esame clinico" o "nessun dato funzionale-posturale fornito".]

Usa un tono professionale. Rispondi SEMPRE in italiano.
DEVI includere SEMPRE all'inizio del report il blocco "## Disclaimer" con il testo esatto sopra indicato. Questo è l'UNICO disclaimer ammesso: non aggiungere altri avvisi legali o note sull'uso dell'intelligenza artificiale.
Vai DIRETTAMENTE al report (a partire dal disclaimer) senza premesse, introduzioni o commenti. Produci SOLO il report formattato, nient'altro.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Authenticate user via JWT ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autenticato." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessione non valida. Effettua nuovamente il login." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // ── Server-side license check (admin bypass) ──
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let monthlyLimit = DEFAULT_MONTHLY_LIMIT;
    {
      const { data: isAdmin } = await serviceClient.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (!isAdmin) {
        const { data: keyRecord } = await serviceClient
          .from("api_keys")
          .select("tools, tool_limits")
          .eq("client_email", user.email)
          .eq("is_active", true)
          .maybeSingle();
        if (!keyRecord || !Array.isArray(keyRecord.tools) || !keyRecord.tools.includes(API_TOOL_KEY)) {
          return new Response(
            JSON.stringify({ error: "Accesso allo strumento non abilitato per il tuo account." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const limFromKey = (keyRecord.tool_limits as Record<string, number> | null)?.[API_TOOL_KEY];
        if (typeof limFromKey === "number" && limFromKey > 0) {
          monthlyLimit = limFromKey;
        }
      }
    }

    // ── Server-side rate limiting ──
    const { data: usageCount } = await serviceClient.rpc("get_monthly_ai_usage", {
      _user_id: userId,
      _tool_name: TOOL_NAME,
    });
    if (usageCount !== null && usageCount >= monthlyLimit) {
      return new Response(
        JSON.stringify({ error: `Limite mensile raggiunto (${monthlyLimit} analisi/mese). Riprova il prossimo mese.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { nome, cognome, age, sex, angolo_sellare, anb, wits, angolo_articolare, angolo_goniaco, rapporto_ns_gome, classe_dentale } = body;

    if (!age || !sex || angolo_sellare == null || anb == null || wits == null || angolo_articolare == null || angolo_goniaco == null) {
      return new Response(
        JSON.stringify({ error: "Dati incompleti. Inserisci tutti i campi obbligatori." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch accumulated retro-feedback
    const { data: feedbackRows } = await serviceClient.rpc("get_tool_feedback", { _tool_name: TOOL_NAME });
    const feedbackSection = feedbackRows && feedbackRows.length > 0
      ? `\n\n=== RETRO-FEEDBACK DAL PROFESSIONISTA (CORREZIONI ACCUMULATE) ===\nQueste sono indicazioni fornite dal professionista dopo aver analizzato referti precedenti. DEVI tenerne conto SEMPRE:\n${feedbackRows.map((r: { feedback: string }, i: number) => `${i + 1}. ${r.feedback}`).join("\n")}\n=== FINE RETRO-FEEDBACK ===`
      : "";

    // Fetch active knowledge base entries (global + orthodontic)
    const { data: knowledgeRows } = await serviceClient.rpc("get_active_ai_knowledge", { _scope: "orthodontic" });
    const knowledgeSection = knowledgeRows && knowledgeRows.length > 0
      ? `\n\n=== KNOWLEDGE BASE AGGIUNTIVA ===\n${knowledgeRows.map((r: { title: string; content: string }, i: number) => `${i + 1}. [${r.title}]\n${r.content}`).join("\n\n")}\n=== FINE KNOWLEDGE BASE ===`
      : "";

    const patientName = nome && cognome ? `${nome} ${cognome}` : (nome || cognome || "Paziente");
    const userMessage = `Analizza i seguenti valori cefalometrici e fornisci l'interpretazione ortodontica con scelta del dispositivo terapeutico:

- Paziente: ${patientName}
- Età: ${age} anni
- Sesso: ${sex}
- Angolo Sellare (N-S-Ar): ${angolo_sellare}°
- ANB: ${anb}°
- Wits: ${wits} mm
- Angolo Articolare (S-Ar-Go): ${angolo_articolare}°
- Angolo Goniaco (Ar-Go-Me): ${angolo_goniaco}°
${rapporto_ns_gome ? `- Rapporto NS/GoMe: ${rapporto_ns_gome}` : ""}
${classe_dentale ? `- Classe dentale/funzionale: ${classe_dentale}` : ""}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiPayload = JSON.stringify({
      model: "openai/gpt-5-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + knowledgeSection + feedbackSection },
        { role: "user", content: userMessage },
      ],
      stream: true,
    });

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: aiPayload,
      });
      if (response.ok || ![502, 503, 504].includes(response.status)) break;
      console.warn(`AI gateway transient ${response.status}, retry ${attempt + 1}/3`);
      try { await response.body?.cancel(); } catch (_) {}
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
    if (!response) {
      return new Response(
        JSON.stringify({ error: "Errore nel servizio AI. Riprova più tardi." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Troppe richieste. Riprova tra qualche minuto." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti. Contatta l'amministratore." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Errore nel servizio AI. Riprova più tardi." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Log usage server-side ──
    await serviceClient.from("ai_usage_log").insert({ user_id: userId, tool_name: TOOL_NAME });

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("orthodontic-diagnosis error:", e);
    return new Response(
      JSON.stringify({ error: "Si è verificato un errore interno. Riprova più tardi." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
