/**
 * Pseudonimizzazione PII per chiamate AI (GDPR art. 4(5) / art. 32).
 *
 * Strategia:
 *  - Prima dell'invio: sostituisce nome/cognome (e altre PII opzionali) con
 *    placeholder neutri stabili nella stessa sessione di richiesta.
 *  - Dopo la risposta: ripristina i valori reali nel testo del referto.
 *
 * Tutto avviene lato browser: i dati identificativi non lasciano mai il device.
 */

export interface PiiMap {
  /** Mappa placeholder -> valore reale (per de-pseudonimizzare l'output). */
  reverse: Record<string, string>;
  /** Mappa valore reale -> placeholder (per pseudonimizzare l'input). */
  forward: Record<string, string>;
}

export interface PiiInput {
  nome?: string;
  cognome?: string;
  /** Eventuali altre PII libere (codice fiscale, indirizzo, telefono...) */
  extras?: string[];
}

const NAME_PLACEHOLDER = "PAZIENTE_NOME";
const SURNAME_PLACEHOLDER = "PAZIENTE_COGNOME";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Costruisce le mappe di pseudonimizzazione partendo dai dati paziente. */
export function buildPiiMap(input: PiiInput): PiiMap {
  const forward: Record<string, string> = {};
  const reverse: Record<string, string> = {};

  if (input.nome && input.nome.trim()) {
    forward[input.nome.trim()] = NAME_PLACEHOLDER;
    reverse[NAME_PLACEHOLDER] = input.nome.trim();
  }
  if (input.cognome && input.cognome.trim()) {
    forward[input.cognome.trim()] = SURNAME_PLACEHOLDER;
    reverse[SURNAME_PLACEHOLDER] = input.cognome.trim();
  }
  (input.extras ?? []).forEach((val, idx) => {
    const v = (val ?? "").trim();
    if (!v) return;
    const ph = `PAZIENTE_DATO_${idx + 1}`;
    forward[v] = ph;
    reverse[ph] = v;
  });

  return { forward, reverse };
}

/**
 * Sostituisce ogni occorrenza dei valori reali con il loro placeholder.
 * Case-insensitive, word-boundary safe (non corrompe parole più lunghe).
 */
export function pseudonymizeText(text: string, map: PiiMap): string {
  let out = text;
  // Ordina dal più lungo al più corto per evitare collisioni parziali.
  const entries = Object.entries(map.forward).sort(
    ([a], [b]) => b.length - a.length,
  );
  for (const [real, placeholder] of entries) {
    if (real.length < 2) continue;
    const re = new RegExp(`\\b${escapeRegex(real)}\\b`, "gi");
    out = out.replace(re, placeholder);
  }
  return out;
}

/** Ripristina i valori reali nei placeholder (lato client, dopo l'output AI). */
export function depseudonymizeText(text: string, map: PiiMap): string {
  let out = text;
  for (const [placeholder, real] of Object.entries(map.reverse)) {
    const re = new RegExp(escapeRegex(placeholder), "g");
    out = out.replace(re, real);
  }
  return out;
}

export const PII_PLACEHOLDERS = {
  NAME: NAME_PLACEHOLDER,
  SURNAME: SURNAME_PLACEHOLDER,
};
