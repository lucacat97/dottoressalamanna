// No identifying map is persisted or used to restore full names in output.
export function patientInitials(value: string): string {
  return value.match(/\p{L}+/gu)?.map(part => `${Array.from(part)[0].toLocaleUpperCase("it-IT")}.`).join(" ") ?? "";
}

export function createPatientRedactor(nome = "", cognome = ""): (text: string) => string {
  const names = [nome.trim(), cognome.trim()].filter(Boolean).sort((a, b) => b.length - a.length);
  const replacements = names.map(name => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    return { pattern: new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "giu"), initials: patientInitials(name) };
  });
  return text => replacements.reduce((result, item) => result.replace(item.pattern, item.initials), text);
}

export function redactClinicalValue(value: unknown, redact: (text: string) => string): unknown {
  if (typeof value === "string") return redact(value);
  if (Array.isArray(value)) return value.map(item => redactClinicalValue(item, redact));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactClinicalValue(item, redact)]));
  return value;
}