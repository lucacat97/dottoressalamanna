// Proposta automatica dei punti cefalometrici con un modello visivo generico.
// I punti sono una PROPOSTA da verificare: il professionista li corregge prima del calcolo definitivo.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EXAMPLES } from "./examples.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const KEYS = ["S", "N", "Ar", "Go", "Me", "A", "B", "OP1", "OP2"] as const;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PROMPT = `Sei un esperto di cefalometria. L'immagine è una teleradiografia latero-laterale del cranio.
Individua con la massima precisione possibile questi punti anatomici e restituisci le coordinate normalizzate su una griglia 0-1000 (x da sinistra, y dall'alto) dell'immagine intera:
- S (Sella): centro geometrico della sella turcica.
- N (Nasion): punto più anteriore della sutura fronto-nasale.
- Ar (Articulare): intersezione del margine posteriore del ramo mandibolare con il margine inferiore della base cranica.
- Go (Gonion): punto più inferiore e posteriore dell'angolo mandibolare.
- Me (Menton): punto più inferiore della sinfisi mentoniera.
- A (Punto A): punto più profondo della concavità anteriore del mascellare tra spina nasale anteriore e prosthion.
- B (Punto B): punto più profondo della concavità anteriore della sinfisi mandibolare.
- OP1: punto posteriore del piano occlusale funzionale (contatto dei primi molari).
- OP2: punto anteriore del piano occlusale funzionale (contatto premolari/incisivi).
Ragiona sulla posizione delle strutture prima di rispondere. Se un punto non è visibile, stima comunque la posizione più plausibile.`;

const PROMPT_A = `L'immagine è un ritaglio ingrandito di una teleradiografia latero-laterale centrato sulla regione del mascellare anteriore.
Individua con la massima precisione il Punto A (subspinale): il punto più profondo (più posteriore) della concavità anteriore del profilo osseo del mascellare, tra la spina nasale anteriore (ANS, in alto) e il prosthion (margine alveolare sopra gli incisivi superiori, in basso).
Segui il contorno osseo corticale anteriore, NON i tessuti molli del labbro e NON la radice dell'incisivo. Restituisci x,y normalizzati 0-1000 rispetto a QUESTO ritaglio.`;
const PROMPT_RULER = `L'immagine è una teleradiografia latero-laterale. Cerca un righello o una scala millimetrata radiopaca (di solito sul nasion-relator/cefalostato davanti al naso, o su un bordo dell'immagine).
Se è presente, scegli due tacche ben leggibili il più distanti possibile, C1 e C2, posizionandole esattamente al centro delle tacche, e indica la distanza reale in millimetri tra loro (contando le tacche/numeri). Coordinate normalizzate 0-1000 sull'immagine intera.
Se non c'è nessuna scala leggibile, imposta found=false.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Accesso richiesto" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "Sessione non valida" }, 401);

    const { image, mode = "full" } = await req.json();
    if (!["full", "refineA", "ruler"].includes(mode)) return json({ error: "Modalità non valida" }, 400);
    if (typeof image !== "string" || !/^data:image\/(png|jpeg|webp);base64,/.test(image) || image.length > 8_000_000)
      return json({ error: "Immagine non valida" }, 400);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY mancante");
    const pt = { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"], additionalProperties: false };
    const keys: readonly string[] = mode === "refineA" ? ["A"] : mode === "ruler" ? ["C1", "C2"] : KEYS;
    const properties: Record<string, unknown> = Object.fromEntries(keys.map(k => [k, pt]));
    const required: string[] = [...keys];
    if (mode === "ruler") { properties.found = { type: "boolean" }; properties.distance_mm = { type: "number" }; required.push("found", "distance_mm"); }
    const prompt = mode === "refineA" ? PROMPT_A : mode === "ruler" ? PROMPT_RULER : PROMPT;
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [{ role: "user", content: [
          { type: "text", text: prompt },
          ...(mode === "full" ? EXAMPLES.flatMap((ex, i) => [
            { type: "text", text: `ESEMPIO DI RIFERIMENTO ${i + 1}: teleradiografia marcata a mano da un ortodontista (le scritte rosse indicano i punti). Coordinate corrette 0-1000: ${JSON.stringify(ex.points)}. Usa questi esempi per capire dove si collocano esattamente i punti secondo la convenzione dello studio.` },
            { type: "image_url", image_url: { url: ex.image } },
          ]) : []),
          { type: "text", text: mode === "full" ? "ORA LA RADIOGRAFIA DA ANALIZZARE (senza marcature). Applica la stessa convenzione degli esempi:" : "Immagine:" },
          { type: "image_url", image_url: { url: image } },
        ] }],
        tools: [{ type: "function", function: { name: "landmarks", description: "Coordinate 0-1000 dei punti", parameters: { type: "object", properties, required, additionalProperties: false } } }],
        tool_choice: { type: "function", function: { name: "landmarks" } },
      }),
    });
    if (resp.status === 429) return json({ error: "Troppe richieste, riprova tra poco." }, 429);
    if (resp.status === 402) return json({ error: "Crediti AI esauriti." }, 402);
    if (!resp.ok) { console.error(resp.status, await resp.text()); throw new Error("Riconoscimento non riuscito"); }
    const data = await resp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const raw = JSON.parse(args ?? "{}");
    const points: Record<string, { x: number; y: number }> = {};
    if (mode === "ruler" && (!raw.found || !(raw.distance_mm > 0))) return json({ points: {}, distance_mm: null });
    for (const k of keys) {
      const p = raw[k];
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y))
        points[k] = { x: Math.min(1000, Math.max(0, p.x)) / 1000, y: Math.min(1000, Math.max(0, p.y)) / 1000 };
    }
    return json({ points, distance_mm: mode === "ruler" ? raw.distance_mm : undefined, model: "google/gemini-3.8-flash" });
  } catch (e) {
    console.error("[cephalometric-landmarks]", e);
    return json({ error: e instanceof Error ? e.message : "Errore" }, 500);
  }
});
