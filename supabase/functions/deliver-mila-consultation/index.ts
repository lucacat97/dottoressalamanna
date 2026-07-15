import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Markdown → HTML (allineato al sito) ──
function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tbl: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tbl.push(lines[i]); i++;
      }
      if (tbl.length >= 2) {
        let h = '<table style="width:100%;border-collapse:collapse;margin:16px 0;page-break-inside:avoid;">';
        let first = true;
        for (const tl of tbl) {
          const cells = tl.split("|").slice(1, -1);
          if (cells.every((c) => /^[\s:-]+$/.test(c.trim()))) continue;
          const tag = first ? "th" : "td";
          const bg = first ? "background:#f0f7f7;font-weight:600;" : "";
          h += `<tr>${cells.map((c) => `<${tag} style="padding:10px 14px;border:1px solid #ddd;text-align:left;${bg}">${c.replace(/\*\*/g, "").trim()}</${tag}>`).join("")}</tr>`;
          first = false;
        }
        h += "</table>";
        out.push(h);
      }
      continue;
    }
    out.push(line); i++;
  }
  let html = out.join("\n");
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote style="border-left:4px solid #f0b400;padding:12px 16px;margin:14px 0;background:#fff8e1;color:#5b4708;border-radius:6px;">$1</blockquote>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 style="font-size:14px;color:#333;margin:16px 0 8px;">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 style="font-size:15px;color:#333;margin:20px 0 8px;">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 style="font-size:17px;color:#2a6f6f;margin:24px 0 10px;font-family:Georgia,serif;">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 style="font-size:20px;color:#2a6f6f;margin:28px 0 12px;font-family:Georgia,serif;border-bottom:1px solid #eee;padding-bottom:8px;page-break-after:avoid;">$1</h1>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li style="margin:4px 0;">$1</li>');
  html = html.replace(/((<li[^>]*>.*<\/li>\n?)+)/g, '<ul style="margin:8px 0 8px 20px;padding:0;">$1</ul>');
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin:4px 0;">$1</li>');
  html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">');
  html = html.split("\n").map((l) => {
    const t = l.trim();
    if (!t) return "";
    if (t.startsWith("<")) return l;
    return `<p style="margin:8px 0;line-height:1.6;">${t}</p>`;
  }).join("\n");
  return html;
}

function extractIntroduction(md: string): string {
  const noDisclaimer = md.replace(/^>\s*\*\*Disclaimer:.*?(?=\n\n|\n#|$)/s, "").trim();
  const introMatch = noDisclaimer.match(/##?\s*Introduzione[^\n]*\n([\s\S]*?)(?=\n##?\s|\n#\s|$)/i);
  if (introMatch && introMatch[1].trim().length > 40) return introMatch[1].trim();
  const paragraphs = noDisclaimer.split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("#") && !p.startsWith(">"))
    .slice(0, 2);
  return paragraphs.join("\n\n") || "La consulenza completa è disponibile nel documento allegato.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // ── Auth: prende l'utente dal JWT ──
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userEmail = userData.user.email;
    const userMeta = (userData.user.user_metadata ?? {}) as Record<string, string>;
    const firstName = userMeta.first_name || userMeta.given_name || userMeta.name || "";
    const lastName = userMeta.last_name || userMeta.family_name || "";

    // ── Body ──
    const body = await req.json();
    const { markdown, consultationType } = body as { markdown?: string; consultationType?: string };
    if (!markdown || typeof markdown !== "string" || markdown.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Campo 'markdown' obbligatorio." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const type = (consultationType && typeof consultationType === "string") ? consultationType : "Consulenza sul caso";

    // ── HTML + Word ──
    const bodyHtml = mdToHtml(markdown);
    const introHtml = mdToHtml(extractIntroduction(markdown));
    const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${type}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: 'Calibri', Arial, sans-serif; font-size: 11pt; color: #222; line-height: 1.5; }
  h1 { color: #2a6f6f; font-family: Georgia, serif; font-size: 18pt; }
  h2 { color: #2a6f6f; font-family: Georgia, serif; font-size: 14pt; }
  h3 { color: #333; font-size: 12pt; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
  th { background: #f0f7f7; }
  blockquote { border-left: 4px solid #f0b400; padding: 10px 14px; margin: 12px 0; background: #fff8e1; }
  strong { color: #2a6f6f; }
</style></head><body>${bodyHtml}</body></html>`;

    // ── Upload ──
    const safeType = type.replace(/[^\w\-]+/g, "_");
    const fileName = `consulenza_${safeType}_${new Date().toISOString().slice(0, 10)}_${crypto.randomUUID().slice(0, 8)}.doc`;
    const filePath = `${userData.user.id}/${fileName}`;
    const { error: upErr } = await admin.storage
      .from("consultation-attachments")
      .upload(filePath, new Blob([wordHtml], { type: "application/msword" }), {
        contentType: "application/msword",
        upsert: false,
      });
    if (upErr) throw new Error(`storage upload: ${upErr.message}`);

    // ── Token ──
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const dlToken = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const { error: tokErr } = await admin.from("consultation_downloads").insert({
      token: dlToken,
      file_path: filePath,
      file_name: fileName,
      recipient_email: userEmail,
      api_key_id: null,
      consultation_type: type,
      max_downloads: 5,
      expires_at: expiresAt,
    });
    if (tokErr) throw new Error(`token insert: ${tokErr.message}`);

    const downloadUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/download-consultation?token=${dlToken}`;

    // ── Email via send-transactional-email ──
    const sendResp = await fetch(`${supabaseUrl.replace(/\/$/, "")}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({
        templateName: "consultation-delivery",
        recipientEmail: userEmail,
        idempotencyKey: `mila-${userData.user.id}-${crypto.randomUUID()}`,
        templateData: {
          professionalFirstName: firstName,
          professionalLastName: lastName,
          consultationType: type,
          introHtml,
          downloadUrl,
        },
      }),
    });
    if (!sendResp.ok) {
      const errText = await sendResp.text().catch(() => "");
      throw new Error(`send-transactional-email HTTP ${sendResp.status}: ${errText.slice(0, 200)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      recipient: userEmail,
      consultation_type: type,
      download_url: downloadUrl,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = (e as Error)?.message || String(e);
    console.error("[deliver-mila-consultation] error:", msg);
    return new Response(JSON.stringify({ error: "Invio email fallito", detail: msg.slice(0, 300) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
