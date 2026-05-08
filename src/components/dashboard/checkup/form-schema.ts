// Schema della form Check Up Ortodontico Posturale
// Sorgente di verità: rendering data-driven via QuestionRenderer.

export type QuestionType =
  | "radio_si_no"
  | "radio"
  | "multi_checkbox"
  | "radio_scale_1_10"
  | "textarea"
  | "numeric_kg"
  | "dental_chart_fdi"
  | "body_map";

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  options?: string[];
}

export interface Section {
  id: string;
  label: string;
  questions: Question[];
}

export const MODULE_NAME = "Check up Ortodontico Posturale";

export const SECTIONS: Section[] = [
  {
    id: "anamnesi",
    label: "Anamnesi",
    questions: [
      { id: "sintomi_motivo_visita", type: "textarea", label: "Sintomi e motivo della visita" },
      { id: "farmaci_assume", type: "textarea", label: "Farmaci che assume" },
      { id: "tipo_parto", type: "radio", label: "Tipo di parto", options: ["Spontaneo", "Cesareo", "Indotto (ventosa, forcipe)"] },
      { id: "sonno", type: "multi_checkbox", label: "Sonno (Qualità, durata)", options: ["Sonno continuo", "Sonno intermittente (si sveglia di notte)", "Respira oralmente", "Russa", "Si sveglia stanco", "Bruxismo/serramento"] },
      { id: "bruxismo", type: "radio_si_no", label: "Bruxismo" },
      { id: "sport", type: "radio_si_no", label: "Sport" },
      { id: "traumi_incidenti", type: "radio_si_no", label: "Traumi e/o incidenti" },
      { id: "traumi_emotivi", type: "radio_si_no", label: "Traumi emotivi" },
      { id: "interventi_chirurgici", type: "radio_si_no", label: "Interventi chirurgici" },
      { id: "occhiali", type: "radio_si_no", label: "Occhiali" },
      { id: "apparecchi_ortodontici", type: "radio_si_no", label: "Apparecchi ortodontici" },
      { id: "apparecchi_acustici", type: "radio_si_no", label: "Apparecchi acustici" },
      { id: "suolette_plantari", type: "radio_si_no", label: "Suole o plantari" },
    ],
  },
  {
    id: "recettore_vestibolare",
    label: "Recettore vestibolare e salute dell'orecchio",
    questions: [
      { id: "otiti_ricorrenti", type: "radio_si_no", label: "Hai mai sofferto di otiti ricorrenti?" },
      { id: "otiti_dettagli", type: "textarea", label: "Se sì: età/frequenza/ultimo episodio" },
      { id: "otiti_sierose", type: "radio_si_no", label: "Hai mai avuto otiti sierose con catarro persistente?" },
      { id: "labirintite", type: "radio_si_no", label: "Hai mai avuto casi di labirintite?" },
      { id: "meniere", type: "radio_si_no", label: "Le è mai stata diagnosticata la Malattia di Menière?" },
      { id: "ipoacusia", type: "radio_si_no", label: "Ha mai avuto casi di ipoacusia (riduzione dell'udito) improvvisa?" },
      { id: "traumi_cranici_orecchio", type: "radio_si_no", label: "Ha mai avuto traumi cranici con interessamento dell'orecchio?" },
      { id: "acufeni", type: "radio_si_no", label: "Sente ronzii o fischi (acufeni)?" },
      { id: "sbandamento", type: "radio_si_no", label: "Hai mai avuto casi di labirintite o sensazioni di sbandamento?" },
    ],
  },
  {
    id: "esame_orale",
    label: "Esame Orale",
    questions: [
      { id: "dentizione", type: "radio", label: "Dentizione", options: ["Decidua", "Definitiva", "Mista"] },
      { id: "dismorfosi", type: "multi_checkbox", label: "Dismorfosi", options: ["Cross monolaterale", "Cross bilaterale", "Morso inverso anteriore", "Palato stretto", "Morso chiuso", "Morso profondo", "Open", "Affollamento"] },
      { id: "classe_dentale", type: "radio", label: "Classe Dentale", options: ["I Classe", "II Classe", "III Classe"] },
      { id: "protesi_totali", type: "dental_chart_fdi", label: "Protesi totali" },
    ],
  },
  {
    id: "foto",
    label: "Foto",
    questions: [
      { id: "foto_endorali", type: "multi_checkbox", label: "Foto Endorali", options: ["Arcata superiore", "Arcata inferiore", "Arcata in occlusione", "Laterale dx in occlusione", "Laterale sx in occlusione", "Sorriso"] },
    ],
  },
  {
    id: "funzione",
    label: "Funzione",
    questions: [
      { id: "lateralita_sx_precontatti", type: "radio_si_no", label: "Movimenti di lateralità Sx: precontatti?" },
      { id: "lateralita_dx_precontatti", type: "radio_si_no", label: "Movimenti di lateralità Dx: precontatti?" },
      { id: "protrusiva_precontatti", type: "radio_si_no", label: "Movimenti di protrusiva: precontatti?" },
      { id: "apertura_deviazione", type: "radio_si_no", label: "Movimento di apertura: deviazione?" },
      { id: "prevalenza_masticazione", type: "radio", label: "Prevalenza masticazione?", options: ["No", "Dx", "Sx"] },
    ],
  },
  {
    id: "fonazione",
    label: "Fonazione",
    questions: [
      { id: "farfalla", type: "radio_si_no", label: "Farfalla: movimento coordinato?" },
      { id: "mann", type: "radio_si_no", label: "Mann: buon tono linguale?" },
      { id: "esposizione_incisale", type: "radio_si_no", label: "III buona esposizione incisale?" },
      { id: "esposizione_gengivale", type: "radio_si_no", label: "Esposizione gengivale?" },
      { id: "conta_60_70", type: "radio_si_no", label: "Conta da 60 a 70. Buona dinamica?" },
      { id: "protrusiva_eccessiva", type: "radio_si_no", label: "Tendenza ad eccessiva protrusiva?" },
    ],
  },
  {
    id: "frenulo_vestibolare",
    label: "Frenulo Vestibolare",
    questions: [
      { id: "frenulo_sup_interincisale", type: "radio_si_no", label: "Frenulo superiore ha inserzione interincisale?" },
      { id: "frenulo_inf_interincisale", type: "radio_si_no", label: "Frenulo inferiore ha inserzione interincisale?" },
      { id: "bambino_8_anni", type: "radio_si_no", label: "Il bambino ha più di 8 anni?" },
      { id: "incisivi_sup_spuntati", type: "radio_si_no", label: "Sono spuntati gli incisivi laterali superiori?" },
      { id: "incisivi_inf_spuntati", type: "radio_si_no", label: "Sono spuntati gli incisivi laterali inferiori?" },
    ],
  },
  {
    id: "frenulo_linguale",
    label: "Frenulo Linguale (protocollo Marchesan)",
    questions: [
      { id: "max_apertura_4cm", type: "radio_si_no", label: "Max apertura bocca è < 4 cm?" },
      { id: "apertura_lingua_spot", type: "radio_si_no", label: "Apertura con lingua allo spot: si riduce di >= 50%?" },
      { id: "forma_lingua_punta", type: "radio_si_no", label: "Forma lingua in max apertura: è presente depressione o fessura nella punta?" },
      { id: "inserzione_pavimento", type: "radio_si_no", label: "Inserzione sul pavimento orale: è molto vicina agli alveoli degli incisivi inferiori?" },
      { id: "inserzione_lingua", type: "radio_si_no", label: "Inserzione sulla lingua: si inserisce molto vicino alla punta della lingua?" },
      { id: "protrusione_lingua", type: "radio_si_no", label: "Protrusione lingua: la lingua si incurva, devia o forma depressioni al centro?" },
    ],
  },
  {
    id: "lingua",
    label: "Lingua",
    questions: [
      { id: "forma_standard", type: "radio_si_no", label: "Forma standard?" },
      { id: "forma_piatta_larga", type: "radio_si_no", label: "Forma piatta e larga?" },
      { id: "forma_lunga_sottile", type: "radio_si_no", label: "Forma lunga e sottile?" },
      { id: "forma_improntata", type: "radio_si_no", label: "Forma improntata?" },
      { id: "lesioni_macchie", type: "radio_si_no", label: "Lesioni e/o macchie? se sì, fare foto e annotare" },
      { id: "lesioni_15gg", type: "radio_si_no", label: "Lesioni/macchie presenti da 15 giorni?" },
      { id: "lesioni_peggiorate", type: "radio_si_no", label: "Lesioni/macchie peggiorate negli ultimi 5 giorni?" },
      { id: "dolore_aumentato", type: "radio_si_no", label: "E' aumentato il dolore negli ultimi 5 giorni?" },
      { id: "sanguinante", type: "radio_si_no", label: "E' costantemente sanguinante?" },
      { id: "fattori_scatenanti", type: "radio_si_no", label: "Si osserva eventuali fattori scatenanti come traumi, protesi, abitudini viziate, fumo, alcol?" },
      { id: "linfonodi_ingrossati", type: "radio_si_no", label: "I linfonodi sottomentonieri, sottomandibolari e cervicali sono ingrossati?" },
      { id: "patologie_pregresse", type: "multi_checkbox", label: "Il PZ ha patologie pregresse?", options: ["No", "Lichen planus", "Infezioni virali", "Immunodeficienze"] },
      { id: "impronte_denti", type: "radio_si_no", label: "Sono presenti impronte dei denti?" },
    ],
  },
  {
    id: "guance",
    label: "Guance",
    questions: [
      { id: "macchie_placche", type: "radio_si_no", label: "Macchie e/o placche? se sì, fare foto e annotare" },
      { id: "macchie_15gg", type: "radio_si_no", label: "Macchie e/o placche presenti da 15 giorni?" },
      { id: "macchie_peggiorate", type: "radio_si_no", label: "Macchie e/o placche peggiorate negli ultimi 5 giorni?" },
      { id: "dolore_aumentato_guance", type: "radio_si_no", label: "E' aumentato il dolore negli ultimi 5 giorni?" },
      { id: "sanguinante_guance", type: "radio_si_no", label: "E' costantemente sanguinante?" },
      { id: "fattori_scatenanti_guance", type: "radio_si_no", label: "Si osserva eventuali fattori scatenanti come traumi, protesi, abitudini viziate, fumo, alcol?" },
      { id: "linfonodi_guance", type: "radio_si_no", label: "I linfonodi sottomentonieri, sottomandibolari e cervicali sono ingrossati?" },
      { id: "patologie_pregresse_guance", type: "multi_checkbox", label: "Il PZ ha patologie pregresse?", options: ["No", "Lichen planus", "Infezioni virali", "Immunodeficienze"] },
    ],
  },
  {
    id: "tonsille",
    label: "Tonsille",
    questions: [
      { id: "normotrofiche", type: "radio_si_no", label: "Normotrofiche?" },
      { id: "ipertrofiche", type: "radio_si_no", label: "Ipertrofiche?" },
      { id: "ipertrofia_cronica", type: "radio_si_no", label: "Ipertrofia cronica?" },
    ],
  },
  {
    id: "funzione_respiratoria",
    label: "Funzione Respiratoria",
    questions: [
      { id: "facies_adenoidea", type: "radio_si_no", label: "Facies adenoidea?" },
      { id: "occhiaie", type: "radio_si_no", label: "Occhiaie?" },
      { id: "glatzel", type: "radio", label: "Test specchietto Glatzel", options: ["Positivo", "Negativo"] },
    ],
  },
  {
    id: "atm_dolore_miofasciale",
    label: "ATM Disordini Muscolari - Dolore Miofasciale",
    questions: [
      { id: "dolore_masticatori", type: "radio_si_no", label: "Dolore riferito ai muscoli masticatori (faccia, tempie, orecchie) a riposo o durante la masticazione?" },
      { id: "dolore_palpazione", type: "radio_si_no", label: "Dolore alla palpazione con almeno un sito positivo omolaterale al dolore riferito?" },
      { id: "apertura_40mm", type: "radio_si_no", label: "Apertura mandibolare minore di 40 mm (3 dita del paziente)?" },
    ],
  },
  {
    id: "atm_dislocazione_disco",
    label: "ATM Dislocazione del Disco",
    questions: [
      { id: "disloc_con_riduzione", type: "radio_si_no", label: "Dislocazione con riduzione: rumore articolare con click durante i movimenti articolari?" },
      { id: "disloc_senza_rid_limit", type: "radio_si_no", label: "Dislocazione senza riduzione con limitazione. Assenza di rumore (click), apertura mandibolare minore di 35 mm?" },
      { id: "disloc_senza_rid_no_limit", type: "radio_si_no", label: "Dislocazione senza riduzione senza limitazione: storia pregressa di blocco articolare" },
    ],
  },
  {
    id: "atm_artralgia",
    label: "ATM Artralgia, Osteoartrite, Osteoartrosi",
    questions: [
      { id: "dolore_articolazioni", type: "radio_si_no", label: "Dolore riferito alle articolazioni a riposo o in funzione" },
      { id: "crepitio", type: "radio_si_no", label: 'Presenza di rumore articolare "crepitio"' },
    ],
  },
  {
    id: "atm_ipoplasie_condilari",
    label: "ATM Ipoplasie condilari",
    questions: [
      { id: "ipoplasie_condilari", type: "radio_si_no", label: "Ipoplasie condilari?" },
    ],
  },
  {
    id: "palpazione_muscoli",
    label: "Palpazione Muscoli",
    questions: [
      { id: "massetere_dx", type: "radio_scale_1_10", label: "Massetere dx" },
      { id: "massetere_sx", type: "radio_scale_1_10", label: "Massetere sx" },
      { id: "temporale_dx", type: "radio_scale_1_10", label: "Temporale dx" },
      { id: "temporale_sx", type: "radio_scale_1_10", label: "Temporale sx" },
      { id: "pterigoideo_lat_dx", type: "radio_scale_1_10", label: "Pterigoideo laterale dx" },
      { id: "pterigoideo_lat_sx", type: "radio_scale_1_10", label: "Pterigoideo laterale sx" },
      { id: "pterigoideo_med_dx", type: "radio_scale_1_10", label: "Pterigoideo mediale dx" },
      { id: "pterigoideo_med_sx", type: "radio_scale_1_10", label: "Pterigoideo mediale sx" },
      { id: "trapezio_dx", type: "radio_scale_1_10", label: "Trapezio dx" },
      { id: "trapezio_sx", type: "radio_scale_1_10", label: "Trapezio sx" },
      { id: "scm_dx", type: "radio_scale_1_10", label: "Sternocleidomastoideo dx" },
      { id: "scm_sx", type: "radio_scale_1_10", label: "Sternocleidomastoideo sx" },
    ],
  },
  {
    id: "esami_opt",
    label: "Esami Strumentali - OPT",
    questions: [
      { id: "condili_asimmetrici", type: "radio_si_no", label: "Condili asimmetrici?" },
      { id: "condili_simmetrici", type: "radio_si_no", label: "Condili forma simmetrica?" },
      { id: "condilo_piatto_tozzo", type: "radio_si_no", label: "Condilo con forma piatta e tozza, condilo lavorante?" },
      { id: "condilo_esile_fine", type: "radio_si_no", label: "Condilo esile e fine?" },
      { id: "seni_dim_standard", type: "radio_si_no", label: "Seni nasali dimensione standard?" },
      { id: "seni_simmetrici", type: "radio_si_no", label: "Seni nasali sono simmetrici?" },
      { id: "seni_trasparenti", type: "radio_si_no", label: "Seni in OPT risultano trasparenti (neri)?" },
      { id: "radio_opacita_diffusa", type: "radio_si_no", label: "Seni in OPT risultano avere radio-opacità diffusa?" },
      { id: "radio_opacita_localizzata", type: "radio_si_no", label: "Seni in OPT risultano avere radio-opacità localizzata?" },
      { id: "agenesie_decidui", type: "radio_si_no", label: "Ci sono agenesie di denti decidui?" },
      { id: "agenesie_definitivi", type: "radio_si_no", label: "Ci sono agenesie di denti definitivi?" },
      { id: "impianti", type: "radio_si_no", label: "Impianti?" },
      { id: "germi_ottavi", type: "radio_si_no", label: "Germi degli ottavi?" },
      { id: "ottavi_inclusi", type: "radio_si_no", label: "Ottavi inclusi?" },
      { id: "recessioni_gengivali", type: "radio_si_no", label: "Recessioni gengivali?" },
      { id: "agenesie_chart", type: "dental_chart_fdi", label: "Agenesie" },
      { id: "lacune_chart", type: "dental_chart_fdi", label: "Lacune" },
      { id: "carie_granulomi_cisti", type: "dental_chart_fdi", label: "Carie, granulomi, cisti?" },
    ],
  },
  {
    id: "esami_rx_ap",
    label: "Esami Strumentali - Rx Antero-Posteriore",
    questions: [
      { id: "simmetria_facciale_cranica", type: "radio_si_no", label: "Simmetria facciale e cranica?" },
      { id: "rapporti_trasversali", type: "radio_si_no", label: "Rapporti trasversali simmetrici?" },
      { id: "posizione_mascellari", type: "radio_si_no", label: "La posizione dei mascellari è corretta rispetto alla linea mediana?" },
      { id: "asimmetria_marcata", type: "radio_si_no", label: "Asimmetria marcata?" },
    ],
  },
  {
    id: "esami_teleradiografia",
    label: "Esami Strumentali - Teleradiografia",
    questions: [
      { id: "limiti_rialzo", type: "radio_si_no", label: "Ci sono limiti nel rialzo?" },
      { id: "lordosi_cervicale", type: "radio", label: "Lordosi cervicale", options: ["Rettilinizzazione", "Iperlordosi", "Normo"] },
      { id: "osso_ioide_c2_c3", type: "radio_si_no", label: "Osso ioide si trova tra C2-C3?" },
      { id: "forma_vertebre", type: "radio", label: "Forma vertebre (età metabolica)", options: ["Corpi vertebrali trapezoidali, bordi poco concavi (pre pubertà)", "Inizio concavità inferiore, aumento altezza (pubertà)", "Corpi rettangolari con concavità marcata (post-pubertà)", "Corpi più squadrati e completi (maturità)"] },
      { id: "vie_aeree", type: "radio_si_no", label: "Vie aeree ben rappresentate?" },
    ],
  },
  {
    id: "post_cicatrici",
    label: "Esame Posturale - Cicatrici",
    questions: [
      { id: "cicatrici_visibili", type: "body_map", label: "Cicatrici visibili" },
    ],
  },
  {
    id: "post_colpo_frusta",
    label: "Esame Posturale - Test Colpo di Frusta (di Barré)",
    questions: [
      { id: "diff_lunghezza_mani", type: "radio", label: "C'è differenza di lunghezza tra mano DX e SX?", options: ["No", "Più lunga mano DX", "Più lunga mano SX"] },
      { id: "normalizza_testa_estensione", type: "radio_si_no", label: "Normalizza con testa in estensione?" },
    ],
  },
  {
    id: "post_romberg",
    label: "Esame Posturale - Test di Romberg",
    questions: [
      { id: "romberg_bipodalico", type: "radio", label: "ROMBERG Bipodalico", options: ["Positivo", "Negativo"] },
      { id: "romberg_mono_dx", type: "radio", label: "ROMBERG Monopodalico DX", options: ["Positivo", "Negativo"] },
      { id: "romberg_mono_sx", type: "radio", label: "ROMBERG Monopodalico SX", options: ["Positivo", "Negativo"] },
    ],
  },
  {
    id: "post_unterbergher_fukuda",
    label: "Esame Posturale - Test di Unterbergher-Fukuda",
    questions: [
      { id: "marcia_neutra", type: "multi_checkbox", label: "Marcia sul posto in posizione neutra:", options: ["Spin DX", "Spin SX", "Spin Neutro"] },
      { id: "marcia_testa_dx", type: "multi_checkbox", label: "Marcia sul posto con la testa girata a destra:", options: ["Spin DX", "Spin SX", "Spin Neutro"] },
      { id: "marcia_testa_sx", type: "multi_checkbox", label: "Marcia sul posto con la testa girata a sinistra:", options: ["Spin DX", "Spin SX", "Spin Neutro"] },
      { id: "normalizza_uf", type: "multi_checkbox", label: "Il test normalizza con:", options: ["Lingua allo spot", "Rulli cotone (ATM)", "Non normalizza"] },
    ],
  },
  {
    id: "post_fontana",
    label: "Esame Posturale - Test di Fontana",
    questions: [
      { id: "fontana_mano_dx", type: "numeric_kg", label: "Test mano DX (Kg)" },
      { id: "fontana_mano_sx", type: "numeric_kg", label: "Test mano SX (Kg)" },
      { id: "fontana_lingua_spot_dx", type: "numeric_kg", label: "Test lingua allo spot - mano DX (Kg)" },
      { id: "fontana_lingua_spot_sx", type: "numeric_kg", label: "Test lingua allo spot - mano SX (Kg)" },
      { id: "fontana_placca_dx", type: "numeric_kg", label: "Test con placca/bite - mano DX (Kg)" },
      { id: "fontana_placca_sx", type: "numeric_kg", label: "Test con placca/bite - mano SX (Kg)" },
    ],
  },
  {
    id: "post_bassani",
    label: "Esame Posturale - Test di Bassani",
    questions: [
      { id: "bassani_sale", type: "radio", label: "Bassani sale a?", options: ["Non sale", "DX", "SX", "Simmetrico"] },
    ],
  },
  {
    id: "post_rotazione_capo",
    label: "Esame Posturale - Test Rotazione del Capo",
    questions: [
      { id: "rotazione_dx_vede", type: "multi_checkbox", label: "Rotazione DX vede:", options: ["Polso", "Braccio", "Spalla", "Occhio"] },
      { id: "rotazione_sx_vede", type: "multi_checkbox", label: "Rotazione SX vede:", options: ["Polso", "Braccio", "Spalla", "Occhio"] },
    ],
  },
  {
    id: "post_simmetria",
    label: "Esame Posturale - Valutazione Simmetria",
    questions: [
      { id: "pelvic_balance", type: "radio", label: "Pelvic Balance: Bacino simmetrico", options: ["Sì", "Alto a DX", "Alto a SX"] },
      { id: "acromion_balance", type: "radio", label: "Acromion Balance: Spalle simmetriche", options: ["Sì", "Alta a DX", "Alta a SX"] },
      { id: "leg_balance", type: "radio", label: "Leg Balance: Piedi simmetrici", options: ["Sì", "Piede corto DX", "Piede corto SX"] },
      { id: "piede_normalizza", type: "multi_checkbox", label: "Piede normalizza?", options: ["No", "Con lingua allo spot", "Con rulli tra le arcate", "Ad occhi chiusi"] },
    ],
  },
  {
    id: "post_rotatori_anca",
    label: "Esame Posturale - Test dei Rotatori dell'Anca o di Autet",
    questions: [
      { id: "restrizione_intrarotazionale", type: "multi_checkbox", label: "Restrizione intrarotazionale", options: ["DX", "SX", "No"] },
      { id: "normalizza_autet", type: "multi_checkbox", label: "Normalizza con:", options: ["Controlaterale rot. esterna (mano nuca)", "Omolaterale rot. interna (mano su spalla opposta)", "Lingua spot", "Rulli cotone", "Occhi chiusi", "Stimolazione viscerale", "Stimolazione punti emotivi (PC6 o SP21)"] },
      { id: "sindrome_posturale", type: "multi_checkbox", label: "Sindrome posturale", options: ["Ascendente", "Discendente", "Psico/emotiva", "Viscerale", "Mista"] },
    ],
  },
  {
    id: "post_oculare",
    label: "Esame Posturale - Test Oculare e Oculomotricità",
    questions: [
      { id: "oculare_note", type: "textarea", label: "Note esame oculare e oculomotricità" },
    ],
  },
  {
    id: "post_corda_brock",
    label: "Esame Posturale - Test della Corda di Brock e Movimento Arti Inferiori",
    questions: [
      { id: "corde_viste", type: "radio", label: "Con focus su biglia quante corde si vedono?", options: ["1", "2", "3", "4"] },
      { id: "visione_piedi", type: "radio_si_no", label: "Cambia la visione muovendo i piedi?" },
    ],
  },
  {
    id: "protocollo_terapeutico",
    label: "Protocollo Terapeutico",
    questions: [
      { id: "terapie_consigliate", type: "multi_checkbox", label: "Quali terapie sono consigliate?", options: ["Terapia miofunzionale", "Terapia elastodontica", "Terapia multibrakets", "Terapia con mascherine trasparenti", "Terapia con fotobiomodulazione", "Cuscino giusto tono", "Placca di riposizionamento discale informata taopatch", "Mockup denti per ridistribuzione carichi masticatori", "Rialzi occlusali", "Molaggi selettivi", "Agopuntura"] },
    ],
  },
  {
    id: "mappa_dolore",
    label: "Mappa Dolore",
    questions: [
      { id: "mappa_dolore_marker", type: "body_map", label: "Mappa Dolore - clicca le zone dolenti" },
    ],
  },
];

// Helpers
export const HAS_NOTES = (t: QuestionType) =>
  t !== "textarea" && t !== "dental_chart_fdi" && t !== "body_map";

export const FDI_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const FDI_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export type BodyView =
  | "fronte" | "retro" | "lato_dx" | "lato_sx"
  | "testa_fronte" | "testa_lat_dx" | "testa_lat_sx"
  | "piedi" | "addome";

export interface BodyMarker {
  x: number;
  y: number;
  view: BodyView;
  side: "dx" | "sx";
}
