import { describe, expect, it } from "vitest";
import { buildRetrievedCephalometry, evaluateCephalometry, type CephalometryInput } from "../../supabase/functions/_shared/amcop-retrieval";

const base: CephalometryInput = { age: 10, sex: "F", angolo_sellare: 123, anb: 2, wits: 0, angolo_articolare: 143, angolo_goniaco: 130 };
const run = (patch: Partial<CephalometryInput>) => evaluateCephalometry({ ...base, ...patch });
describe("AMCOP retrieval without AI", () => {
  it("a single III-class indicator takes priority over hypodivergence", () => expect(run({ anb: -1, angolo_articolare: 130, angolo_goniaco: 120 }).device).toBe("TC"));
  it("significant concordant II class takes priority over hyperdivergence", () => expect(run({ anb: 5, wits: 3, angolo_articolare: 150, angolo_goniaco: 140 }).device).toBe("SC"));
  it("ANB-Wits discordance prevents SC", () => expect(run({ angolo_sellare: 130, anb: 5, wits: 0 }).device).toBe("INTEGRAL"));
  it("hypodivergence selects DEEP", () => expect(run({ angolo_articolare: 137, angolo_goniaco: 122 }).device).toBe("DEEP"));
  it("hyperdivergence selects OPEN", () => expect(run({ angolo_articolare: 149, angolo_goniaco: 138 }).device).toBe("OPEN"));
  it("crossbite overrides divergence without significant class", () => expect(run({ crossbite: true, angolo_articolare: 137, angolo_goniaco: 122 }).device).toBe("INTEGRAL"));
  it("crossbite does not override significant II class", () => expect(run({ crossbite: true, anb: 5, wits: 3 }).device).toBe("SC"));
  it("age 25 never selects TC or SC", () => expect(run({ age: 25, anb: -1 }).device).toBe("INTEGRAL"));
  it("adult hypodivergence alone does not justify DEEP", () => expect(run({ age: 25, angolo_articolare: 137, angolo_goniaco: 122 }).device).toBe("INTEGRAL"));
  it("adult confirmed occlusal raise selects DEEP", () => expect(run({ age: 25, needs_occlusal_raise: true }).device).toBe("DEEP"));
  it("adult confirmed dental or ATM indication selects DTM", () => expect(run({ age: 25, tmj_or_dental_changes: true }).device).toBe("DTM"));
  it("red alert starts at 1.0 below age 11", () => { expect(run({ rapporto_ns_gome: 1 }).alert).toBe("red"); expect(run({ age: 11, rapporto_ns_gome: 1 }).alert).toBe("none"); });
  it("orange alert starts at 0.95 and selects TC", () => { expect(run({ rapporto_ns_gome: 0.95 }).alert).toBe("orange"); expect(run({ rapporto_ns_gome: 0.95 }).device).toBe("TC"); });
  it("calculates NS divided by GoMe, not the inverse", () => expect(run({ ns_mm: 70, gome_mm: 74 }).ratio).toBeCloseTo(70 / 74));
  it("normal thresholds are inclusive and sex changes Wits", () => { expect(run({ angolo_sellare: 118, anb: 0, wits: -2 }).device).toBe("INTEGRAL"); expect(run({ sex: "M", wits: -2 }).signals[2]).toBe("NORMO"); expect(run({ sex: "M", wits: -4 }).device).toBe("TC"); });
  it("discordant divergence without confirmed bite stays neutral", () => expect(run({ angolo_articolare: 130, angolo_goniaco: 140 }).device).toBe("INTEGRAL"));
  it("confirmed deep bite resolves discordant divergence", () => expect(run({ angolo_articolare: 130, angolo_goniaco: 140, bite: "deep" }).device).toBe("DEEP"));
  it("rejects nonfinite measures", () => expect(() => run({ anb: NaN })).toThrow());
  it("retrieves only the selected manufacturer passage plus usage", () => {
    const a = buildRetrievedCephalometry({ ...base, anb: -1 });
    expect(a.passages.map(p => p.id)).toEqual(["amcop-tc", "amcop-usage"]);
    expect(buildRetrievedCephalometry({ ...base, anb: -1 })).toEqual(a);
  });
});