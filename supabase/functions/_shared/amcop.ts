// Template "Metodo AMCOP" per la consulenza cefalometrica dell'API esterna.
// Dispositivi, descrizioni e immagini presi da https://www.amcop.it/
// Mappatura vecchie sigle MILA → Bio Attivatori AMCOP:
//   TC → AMCOP TC (verde) | SC → AMCOP SC (arancio)
//   IC + piano neutro → INTEGRAL DCM (giallo) | IC + rialzo anteriore → DEEP
//   IC + rialzo posteriore → OPEN | Adulto > 20 anni → INTEGRAL DCM o DTM (DEEP se serve rialzo)

const BASE = "https://www.amcop.it";

export type AmcopDeviceKey = "TC" | "SC" | "INTEGRAL" | "DEEP" | "OPEN" | "DTM";

export interface AmcopDevice {
  key: AmcopDeviceKey;
  name: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
  /** Percorso nel bucket storage privato "amcop-assets" (copia locale dell'immagine). */
  storagePath: string;
}

/** Bucket storage con le copie locali delle immagini AMCOP (il sito amcop.it può essere irraggiungibile). */
export const AMCOP_STORAGE_BUCKET = "amcop-assets";
export const AMCOP_LOGO_STORAGE_PATH = "logo.png";

// Le varianti descrivono solo la gamma fotografica, NON una scelta di forma.
export const AMCOP_DCM_VARIANTS = [
  { label: "DCM F", imageUrl: `${BASE}/images/attivatori/giallo.jpg`, storagePath: "dcm-f.jpg" },
  { label: "DCM S", imageUrl: `${BASE}/images/attivatori/blu.jpg`, storagePath: "dcm-s.jpg" },
  { label: "DCM C", imageUrl: `${BASE}/images/attivatori/viola.jpg`, storagePath: "dcm-c.jpg" },
  { label: "DCM ØS", imageUrl: `${BASE}/images/attivatori/rosso.jpg`, storagePath: "dcm-os.jpg" },
] as const;

export const AMCOP_INDICATIONS = {
  DEEP: "hypodivergence", OPEN: "hyperdivergence", SC: "class_II", TC: "class_III",
  DTM: "dental_changes_and_TMJ", INTEGRAL: "all_indications",
} as const;

/** Nessuna forma DCM viene dedotta dalla sola cefalometria. */
export function getAmcopDcmForm(): null { return null; }

export const AMCOP_DEVICES: Record<AmcopDeviceKey, AmcopDevice> = {
  TC: {
    key: "TC",
    name: "AMCOP TC",
    subtitle: "Bio Attivatore DCM — Terza Classe (verde)",
    description:
      "Indicato nelle dismorfosi di III classe per il trattamento delle pseudoprognazie mandibolari: riposiziona le arcate in un rapporto incisivo regolare con un piano di scivolamento anteriore e un'azione frenante sulla crescita mandibolare.",
    imageUrl: `${BASE}/images/attivatori/verde.jpg`,
    pageUrl: `${BASE}/verde.html`,
    storagePath: "tc.jpg",
  },
  SC: {
    key: "SC",
    name: "AMCOP SC",
    subtitle: "Bio Attivatore DCM — Seconda Classe (arancio)",
    description:
      "Indicato nelle dismorfosi di II classe per il trattamento delle retrognazie mandibolari: il piano di scivolamento anteriore posiziona gli incisivi testa a testa, favorendo l'allungamento della base ossea mandibolare e il ricondizionamento delle ATM.",
    imageUrl: `${BASE}/images/attivatori/arancio.jpg`,
    pageUrl: `${BASE}/arancio.html`,
    storagePath: "sc.jpg",
  },
  INTEGRAL: {
    key: "INTEGRAL",
    name: "AMCOP DCM",
    subtitle: "Bio Attivatore DCM — tutte le indicazioni; forma da definire",
    description:
      "DCM è utilizzabile in tutte le indicazioni. La forma F, S, C o ØS non è determinabile dai soli valori cefalometrici e resta da definire dopo l'acquisizione della scansione delle arcate.",
    imageUrl: `${BASE}/images/attivatori/giallo.jpg`,
    pageUrl: `${BASE}/giallo.html`,
    storagePath: "integral.jpg",
  },
  DEEP: {
    key: "DEEP",
    name: "AMCOP DEEP",
    subtitle: "Bio Attivatore Prima Classe — rialzo anteriore",
    description:
      "Indicato nei morsi profondi (deep bite): presenta flange simili al DCM con un rialzo del piano occlusale nella zona frontale, utile quando è necessario un rialzo di occlusione.",
    imageUrl: `${BASE}/images/attivatori/deep.jpg`,
    pageUrl: `${BASE}/deep.html`,
    storagePath: "deep.jpg",
  },
  OPEN: {
    key: "OPEN",
    name: "AMCOP OPEN",
    subtitle: "Bio Attivatore — iperdivergenza",
    description:
      "Indicato per arcate con malocclusione di carattere scheletrico di tipo morso aperto anteriore, per il controllo della componente verticale.",
    imageUrl: `${BASE}/images/attivatori/open.jpg`,
    pageUrl: `${BASE}/open.html`,
    storagePath: "open.jpg",
  },
  DTM: {
    key: "DTM",
    name: "AMCOP DTM",
    subtitle: "Bio Attivatore — modifiche dentali e problemi ATM",
    description:
      "Indicato per modifiche prevalentemente dentali e per problemi delle articolazioni temporo-mandibolari (ATM), con flange ridotte per un maggiore comfort.",
    imageUrl: `${BASE}/images/attivatori/dtm.jpg`,
    pageUrl: `${BASE}/dtm.html`,
    storagePath: "dtm.jpg",
  },
};

export const AMCOP_LOGO_URL = `${BASE}/images/logo.png`;
export const AMCOP_RANGE_URL = `${BASE}/images/attivatori/2classe.jpg`;

/** Istruzioni per il modello: si aggiungono al prompt cefalometrico standard. */
export const AMCOP_ORTHO_ADDENDUM = `

=== TEMPLATE METODO AMCOP (PRIORITARIO SULLE ISTRUZIONI DI OUTPUT PRECEDENTI) ===
Questa consulenza segue il template "Consulenza Cefalometrica — Metodo AMCOP (Funzione · Crescita · Postura)". Mantieni tutte le regole cliniche (classe, divergenza, alert, età adulta) ma usa i dispositivi Bio Attivatori AMCOP con questa logica di scelta OBBLIGATORIA.

REGOLA DI PRIORITÀ: i due dati decisionali sono la CLASSE (I, II, III) e la DIVERGENZA (ipo/iper). Quando la classe è significativa, la scelta di classe ha SEMPRE la priorità e i valori di divergenza NON cambiano il dispositivo: vanno riportati nelle Indicazioni Terapeutiche con la raccomandazione di controllare l'evoluzione della divergenza ogni 4 mesi clinicamente e ogni 12 mesi con Rx telecranio.

MAPPATURA DISPOSITIVI:
- Alert o valori di III classe → **AMCOP TC** (Bio Attivatore DCM Terza Classe), sempre.
- Angoli e previsioni di crescita di II classe significativi → **AMCOP SC** (Bio Attivatore DCM Seconda Classe).
- In tutti gli altri casi (I classe, o II classe non significativa):
  - Ipodivergenza (morso coperto) → **AMCOP DEEP**
  - Iperdivergenza (morso aperto) → **AMCOP OPEN**
  - Crossbite monolaterale o bilaterale → **AMCOP INTEGRAL DCM**, anche in presenza di II classe non significativa
  - Piano neutro senza crossbite → **AMCOP INTEGRAL DCM**
- Paziente > 20 anni → **AMCOP INTEGRAL DCM** oppure **AMCOP DTM**; **AMCOP DEEP** solo se serve un rialzo di occlusione. Mai TC/SC nell'adulto.
La parola "INTEGRAL" è ammessa in questo template.

PRECISAZIONI PRIORITARIE SUL CATALOGO: DEEP = ipodivergenza; OPEN = iperdivergenza; SC = seconda classe; TC = terza classe; DTM = modifiche prevalentemente dentali e problemi ATM; DCM = tutte le indicazioni. Mantieni la priorità alla classe significativa e l'eccezione adulta già descritte. Quando consigli DCM usa il nome "AMCOP DCM". Le varianti DCM F (giallo), DCM S (blu), DCM C (viola), DCM ØS (rosso) sono solo una gamma illustrativa: NON puoi stabilire o consigliare la forma senza scansione delle arcate. Scrivi che la forma resta da definire dopo la scansione; non inventare dati di scansione. Nell'adulto la cefalometria ha valore clinico interpretativo, non giustifica dispositivi di classe.

STRUTTURA DI OUTPUT (sostituisce quella precedente, stesso ordine, niente sezioni extra):
Il template è una scheda clinica compatta: evita ripetizioni, mantieni i paragrafi di ogni riquadro sintetici (massimo 70 parole), senza omettere valori, alert o motivazioni cliniche. Le indicazioni terapeutiche hanno frasi brevi e complete.
## Disclaimer (testo esatto già indicato)
## Consulenza Cefalometrica — [Nome Cognome]
## 1. Tabella dei Valori, Norme e Interpretazioni  (stessa tabella di prima; nella colonna Norma aggiungi tra parentesi il range, es. "123° ± 5° (range 118–128°)")
## 2. Classe Scheletrica  → prima riga in grassetto con sigla e nome (es. **SC – Seconda Classe**), poi "Ragionamento:" sintetico sui tre indicatori.
## 3. Pattern di Divergenza  → prima riga in grassetto con il modello (es. **Modello INTEGRAL**), poi spiegazione sintetica.
## 4. Dispositivo Consigliato  → prima riga **[NOME DISPOSITIVO AMCOP]**, seconda riga col sottotitolo, poi 2-3 frasi su perché è indicato per questo caso. NON inserire immagini o link: vengono aggiunti automaticamente.
## 5. Alert III Classe Evolutiva
## 6. Alert Età Adulta
## 7. Significato dell'Angolo Goniaco
## 8. Indicazioni Terapeutiche  → elenco numerato di 3-4 punti, sul modello: 1. Controllo mensile con istruzione alla corretta deglutizione. 2. Terapia miofunzionale (es. con frutta omogeneizzata) con dispositivo indossato per il primo mese. 3. Dopo circa 5 mesi rivalutare ed eventualmente sostituire il dispositivo con un altro di classe o con un INTEGRAL (nell'adulto: rivalutare il passaggio INTEGRAL DCM / DTM). Adatta i punti al caso. Se il dispositivo è stato scelto per la CLASSE ma sono presenti valori di divergenza (ipo/iper), aggiungi un punto: controllare l'evoluzione della divergenza ogni 4 mesi clinicamente e ogni 12 mesi con Rx telecranio.
NON scrivere la sezione "Istruzioni d'uso": viene aggiunta automaticamente dalla brochure AMCOP.

Come ULTIMA riga in assoluto scrivi un marcatore tecnico nel formato esatto:
[[AMCOP_DEVICE:CHIAVE]]
dove CHIAVE è una tra TC, SC, INTEGRAL, DEEP, OPEN, DTM (il dispositivo principale consigliato).`;

export const AMCOP_USAGE_INSTRUCTIONS = `## 9. Istruzioni d'uso (da brochure AMCOP)

1. **PREPARA** — Prima di indossarlo, lavare il dispositivo sotto acqua corrente tiepida.
2. **LIBERA IL NASO** — Soffiare prima con una narice e poi con l'altra.
3. **RESPIRA DAL NASO** — Respirare con il naso, non con la bocca, espandendo la lingua sotto il palato e respirando profondamente.
4. **CHIUDI LE LABBRA** — Chiudere le labbra e serrare i denti sull'apparecchio come per soffiare in un palloncino.
5. **LINGUA + DEGLUTIZIONE** — Lingua sullo spot per 10 secondi; deglutire e premere al centro del palato per altri 10 secondi. Eseguire 3 respirazioni diaframmatiche. Alternare respirazione e deglutizione per 10 volte; poi mordicchiare per 20–30 minuti.
6. **3 VOLTE AL GIORNO** — Ripetere l'esercizio tre volte al giorno.
7. **DOPO 1 SETTIMANA** — Dopo una settimana di utilizzo esclusivamente diurno, indossarlo tutta la notte.
8. **INDOLENZIMENTO** — Un eventuale indolenzimento dei denti dopo l'uso del dispositivo è indicato nella brochure come nella norma.`;

const MARKER_RE = /\[\[AMCOP_DEVICE:\s*([A-Z]+)\s*\]\]/i;

/** Ricava il dispositivo dal marcatore o, in mancanza, dal testo della sezione 4. */
export function detectAmcopDevice(markdown: string, age?: number): AmcopDeviceKey {
  const m = markdown.match(MARKER_RE);
  const fromMarker = m?.[1]?.toUpperCase();
  if (age !== undefined && age > 20) {
    if (fromMarker === "DEEP" || fromMarker === "DTM") return fromMarker;
    if (fromMarker) return "INTEGRAL";
  }
  if (fromMarker && fromMarker in AMCOP_DEVICES) return fromMarker as AmcopDeviceKey;
  const sec = markdown.match(/##\s*4\.[^\n]*\n([\s\S]*?)(?=\n##\s|$)/)?.[1] ?? "";
  const s = sec.toUpperCase();
  if (age !== undefined && age > 20) {
    if (/\bDEEP\b/.test(s)) return "DEEP";
    if (/\bDTM\b/.test(s) && !/INTEGRAL|\bDCM\b/.test(s)) return "DTM";
    return "INTEGRAL";
  }
  if (/AMCOP\s+TC\b/.test(s)) return "TC";
  if (/AMCOP\s+SC\b/.test(s)) return "SC";
  if (/\bDEEP\b/.test(s)) return "DEEP";
  if (/\bOPEN\b/.test(s)) return "OPEN";
  if (/\bDTM\b/.test(s) && !/INTEGRAL/.test(s)) return "DTM";
  if (age && age > 20) return "INTEGRAL";
  return "INTEGRAL";
}

/**
 * Applica il template AMCOP al markdown generato:
 * rimuove il marcatore, inserisce l'immagine del dispositivo nella sezione 4
 * e aggiunge le istruzioni d'uso della brochure.
 */
export function applyAmcopTemplate(markdown: string, age?: number): { markdown: string; device: AmcopDevice } {
  const device = AMCOP_DEVICES[detectAmcopDevice(markdown, age)];
  let md = markdown.replace(MARKER_RE, "").trimEnd();
  // Blocca una selezione di forma non supportata dai dati disponibili.
  md = md.replace(/\b(?:AMCOP\s+)?(?:INTEGRAL\s+)?DCM\s+(?:ØS|OS|F|S|C)\b/gi, "AMCOP DCM (forma da definire)");
  // Elimina eventuale sezione istruzioni scritta comunque dal modello
  md = md.replace(/\n##\s*9\.[\s\S]*$/, "").trimEnd();

  const imageBlock = `${device.key === "INTEGRAL" ? "" : `\n\n![${device.name}](${device.imageUrl})`}\n\n*${device.description}*\n\nScheda dispositivo: ${device.pageUrl}\n`;
  const sec4 = md.match(/(##\s*4\.[^\n]*\n[\s\S]*?)(?=\n##\s|$)/);
  if (sec4) {
    md = md.replace(sec4[1], sec4[1].trimEnd() + imageBlock);
  } else {
    md += `\n\n## 4. Dispositivo Consigliato\n\n**${device.name}**\n\n${device.subtitle}${imageBlock}`;
  }
  md += `\n\n${AMCOP_USAGE_INSTRUCTIONS}\n`;
  return { markdown: md, device };
}

/** Scarica un'immagine (con timeout); restituisce null in caso di errore. */
export async function fetchImageBytes(url: string, timeoutMs = 6000): Promise<Uint8Array | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}
