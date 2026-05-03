export type QType = "bool" | "select" | "multi" | "text" | "number" | "longtext";

export interface Question {
  key: string;
  label: string;
  type: QType;
  options?: string[];
}

export interface Section {
  id: string;
  title: string;
  questions: Question[];
}

const YN: string[] = ["Sì", "No"];
const POS_NEG = ["Positivo", "Negativo"];

export const CHECKUP_SECTIONS: Section[] = [
  { id: "anamnesi", title: "Anamnesi generale", questions: [
    { key: "sintomi", label: "Sintomi e motivo della visita", type: "longtext" },
    { key: "tipo_parto", label: "Tipo di parto", type: "select", options: ["Spontaneo", "Cesareo", "Operativo / Ventosa"] },
    { key: "sonno", label: "Sonno (qualità, durata)", type: "multi", options: ["Sonno regolare", "Sonno intermittente (si sveglia di notte)", "Respira oralmente", "Russa", "Si sveglia stanco"] },
    { key: "bruxismo", label: "Bruxismo", type: "select", options: YN },
    { key: "sport", label: "Pratica sport", type: "select", options: YN },
    { key: "traumi_emotivi", label: "Traumi emotivi", type: "select", options: YN },
    { key: "interventi_chirurgici", label: "Interventi chirurgici", type: "select", options: YN },
    { key: "occhiali", label: "Occhiali", type: "select", options: YN },
    { key: "apparecchi_ortodontici", label: "Apparecchi ortodontici (precedenti)", type: "select", options: YN },
    { key: "apparecchi_acustici", label: "Apparecchi acustici", type: "select", options: YN },
    { key: "plantari", label: "Suolette o plantari", type: "select", options: YN },
  ]},
  { id: "vestibolare", title: "Recettore vestibolare e orecchio", questions: [
    { key: "otiti", label: "Otiti ricorrenti", type: "select", options: YN },
    { key: "acufeni", label: "Acufeni (ronzii o fischi)", type: "select", options: YN },
    { key: "labirintite", label: "Labirintite o sbandamento", type: "select", options: YN },
  ]},
  { id: "esame_orale", title: "Esame orale", questions: [
    { key: "dentizione", label: "Dentizione", type: "select", options: ["Decidua", "Mista", "Permanente"] },
    { key: "dismorfosi", label: "Dismorfosi", type: "multi", options: ["Palato stretto", "Palato profondo", "Asimmetria", "Cross-bite", "Open-bite", "Deep-bite"] },
    { key: "classe_dentale", label: "Classe dentale", type: "select", options: ["I Classe", "II Classe", "III Classe"] },
  ]},
  { id: "funzione", title: "Funzione", questions: [
    { key: "lat_sx", label: "Lateralità SX: precontatti?", type: "select", options: YN },
    { key: "lat_dx", label: "Lateralità DX: precontatti?", type: "select", options: YN },
    { key: "protrusiva", label: "Protrusiva: precontatti?", type: "select", options: YN },
    { key: "deviazione_apertura", label: "Movimento apertura: deviazione?", type: "select", options: YN },
    { key: "prevalenza_masticazione", label: "Prevalenza masticazione", type: "select", options: ["No", "Destra", "Sinistra"] },
  ]},
  { id: "fonazione", title: "Fonazione", questions: [
    { key: "farfalla", label: "Farfalla: movimento coordinato?", type: "select", options: YN },
    { key: "mann", label: "Mann: buon tono linguale?", type: "select", options: YN },
    { key: "esposizione_incisale", label: "III: buona esposizione incisale?", type: "select", options: YN },
    { key: "esposizione_gengivale", label: "Esposizione gengivale?", type: "select", options: YN },
    { key: "conta_60_70", label: "Conta da 60 a 70: buona dinamica?", type: "select", options: YN },
  ]},
  { id: "frenulo_vestibolare", title: "Frenulo vestibolare", questions: [
    { key: "sup_interincisale", label: "Frenulo superiore: inserzione interincisale?", type: "select", options: YN },
    { key: "inf_interincisale", label: "Frenulo inferiore: inserzione interincisale?", type: "select", options: YN },
    { key: "eta_8", label: "Il bambino ha più di 8 anni?", type: "select", options: YN },
    { key: "laterali_sup", label: "Sono spuntati gli incisivi laterali superiori?", type: "select", options: YN },
    { key: "laterali_inf", label: "Sono spuntati gli incisivi laterali inferiori?", type: "select", options: YN },
  ]},
  { id: "frenulo_linguale", title: "Frenulo linguale (Marchesan)", questions: [
    { key: "max_apertura_lt4", label: "Massima apertura < 4 cm?", type: "select", options: YN },
    { key: "riduzione_50", label: "Apertura con lingua allo spot: si riduce ≥ 50%?", type: "select", options: YN },
    { key: "depressione_punta", label: "Depressione/fessura nella punta della lingua?", type: "select", options: YN },
    { key: "vicino_alveoli", label: "Inserzione molto vicina agli alveoli inferiori?", type: "select", options: YN },
    { key: "vicino_punta", label: "Inserzione molto vicina alla punta della lingua?", type: "select", options: YN },
    { key: "protrusione_anomala", label: "Protrusione: lingua si incurva/devia/forma depressioni?", type: "select", options: YN },
  ]},
  { id: "lingua_guance", title: "Lingua e guance", questions: [
    { key: "lingua_standard", label: "Lingua: forma standard?", type: "select", options: YN },
    { key: "lingua_lesioni", label: "Lingua: lesioni o macchie?", type: "select", options: YN },
    { key: "guance_macchie", label: "Guance: macchie o placche?", type: "select", options: YN },
  ]},
  { id: "tonsille", title: "Tonsille", questions: [
    { key: "tonsille", label: "Stato tonsille", type: "multi", options: ["Normotrofiche", "Ipertrofiche", "Ipertrofia cronica"] },
  ]},
  { id: "respiratoria", title: "Funzione respiratoria", questions: [
    { key: "facies_adenoidea", label: "Facies adenoidea?", type: "select", options: YN },
    { key: "occhiaie", label: "Occhiaie?", type: "select", options: YN },
    { key: "glatzel", label: "Test specchietto Glatzel", type: "select", options: POS_NEG },
  ]},
  { id: "atm_muscolari", title: "ATM — Disordini muscolari", questions: [
    { key: "dolore_riferito", label: "Dolore riferito ai muscoli masticatori (riposo o masticazione)?", type: "select", options: YN },
    { key: "dolore_palpazione", label: "Dolore alla palpazione con sito positivo omolaterale?", type: "select", options: YN },
    { key: "apertura_lt40", label: "Apertura mandibolare < 40 mm (3 dita)?", type: "select", options: YN },
  ]},
  { id: "atm_disco", title: "ATM — Dislocazione disco", questions: [
    { key: "click", label: "Dislocazione con riduzione: click articolare?", type: "select", options: YN },
  ]},
  { id: "palpazione", title: "Palpazione muscoli (0-10)", questions: [
    { key: "massetere_dx", label: "Massetere DX", type: "number" },
    { key: "massetere_sx", label: "Massetere SX", type: "number" },
    { key: "temporale_dx", label: "Temporale DX", type: "number" },
    { key: "temporale_sx", label: "Temporale SX", type: "number" },
    { key: "pter_med_dx", label: "Pterigoideo mediale DX", type: "number" },
    { key: "pter_med_sx", label: "Pterigoideo mediale SX", type: "number" },
    { key: "pter_lat_dx", label: "Pterigoideo laterale DX", type: "number" },
    { key: "pter_lat_sx", label: "Pterigoideo laterale SX", type: "number" },
    { key: "trapezio_dx", label: "Trapezio DX", type: "number" },
    { key: "trapezio_sx", label: "Trapezio SX", type: "number" },
    { key: "scm_dx", label: "Sternocleidomastoideo DX", type: "number" },
    { key: "scm_sx", label: "Sternocleidomastoideo SX", type: "number" },
  ]},
  { id: "opt", title: "Esami strumentali — OPT", questions: [
    { key: "condili_asimmetrici", label: "Condili asimmetrici?", type: "select", options: YN },
    { key: "condili_simmetrici", label: "Condili: forma simmetrica?", type: "select", options: YN },
    { key: "seni_dimensione", label: "Seni nasali: dimensione standard?", type: "select", options: YN },
    { key: "seni_trasparenti", label: "Seni in OPT: trasparenti (neri)?", type: "select", options: YN },
    { key: "seni_simmetrici", label: "Seni nasali: simmetrici?", type: "select", options: YN },
    { key: "agenesie_decidui", label: "Agenesie denti decidui?", type: "select", options: YN },
    { key: "agenesie_definitivi", label: "Agenesie denti definitivi?", type: "select", options: YN },
    { key: "germi_ottavi", label: "Germi degli ottavi?", type: "select", options: YN },
  ]},
  { id: "barre", title: "Esame posturale — Test Colpo di Frusta (Barré)", questions: [
    { key: "barre_diff", label: "Differenza lunghezza tra mano DX e SX?", type: "select", options: ["No", "DX più lunga", "SX più lunga"] },
  ]},
  { id: "romberg", title: "Test di Romberg", questions: [
    { key: "romberg_bipodalico", label: "Romberg bipodalico", type: "select", options: POS_NEG },
    { key: "romberg_dx", label: "Romberg monopodalico DX", type: "select", options: POS_NEG },
    { key: "romberg_sx", label: "Romberg monopodalico SX", type: "select", options: POS_NEG },
  ]},
  { id: "fukuda", title: "Test di Unterberger-Fukuda", questions: [
    { key: "marcia_neutra", label: "Marcia sul posto, posizione neutra", type: "select", options: ["Nessuno spin", "Spin DX", "Spin SX"] },
    { key: "marcia_dx", label: "Marcia con testa girata a destra", type: "select", options: ["Nessuno spin", "Spin DX", "Spin SX"] },
    { key: "marcia_sx", label: "Marcia con testa girata a sinistra", type: "select", options: ["Nessuno spin", "Spin DX", "Spin SX"] },
    { key: "fukuda_normalizza", label: "Il test normalizza con", type: "multi", options: ["Lingua allo spot", "Deglutizione corretta", "Plantare", "Bite", "Altro"] },
  ]},
  { id: "fontana", title: "Test di Fontana", questions: [
    { key: "fontana_sx", label: "Test mano SX", type: "select", options: ["Forte", "Debole"] },
    { key: "fontana_sx_spot", label: "Test mano SX con lingua allo spot", type: "select", options: ["Forte", "Debole"] },
  ]},
  { id: "bassani", title: "Test di Bassani", questions: [
    { key: "bassani_sale", label: "Bassani sale a", type: "select", options: ["Nessuno", "DX", "SX"] },
  ]},
  { id: "rotazione_capo", title: "Rotazione del capo", questions: [
    { key: "rot_dx_vede", label: "Rotazione DX vede", type: "select", options: ["Occhio", "Braccio", "Altro"] },
    { key: "rot_sx_vede", label: "Rotazione SX vede", type: "select", options: ["Occhio", "Braccio", "Altro"] },
  ]},
  { id: "simmetria", title: "Valutazione simmetria", questions: [
    { key: "pelvic", label: "Pelvic Balance", type: "select", options: ["Bacino simmetrico", "Alto a DX", "Alto a SX"] },
    { key: "acromion", label: "Acromion Balance", type: "select", options: ["Spalle simmetriche", "Alta a DX", "Alta a SX"] },
    { key: "leg", label: "Leg Balance", type: "select", options: ["Piedi simmetrici", "Piede corto DX", "Piede corto SX"] },
    { key: "piede_normalizza", label: "Piede normalizza con", type: "multi", options: ["Lingua allo spot", "Deglutizione corretta", "Plantare", "Bite", "Altro"] },
  ]},
  { id: "autet", title: "Test dei rotatori dell'anca (Autet)", questions: [
    { key: "autet_restrizione", label: "Restrizione intrarotazionale", type: "select", options: ["Nessuna", "DX", "SX"] },
    { key: "autet_normalizza", label: "Normalizza con", type: "multi", options: ["Omolaterale rotazione interna (mano su spalla opposta)", "Lingua allo spot", "Deglutizione corretta", "Plantare", "Altro"] },
    { key: "sindrome_posturale", label: "Sindrome posturale", type: "select", options: ["Ascendente", "Discendente", "Mista"] },
  ]},
  { id: "oculare", title: "Test oculare e oculomotricità", questions: [
    { key: "convergenza", label: "Convergenza sincrona?", type: "select", options: YN },
  ]},
  { id: "terapia", title: "Protocollo terapeutico", questions: [
    { key: "terapie", label: "Terapie consigliate", type: "multi", options: ["Terapia miofunzionale", "Terapia elastodontica", "Terapia con fotobiomodulazione", "Rialzi occlusali", "Molaggi selettivi", "Espansore", "Bite", "Altro"] },
    { key: "note_terapia", label: "Note aggiuntive sul protocollo", type: "longtext" },
  ]},
];
