// Symptom categories for MTC Organica pattern identification
export interface Symptom {
  id: string;
  name: string;
}

export interface SymptomCategory {
  id: string;
  name: string;
  icon: string;
  symptoms: Symptom[];
}

export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    id: "digestive",
    name: "Apparato Digerente",
    icon: "🟡",
    symptoms: [
      { id: "d1", name: "Nausea / vomito" },
      { id: "d2", name: "Gonfiore addominale" },
      { id: "d3", name: "Diarrea" },
      { id: "d4", name: "Stipsi" },
      { id: "d5", name: "Reflusso gastroesofageo" },
      { id: "d6", name: "Inappetenza" },
      { id: "d7", name: "Fame eccessiva" },
      { id: "d8", name: "Feci molli" },
      { id: "d9", name: "Dolore epigastrico" },
      { id: "d10", name: "Bocca amara al mattino" },
      { id: "d11", name: "Sapore dolce in bocca" },
      { id: "d12", name: "Eruttazioni frequenti" },
    ],
  },
  {
    id: "respiratory",
    name: "Apparato Respiratorio",
    icon: "🔵",
    symptoms: [
      { id: "r1", name: "Tosse secca" },
      { id: "r2", name: "Tosse produttiva" },
      { id: "r3", name: "Dispnea / fiato corto" },
      { id: "r4", name: "Oppressione toracica" },
      { id: "r5", name: "Rinite / naso chiuso" },
      { id: "r6", name: "Voce debole" },
      { id: "r7", name: "Sudorazione spontanea" },
      { id: "r8", name: "Facilità a prendere freddo" },
    ],
  },
  {
    id: "cardiovascular",
    name: "Cuore / Circolazione",
    icon: "🔴",
    symptoms: [
      { id: "c1", name: "Palpitazioni" },
      { id: "c2", name: "Insonnia" },
      { id: "c3", name: "Sogni disturbanti" },
      { id: "c4", name: "Ansia" },
      { id: "c5", name: "Agitazione mentale" },
      { id: "c6", name: "Mani e piedi freddi" },
      { id: "c7", name: "Dolore precordiale" },
      { id: "c8", name: "Perdita di memoria" },
    ],
  },
  {
    id: "urogenital",
    name: "Rene / Urogenitale",
    icon: "⚫",
    symptoms: [
      { id: "u1", name: "Lombalgia" },
      { id: "u2", name: "Ginocchia deboli" },
      { id: "u3", name: "Minzione frequente" },
      { id: "u4", name: "Nicturia (minzione notturna)" },
      { id: "u5", name: "Tinnito / acufeni" },
      { id: "u6", name: "Vertigini" },
      { id: "u7", name: "Capelli fragili / caduta" },
      { id: "u8", name: "Denti deboli" },
      { id: "u9", name: "Calo del desiderio" },
      { id: "u10", name: "Edemi arti inferiori" },
      { id: "u11", name: "Vampate di calore" },
      { id: "u12", name: "Sudorazione notturna" },
    ],
  },
  {
    id: "hepatobiliary",
    name: "Fegato / Vescica Biliare",
    icon: "🟢",
    symptoms: [
      { id: "h1", name: "Irritabilità" },
      { id: "h2", name: "Frustrazione / rabbia repressa" },
      { id: "h3", name: "Distensione ipocondriaca" },
      { id: "h4", name: "Cefalea temporale" },
      { id: "h5", name: "Occhi secchi / arrossati" },
      { id: "h6", name: "Visione offuscata" },
      { id: "h7", name: "Crampi muscolari" },
      { id: "h8", name: "Unghie fragili" },
      { id: "h9", name: "Ciclo irregolare" },
      { id: "h10", name: "Dismenorrea" },
      { id: "h11", name: "Sindrome premestruale" },
      { id: "h12", name: "Sospiri frequenti" },
    ],
  },
  {
    id: "musculoskeletal",
    name: "Muscoli / Articolazioni",
    icon: "🟤",
    symptoms: [
      { id: "m1", name: "Dolore articolare diffuso" },
      { id: "m2", name: "Rigidità mattutina" },
      { id: "m3", name: "Dolore che migra" },
      { id: "m4", name: "Dolore fisso e pesante" },
      { id: "m5", name: "Dolore che peggiora col freddo" },
      { id: "m6", name: "Dolore che peggiora con l'umidità" },
      { id: "m7", name: "Debolezza muscolare" },
      { id: "m8", name: "Intorpidimento / formicolio" },
    ],
  },
  {
    id: "neuropsych",
    name: "Sistema Nervoso / Psiche",
    icon: "🟣",
    symptoms: [
      { id: "n1", name: "Stanchezza cronica" },
      { id: "n2", name: "Depressione" },
      { id: "n3", name: "Difficoltà di concentrazione" },
      { id: "n4", name: "Cefalea frontale" },
      { id: "n5", name: "Cefalea occipitale" },
      { id: "n6", name: "Emicrania" },
      { id: "n7", name: "Senso di oppressione" },
      { id: "n8", name: "Pianto facile" },
      { id: "n9", name: "Paura immotivata" },
      { id: "n10", name: "Voglia di stare soli" },
    ],
  },
  {
    id: "skin",
    name: "Pelle / Tegumenti",
    icon: "🟠",
    symptoms: [
      { id: "s1", name: "Pelle secca" },
      { id: "s2", name: "Prurito" },
      { id: "s3", name: "Eczema / dermatite" },
      { id: "s4", name: "Acne" },
      { id: "s5", name: "Orticaria" },
      { id: "s6", name: "Pallore cutaneo" },
      { id: "s7", name: "Colorito giallastro" },
    ],
  },
  {
    id: "general",
    name: "Sintomi Generali",
    icon: "⚪",
    symptoms: [
      { id: "g1", name: "Sensazione di freddo" },
      { id: "g2", name: "Sensazione di calore" },
      { id: "g3", name: "Alternanza caldo/freddo" },
      { id: "g4", name: "Sete eccessiva" },
      { id: "g5", name: "Assenza di sete" },
      { id: "g6", name: "Preferenza bevande calde" },
      { id: "g7", name: "Preferenza bevande fredde" },
      { id: "g8", name: "Astenia post-prandiale" },
      { id: "g9", name: "Sonnolenza diurna" },
    ],
  },
];
