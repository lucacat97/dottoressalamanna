import { AMCOP_DEVICES, AMCOP_DCM_VARIANTS, AMCOP_STORAGE_BUCKET, AMCOP_LOGO_STORAGE_PATH, applyAmcopTemplate } from "../_shared/amcop.ts";
import { buildRetrievedCephalometry, type CephalometryInput } from "../_shared/amcop-retrieval.ts";
import { buildAmcopPdf, PDF_MIME } from "../_shared/amcop-pdf.ts";
import { buildAmcopDocx } from "../_shared/amcop-docx.ts";
import { DOCX_MIME } from "../_shared/docx-generator.ts";

export async function retrievalResponse(input: CephalometryInput, readAsset: (path: string) => Promise<Uint8Array | null>) {
  const generated = buildRetrievedCephalometry(input);
  const amcop = applyAmcopTemplate(generated.markdown, input.age);
  const gallery = [...(["DEEP", "OPEN", "SC", "TC", "DTM"] as const).map(k =>
    ({ label: k, storagePath: AMCOP_DEVICES[k].storagePath })), ...AMCOP_DCM_VARIANTS];
  const [logo, deviceImage, ...rangeImages] = await Promise.all([
    readAsset(AMCOP_LOGO_STORAGE_PATH),
    amcop.device.key === "INTEGRAL" ? Promise.resolve(null) : readAsset(amcop.device.storagePath),
    ...gallery.map(d => readAsset(d.storagePath)),
  ]);
  const data = { patientName: "Caso senza identificativi", date: new Date().toLocaleDateString("it-IT"),
    logo, deviceImage, deviceImageAlt: amcop.device.name, rangeImages, rangeLabels: gallery.map(d => d.label) };
  const [pdf, docx] = await Promise.all([
    buildAmcopPdf(amcop.markdown, data),
    buildAmcopDocx(amcop.markdown, { ...data, rangeCaption: "GAMMA AMCOP — forme DCM da definire dopo scansione" }),
  ]);
  if (!pdf) throw new Error("Generazione PDF non riuscita");
  const encode = (bytes: Uint8Array) => {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  };
  return {
    success: true, tool: "orthodontic", consultation_type: "Consulenza Cefalometrica", engine: generated.engine,
    ai_used: false, clinical_storage: false, markdown: amcop.markdown, decision: generated.result,
    sources: generated.passages.map(({ text: _text, ...source }) => source),
    documents: {
      pdf: { filename: "consulenza_cefalometrica.pdf", mime_type: PDF_MIME, base64: encode(pdf) },
      docx: { filename: "consulenza_cefalometrica.docx", mime_type: DOCX_MIME, base64: encode(docx) },
    },
    email_delivery: { sent: false, reason: "Consegna diretta, senza archiviazione clinica o invio email dal server MILA." },
  };
}

export { AMCOP_STORAGE_BUCKET };