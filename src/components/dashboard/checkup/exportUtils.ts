import { SECTIONS, MODULE_NAME, type Question } from "./form-schema";

export interface CheckupRecord {
  id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_birth_date: string | null;
  patient_sex: string | null;
  exam_date: string;
  status: "draft" | "completed";
  form_data: Record<string, any>;
  notes_data: Record<string, string>;
  current_section?: string | null;
  updated_at: string;
}

const formatValue = (q: Question, v: any): string => {
  if (v === undefined || v === null || v === "") return "—";
  switch (q.type) {
    case "radio_si_no":
    case "radio":
      return String(v);
    case "multi_checkbox":
      return Array.isArray(v) && v.length > 0 ? v.join(", ") : "—";
    case "radio_scale_1_10":
      return `${v}/10`;
    case "numeric_kg":
      return `${v} Kg`;
    case "textarea":
      return String(v);
    case "dental_chart_fdi":
      return Array.isArray(v) && v.length > 0 ? `Denti: ${v.join(", ")}` : "—";
    case "body_map":
      return Array.isArray(v) && v.length > 0
        ? v.map((m: any) => `[${m.view} ${m.side.toUpperCase()} x:${Math.round(m.x)} y:${Math.round(m.y)}]`).join(", ")
        : "—";
    default:
      return String(v);
  }
};

/** Build a Q/A markdown text from the checkup data — also used as MILA input. */
export function buildQAMarkdown(rec: CheckupRecord): string {
  const lines: string[] = [];
  lines.push(`# ${MODULE_NAME}`);
  lines.push("");
  const fullName = `${rec.patient_first_name} ${rec.patient_last_name}`.trim() || "—";
  lines.push(`**Paziente:** ${fullName}`);
  if (rec.patient_birth_date) lines.push(`**Data nascita:** ${rec.patient_birth_date}`);
  if (rec.patient_sex) lines.push(`**Sesso:** ${rec.patient_sex}`);
  lines.push(`**Data esame:** ${rec.exam_date}`);
  lines.push("");

  for (const section of SECTIONS) {
    // Skip empty sections
    const answered = section.questions.some((q) => {
      const v = rec.form_data[q.id];
      const note = rec.notes_data[q.id];
      return (v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)) || (note && note.trim());
    });
    if (!answered) continue;

    lines.push(`## ${section.label}`);
    lines.push("");
    for (const q of section.questions) {
      const v = rec.form_data[q.id];
      const note = rec.notes_data[q.id];
      const hasV = v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
      if (!hasV && !(note && note.trim())) continue;
      lines.push(`**D:** ${q.label}`);
      lines.push(`**R:** ${formatValue(q, v)}`);
      if (note && note.trim()) lines.push(`**Note:** ${note.trim()}`);
      lines.push("");
    }
  }
  return lines.join("\n");
}

/** Build a printable HTML document for Q/A export. */
export function buildQAHtml(rec: CheckupRecord): string {
  const fullName = `${rec.patient_first_name} ${rec.patient_last_name}`.trim() || "—";
  let body = `
    <div style="border-bottom:2px solid #0f6e6e;padding-bottom:10px;margin-bottom:20px;">
      <h1 style="margin:0;color:#0f6e6e;font-family:Georgia,serif;">${MODULE_NAME}</h1>
      <table style="margin-top:10px;font-size:12px;">
        <tr><td style="padding:2px 12px 2px 0;color:#666;">Paziente:</td><td><strong>${fullName}</strong></td></tr>
        ${rec.patient_birth_date ? `<tr><td style="padding:2px 12px 2px 0;color:#666;">Data nascita:</td><td>${rec.patient_birth_date}</td></tr>` : ""}
        ${rec.patient_sex ? `<tr><td style="padding:2px 12px 2px 0;color:#666;">Sesso:</td><td>${rec.patient_sex}</td></tr>` : ""}
        <tr><td style="padding:2px 12px 2px 0;color:#666;">Data esame:</td><td>${rec.exam_date}</td></tr>
      </table>
    </div>
  `;
  for (const section of SECTIONS) {
    const answered = section.questions.some((q) => {
      const v = rec.form_data[q.id];
      const note = rec.notes_data[q.id];
      return (v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)) || (note && note.trim());
    });
    if (!answered) continue;
    body += `<h2 style="color:#0f6e6e;font-family:Georgia,serif;font-size:15px;margin:20px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px;">${section.label}</h2>`;
    body += `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px;">`;
    for (const q of section.questions) {
      const v = rec.form_data[q.id];
      const note = rec.notes_data[q.id];
      const hasV = v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
      if (!hasV && !(note && note.trim())) continue;
      body += `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:6px 8px;width:55%;vertical-align:top;color:#333;">${q.label}</td>
          <td style="padding:6px 8px;width:25%;vertical-align:top;font-weight:600;color:#0f6e6e;">${formatValue(q, v)}</td>
          <td style="padding:6px 8px;width:20%;vertical-align:top;font-style:italic;color:#666;">${note && note.trim() ? note.trim() : ""}</td>
        </tr>`;
    }
    body += `</table>`;
  }

  return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8">
    <title>${MODULE_NAME} - ${fullName}</title>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 30px; color: #222; }
      @media print { body { padding: 15px; } h2 { page-break-after: avoid; } table { page-break-inside: avoid; } }
    </style></head><body>${body}</body></html>`;
}

export const printQA = (rec: CheckupRecord) => {
  const html = buildQAHtml(rec);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
};

export const downloadQAJson = (rec: CheckupRecord) => {
  const blob = new Blob([JSON.stringify(rec, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `checkup-${rec.patient_last_name || "paziente"}-${rec.exam_date}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const MILA_IMPORT_KEY = "mila:imported-checkup";
