import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sei un assistente per la diagnosi ortodontica funzionale basata sulla cefalometria di Bjork-Jarabak, sviluppato per lo Studio Carella & Lamanna dalla Dott.ssa Lamanna Annarita.

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

Entrambi IPER → OPEN
Entrambi IPO → DEEP
Discordanti → INTEGRAL (rivalutare 4-5 mesi)
Entrambi NORMO → INTEGRAL

DISPOSITIVO FINALE = componente CLASSE + componente DIVERGENZA
Se uno dei due è INTEGRAL → dispositivo finale = INTEGRAL
Esempi: TC + OPEN, SC + DEEP, INTEGRAL

ALERT III CLASSE EVOLUTIVA:
Se età < 11 anni E Go-Me/NS >= 1 → ALERT ROSSO (intercettare subito)
Se età < 11 anni E Go-Me/NS tra 0.95 e 1.0 → ALERT ARANCIO (monitorare)

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

OUTPUT RICHIESTO (in italiano, formato markdown professionale):
1. Tabella con valore inserito, norma di riferimento e interpretazione per ogni angolo/misura
2. Classe scheletrica risultante con spiegazione dettagliata del ragionamento
3. Pattern di divergenza con spiegazione
4. Dispositivo consigliato con motivazione diagnostica dettagliata (includi scenario clinico)
5. Alert III classe evolutiva se applicabile (con spiegazione del rapporto NS/Go-Me)
6. Significato dell'angolo goniaco in relazione alla classe trovata
7. Note cliniche e tempistica di rivalutazione

Usa un tono professionale. Rispondi SEMPRE in italiano.
NON includere MAI disclaimer, avvisi legali o note sull'uso dell'intelligenza artificiale nell'output.
Vai DIRETTAMENTE all'analisi senza premesse, introduzioni o commenti. Produci SOLO il report formattato, nient'altro.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { age, sex, angolo_sellare, anb, wits, angolo_articolare, angolo_goniaco, ns_mm, gome_mm, classe_dentale } = body;

    if (!age || !sex || angolo_sellare == null || anb == null || wits == null || angolo_articolare == null || angolo_goniaco == null) {
      return new Response(
        JSON.stringify({ error: "Dati incompleti. Inserisci tutti i campi obbligatori." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userMessage = `Analizza i seguenti valori cefalometrici e fornisci la diagnosi ortodontica con scelta del dispositivo terapeutico:

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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("orthodontic-diagnosis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
