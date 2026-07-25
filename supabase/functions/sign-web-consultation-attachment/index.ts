// Signs a short-lived URL for a freshly uploaded web/ consultation attachment.
// Public (no JWT) — path must start with "web/" and be an existing object in the
// consultation-attachments bucket. Signed URLs are limited to 30 days.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { path } = await req.json();
    if (typeof path !== "string" || !path.startsWith("web/") || path.includes("..")) {
      return new Response(JSON.stringify({ error: "invalid path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase.storage
      .from("consultation-attachments")
      .createSignedUrl(path, 60 * 60 * 24 * 30);
    if (error || !data?.signedUrl) {
      return new Response(JSON.stringify({ error: error?.message ?? "sign failed" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
