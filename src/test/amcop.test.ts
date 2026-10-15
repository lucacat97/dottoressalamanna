import { describe, expect, it } from "vitest";
import { AMCOP_DEVICES, AMCOP_DCM_VARIANTS, AMCOP_INDICATIONS, detectAmcopDevice, getAmcopDcmForm } from "../../supabase/functions/_shared/amcop";

describe("AMCOP agreed device indications", () => {
  it("uses DEEP for hypodivergence", () => expect(AMCOP_INDICATIONS.DEEP).toBe("hypodivergence"));
  it("uses OPEN for hyperdivergence", () => expect(AMCOP_INDICATIONS.OPEN).toBe("hyperdivergence"));
  it("uses SC for class II", () => expect(AMCOP_INDICATIONS.SC).toBe("class_II"));
  it("uses TC for class III", () => expect(AMCOP_INDICATIONS.TC).toBe("class_III"));
  it("uses DTM for dental changes and TMJ problems", () => expect(AMCOP_INDICATIONS.DTM).toBe("dental_changes_and_TMJ"));
  it("supports DCM in all indications", () => expect(AMCOP_INDICATIONS.INTEGRAL).toBe("all_indications"));
  it("does not determine a DCM form without scans", () => expect(getAmcopDcmForm()).toBeNull());
  it("never selects a class device at age 25", () => {
    expect(detectAmcopDevice("[[AMCOP_DEVICE:SC]]", 25)).toBe("INTEGRAL");
    expect(detectAmcopDevice("[[AMCOP_DEVICE:TC]]", 25)).toBe("INTEGRAL");
  });
  it("maps the nine exact supplied image filenames", () => {
    expect([AMCOP_DEVICES.DEEP, AMCOP_DEVICES.OPEN, AMCOP_DEVICES.SC, AMCOP_DEVICES.TC, AMCOP_DEVICES.DTM, ...AMCOP_DCM_VARIANTS].map(d => d.imageUrl.split("/").pop())).toEqual(["deep.jpg", "open.jpg", "arancio.jpg", "verde.jpg", "dtm.jpg", "giallo.jpg", "blu.jpg", "viola.jpg", "rosso.jpg"]);
  });
});