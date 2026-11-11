import { INPUT_SIZE, HEATMAP_STRIDE, CHANNELS } from "./landmark-model";
import type { Points } from "./geometry";

let worker: Worker | null = null;

type P = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };

function runWorker(rgba: Uint8ClampedArray) {
  worker ??= new Worker(new URL("./landmark-worker.ts", import.meta.url), { type: "module" });
  const w = worker;
  return new Promise<{ x: number; y: number; score: number }[]>((resolve, reject) => {
    w.onmessage = e => e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.cells);
    w.onerror = e => { worker = null; reject(new Error(e.message || "Riconoscimento non riuscito")); };
    w.postMessage({ rgba }, [rgba.buffer]);
  });
}

const median = (v: number[]) => { const s = [...v].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const medianPoint = (ps: P[]) => ({ x: median(ps.map(p => p.x)), y: median(ps.map(p => p.y)) });
const spreadOf = (ps: P[], c: P) => Math.max(0, ...ps.map(p => Math.hypot(p.x - c.x, p.y - c.y)));

/** Combina più letture (stesse coordinate) con la mediana per canale e misura la dispersione. */
export function combineCells(runs: P[][]) {
  return CHANNELS.map((_, c) => {
    const ps = runs.map(r => r[c]), m = medianPoint(ps);
    return { ...m, spread: spreadOf(ps, m) };
  });
}

/**
 * Un Gonion è anatomicamente plausibile solo se sta dietro/sotto la retta Ar–Me (dal lato opposto a N),
 * forma con Ar e Me un angolo goniaco tra 100° e 150° e dista da Ar tra il 30% e l'80% di Ar–Me.
 */
export function isPlausibleGonion(g: P, Ar: P, Me: P, N: P) {
  const am = Math.hypot(Me.x - Ar.x, Me.y - Ar.y); if (!am) return false;
  const v1 = { x: Ar.x - g.x, y: Ar.y - g.y }, v2 = { x: Me.x - g.x, y: Me.y - g.y };
  const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y); if (!l1 || !l2) return false;
  const angle = Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (l1 * l2)))) * 180 / Math.PI;
  const side = (p: P) => (Me.x - Ar.x) * (p.y - Ar.y) - (Me.y - Ar.y) * (p.x - Ar.x);
  return angle >= 100 && angle <= 150 && l1 / am >= 0.3 && l1 / am <= 0.8 && side(g) * side(N) < 0;
}

/** Sceglie Go come mediana delle sole letture plausibili; scarta quelle finite su vertebre, orecchio o denti. */
export function selectGonion(candidates: P[], Ar: P, Me: P, N: P) {
  const ok = candidates.filter(g => isPlausibleGonion(g, Ar, Me, N));
  if (!ok.length) return null;
  const go = medianPoint(ok);
  return { go, plausible: ok.length, spread: spreadOf(ok, go) };
}

/**
 * Propone i punti con il modello dedicato eseguito localmente (Web Worker, nessun invio dell'immagine).
 * 1) La radiografia viene messa in un quadrato con bordi neri (mai deformata) e letta intera + due ritagli.
 * 2) Attorno a S, N, Ar, Me si fanno sei inquadrature del viso a scale diverse.
 * Per Go, il punto meno stabile del modello, si tengono solo le letture anatomicamente plausibili.
 */
export async function detectLandmarks(image: string, width: number, height: number): Promise<{ points: Points; uncertain: string[] }> {
  const img = new Image(); img.src = image; await img.decode();
  const canvas = document.createElement("canvas"); canvas.width = INPUT_SIZE; canvas.height = INPUT_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Immagine non leggibile");
  ctx.imageSmoothingQuality = "high";
  const iw = img.naturalWidth, ih = img.naturalHeight, kx = width / iw, ky = height / ih;
  const read = async (r: Rect) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE);
    ctx.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, INPUT_SIZE, INPUT_SIZE);
    const cells = await runWorker(ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data);
    const f = HEATMAP_STRIDE / INPUT_SIZE;
    return cells.map(c => ({ x: r.x + c.x * f * r.w, y: r.y + c.y * f * r.h }));
  };
  const S = Math.max(iw, ih), ox = (iw - S) / 2, oy = (ih - S) / 2;
  const stage1: P[][] = [];
  for (const [fx, fy, s] of [[0, 0, 1], [0.05, 0.05, 0.9], [0.1, 0.1, 0.9]])
    stage1.push(await read({ x: ox + fx * S, y: oy + fy * S, w: s * S, h: s * S }));
  const c1 = combineCells(stage1), at = (runs: { x: number; y: number }[], n: string) => runs[CHANNELS.indexOf(n)];
  const ref = ["S", "N", "Ar", "Me"].map(n => at(c1, n));
  const xs = ref.map(p => p.x), ys = ref.map(p => p.y);
  const L = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const stage2: P[][] = [];
  for (const sc of [1.6, 2]) for (const [dx, dy] of [[0, 0], [-0.08, 0.08], [0.08, -0.05]]) {
    const side = sc * L; stage2.push(await read({ x: cx + dx * L - side / 2, y: cy + dy * L - side / 2, w: side, h: side }));
  }
  const all = [...stage1, ...stage2], combined = combineCells(all);
  const px = (p: P) => ({ x: p.x * kx, y: p.y * ky });
  const pt = (n: string) => px(at(combined, n));
  const mid = (a: string, b: string) => { const p = pt(a), q = pt(b); return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; };
  const Ar = at(combined, "Ar"), Me = at(combined, "Me"), N = at(combined, "N");
  const goSel = selectGonion(all.map(r => at(r, "Go")), Ar, Me, N);
  const points: Points = {
    S: pt("S"), N: pt("N"), Ar: pt("Ar"), Me: pt("Me"), A: pt("A"), B: pt("B"),
    Go: goSel ? px(goSel.go) : pt("Go"),
    OP1: mid("UMT", "LMT"), OP2: mid("UIT", "LIT"),
  };
  // soglia di disaccordo: ~0,8% del lato maggiore della radiografia
  const tol = S * 0.008;
  const uncertain = ["S", "N", "Ar", "Me", "A", "B"].filter(n => combined[CHANNELS.indexOf(n)].spread > tol * 2);
  if (!goSel || goSel.plausible < 3 || goSel.spread > tol * 4) uncertain.push("Go");
  return { points, uncertain };
}
