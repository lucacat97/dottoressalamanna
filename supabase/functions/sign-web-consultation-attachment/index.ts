// Uploads a web consultation attachment (public form, no JWT) into the
// consultation-attachments bucket under web/ and returns a 30-day signed URL.
// Clients cannot write to storage directly: type, size and path are validated here.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = /^(image\/(png|jpe?g|webp|heic|heif)|application\/pdf)$/i;
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "file missing" }, 400);
    if (!ALLOWED.test(file.type)) return json({ error: "unsupported type" }, 400);
    if (file.size === 0 || file.size > MAX_SIZE) return json({ error: "invalid size" }, 400);
    const safeName = (file.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const path = `web/${Date.now()}-${crypto.randomUUID().slice(0, 8)}/${safeName}`;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: upErr } = await supabase.storage
      .from("consultation-attachments")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) return json({ error: "upload failed" }, 500);
    const { data, error } = await supabase.storage
      .from("consultation-attachments")
      .createSignedUrl(path, 60 * 60 * 24 * 30);
    if (error || !data?.signedUrl) return json({ error: "sign failed" }, 500);
    return json({ signedUrl: data.signedUrl });
  } catch (_e) {
    return json({ error: "server error" }, 500);
  }
});
