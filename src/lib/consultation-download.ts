import { supabase } from "@/integrations/supabase/client";

/**
 * Scarica la consulenza come documento generato lato server con lo stesso
 * template dell'API (Word .docx / PDF). Richiede una sessione attiva.
 */
export async function downloadConsultationDocument(opts: {
  markdown: string;
  patientName?: string;
  tool: "orthodontic" | "diagnosis";
  format: "docx" | "pdf";
  filename: string;
}): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessione scaduta. Effettua nuovamente il login.");
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/consultation-document`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      markdown: opts.markdown,
      patientName: opts.patientName,
      tool: opts.tool,
      format: opts.format,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || "Errore nella generazione del documento. Riprova.");
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  const objUrl = URL.createObjectURL(blob);
  a.href = objUrl;
  a.download = `${opts.filename}.${opts.format}`;
  a.click();
  URL.revokeObjectURL(objUrl);
}
