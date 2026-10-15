import { describe, expect, it } from "vitest";
import { createPatientRedactor, patientInitials, redactClinicalValue } from "../../supabase/functions/_shared/patient-privacy";

describe("API patient minimization", () => {
  it("reduces patient first and last names to initials", () => {
    expect(patientInitials("Anna")).toBe("A.");
    expect(patientInitials("Bianchi")).toBe("B.");
    expect(patientInitials("Anna Maria D’Angelo")).toBe("A. M. D. A.");
  });
  it("removes supplied full names from clinical text and generated output", () => {
    const redact = createPatientRedactor("Anna", "Bianchi");
    expect(redact("Paziente ANNA Bianchi; controllo per Anna.")).toBe("Paziente A. B.; controllo per A..");
    expect(redact("Marianna presenta dolore")).toBe("Marianna presenta dolore");
  });
  it("minimizes nested clinical inputs without changing measurements", () => {
    expect(redactClinicalValue([{ description: "Anna Bianchi", value: 125 }], createPatientRedactor("Anna", "Bianchi")))
      .toEqual([{ description: "A. B.", value: 125 }]);
  });
  it("does not invent an identity when names are omitted", () => {
    expect(patientInitials("")).toBe("");
    expect(createPatientRedactor()("Dato clinico")).toBe("Dato clinico");
  });
});