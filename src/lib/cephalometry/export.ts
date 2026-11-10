import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { SEGMENTS, MEASURE_LABELS, calculateMeasures, formattedMeasure, type Points } from "./geometry";
import { downloadBlob, type Analysis } from "./analysis";

export async function traceCanvas(image: string, points: Points) {
  const img = new Image(); img.src = image; await img.decode();
  const canvas = document.createElement("canvas"); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossibile creare il tracciato");
  ctx.drawImage(img, 0, 0);
  const theme = getComputedStyle(document.documentElement);
  ctx.strokeStyle = `hsl(${theme.getPropertyValue("--gold-warm").trim()})`;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = Math.max(2, canvas.width / 400);
  for (const [a, b] of SEGMENTS) {
    const pa = points[a], pb = points[b]; if (!pa || !pb) continue;
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
  }
  ctx.font = `bold ${Math.max(16, canvas.width / 50)}px sans-serif`;
  for (const [key, p] of Object.entries(points)) {
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(4, canvas.width / 180), 0, 2 * Math.PI); ctx.fill();
    ctx.fillText(key, p.x + canvas.width / 100, p.y - canvas.width / 100);
  }
  return canvas;
}
export async function exportTrace(analysis: Analysis, format: "png" | "pdf") {
  const canvas = await traceCanvas(analysis.image, analysis.points);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Immagine non disponibile")), "image/png"));
  if (format === "png") { downloadBlob(blob, "MILA_tracciato.png"); return; }
  const doc = await PDFDocument.create(), font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText("MILA - Tracciato cefalometrico", { x: 30, y: 810, size: 18, font });
  page.drawText(`Eta: ${analysis.age || "non indicata"} | Sesso: ${analysis.sex} | Tracciato manuale sperimentale`, { x: 30, y: 788, size: 10, font });
  const img = await doc.embedPng(await blob.arrayBuffer());
  const factor = Math.min(535 / img.width, 540 / img.height);
  page.drawImage(img, { x: 30, y: 235, width: img.width * factor, height: img.height * factor });
  const measures = calculateMeasures(analysis.points, analysis.calibration);
  let y = 210;
  for (const [key, label] of Object.entries(MEASURE_LABELS)) {
    const value = measures[key as keyof typeof MEASURE_LABELS];
    page.drawText(`${label.replace(/[−–]/g, "-")} : ${formattedMeasure(key, value).replace("—", "non disponibile")}`, { x: 30, y, size: 11, font }); y -= 20;
  }
  page.drawText("Verifica del professionista necessaria. Non costituisce diagnosi medica.", { x: 30, y: 45, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
  const bytes = await doc.save({ useObjectStreams: false });
  downloadBlob(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), "MILA_tracciato.pdf");
}