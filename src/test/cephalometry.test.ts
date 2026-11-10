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
    expect(m.rapportо_ns_gome).toBeUndefined();
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