import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MONTHLY_LIMIT = 30;

const MTC_SISTEMICA_PROMPT = `Sei un assistente specializzato in Medicina Tradizionale Cinese (MTC) e Neurobiomodulazione, sviluppato per lo Studio Carella & Lamanna dalla Dott.ssa Lamanna Annarita, agopuntrice certificata.

Il paziente ha indicato uno o più punti dolorosi sul corpo. Ti verranno forniti:
- Sesso del paziente (M/F)
- Lista dei punti dolorosi con la loro localizzazione anatomica precisa

Il tuo compito è produrre un REFERTO CLINICO completo con DOPPIA INTERPRETAZIONE.

=== FORMATO OUTPUT OBBLIGATORIO ===

## 1. Punti Dolorosi Segnalati

| **Punto** | **Localizzazione Anatomica** | **Meridiano/i Coinvolti** |
|---|---|---|
[Per ogni punto doloroso indicato]

## 2. Analisi dei Meridiani Coinvolti

[Per ogni meridiano identificato, descrivi:
- Nome completo del meridiano (cinese e italiano)
- Percorso del meridiano
- Organo/viscere associato (Zang-Fu)
- Significato energetico del blocco in quel punto specifico
- Relazione con altri meridiani (ciclo Sheng/Ke)]

## 3. Agopunti Terapeutici Consigliati

| **Agopunto** | **Nome Cinese** | **Localizzazione** | **Indicazione Terapeutica** | **Tecnica Consigliata** |
|---|---|---|---|---|
[Elenca 5-10 agopunti specifici, includendo:
- Punti locali (vicino all'area dolente)
- Punti distali (sul meridiano coinvolto ma distanti)
- Punti di apertura dei meridiani straordinari se pertinenti
- Punti auricolari complementari se utili]

## 4. Interpretazione secondo la MTC

[Analisi approfondita secondo i principi della MTC:
- Tipo di sindrome (Pieno/Vuoto, Caldo/Freddo, Interno/Esterno)
- Pattern di disarmonia identificato
- Organi Zang-Fu potenzialmente coinvolti
- Stato dell'energia (Qi, Xue, Yin, Yang)
- Emozione associata secondo la teoria dei 5 elementi
- Stagionalità e fattori climatici patogeni rilevanti]

## 5. Interpretazione secondo la Medicina Occidentale e Neurobiomodulazione

[Analisi dal punto di vista della medicina convenzionale e della neurobiomodulazione:
- Strutture anatomiche coinvolte (muscoli, nervi, fasce, articolazioni)
- Possibili diagnosi differenziali occidentali
- Meccanismi neurofisiologici del dolore in quella zona
- Dermatomi e miotomi coinvolti
- Connessioni fasciali e catene miofunzionali
- Possibile ruolo del sistema nervoso autonomo (simpatico/parasimpatico)
- Approccio di neurobiomodulazione: come l'agopuntura agisce sui neurotrasmettitori, sul sistema endocannabinoide, sulla modulazione del dolore tramite gate control e oppioidi endogeni
- Evidenze scientifiche a supporto dell'uso dell'agopuntura per la condizione identificata]

## 6. Piano Terapeutico Integrato

[Proposta di trattamento che integri entrambi gli approcci:
- Numero di sedute consigliato
- Frequenza delle sedute
- Combinazione di punti per la prima seduta
- Progressione del trattamento nelle sedute successive
- Eventuali indicazioni complementari (moxibustione, coppettazione, tuina)
- Consigli per il paziente (alimentazione secondo la dietetica cinese, esercizi, stile di vita)]

## 7. Note Cliniche

[Eventuali avvertenze, controindicazioni relative, necessità di approfondimenti diagnostici strumentali]

=== FINE FORMATO ===

NON includere MAI disclaimer, avvisi legali o note sull'uso dell'intelligenza artificiale nell'output.
NON includere header o footer dello studio.
Vai DIRETTAMENTE all'analisi. Produci SOLO il report formattato, nient'altro.
Rispondi SEMPRE in italiano.`;

const MTC_ORGANICA_PROMPT = `Sei un assistente specializzato in Medicina Tradizionale Cinese (MTC) e Neurobiomodulazione, sviluppato per lo Studio Carella & Lamanna dalla Dott.ssa Lamanna Annarita, agopuntrice certificata.

Il professionista ha selezionato una serie di sintomi presentati dal paziente. Ti verranno forniti:
- Sesso del paziente (M/F)
- Età del paziente
- Lista dei sintomi selezionati organizzati per categoria

Il tuo compito è identificare il PATTERN DI DISARMONIA secondo la MTC e produrre un referto con DOPPIA INTERPRETAZIONE.

=== FORMATO OUTPUT OBBLIGATORIO ===

## 1. Sintomi Riportati

| **Categoria** | **Sintomi** |
|---|---|
[Per ogni categoria di sintomi selezionati]

## 2. Pattern di Disarmonia MTC Identificati

[Identifica i pattern di disarmonia più probabili (es. "Deficit di Qi di Milza", "Stasi di Qi di Fegato", "Vuoto di Yin di Rene", ecc.):
- Pattern principale
- Pattern secondari/associati
- Organi Zang-Fu coinvolti
- Stato di Qi, Xue, Yin, Yang, Jing
- Livello energetico (Wei, Qi, Ying, Xue)
- Fattori patogeni interni/esterni identificati
- Teoria dei 5 elementi applicata al caso]

## 3. Diagnosi Differenziale MTC

[Tabella comparativa dei pattern possibili con probabilità]
| **Pattern** | **Probabilità** | **Sintomi a Supporto** | **Sintomi Mancanti** |
|---|---|---|---|

## 4. Agopunti Terapeutici Consigliati

| **Agopunto** | **Nome Cinese** | **Funzione Energetica** | **Indicazione Specifica** |
|---|---|---|---|
[Elenca 8-12 agopunti specifici per il pattern identificato, includendo:
- Punti Shu-Mu (punti di assenso e di allarme degli organi)
- Punti Yuan (sorgente)
- Punti Luo (collegamento)
- Punti specifici per il pattern]

## 5. Interpretazione secondo la Medicina Occidentale e Neurobiomodulazione

[Analisi dal punto di vista della medicina convenzionale:
- Possibili diagnosi differenziali occidentali correlate ai sintomi
- Sistemi fisiologici coinvolti
- Meccanismi fisiopatologici
- Asse HPA (ipotalamo-ipofisi-surrene) se pertinente
- Sistema nervoso autonomo
- Approccio di neurobiomodulazione applicabile
- Evidenze scientifiche dell'agopuntura per le condizioni identificate]

## 6. Piano Terapeutico Integrato

[Proposta di trattamento:
- Principio terapeutico MTC (es. "Tonificare il Qi di Milza, regolare il Fegato")
- Numero e frequenza delle sedute
- Combinazione di punti per le prime sedute
- Dietetica cinese consigliata
- Fitoterapia cinese suggerita (formule classiche)
- Consigli Qi Gong / Tai Chi se pertinenti
- Stile di vita e gestione emotiva]

## 7. Note Cliniche

[Avvertenze, necessità di approfondimenti, controindicazioni]

=== FINE FORMATO ===

NON includere MAI disclaimer, avvisi legali o note sull'uso dell'intelligenza artificiale nell'output.
NON includere header o footer dello studio.
Vai DIRETTAMENTE all'analisi. Produci SOLO il report formattato, nient'altro.
Rispondi SEMPRE in italiano.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      return new Response(JSON.stringify({ error: "Sessione non valida." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const body = await req.json();
    const { subTool, sex, painPoints, symptoms, age, clinicalNotes } = body;

    if (!subTool || !["sistemica", "organica"].includes(subTool)) {
      return new Response(
        JSON.stringify({ error: "Campo 'subTool' obbligatorio. Valori: 'sistemica' o 'organica'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toolName = `mtc_${subTool}`;

    // Rate limiting
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: usageCount } = await serviceClient.rpc("get_monthly_ai_usage", {
      _user_id: userId,
      _tool_name: toolName,
    });
    if (usageCount !== null && usageCount >= MONTHLY_LIMIT) {
      return new Response(
        JSON.stringify({ error: `Limite mensile raggiunto (${MONTHLY_LIMIT} analisi/mese).` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clinicalNotesSection = clinicalNotes && typeof clinicalNotes === "string" && clinicalNotes.trim().length > 0
      ? `\n\n--- CONSIDERAZIONI CLINICHE DEL PROFESSIONISTA (RETRO-FEEDBACK) ---\n${clinicalNotes.trim()}\n--- FINE CONSIDERAZIONI ---\nTieni conto di queste considerazioni nell'analisi, integrandole nel referto.`
      : "";

    let systemPrompt: string;
    let userMessage: string;

    if (subTool === "sistemica") {
      if (!painPoints || !Array.isArray(painPoints) || painPoints.length === 0) {
        return new Response(
          JSON.stringify({ error: "Seleziona almeno un punto doloroso sul corpo." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      systemPrompt = MTC_SISTEMICA_PROMPT;
      const pointsList = painPoints.map((p: { region: string; description: string }, i: number) =>
        `${i + 1}. Regione: ${p.region} — Descrizione: ${p.description}`
      ).join("\n");
      userMessage = `Paziente: Sesso ${sex || "non specificato"}\n\nPunti dolorosi segnalati:\n${pointsList}${clinicalNotesSection}`;
    } else {
      if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return new Response(
          JSON.stringify({ error: "Seleziona almeno un sintomo." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      systemPrompt = MTC_ORGANICA_PROMPT;
      const symptomsList = symptoms.map((s: { category: string; name: string }) =>
        `- [${s.category}] ${s.name}`
      ).join("\n");
      userMessage = `Paziente: Sesso ${sex || "non specificato"}, Età ${age || "non specificata"}\n\nSintomi riportati:\n${symptomsList}${clinicalNotesSection}`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
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

    await serviceClient.from("ai_usage_log").insert({ user_id: userId, tool_name: toolName });

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mtc-diagnosis error:", e);
    return new Response(
      JSON.stringify({ error: "Si è verificato un errore interno. Riprova più tardi." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
