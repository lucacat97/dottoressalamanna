import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MONTHLY_LIMIT = 30;
const TOOL_NAME = "orthodontic-diagnosis";

const SYSTEM_PROMPT = `Sei un assistente per la diagnosi ortodontica funzionale basata sulla cefalometria di Bjork-Jarabak, sviluppato per lo Studio Carella & Lamanna dalla Dott.ssa Lamanna Annarita.

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
Discordanti → Dispositivo con Piano neutro (rivalutare 4-5 mesi)
Entrambi NORMO → Dispositivo con Piano neutro

DISPOSITIVO FINALE = componente CLASSE + componente DIVERGENZA
Esempi: TC + Dispositivo con rialzo posteriore, SC + Dispositivo con rialzo anteriore, IC + Dispositivo con Piano neutro, TC + Dispositivo con Piano neutro

ALERT III CLASSE EVOLUTIVA:
Se età < 11 anni E Rapporto NS/GoMe >= 1 → ALERT ROSSO (intercettare subito)
Se età < 11 anni E Rapporto NS/GoMe tra 0.95 e 1.0 → ALERT ARANCIO (monitorare)

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

## Analisi Cefalometrica — [Nome Cognome del paziente]

## Legenda
- **TC** = Terza Classe (dispositivo per III classe scheletrica)
- **SC** = Seconda Classe (dispositivo per II classe scheletrica)
- **IC** = Prima Classe (dispositivo per I classe scheletrica)
- **Dispositivo con rialzo posteriore** = pattern iperdivergente
- **Dispositivo con rialzo anteriore** = pattern ipodivergente
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
[Indica il pattern e il dispositivo corrispondente (rialzo posteriore/anteriore/piano neutro).]

## 4. Dispositivo Consigliato
**Dispositivo: [NOME composto da classe + divergenza]**
[Motivazione diagnostica dettagliata con scenario clinico e durata stimata.]

## 5. Alert III Classe Evolutiva
[Se applicabile indica alert ROSSO/ARANCIO. Altrimenti "Non applicabile."]

## 6. Significato dell'Angolo Goniaco
[Interpreta in relazione alla classe scheletrica trovata.]

## 7. Note Cliniche e Rivalutazione
[Indicazioni cliniche e tempistica.]

Usa un tono professionale. Rispondi SEMPRE in italiano.
NON includere MAI disclaimer, avvisi legali o note sull'uso dell'intelligenza artificiale nell'output.
Vai DIRETTAMENTE all'analisi senza premesse, introduzioni o commenti. Produci SOLO il report formattato, nient'altro.`;

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

    // ── Server-side rate limiting ──
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: usageCount } = await serviceClient.rpc("get_monthly_ai_usage", {
      _user_id: userId,
      _tool_name: TOOL_NAME,
    });
    if (usageCount !== null && usageCount >= MONTHLY_LIMIT) {
      return new Response(
        JSON.stringify({ error: `Limite mensile raggiunto (${MONTHLY_LIMIT} analisi/mese). Riprova il prossimo mese.` }),
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

    const userMessage = `Analizza i seguenti valori cefalometrici e fornisci la diagnosi ortodontica con scelta del dispositivo terapeutico:

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + feedbackSection },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

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
