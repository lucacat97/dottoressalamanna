import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function htmlPage(title: string, message: string, status: number) {
  return new Response(
    `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background:#f7faf9; color:#222; margin:0; padding:40px 20px; min-height:100vh; box-sizing:border-box; }
  .card { max-width: 520px; margin: 60px auto; background:#fff; border:1px solid #d9e6e4; border-radius:10px; padding:32px; box-shadow:0 4px 16px rgba(0,0,0,0.04); }
  h1 { color:#2a6f6f; font-family: Georgia, serif; margin:0 0 16px; font-size: 22px; }
  p { line-height:1.6; font-size:15px; color:#333; }
  .small { color:#666; font-size:13px; margin-top:24px; }
</style></head><body>
<div class="card"><h1>${title}</h1><p>${message}</p>
<p class="small">Studio Carella & Lamanna — Metodo MILA</p></div>
</body></html>`,
    { status, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token || token.length < 16) {
      return htmlPage("Link non valido", "Il link di download non è valido o è incompleto.", 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: record, error } = await supabase
      .from("consultation_downloads")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (error || !record) {
      return htmlPage("Link non valido", "Questo link non esiste o è stato revocato.", 404);
    }

    const now = new Date();
    if (new Date(record.expires_at) < now) {
      return htmlPage(
        "Link scaduto",
        "Questo link è scaduto (validità: 5 giorni dall'invio della consulenza). Per ricevere nuovamente la consulenza, contatti lo Studio."
      , 410);
    }

    if (record.download_count >= record.max_downloads) {
      return htmlPage(
        "Limite raggiunto",
        `Questo link ha esaurito i download disponibili (${record.max_downloads} totali). Per ricevere nuovamente la consulenza, contatti lo Studio.`,
        429
      );
    }

    // Scarica il file dallo storage privato
    const { data: file, error: fileError } = await supabase.storage
      .from("consultation-attachments")
      .download(record.file_path);

    if (fileError || !file) {
      console.error("[download-consultation] storage error:", fileError);
      return htmlPage(
        "File non disponibile",
        "Si è verificato un problema nel recupero del file. La preghiamo di riprovare tra qualche istante o contattare lo Studio.",
        500
      );
    }

    // Incrementa contatore (best-effort, non bloccante)
    await supabase
      .from("consultation_downloads")
      .update({
        download_count: record.download_count + 1,
        last_downloaded_at: now.toISOString(),
      })
      .eq("id", record.id);

    const safeName = (record.file_name || "consulenza.doc").replace(/[^a-zA-Z0-9._-]+/g, "_");
    const isPdf = safeName.toLowerCase().endsWith(".pdf");
    const arrayBuffer = await file.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": isPdf ? "application/pdf" : "application/msword",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error("[download-consultation] error:", e);
    return htmlPage("Errore", "Si è verificato un errore interno. Riprova più tardi.", 500);
  }
});
