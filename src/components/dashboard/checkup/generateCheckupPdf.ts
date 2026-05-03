import { CHECKUP_SECTIONS } from "./checkupSchema";
import { getBranding } from "../BrandingSettings";

interface Payload {
  first: string;
  last: string;
  date: string;
  data: Record<string, any>;
}

const escape = (s: any): string => {
  if (s === null || s === undefined || s === "") return "—";
  const str = Array.isArray(s) ? s.join("; ") : String(s);
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString("it-IT"); } catch { return iso; }
};

export function generateCheckupPdf(p: Payload) {
  const branding = getBranding();
  const notes: Record<string, string> = (p.data?._notes as any) || {};
  const birthDate: string | undefined = p.data?._birth_date;
  const consentDate = p.data?._gdpr_consent_date ? new Date(p.data._gdpr_consent_date).toLocaleString("it-IT") : null;

  const sectionsHtml = CHECKUP_SECTIONS.map((s) => {
    const rows = s.questions
      .map((q) => {
        const v = p.data?.[q.key];
        if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) return "";
        return `<tr>
          <td style="padding:4px 10px 4px 0;vertical-align:top;width:62%;">${escape(q.label)}</td>
          <td style="padding:4px 0;vertical-align:top;font-weight:600;">${escape(v)}</td>
        </tr>`;
      })
      .filter(Boolean)
      .join("");
    const note = notes[s.id]?.trim();
    if (!rows && !note) return "";
    return `
      <section style="margin:14px 0;page-break-inside:avoid;">
        <h3 style="font-size:12px;color:#2a6f6f;border-bottom:1px solid #2a6f6f;padding-bottom:4px;margin:0 0 8px;font-family:Georgia,serif;text-transform:uppercase;letter-spacing:.5px;">${escape(s.title)}</h3>
        ${rows ? `<table style="width:100%;border-collapse:collapse;font-size:11px;">${rows}</table>` : ""}
        ${note ? `<div style="margin-top:6px;padding:8px 10px;background:#f6f1e6;border-left:3px solid #c9a64a;font-size:11px;font-style:italic;"><strong>Note:</strong> ${escape(note).replace(/\n/g, "<br>")}</div>` : ""}
      </section>
    `;
  }).join("");

  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8">
<title>Check-up Ortodontico Posturale — ${escape(p.last)} ${escape(p.first)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #222; margin: 0; }
  .header { border-bottom: 2px solid #2a6f6f; padding-bottom: 10px; margin-bottom: 14px; }
  .studio { font-family: Georgia, serif; color: #2a6f6f; font-size: 16px; margin: 0; }
  .sub { color: #555; font-size: 10px; margin: 2px 0 0; }
  .title { font-family: Georgia, serif; font-size: 14px; margin: 14px 0 4px; color: #1f4f4f; }
  .patient { background: #f4ece0; padding: 10px 12px; border-radius: 4px; font-size: 11px; margin: 6px 0 16px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
  .patient strong { color: #2a6f6f; }
  .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 9px; color: #777; text-align: center; font-family: Georgia, serif; }
  .gdpr { margin-top: 12px; padding: 8px 10px; border: 1px dashed #c9a64a; background: #fdf8ec; font-size: 9.5px; color: #5b4708; }
  @media print { .noprint { display:none; } }
  .noprint { position: fixed; top: 8px; right: 8px; }
  .noprint button { background:#2a6f6f; color:#fff; border:none; padding:8px 14px; border-radius:4px; font-size:12px; cursor:pointer; }
</style></head><body>
<div class="noprint"><button onclick="window.print()">Stampa / Salva PDF</button></div>
<div class="header">
  <h1 class="studio">${escape(branding.studioName || "Studio")}</h1>
  ${branding.subtitle ? `<p class="sub">${escape(branding.subtitle)}</p>` : ""}
</div>
<h2 class="title">Visita Check-up Ortodontico Posturale del ${formatDate(p.date)}</h2>
<div class="patient">
  <span><strong>Paziente:</strong> ${escape(p.last)} ${escape(p.first)}</span>
  ${birthDate ? `<span><strong>Data di nascita:</strong> ${formatDate(birthDate)}</span>` : ""}
  <span><strong>Data esame:</strong> ${formatDate(p.date)}</span>
</div>
${sectionsHtml || `<p style="color:#888;font-style:italic;">Nessun dato compilato.</p>`}
<div class="gdpr">
  <strong>Privacy &amp; GDPR.</strong> Documento ad uso clinico riservato. Dati trattati secondo Reg. UE 2016/679 (GDPR), conservati in forma cifrata e accessibili al solo professionista. ${consentDate ? `Consenso del paziente acquisito il ${escape(consentDate)}.` : "Consenso del paziente da archiviare separatamente."}
</div>
<div class="footer">${escape(branding.footerText || branding.studioName || "")}</div>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 400));</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) {
    alert("Abilita i popup per generare il referto PDF.");
    return;
  }
  w.document.write(html);
  w.document.close();
}
