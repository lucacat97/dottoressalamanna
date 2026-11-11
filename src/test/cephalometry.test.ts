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

import { selectGonion, isPlausibleGonion } from "@/lib/cephalometry/landmark-detect";
describe("scelta del Gonion tra più letture", () => {
  // Ar in alto a sinistra, Me in basso a destra, N in alto a destra (profilo rivolto a destra)
  const Ar = { x: 540, y: 520 }, Me = { x: 980, y: 940 }, N = { x: 1015, y: 300 };
  it("accetta un Go sull'angolo mandibolare", () => {
    expect(isPlausibleGonion({ x: 598, y: 760 }, Ar, Me, N)).toBe(true);
  });
  it("scarta un Go finito sulle vertebre, vicino all'orecchio o sui denti", () => {
    expect(isPlausibleGonion({ x: 464, y: 747 }, Ar, Me, N)).toBe(false);
    expect(isPlausibleGonion({ x: 561, y: 488 }, Ar, Me, N)).toBe(false);
    expect(isPlausibleGonion({ x: 894, y: 717 }, Ar, Me, N)).toBe(false);
  });
  it("usa la mediana delle sole letture plausibili", () => {
    const sel = selectGonion([{ x: 561, y: 488 }, { x: 600, y: 750 }, { x: 590, y: 760 }, { x: 894, y: 717 }, { x: 596, y: 744 }], Ar, Me, N);
    expect(sel?.plausible).toBe(3);
    expect(sel?.go).toEqual({ x: 596, y: 750 });
  });
  it("non propone Go se nessuna lettura è plausibile", () => {
    expect(selectGonion([{ x: 464, y: 747 }], Ar, Me, N)).toBeNull();
  });
});
