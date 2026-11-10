// Proposta automatica dei punti cefalometrici con un modello visivo generico.
// I punti sono una PROPOSTA da verificare: il professionista li corregge prima del calcolo definitivo.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Accesso richiesto" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "Sessione non valida" }, 401);

    const { image } = await req.json();
    if (typeof image !== "string" || !/^data:image\/(png|jpeg|webp);base64,/.test(image) || image.length > 8_000_000)
      return json({ error: "Immagine non valida" }, 400);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY mancante");
    const properties = Object.fromEntries(KEYS.map(k => [k, {
      type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"], additionalProperties: false,
    }]));
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: image } }] }],
        tools: [{ type: "function", function: { name: "landmarks", description: "Coordinate 0-1000 dei punti", parameters: { type: "object", properties, required: [...KEYS], additionalProperties: false } } }],
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
    for (const k of KEYS) {
      const p = raw[k];
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y))
        points[k] = { x: Math.min(1000, Math.max(0, p.x)) / 1000, y: Math.min(1000, Math.max(0, p.y)) / 1000 };
    }
    return json({ points, model: "google/gemini-2.5-pro" });
  } catch (e) {
    console.error("[cephalometric-landmarks]", e);
    return json({ error: e instanceof Error ? e.message : "Errore" }, 500);
  }
});
