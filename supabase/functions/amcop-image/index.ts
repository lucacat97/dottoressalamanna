// Serve le foto dei dispositivi AMCOP dal bucket privato "amcop-assets"
// tramite redirect a signed URL breve. Usata dalle consulenze (markdown img)
// per mostrare la foto del dispositivo senza rendere pubblico il bucket.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PATHS: Record<string, string> = {
  tc: "tc.jpg",
  sc: "sc.jpg",
  integral: "integral.jpg",
  dcm: "integral.jpg",
  deep: "deep.jpg",
  open: "open.jpg",
  dtm: "dtm.jpg",
  "dcm-f": "dcm-f.jpg",
  "dcm-s": "dcm-s.jpg",
  "dcm-c": "dcm-c.jpg",
  "dcm-os": "dcm-os.jpg",
  logo: "logo.png",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const key = (new URL(req.url).searchParams.get("d") ?? "").toLowerCase();
  const path = PATHS[key];
  if (!path) {
    return new Response(JSON.stringify({ error: "Dispositivo sconosciuto." }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data, error } = await client.storage
    .from("amcop-assets")
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    return new Response(JSON.stringify({ error: "Immagine non disponibile." }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      Location: data.signedUrl,
      "Cache-Control": "public, max-age=3000",
    },
  });
});
