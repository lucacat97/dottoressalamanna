import { INPUT_SIZE, HEATMAP_STRIDE, CHANNELS, toAnalysisPoints } from "./landmark-model";
import type { Points } from "./geometry";
import { constructGonion } from "./gonion";

let worker: Worker | null = null;

type Cell = { x: number; y: number };
/** Ritagli usati per l'analisi multipla (frazioni dell'immagine): intera + tre ritagli al 90%. */
const CROPS = [
  { x: 0, y: 0, s: 1 },
  { x: 0.05, y: 0.05, s: 0.9 },
  { x: 0, y: 0, s: 0.9 },
  { x: 0.1, y: 0.1, s: 0.9 },
];

function runWorker(rgba: Uint8ClampedArray) {
  worker ??= new Worker(new URL("./landmark-worker.ts", import.meta.url), { type: "module" });
  const w = worker;
  return new Promise<Cell[]>((resolve, reject) => {
    w.onmessage = e => e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.cells);
    w.onerror = e => { worker = null; reject(new Error(e.message || "Riconoscimento non riuscito")); };
    w.postMessage({ rgba }, [rgba.buffer]);
  });
}

const median = (v: number[]) => { const s = [...v].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** Combina le letture dei vari ritagli (coordinate già in celle dell'immagine intera) con la mediana e misura la dispersione. */
export function combineCells(runs: Cell[][]) {
  return CHANNELS.map((_, c) => {
    const xs = runs.map(r => r[c].x), ys = runs.map(r => r[c].y);
    const x = median(xs), y = median(ys);
    const spread = Math.max(...runs.map(r => Math.hypot(r[c].x - x, r[c].y - y)));
    return { x, y, spread };
  });
}

/**
 * Propone i punti con il modello dedicato eseguito localmente (Web Worker, nessun invio dell'immagine).
 * Analizza l'immagine intera e tre ritagli leggermente diversi, poi prende la mediana: riduce gli errori isolati
 * (es. Gonion) e segnala i punti su cui le letture non concordano.
 */
export async function detectLandmarks(image: string, width: number, height: number): Promise<{ points: Points; uncertain: string[] }> {
  const img = new Image(); img.src = image; await img.decode();
  const canvas = document.createElement("canvas"); canvas.width = INPUT_SIZE; canvas.height = INPUT_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Immagine non leggibile");
  ctx.imageSmoothingQuality = "high";
  const iw = img.naturalWidth, ih = img.naturalHeight, cellsPerSide = INPUT_SIZE / HEATMAP_STRIDE;
  const runs: Cell[][] = [];
  for (const c of CROPS) {
    ctx.clearRect(0, 0, INPUT_SIZE, INPUT_SIZE);
    ctx.drawImage(img, c.x * iw, c.y * ih, c.s * iw, c.s * ih, 0, 0, INPUT_SIZE, INPUT_SIZE);
    const cells = await runWorker(ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data);
    // celle del ritaglio → celle dell'immagine intera
    runs.push(cells.map(p => ({ x: c.x * cellsPerSide + p.x * c.s, y: c.y * cellsPerSide + p.y * c.s })));
  }
  const combined = combineCells(runs);
  const points = toAnalysisPoints(combined, width, height);
  // Go: vertice dell'angolo mandibolare costruito con le tangenti (il modello tende a metterlo più in alto sul ramo)
  try {
    const k = Math.min(1, 1024 / Math.max(iw, ih)), gw = Math.round(iw * k), gh = Math.round(ih * k);
    const g = document.createElement("canvas"); g.width = gw; g.height = gh;
    const gc = g.getContext("2d", { willReadFrequently: true });
    if (gc && points.Ar && points.Go && points.Me) {
      gc.filter = "grayscale(1) blur(2px)"; gc.drawImage(img, 0, 0, gw, gh);
      const d = gc.getImageData(0, 0, gw, gh).data, gray = new Float32Array(gw * gh);
      for (let i = 0; i < gray.length; i++) gray[i] = d[i * 4];
      const sx = gw / width, sy = gh / height, to = (p: { x: number; y: number }) => ({ x: p.x * sx, y: p.y * sy });
      const G = constructGonion(gray, gw, gh, to(points.Ar), to(points.Go), to(points.Me));
      if (G) points.Go = { x: G.x / sx, y: G.y / sy };
    }
  } catch { /* resta il Go del modello */ }
  // soglia: 1,5 celle (~0,8% del lato) di disaccordo tra le letture
  const names: Record<string, string> = { S: "S", N: "N", Ar: "Ar", Go: "Go", Me: "Me", A: "A", B: "B" };
  const uncertain = Object.keys(names).filter(k => combined[CHANNELS.indexOf(k)].spread > 1.5);
  return { points, uncertain };
}
