import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import metodologia from "./metodologia.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sei l'assistente clinico della Dott.ssa Lamanna Annarita, ortodontista, agopuntrice e nanotectherapist specializzata in approccio multidisciplinare ortodontico-posturale presso lo Studio Carella & Lamanna (Occlusione e Postura).

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

[Paragrafo discorsivo di sintesi del caso. Descrivi il quadro clinico generale, il tipo di sindrome posturale individuata (ascendente/discendente/mista) e la sua origine. Specifica se il dolore è di natura funzionale e meccanica vs strutturale. Usa un tono professionale ma empatico, come nel modello.]

# ANALISI CLINICA DETTAGLIATA

[Per ogni area clinica rilevante dai dati forniti, crea una sottosezione con titolo H1. Includi SOLO le sezioni per cui ci sono dati disponibili. Per ogni sezione scrivi 1-2 paragrafi discorsivi che interpretano i dati clinicamente, non limitarti a elencarli.]

# Articolazione Temporo-Mandibolare (ATM)
[Se presenti dati ATM: descrizione dei reperti e interpretazione clinica]

# Palpazione Muscolare
[Se presenti dati muscolari: pattern muscolare e significato clinico]

# Esame Posturale
[Se presenti dati posturali: asimmetrie, test, correlazioni. Evidenzia test chiave come effetto della lingua sulla dismetria]

# Funzione Linguale e Deglutizione
[Se presenti dati linguali/deglutitori: postura linguale, frenulo, impatto su sonno e postura]

# Sistema Oculomotore
[Se presenti dati oculomotori: convergenza, compensi]

# Valutazione Cefalometrica
[Se presenti dati cefalometrici: classe scheletrica, pattern di crescita, posizione ioide]

# PERCHÉ QUESTA TERAPIA È NECESSARIA

> **⚠ Nota importante**
> [Breve nota che spiega perché il problema non è isolato ma sistemico e richiede intervento mirato]

# 1. RIEDUCAZIONE MIOFUNZIONALE — PRIORITÀ ASSOLUTA

[Spiega perché è il cardine del percorso. Elenca con bullet points le ragioni specifiche per il paziente e gli obiettivi specifici.]

# 2. TERAPIA ELASTODONTICA

[Se pertinente: spiega il ruolo dell'apparecchio come supporto strutturale alla rieducazione miofunzionale]

# 3. FOTOBIOMODULAZIONE

[Se pertinente: indicazioni specifiche per il paziente, tabella con aree di applicazione]

# OBIETTIVI TERAPEUTICI

[Elenco puntato degli obiettivi terapeutici specifici per il paziente]

# DURATA E MODALITÀ DEL PERCORSO

[Stima durata, frequenza visite, cosa si farà ad ogni visita]

# COINVOLGIMENTO DI ALTRE FIGURE PROFESSIONALI

[Quali professionisti coinvolgere e perché, basato sul tipo di sindrome]

# CURE DENTALI ASSOCIATE

[Se emergono necessità dentali dai dati]

# MESSAGGIO PER IL PAZIENTE

> [Messaggio empatico e motivazionale diretto al paziente, che spiega in modo comprensibile la situazione e il percorso. Tono rassicurante ma onesto. Evidenzia i segnali positivi emersi dai test.]

---

Dott.ssa Lamanna Annarita

Odontoiatra — Ortodontista — Agopuntrice — Nanotectherapist

Studio Carella & Lamanna — Studio Dentistico Multidisciplinare, Occlusione e Postura

Data: ___________________________                  Firma: ___________________________

---

⚠️ *Questo referto è stato generato con il supporto di intelligenza artificiale come strumento di analisi clinica. La responsabilità diagnostica e terapeutica resta interamente in capo al professionista sanitario.*

REGOLE IMPORTANTI:
- Ometti le sezioni per cui non ci sono dati sufficienti, ma mantieni la struttura generale
- Usa tabelle markdown dove appropriato (come nel modello) per dati anagrafici e indicazioni terapeutiche
- Scrivi in modo discorsivo e interpretativo, non come semplice elenco di dati
- Il tono deve essere professionale ma comprensibile: il paziente potrebbe leggere questo referto
- Ogni affermazione deve essere supportata dai dati forniti
- Non inventare dati non presenti nel documento`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText } = await req.json();

    if (!documentText || typeof documentText !== "string" || documentText.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Testo del documento troppo breve o mancante." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analizza il seguente documento clinico e genera un REFERTO CLINICO COMPLETO nel formato professionale dello Studio Carella & Lamanna, secondo la metodologia della Dott.ssa Lamanna:\n\n---\n${documentText}\n---`,
          },
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("diagnosis-support error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
