import type { Points } from "./geometry";

/**
 * Modello pubblico dedicato: HRNet-W32 addestrato sul dataset Aariz/CEPHA29 (CC BY 4.0).
 * Gira interamente nel browser: la radiografia non viene inviata a nessun servizio.
 */
export const MODEL_URL = "https://huggingface.co/MuhammadNabeelSh/cephalometry-landmarks/resolve/80fc4aa9df7b5510aed23654f975a3683d30fee5/landmarks-cepha29.int8.onnx";
export const MODEL_ATTRIBUTION = "Modello HRNet CEPHA29 (MuhammadNabeelSh, CC BY 4.0) addestrato sul dataset Aariz (CC BY 4.0)";
export const INPUT_SIZE = 768;
export const HEATMAP_STRIDE = 4;
export const CHANNELS = "A ANS Ar B Co Gn Go LIA LIT LMT LPM Li Ls Me N N` Or PNS Pn Po Pog Pog` R S Sn UIA UIT UMT UPM".split(" ");
const MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225];

/** RGBA 768×768 → tensore CHW normalizzato ImageNet, come nel codice di addestramento. */
export function toTensor(rgba: Uint8ClampedArray, size = INPUT_SIZE) {
  const plane = size * size, out = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) for (let c = 0; c < 3; c++) out[c * plane + i] = (rgba[i * 4 + c] / 255 - MEAN[c]) / STD[c];
  return out;
}

/** Argmax per canale con raffinamento sub-pixel di ¼ di cella verso il vicino più alto. */
export function decodeHeatmaps(data: ArrayLike<number>, channels: number, h: number, w: number) {
  const result: { x: number; y: number; score: number }[] = [];
  for (let c = 0; c < channels; c++) {
    const base = c * h * w; let best = 0, score = -Infinity;
    for (let i = 0; i < h * w; i++) if (data[base + i] > score) { score = data[base + i]; best = i; }
    let x = best % w, y = Math.floor(best / w);
    const at = (xx: number, yy: number) => data[base + yy * w + xx];
    const dx = x > 0 && x < w - 1 ? Math.sign(at(x + 1, y) - at(x - 1, y)) * 0.25 : 0;
    const dy = y > 0 && y < h - 1 ? Math.sign(at(x, y + 1) - at(x, y - 1)) * 0.25 : 0;
    x += dx; y += dy;
    result.push({ x, y, score });
  }
  return result;
}

/**
 * Converte le celle della heatmap in pixel dell'immagine originale e mappa i punti usati dall'analisi.
 * Piano occlusale funzionale: OP1 = punto medio tra le cuspidi mesiali dei primi molari (UMT/LMT),
 * OP2 = punto medio tra i margini incisali (UIT/LIT).
 */
export function toAnalysisPoints(cells: { x: number; y: number }[], width: number, height: number): Points {
  const px = (name: string) => {
    const c = cells[CHANNELS.indexOf(name)];
    return { x: c.x * HEATMAP_STRIDE * width / INPUT_SIZE, y: c.y * HEATMAP_STRIDE * height / INPUT_SIZE };
  };
  const mid = (a: string, b: string) => { const p = px(a), q = px(b); return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; };
  return { S: px("S"), N: px("N"), Ar: px("Ar"), Go: px("Go"), Me: px("Me"), A: px("A"), B: px("B"), OP1: mid("UMT", "LMT"), OP2: mid("UIT", "LIT") };
}
