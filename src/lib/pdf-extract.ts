import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { supabase } from "@/integrations/supabase/client";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Estrae testo da un PDF.
 * 1) Prova estrazione nativa con pdf.js
 * 2) Se il testo è insufficiente (PDF scansionato/immagine), fa fallback OCR via Lovable AI Vision
 */
export async function extractPdfTextWithFallback(pdfFile: File): Promise<string> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  let nativeText = "";
  let pdf: any = null;
  try {
    pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      nativeText += pageText + "\n\n";
    }
  } catch (err) {
    console.warn("[pdf-extract] native parsing failed, will try OCR", err);
  }

  // Quality check: enough text and enough actual letters
  const letters = (nativeText.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
  const looksGood = nativeText.trim().length >= 200 && letters >= 80;
  if (looksGood) return nativeText;

  // ---------- OCR fallback ----------
  console.info("[pdf-extract] poor native extraction, using OCR fallback");
  if (!pdf) {
    pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
  }

  const images: string[] = [];
  const maxPages = Math.min(pdf.numPages, 15);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    images.push(canvas.toDataURL("image/jpeg", 0.85));
  }

  if (images.length === 0) {
    throw new Error("Impossibile renderizzare le pagine del PDF");
  }

  const { data, error } = await supabase.functions.invoke("pdf-ocr", {
    body: { images },
  });
  if (error) throw error;
  const ocrText = (data?.text ?? "").trim();
  if (!ocrText) throw new Error("OCR non ha restituito testo");

  // Combine native (if any) + OCR for safety
  return nativeText.trim().length > 0 ? `${nativeText}\n\n${ocrText}` : ocrText;
}
