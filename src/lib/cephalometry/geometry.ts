export const LANDMARKS = ["S", "N", "Ar", "Go", "Me", "A", "B", "OP1", "OP2", "C1", "C2"] as const;
export type Landmark = typeof LANDMARKS[number];
export interface Point { x: number; y: number }
export type Points = Partial<Record<Landmark, Point>>;
export const POINT_LABELS: Record<Landmark, string> = {
  S: "Sella", N: "Nasion", Ar: "Articulare", Go: "Gonion", Me: "Menton",
  A: "Punto A", B: "Punto B", OP1: "Piano occlusale · posteriore", OP2: "Piano occlusale · anteriore",
  C1: "Scala · primo riferimento", C2: "Scala · secondo riferimento",
};
export const SEGMENTS: [Landmark, Landmark][] = [["N", "S"], ["S", "Ar"], ["Ar", "Go"], ["Go", "Me"], ["S", "Go"], ["N", "Me"], ["N", "Go"], ["N", "A"], ["N", "B"], ["OP1", "OP2"], ["C1", "C2"]];
export function distance(a: Point, b: Point) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function angle(a?: Point, vertex?: Point, b?: Point): number | null {
  if (!a || !vertex || !b) return null;
  const denominator = distance(a, vertex) * distance(b, vertex);
  if (denominator < 1e-8) return null;
  const dot = (a.x - vertex.x) * (b.x - vertex.x) + (a.y - vertex.y) * (b.y - vertex.y);
  return Math.acos(Math.max(-1, Math.min(1, dot / denominator))) * 180 / Math.PI;
}
export function calculateMeasures(p: Points, calibrationMm: number | null) {
  const sna = angle(p.S, p.N, p.A), snb = angle(p.S, p.N, p.B);
  const scalePx = p.C1 && p.C2 ? distance(p.C1, p.C2) : 0;
  const mmPerPx = calibrationMm && calibrationMm > 0 && scalePx > 1e-8 ? calibrationMm / scalePx : null;
  const occlusalLength = p.OP1 && p.OP2 ? distance(p.OP1, p.OP2) : 0;
  let wits: number | null = null;
  if (p.A && p.B && p.OP1 && p.OP2 && mmPerPx && occlusalLength > 1e-8) {
    wits = ((p.A.x - p.B.x) * (p.OP2.x - p.OP1.x) + (p.A.y - p.B.y) * (p.OP2.y - p.OP1.y)) / occlusalLength * mmPerPx;
  }
  const mandibular = p.Go && p.Me ? distance(p.Go, p.Me) : 0;
  return {
    angolo_sellare: angle(p.N, p.S, p.Ar),
    anb: sna === null || snb === null ? null : sna - snb,
    angolo_articolare: angle(p.S, p.Ar, p.Go),
    angolo_goniaco: angle(p.Ar, p.Go, p.Me),
    rapporto_ns_gome: p.N && p.S && mandibular > 1e-8 ? distance(p.N, p.S) / mandibular : null,
    wits, mmPerPx,
  };
}
export type Measures = ReturnType<typeof calculateMeasures>;
export const MEASURE_LABELS: Record<Exclude<keyof Measures, "mmPerPx">, string> = {
  angolo_sellare: "Angolo sellare (N–S–Ar)", anb: "ANB (SNA − SNB)",
  angolo_articolare: "Angolo articolare (S–Ar–Go)", angolo_goniaco: "Angolo goniaco (Ar–Go–Me)",
  rapporto_ns_gome: "Rapporto NS/GoMe", wits: "Wits (AO − BO)",
};
export function formattedMeasure(key: string, value: number | null) {
  if (value === null) return "—";
  return `${value.toFixed(key === "rapporto_ns_gome" ? 3 : 2)}${key === "wits" ? " mm" : key === "rapporto_ns_gome" ? "" : "°"}`;
}
export function analysisSignature(points: Points, calibration: number | null, age: string, sex: string) {
  return JSON.stringify([LANDMARKS.map(k => points[k] ?? null), calibration, age, sex]);
}
/** Analisi di Jarabak: calcolo geometrico deterministico sui punti confermati. */
export function calculateJarabak(p: Points, mmPerPx: number | null) {
  const len = (a?: Point, b?: Point) => a && b ? distance(a, b) : null;
  const mm = (v: number | null) => v !== null && mmPerPx ? v * mmPerPx : null;
  const ratio = (a: number | null, b: number | null) => a !== null && b !== null && b > 1e-8 ? a / b * 100 : null;
  const sellare = angle(p.N, p.S, p.Ar), articolare = angle(p.S, p.Ar, p.Go), goniaco = angle(p.Ar, p.Go, p.Me);
  const sGo = len(p.S, p.Go), nMe = len(p.N, p.Me), sAr = len(p.S, p.Ar), arGo = len(p.Ar, p.Go);
  return {
    somma_angoli: sellare !== null && articolare !== null && goniaco !== null ? sellare + articolare + goniaco : null,
    goniaco_superiore: angle(p.Ar, p.Go, p.N), goniaco_inferiore: angle(p.N, p.Go, p.Me),
    rapporto_altezze: ratio(sGo, nMe), rapporto_sar_argo: ratio(sAr, arGo),
    base_cranica_anteriore: mm(len(p.S, p.N)), base_cranica_posteriore: mm(sAr), altezza_ramo: mm(arGo),
    corpo_mandibolare: mm(len(p.Go, p.Me)), altezza_posteriore: mm(sGo), altezza_anteriore: mm(nMe),
  };
}
export type JarabakMeasures = ReturnType<typeof calculateJarabak>;
export const JARABAK_LABELS: Record<keyof JarabakMeasures, string> = {
  somma_angoli: "Somma angoli (N–S–Ar + S–Ar–Go + Ar–Go–Me)", goniaco_superiore: "Goniaco superiore (Ar–Go–N)",
  goniaco_inferiore: "Goniaco inferiore (N–Go–Me)", rapporto_altezze: "Rapporto S–Go / N–Me",
  rapporto_sar_argo: "Rapporto S–Ar / Ar–Go", base_cranica_anteriore: "Base cranica anteriore (S–N)",
  base_cranica_posteriore: "Base cranica posteriore (S–Ar)", altezza_ramo: "Altezza del ramo (Ar–Go)",
  corpo_mandibolare: "Corpo mandibolare (Go–Me)", altezza_posteriore: "Altezza facciale posteriore (S–Go)",
  altezza_anteriore: "Altezza facciale anteriore (N–Me)",
};
export function formattedJarabak(key: keyof JarabakMeasures, value: number | null) {
  if (value === null) return key.startsWith("rapporto") || key.includes("angol") || key.includes("goniaco") ? "—" : "— (serve scala)";
  if (key.startsWith("rapporto")) return `${value.toFixed(1)}%`;
  if (key === "somma_angoli" || key.startsWith("goniaco")) return `${value.toFixed(2)}°`;
  return `${value.toFixed(1)} mm`;
}
