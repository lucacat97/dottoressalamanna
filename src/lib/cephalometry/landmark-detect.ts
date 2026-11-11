import { INPUT_SIZE, toAnalysisPoints } from "./landmark-model";
import type { Points } from "./geometry";

let worker: Worker | null = null;

/** Propone i punti con il modello dedicato eseguito localmente (Web Worker, nessun invio dell'immagine). */
export async function detectLandmarks(image: string, width: number, height: number): Promise<Points> {
  const img = new Image(); img.src = image; await img.decode();
  const canvas = document.createElement("canvas"); canvas.width = INPUT_SIZE; canvas.height = INPUT_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Immagine non leggibile");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, INPUT_SIZE, INPUT_SIZE);
  const rgba = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;
  worker ??= new Worker(new URL("./landmark-worker.ts", import.meta.url), { type: "module" });
  const w = worker;
  const cells = await new Promise<{ x: number; y: number }[]>((resolve, reject) => {
    w.onmessage = e => e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.cells);
    w.onerror = e => { worker = null; reject(new Error(e.message || "Riconoscimento non riuscito")); };
    w.postMessage({ rgba }, [rgba.buffer]);
  });
  return toAnalysisPoints(cells, width, height);
}
