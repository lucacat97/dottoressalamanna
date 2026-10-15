// No model, embeddings, network, patient storage or free-text inference.
// Retrieves curated manufacturer passages by device indication; MILA rules
// remain explicitly separate from manufacturer information.
import { AMCOP_DEVICES, AMCOP_USAGE_INSTRUCTIONS, type AmcopDeviceKey } from "./amcop.ts";

export interface CephalometryInput {
  age: number;
  sex: "M" | "F";
  angolo_sellare: number;
  anb: number;
  wits: number;
  angolo_articolare: number;
  angolo_goniaco: number;
  rapporto_ns_gome?: number;
  ns_mm?: number;
  gome_mm?: number;
  crossbite?: boolean;
  bite?: "deep" | "open" | "neutral";
  needs_occlusal_raise?: boolean;
  tmj_or_dental_changes?: boolean;
}

type ClassSignal = "TC" | "SC" | "NORMO";
type VerticalSignal = "IPO" | "IPER" | "NORMO";
export interface RetrievedPassage {
  id: string;
  title: string;
  text: string;
  url: string;
  kind: "manufacturer_catalogue" | "manufacturer_instructions";
}

export function retrieveAmcopPassages(key: AmcopDeviceKey): RetrievedPassage[] {
  const device = AMCOP_DEVICES[key];
  return [
    { id: `amcop-${key.toLowerCase()}`, title: device.name, text: device.description,
      url: device.pageUrl, kind: "manufacturer_catalogue" },
    { id: "amcop-usage", title: "Istruzioni d'uso AMCOP — sintesi della brochure",
      text: AMCOP_USAGE_INSTRUCTIONS, url: "https://www.amcop.it/", kind: "manufacturer_instructions" },
  ];
}

const classSignal = (value: number, low: number, high: number): ClassSignal =>
  value < low ? "TC" : value > high ? "SC" : "NORMO";
const verticalSignal = (value: number, low: number, high: number): VerticalSignal =>
  value < low ? "IPO" : value > high ? "IPER" : "NORMO";

export function evaluateCephalometry(input: CephalometryInput) {
  for (const key of ["age", "angolo_sellare", "anb", "wits", "angolo_articolare", "angolo_goniaco"] as const) {
    if (typeof input[key] !== "number" || !Number.isFinite(input[key])) throw new Error(`Valore non valido: ${key}`);
  }
  if (input.age <= 0 || input.age > 120 || !["M", "F"].includes(input.sex)) throw new Error("Età o sesso non validi");
  for (const key of ["rapporto_ns_gome", "ns_mm", "gome_mm"] as const) {
    const value = input[key];
    if (value !== undefined && (!Number.isFinite(value) || value <= 0)) throw new Error(`Valore non valido: ${key}`);
  }
  const witsNorm = input.sex === "M" ? -1 : 0;
  const signals = [classSignal(input.angolo_sellare, 118, 128), classSignal(input.anb, 0, 4),
    classSignal(input.wits, witsNorm - 2, witsNorm + 2)];
  // Mathematically NS/GoMe, not the inverted historical API calculation.
  const ratio = input.rapporto_ns_gome ?? (input.ns_mm !== undefined && input.gome_mm !== undefined
    ? input.ns_mm / input.gome_mm : undefined);
  const alert = input.age < 11 && ratio !== undefined
    ? ratio >= 1 ? "red" : ratio >= 0.95 ? "orange" : "none" : "none";
  const scCount = signals.filter(s => s === "SC").length;
  const tcCount = signals.filter(s => s === "TC").length;
  // Existing ANB/Wits discordance rule takes precedence over a II-class majority.
  const discordantClass = signals[1] !== signals[2];
  const skeletalClass = tcCount > 0 || alert !== "none" ? "III"
    : scCount >= 2 && !discordantClass ? "II" : "I";
  const vertical = [verticalSignal(input.angolo_articolare, 138, 148),
    verticalSignal(input.angolo_goniaco, 123, 137)];
  const divergence = vertical[0] === vertical[1] ? vertical[0] : "DISCORDANTE";
  const adult = input.age > 20;
  let device: AmcopDeviceKey;
  if (adult) {
    device = input.needs_occlusal_raise === true ? "DEEP"
      : input.tmj_or_dental_changes === true ? "DTM" : "INTEGRAL";
  } else if (skeletalClass === "III") device = "TC";
  else if (skeletalClass === "II") device = "SC";
  else if (input.crossbite === true) device = "INTEGRAL";
  else if (divergence === "IPO" || (divergence === "DISCORDANTE" && input.bite === "deep")) device = "DEEP";
  else if (divergence === "IPER" || (divergence === "DISCORDANTE" && input.bite === "open")) device = "OPEN";
  else device = "INTEGRAL";
  return { device, skeletalClass, signals, divergence, vertical, ratio, alert, adult, tcCount,
    classPriority: !adult && (device === "TC" || device === "SC"), discordantClass };
}

export function buildRetrievedCephalometry(input: CephalometryInput) {
  const result = evaluateCephalometry(input);
  const passages = retrieveAmcopPassages(result.device);
  const device = AMCOP_DEVICES[result.device];
  const witsNorm = input.sex === "M" ? -1 : 0;
  const divergenceNames: Record<string, string> = { IPO: "Ipodivergenza", IPER: "Iperdivergenza", NORMO: "Normodivergenza", DISCORDANTE: "Divergenza discordante" };
  const classExplanation = result.skeletalClass === "III"
    ? `${result.tcCount} indicatori cefalometrici di III classe; alert evolutivo ${result.alert === "none" ? "non attivato" : result.alert === "red" ? "rosso" : "arancio"}. La componente di III classe ha priorità secondo le regole MILA.`
    : result.skeletalClass === "II" ? "Indicatori di II classe significativi e concordanza ANB-Wits: priorità alla classe secondo le regole MILA."
    : "Nessun indicatore di III classe o alert evolutivo attivo. I dati non soddisfano la regola MILA per una II classe significativa; gli indicatori isolati o discordanti richiedono rivalutazione.";
  const rationale = result.adult
    ? result.device === "DEEP" ? "Età adulta e necessità di rialzo occlusale confermata dal professionista."
      : result.device === "DTM" ? "Età adulta e modifiche dentali o problemi ATM confermati dal professionista."
      : "Età adulta: DCM come riferimento generale; DTM resta un'alternativa per modifiche dentali o problemi ATM. La cefalometria non orienta un dispositivo di classe."
    : result.classPriority ? "La classe significativa o l'alert evolutivo prevale sul dato di divergenza."
    : input.crossbite ? "Crossbite confermato dal professionista: DCM ha priorità sulla divergenza in assenza di classe significativa."
    : `Scelta secondo la divergenza e, se discordante, il morso confermato dal professionista.`;
  const monitoring = result.classPriority && result.divergence !== "NORMO"
    ? "Controllare l'evoluzione della divergenza ogni 4 mesi clinicamente e ogni 12 mesi con Rx telecranio, secondo le regole MILA e la valutazione del professionista."
    : result.divergence === "DISCORDANTE" ? "Rivalutare il morso e il piano occlusale a 4–6 mesi; senza morso confermato non viene dedotto un rialzo."
    : "Definire i controlli clinici con il professionista sulla base del quadro completo.";
  const markdown = `> **Disclaimer:** Questo strumento fornisce esclusivamente un supporto all'analisi clinica e NON costituisce in alcun modo una diagnosi medica. La responsabilità diagnostica resta interamente in capo al professionista sanitario. L'utilizzo di questo strumento non sostituisce il giudizio clinico del medico.

## Consulenza Cefalometrica — Caso senza identificativi

Età: ${input.age} anni. Sesso: ${input.sex}. Elaborazione documentale a regole, senza AI generativa.

## 1. Tabella dei Valori, Norme e Interpretazioni

| Misura | Valore | Norma | Interpretazione |
| --- | --- | --- | --- |
| Sellare N-S-Ar | ${input.angolo_sellare}° | 123° ± 5° (118–128°) | ${result.signals[0]} |
| ANB | ${input.anb}° | 2° ± 2° (0–4°) | ${result.signals[1]} |
| Wits | ${input.wits} mm | ${witsNorm} ± 2 mm (${witsNorm - 2}–${witsNorm + 2}) | ${result.signals[2]} |
| Articolare S-Ar-Go | ${input.angolo_articolare}° | 143° ± 5° (138–148°) | ${result.vertical[0]} |
| Goniaco Ar-Go-Me | ${input.angolo_goniaco}° | 130° ± 7° (123–137°) | ${result.vertical[1]} |
${result.ratio === undefined ? "" : `| NS/GoMe | ${result.ratio.toFixed(3)} | Alert sotto 11 anni | ${result.alert} |`}

## 2. Classe Scheletrica

**${result.skeletalClass} Classe — lettura cefalometrica**

${classExplanation} TC = Terza Classe; SC = Seconda Classe; IC = Prima Classe. La classe dentale e la maturità scheletrica richiedono verifica clinica.

## 3. Pattern di Divergenza

**${divergenceNames[result.divergence]}**

Angolo articolare: ${result.vertical[0]}; angolo goniaco: ${result.vertical[1]}. ${result.classPriority ? "Il dato verticale non cambia il dispositivo di classe." : "La scelta del piano segue le regole MILA e i dati occlusali confermati."}

## 4. Dispositivo Consigliato

**${device.name}**

${device.subtitle}

${rationale} Fonte della scheda: ${passages[0].url}. La regola di selezione è MILA, non una linea guida indipendente del produttore.

## 5. Alert III Classe Evolutiva

${result.ratio === undefined ? "Rapporto NS/GoMe non fornito: alert evolutivo non valutabile; restano valutati gli indicatori di classe." : result.alert === "red" ? "ALERT ROSSO: età inferiore a 11 anni e NS/GoMe ≥ 1. Valutazione clinica tempestiva secondo le regole MILA." : result.alert === "orange" ? "ALERT ARANCIO: età inferiore a 11 anni e 0,95 ≤ NS/GoMe < 1. Monitoraggio clinico secondo le regole MILA." : "Nessun alert evolutivo attivato dalla regola età/rapporto; questo non esclude una componente di III classe."}

## 6. Alert Età Adulta

${result.adult ? "Paziente oltre 20 anni: classe e divergenza sono dati clinici interpretativi. Non si consigliano TC o SC; riferimento DCM o DTM, DEEP esclusivamente per necessità di rialzo occlusale confermata." : "Soglia adulta oltre 20 anni non raggiunta; la maturità scheletrica effettiva resta da verificare dal professionista."}

## 7. Significato dell'Angolo Goniaco

Ar-Go-Me ${input.angolo_goniaco}°: ${divergenceNames[result.vertical[1]]}. La misura descrive la componente verticale; tono muscolare, prognosi e maturità non sono dedotti automaticamente dalla sola misura.

## 8. Indicazioni Terapeutiche

${monitoring} La scelta finale e il programma terapeutico restano al professionista. La forma DCM F, S, C o ØS non è determinabile senza scansione delle arcate. Le istruzioni seguenti sono una sintesi dei materiali del produttore, non un programma personalizzato. Le note libere non vengono interpretate da questa modalità.

[[AMCOP_DEVICE:${result.device}]]`;
  return { markdown, result, passages, engine: "amcop-retrieval-rules-v1" as const };
}