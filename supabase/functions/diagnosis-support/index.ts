import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sei un assistente medico AI specializzato in neuropsicologia clinica. Il tuo compito è fornire un SUPPORTO alla diagnosi analizzando documenti clinici caricati dal professionista.

ISTRUZIONI:
- Analizza il documento fornito (referti, test neuropsicologici, anamnesi, valutazioni cliniche).
- Identifica i pattern rilevanti, le aree cognitive coinvolte e le possibili ipotesi diagnostiche.
- Fornisci un'analisi strutturata con: sintesi del caso, aree di attenzione, possibili ipotesi diagnostiche differenziali, suggerimenti per approfondimenti.
- Usa un linguaggio tecnico-professionale adatto a un clinico.
- NON formulare MAI una diagnosi definitiva. Fornisci solo supporto e spunti di riflessione.
- Rispondi SEMPRE in italiano.

FORMATO RISPOSTA:
## 📋 Sintesi del Caso
[Riassunto dei dati principali]

## 🔍 Aree di Attenzione
[Elementi clinici significativi individuati]

## 🧠 Ipotesi Diagnostiche Differenziali
[Possibili inquadramenti diagnostici da considerare, con breve motivazione]

## 📌 Suggerimenti per Approfondimenti
[Test aggiuntivi, valutazioni o esami consigliati]

## ⚠️ Note
[Eventuali limiti dell'analisi o elementi che richiedono cautela interpretativa]`;

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
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analizza il seguente documento clinico e fornisci un supporto alla diagnosi:\n\n---\n${documentText}\n---`,
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
