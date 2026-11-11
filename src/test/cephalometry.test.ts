import { describe, it, expect } from "vitest";
import { angle, calculateMeasures, analysisSignature } from "@/lib/cephalometry/geometry";
import { analysisSchema } from "@/lib/cephalometry/analysis";

describe("cephalometric geometry", () => {
  it("calculates a 90 degree angle from coordinates, not a model", () => {
    expect(angle({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(90, 8);
  });
  it("does not calculate an angle with missing or coincident points", () => {
    expect(angle(undefined, { x: 0, y: 0 }, { x: 1, y: 1 })).toBeNull();
    expect(angle({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 })).toBeNull();
  });
  it("uses NS divided by GoMe", () => {
    const m = calculateMeasures({ N: { x: 0, y: 0 }, S: { x: 6, y: 0 }, Go: { x: 0, y: 10 }, Me: { x: 3, y: 10 } }, null);
    expect(m.rapporto_ns_gome).toBe(2);
  });
  it("withholds millimetres without a scale", () => {
    expect(calculateMeasures({ A: { x: 2, y: 1 }, B: { x: 1, y: 2 }, OP1: { x: 0, y: 0 }, OP2: { x: 10, y: 0 } }, null).wits).toBeNull();
  });
  it("projects AO minus BO along the posterior-to-anterior occlusal plane", () => {
    expect(calculateMeasures({ A: { x: 20, y: 5 }, B: { x: 10, y: 15 }, OP1: { x: 0, y: 0 }, OP2: { x: 40, y: 0 }, C1: { x: 0, y: 0 }, C2: { x: 100, y: 0 } }, 20).wits).toBeCloseTo(2);
  });
  it("withholds Wits on a degenerate occlusal plane", () => {
    expect(calculateMeasures({ A: { x: 1, y: 0 }, B: { x: 0, y: 0 }, OP1: { x: 0, y: 0 }, OP2: { x: 0, y: 0 }, C1: { x: 0, y: 0 }, C2: { x: 100, y: 0 } }, 20).wits).toBeNull();
  });
  it("preserves negative ANB for SNA smaller than SNB", () => {
    expect(calculateMeasures({ N: { x: 0, y: 0 }, S: { x: -1, y: 0 }, A: { x: 0, y: 1 }, B: { x: 1, y: 1 } }, null).anb).toBeCloseTo(-45);
  });
  it("invalidates a report when points or calibration change", () => {
    const original = analysisSignature({ S: { x: 1, y: 1 } }, 20, "9", "F");
    expect(analysisSignature({ S: { x: 2, y: 1 } }, 20, "9", "F")).not.toBe(original);
    expect(analysisSignature({ S: { x: 1, y: 1 } }, 21, "9", "F")).not.toBe(original);
  });
  it("rejects non-image and out-of-bounds imported analyses", () => {
    expect(analysisSchema.safeParse({ version: 1, image: "https://external/image", width: 100, height: 100, points: {}, calibration: null, age: "9", sex: "F", report: "", reportSignature: "" }).success).toBe(false);
  });
});
import { calculateJarabak } from "@/lib/cephalometry/geometry";
import { decodeHeatmaps, toAnalysisPoints, CHANNELS } from "@/lib/cephalometry/landmark-model";

describe("Jarabak analysis", () => {
  const p = { S: { x: 0, y: 0 }, N: { x: 10, y: 0 }, Ar: { x: 0, y: 5 }, Go: { x: 0, y: 10 }, Me: { x: 10, y: 15 } };
  it("sums saddle, articular and gonial angles", () => {
    const j = calculateJarabak(p, null);
    expect(j.somma_angoli).toBeCloseTo(90 + 180 + (180 - Math.atan(2) * 180 / Math.PI), 6);
  });
  it("expresses S-Go / N-Me as a percentage", () => {
    expect(calculateJarabak(p, null).rapporto_altezze).toBeCloseTo(10 / 15 * 100, 6);
  });
  it("gives millimetres only with a calibrated scale", () => {
    expect(calculateJarabak(p, null).altezza_ramo).toBeNull();
    expect(calculateJarabak(p, 0.5).altezza_ramo).toBeCloseTo(2.5, 6);
  });
});

describe("dedicated landmark model decoding", () => {
  it("maps heatmap peaks to original pixels (stride 4 on a 768 input)", () => {
    const h = 192, w = 192, data = new Float32Array(CHANNELS.length * h * w);
    CHANNELS.forEach((_, c) => { data[c * h * w + 96 * w + 48] = 1; });
    const pts = toAnalysisPoints(decodeHeatmaps(data, CHANNELS.length, h, w), 1536, 768);
    expect(pts.S).toEqual({ x: 48 * 4 * 2, y: 96 * 4 });
  });
  it("builds the occlusal plane from molar and incisor midpoints", () => {
    const cells = CHANNELS.map(name => ({ UMT: { x: 10, y: 10 }, LMT: { x: 10, y: 20 }, UIT: { x: 50, y: 10 }, LIT: { x: 50, y: 14 } } as Record<string, { x: number; y: number }>)[name] ?? { x: 0, y: 0 });
    const pts = toAnalysisPoints(cells, 768, 768);
    expect(pts.OP1).toEqual({ x: 40, y: 60 });
    expect(pts.OP2).toEqual({ x: 200, y: 48 });
  });
});

import { combineCells } from "@/lib/cephalometry/landmark-detect";
describe("combinazione letture multiple", () => {
  it("usa la mediana e ignora una lettura isolata sbagliata di Go", () => {
    const base = CHANNELS.map(() => ({ x: 10, y: 10 }));
    const go = CHANNELS.indexOf("Go");
    const wrong = base.map((p, i) => (i === go ? { x: 40, y: 40 } : p));
    const out = combineCells([base, base, wrong]);
    expect(out[go].x).toBe(10);
    expect(out[go].spread).toBeGreaterThan(1.5);
    expect(out[0].spread).toBe(0);
  });
});

import { constructGonion, grayBlur } from "@/lib/cephalometry/gonion";
/** come nelle radiografie vere: bordi ossei sfumati */
const soften = (g: Float32Array, w: number, h: number) => { const rgba = new Float32Array(w * h * 4); g.forEach((v, i) => { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = v; }); return grayBlur(rgba, w, h, 4); };
describe("Gonion costruito", () => {
  it("scende dal Go alto del modello al vertice dell'angolo mandibolare", () => {
    // mandibola a L chiara: ramo verticale x 100-140, corpo orizzontale y 300-340 fino a x 400; vertice esterno (100,340)
    const w = 500, h = 500, gray = new Float32Array(w * h).fill(20);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      if ((x >= 100 && x <= 140 && y >= 50 && y <= 340) || (y >= 300 && y <= 340 && x >= 100 && x <= 400)) gray[y * w + x] = 200;
    const G = constructGonion(soften(gray, w, h), w, h, { x: 100, y: 60 }, { x: 100, y: 240 }, { x: 400, y: 340 });
    expect(G).not.toBeNull();
    expect(Math.hypot(G!.x - 100, G!.y - 340)).toBeLessThan(6);
  });
  it("non si ferma su un bordo interno (es. ombra faringea) e corregge un Go del modello spostato in avanti", () => {
    const w = 500, h = 500, gray = new Float32Array(w * h).fill(20);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if ((x >= 100 && x <= 140 && y >= 50 && y <= 340) || (y >= 300 && y <= 340 && x >= 100 && x <= 400)) gray[y * w + x] = 120;
      if (x >= 150 && x <= 400 && y >= 150 && y < 300) gray[y * w + x] = 255; // osso molto chiaro più all'interno
    }
    const G = constructGonion(soften(gray, w, h), w, h, { x: 100, y: 60 }, { x: 112, y: 250 }, { x: 400, y: 340 });
    expect(G).not.toBeNull();
    expect(Math.hypot(G!.x - 100, G!.y - 340)).toBeLessThan(8);
  });
});
