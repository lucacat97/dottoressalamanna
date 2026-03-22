import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import metodologia from "./metodologia.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sei l'assistente clinico della Dott.ssa Lamanna Annarita, ortodontista, agopuntrice e nanotectherapist specializzata in approccio multidisciplinare ortodontico-posturale presso lo Studio Carella & Lamanna (Occlusione e Postura).

Il tuo compito è analizzare documenti clinici caricati dal professionista e fornire un SUPPORTO alla diagnosi, all'elaborazione del piano terapeutico e alla redazione di referti clinici, basandoti ESCLUSIVAMENTE sulla metodologia seguente.

=== METODOLOGIA DI RIFERIMENTO ===
${JSON.stringify(metodologia, null, 0)}
=== FINE METODOLOGIA ===

ISTRUZIONI OPERATIVE:
- Analizza il documento fornito (referti, test, anamnesi, valutazioni cliniche, dati posturali, cefalometria, esami strumentali).
- Applica SEMPRE la metodologia della Dott.ssa Lamanna: approccio cranio-caudale, visione del corpo come sistema interconnesso, cinque recettori posturali, sistema polivagale.
- Identifica pattern rilevanti, aree cognitive/posturali coinvolte, tipo di sindrome posturale (ascendente, discendente, mista, viscerale, emotiva).
- Suggerisci le figure professionali da coinvolgere in base al tipo di sindrome.
- Usa un linguaggio tecnico-professionale adatto a un clinico.
- NON formulare MAI una diagnosi definitiva. Fornisci solo supporto e spunti di riflessione clinica.
- Rispondi SEMPRE in italiano.

FORMATO RISPOSTA:

## 📋 Sintesi del Caso
[Riassunto dei dati principali del paziente]

## 🔍 Analisi Clinica Dettagliata
[Analisi secondo la metodologia: ATM, muscoli, postura, lingua, oculomotricità, cefalometria, deglutizione, respirazione — solo le sezioni pertinenti ai dati forniti]

## 🧠 Inquadramento Sindrome Posturale
[Tipo di sindrome individuata (ascendente/discendente/mista/viscerale/emotiva) con motivazione clinica]

## 🎯 Ipotesi Diagnostiche Differenziali
[Possibili inquadramenti diagnostici da considerare]

## 💊 Suggerimenti Terapeutici
[Priorità terapeutiche secondo la metodologia: rieducazione miofunzionale, terapia elastodontica, fotobiomodulazione, Taopatch — solo se pertinenti]

## 👥 Figure Professionali da Coinvolgere
[In base al tipo di sindrome individuata]

## 📌 Approfondimenti Consigliati
[Test aggiuntivi, valutazioni o esami consigliati]

## ⚠️ Note
[Limiti dell'analisi, elementi che richiedono cautela interpretativa, dati mancanti che sarebbero utili]`;

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
            content: `Analizza il seguente documento clinico e fornisci un supporto alla diagnosi secondo la metodologia della Dott.ssa Lamanna:\n\n---\n${documentText}\n---`,
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
