// Spiegazioni cliniche per Check Up Ortodontico Posturale.
// `hint` = riga breve mostrata in tooltip (hover icona).
// `details` = testo esteso mostrato cliccando "Dettagli Test"
//   (come si esegue / come si interpreta).
// Sorgenti: knowledge clinica integrata (Marchesan, Glatzel, Romberg,
// Unterbergher-Fukuda, Bassani, Fontana, Autet, Brock, Barré, FDI).

export interface InfoEntry {
  hint: string;
  details?: string;
}

export const SECTION_INFO: Record<string, InfoEntry> = {
  anamnesi: {
    hint: "Raccolta dati storici e abitudinari del paziente.",
    details:
      "Esecuzione: intervista guidata su sintomi, farmaci, parto, sonno, sport, traumi, dispositivi (occhiali, apparecchi, plantari).\nInterpretazione: identifica fattori predisponenti (parto traumatico, respirazione orale, bruxismo, traumi pregressi) che possono spiegare alterazioni occluso-posturali e orientare la diagnosi.",
  },
  recettore_vestibolare: {
    hint: "Valuta integrità del sistema vestibolare e dell'orecchio medio.",
    details:
      "Esecuzione: indaga storia di otiti, labirintiti, Menière, ipoacusie, acufeni e traumi cranici con coinvolgimento auricolare.\nInterpretazione: un recettore vestibolare alterato genera squilibri posturali ascendenti; positività indirizza verso valutazione ORL e correlazione con disturbi dell'equilibrio.",
  },
  esame_orale: {
    hint: "Ispezione clinica di arcate, occlusione e protesi.",
    details:
      "Esecuzione: osservazione diretta della dentizione (decidua/mista/definitiva), morfologia delle arcate, classe dentale di Angle e dismorfosi (cross-bite, open-bite, morso profondo, affollamento).\nInterpretazione: dismorfosi e malocclusioni sono indicatori chiave di disfunzioni miofunzionali e posturali.",
  },
  foto: {
    hint: "Documentazione fotografica intraorale standard.",
    details:
      "Esecuzione: scatti con divaricatori e specchietti — arcate superiore/inferiore occlusali, frontale in occlusione, laterali dx/sx, sorriso.\nInterpretazione: serve a documentare lo stato iniziale e monitorare l'evoluzione del trattamento.",
  },
  funzione: {
    hint: "Test dei movimenti mandibolari di base.",
    details:
      "Esecuzione: paziente esegue lateralità dx/sx, protrusiva e apertura. Si valuta presenza di precontatti dentali, deviazioni del tragitto e prevalenza masticatoria.\nInterpretazione: precontatti e deviazioni indicano interferenze occlusali; lateralità masticatoria preferenziale è segno di asimmetria muscolare/articolare.",
  },
  fonazione: {
    hint: "Valutazione coordinazione neuromuscolare oro-facciale.",
    details:
      "Esecuzione: si chiede al paziente di eseguire il movimento 'farfalla' con la lingua, il test di Mann (tono linguale), pronuncia con esposizione incisale, conteggio 60-70.\nInterpretazione: alterazioni indicano deglutizione atipica, tono linguale insufficiente o pattern di compenso fonatorio.",
  },
  frenulo_vestibolare: {
    hint: "Inserzione dei frenuli labiali.",
    details:
      "Esecuzione: ispezione dell'inserzione del frenulo superiore e inferiore rispetto agli incisivi.\nInterpretazione: inserzione interincisale può causare diastema; intervento chirurgico va valutato in funzione dell'età e dell'eruzione degli incisivi laterali.",
  },
  frenulo_linguale: {
    hint: "Protocollo Marchesan per frenulo linguale corto.",
    details:
      "Esecuzione (Marchesan): 1) max apertura bocca; 2) apertura con punta lingua sullo spot palatino; 3) osservare forma della punta in protrusione; 4) inserzione sul pavimento e sulla lingua; 5) protrusione linguale.\nInterpretazione: positività multipla = anchiloglossia significativa; indicazione a frenulectomia/frenuloplastica con riabilitazione miofunzionale.",
  },
  lingua: {
    hint: "Morfologia e patologie della mucosa linguale.",
    details:
      "Esecuzione: ispezione di forma, dimensioni, presenza di impronte dentarie, lesioni o macchie. Palpazione dei linfonodi cervicali.\nInterpretazione: lingua improntata = macroglossia funzionale o iperattività; lesioni persistenti >15 gg richiedono biopsia per esclusione neoplasie.",
  },
  guance: {
    hint: "Ispezione mucosa giugale per lesioni.",
    details:
      "Esecuzione: ispezione visiva e palpatoria della mucosa giugale bilaterale, valutazione linfonodi.\nInterpretazione: lesioni bianche/rosse persistenti, sanguinanti o in peggioramento sono segnali di allarme oncologico; valutare fattori scatenanti (mordicchiamento, fumo, protesi traumatiche).",
  },
  tonsille: {
    hint: "Volumetria tonsillare e impatto sulle vie aeree.",
    details:
      "Esecuzione: ispezione orofaringea con abbassalingua.\nInterpretazione: ipertrofia cronica può causare respirazione orale, OSAS e facies adenoidea; richiede valutazione ORL.",
  },
  funzione_respiratoria: {
    hint: "Pattern respiratorio nasale vs orale.",
    details:
      "Esecuzione: osservazione fenotipo facciale (facies adenoidea, occhiaie) + test specchietto di Glatzel.\nInterpretazione: respirazione orale cronica altera lo sviluppo cranio-facciale e la postura cervicale.",
  },
  atm_dolore_miofasciale: {
    hint: "Diagnosi DC/TMD: dolore miofasciale.",
    details:
      "Esecuzione: anamnesi dolore + palpazione bilaterale dei masticatori + misurazione apertura mandibolare (3 dita ≈ 40 mm).\nInterpretazione: dolore evocato omolaterale al dolore riferito + apertura ridotta confermano dolore miofasciale.",
  },
  atm_dislocazione_disco: {
    hint: "Classifica dislocazioni discali secondo DC/TMD.",
    details:
      "Esecuzione: auscultazione/palpazione articolare durante apertura/chiusura, misurazione apertura.\nInterpretazione: click reciproco = dislocazione con riduzione; apertura <35 mm senza click = senza riduzione con limitazione; pregressi blocchi = senza riduzione senza limitazione.",
  },
  atm_artralgia: {
    hint: "Componente artrogena dell'ATM.",
    details:
      "Esecuzione: dolore articolare a riposo/in funzione + ricerca di crepitio.\nInterpretazione: crepitio = degenerazione cartilaginea (osteoartrosi); dolore articolare puro = artralgia.",
  },
  atm_ipoplasie_condilari: {
    hint: "Anomalie morfologiche del condilo.",
    details:
      "Esecuzione: valutazione clinica e imaging (OPT/CBCT).\nInterpretazione: ipoplasia condilare può causare asimmetrie facciali e malocclusioni di classe II/III scheletrica.",
  },
  palpazione_muscoli: {
    hint: "Mappa dolore muscoli masticatori e cervicali (scala 0-10).",
    details:
      "Esecuzione: palpazione bilaterale digitale dei muscoli (masseteri, temporali, pterigoidei, trapezi, SCM). Il paziente quantifica il dolore da 0 (nessuno) a 10 (massimo).\nInterpretazione: punteggi ≥4 indicano trigger points attivi; asimmetrie dx/sx orientano la diagnosi miofunzionale.",
  },
  esami_opt: {
    hint: "Lettura sistematica dell'ortopantomografia.",
    details:
      "Esecuzione: analisi di simmetria condilare, morfologia condilare, seni mascellari, agenesie, impianti, ottavi, recessioni gengivali; mappatura su schema FDI di agenesie/lacune/carie.\nInterpretazione: asimmetrie condilari + opacità sinusali + agenesie sono segni che orientano la diagnosi posturale e ortodontica.",
  },
  esami_rx_ap: {
    hint: "Telecranio in proiezione antero-posteriore.",
    details:
      "Esecuzione: analisi della simmetria scheletrica facciale rispetto alla linea mediana.\nInterpretazione: asimmetrie marcate = asimmetria scheletrica vera (vs compenso funzionale).",
  },
  esami_teleradiografia: {
    hint: "Analisi cefalometrica laterale.",
    details:
      "Esecuzione: misurazione lordosi cervicale, posizione osso ioide (riferimento C2-C3), morfologia vertebrale (età metabolica/maturazione scheletrica), pervietà delle vie aeree.\nInterpretazione: rettilinizzazione cervicale + ioide alto = pattern posturale alterato; forma vertebrale stima il picco di crescita residuo.",
  },
  post_cicatrici: {
    hint: "Mappatura cicatrici sulla mappa corporea.",
    details:
      "Esecuzione: marcare le cicatrici visibili (chirurgiche, traumatiche) sul body-map.\nInterpretazione: cicatrici attive possono creare aderenze fasciali e disfunzioni posturali a distanza (cicatrice patologica).",
  },
  post_colpo_frusta: {
    hint: "Test di Barré per asimmetria cervicale/colpo di frusta.",
    details:
      "Esecuzione: paziente seduto, braccia tese in avanti, palme rivolte verso l'alto, occhi chiusi. Si confronta la lunghezza relativa delle mani (pollici).\nInterpretazione: asimmetria = sospetta sindrome post colpo di frusta o disfunzione cervicale alta. Normalizzazione con testa in estensione conferma origine cervicale.",
  },
  post_romberg: {
    hint: "Stabilità posturale statica con feedback visivo.",
    details:
      "Esecuzione: in stazione bipodalica e poi monopodalica dx/sx, occhi chiusi per 30''.\nInterpretazione: oscillazioni eccessive o caduta = positivo; orienta verso disfunzioni propriocettive, vestibolari o cerebellari.",
  },
  post_unterbergher_fukuda: {
    hint: "Test di marcia sul posto: rivela lateralizzazione vestibolare.",
    details:
      "Esecuzione: paziente marcia sul posto a occhi chiusi (50 passi), prima in posizione neutra, poi con testa ruotata dx e sx. Si misura lo 'spin' (rotazione) finale.\nInterpretazione: spin >30° = positivo lato di rotazione; normalizzazione con lingua allo spot o rulli ATM identifica il recettore disfunzionante (linguale o occlusale).",
  },
  post_fontana: {
    hint: "Forza di prensione (dinamometro) come indicatore neuromuscolare.",
    details:
      "Esecuzione: si misura in Kg la forza di chiusura della mano dx e sx in 4 condizioni: base, lingua allo spot, con placca/bite.\nInterpretazione: aumento della forza in una condizione identifica il recettore stabilizzante; asimmetrie dx/sx evidenziano disfunzioni propriocettive lateralizzate.",
  },
  post_bassani: {
    hint: "Test di Bassani: salita su pedana per valutare appoggio.",
    details:
      "Esecuzione: paziente sale su un gradino/pedana osservando il primo arto utilizzato e la simmetria di carico.\nInterpretazione: lato di salita preferenziale indica arto dominante posturale; asimmetria può confermare lateralizzazione discendente.",
  },
  post_rotazione_capo: {
    hint: "Range di rotazione cervicale attiva.",
    details:
      "Esecuzione: paziente ruota il capo attivamente dx e sx, braccia rilasciate. Si annota fino a quale punto del proprio corpo arriva la visuale (polso, braccio, spalla, occhio).\nInterpretazione: limitazioni asimmetriche indicano restrizioni cervicali, miofasciali o ATM.",
  },
  post_simmetria: {
    hint: "Valutazione simmetria di bacino, spalle e arti inferiori.",
    details:
      "Esecuzione: paziente in piedi a occhi aperti — palpazione creste iliache (Pelvic Balance), acromion (Acromion Balance), allineamento arti inferiori (Leg Balance). Si testa la normalizzazione con lingua allo spot, rulli, occhi chiusi.\nInterpretazione: normalizzazione identifica il recettore causale (occlusale, linguale, visivo).",
  },
  post_rotatori_anca: {
    hint: "Test di Autet: sindrome posturale ascendente vs discendente.",
    details:
      "Esecuzione: paziente supino, ginocchia flesse — si valuta la rotazione interna passiva delle anche (restrizione mono o bilaterale). Si testano normalizzazioni con manovre controlaterali, lingua, rulli, stimolazioni emotive (PC6, SP21).\nInterpretazione: la condizione che normalizza la restrizione classifica la sindrome (ascendente, discendente, viscerale, psico-emotiva, mista).",
  },
  post_oculare: {
    hint: "Annotazioni libere su esame oculomotore.",
    details:
      "Esecuzione: valutazione convergenza, motilità oculare estrinseca, dominanza visiva.\nInterpretazione: deficit di convergenza o dominanza alterata possono essere causa di postura cefalica anomala.",
  },
  post_corda_brock: {
    hint: "Test della corda di Brock: visione binoculare e convergenza.",
    details:
      "Esecuzione: paziente fissa una biglia su una corda con 3 nodi. Si chiede quante 'corde' vede convergere sulla biglia (dovrebbero essere 2). Poi si modifica la posizione dei piedi.\nInterpretazione: 1 corda = soppressione monoculare; >2 = diplopia. Cambiamento muovendo i piedi indica influenza propriocettiva podalica sulla visione.",
  },
  protocollo_terapeutico: {
    hint: "Sintesi delle terapie indicate dal quadro clinico.",
    details:
      "Esecuzione: selezionare le terapie appropriate sulla base dei test eseguiti.\nInterpretazione: la combinazione delle terapie costituisce il piano integrato occluso-posturale del paziente.",
  },
  mappa_dolore: {
    hint: "Localizzazione del dolore percepito sul body-map.",
    details:
      "Esecuzione: il paziente (o il professionista) clicca sulle zone del corpo dove avverte dolore.\nInterpretazione: la distribuzione (mono/multi-segmentaria, dx/sx) aiuta a riconoscere pattern miofasciali, viscerali o posturali.",
  },
};

// Hint brevi per singole domande. Per domande non elencate viene
// mostrato un hint di default basato sul tipo di campo.
export const QUESTION_INFO: Record<string, InfoEntry> = {
  // anamnesi
  sintomi_motivo_visita: { hint: "Annota in forma libera sintomi e motivo della visita." },
  farmaci_assume: { hint: "Lista farmaci attivi: utili per interazioni e cofattori sintomatici." },
  tipo_parto: { hint: "Parto traumatico (ventosa/forcipe) può predisporre ad alterazioni cranio-cervicali." },
  sonno: { hint: "Pattern del sonno: russamento e respirazione orale orientano verso OSAS/ipertrofia adenoidea." },
  bruxismo: { hint: "Serramento o digrignamento notturno: segno di stress o malocclusione." },
  sport: { hint: "Attività fisica regolare modula tono muscolare e postura." },
  traumi_incidenti: { hint: "Traumi cranio-cervicali pregressi possono cronicizzare in disfunzioni posturali." },
  traumi_emotivi: { hint: "Eventi emotivi maggiori possono manifestarsi come disfunzioni somato-posturali." },
  interventi_chirurgici: { hint: "Cicatrici interne/esterne possono creare aderenze fasciali a distanza." },
  occhiali: { hint: "Compenso visivo influenza postura cefalica e cervicale." },
  apparecchi_ortodontici: { hint: "Apparecchi attivi modificano l'occlusione e quindi il quadro posturale." },
  apparecchi_acustici: { hint: "Deficit uditivo può alterare l'equilibrio (recettore vestibolare)." },
  suolette_plantari: { hint: "Compenso podalico già in atto: rilevante per la sindrome ascendente." },

  // recettore vestibolare
  otiti_ricorrenti: { hint: "Otiti ripetute in età evolutiva = rischio disfunzione vestibolare." },
  otiti_dettagli: { hint: "Specifica età d'insorgenza, frequenza ed ultimo episodio." },
  otiti_sierose: { hint: "Otite media effusiva con riduzione dell'udito di trasmissione." },
  labirintite: { hint: "Sindrome vertiginosa periferica acuta." },
  meniere: { hint: "Vertigine + acufene + ipoacusia fluttuante." },
  ipoacusia: { hint: "Calo improvviso dell'udito = urgenza ORL." },
  traumi_cranici_orecchio: { hint: "Possibile lesione labirintica post-traumatica." },
  acufeni: { hint: "Ronzii/fischi cronici: indicatore di sofferenza cocleo-vestibolare." },
  sbandamento: { hint: "Sensazione di instabilità: anche di origine cervicogena." },

  // esame orale
  dentizione: { hint: "Stadio dentizione = riferimento per l'età biologica e la pianificazione terapeutica." },
  dismorfosi: { hint: "Anomalie occlusali trasversali/sagittali/verticali." },
  classe_dentale: { hint: "Classificazione di Angle basata sui rapporti dei primi molari." },
  protesi_totali: { hint: "Mappa sui denti FDI le protesi totali presenti." },

  foto_endorali: { hint: "Set fotografico standard per documentazione clinica." },

  // funzione
  lateralita_sx_precontatti: { hint: "Contatti dentali interferenti durante la lateralità sinistra." },
  lateralita_dx_precontatti: { hint: "Contatti dentali interferenti durante la lateralità destra." },
  protrusiva_precontatti: { hint: "Interferenze nel movimento di protrusiva." },
  apertura_deviazione: { hint: "Tragitto di apertura non rettilineo: sospetta disfunzione articolare." },
  prevalenza_masticazione: { hint: "Lato preferenziale di masticazione." },

  // fonazione
  farfalla: { hint: "Test di mobilità linguale: la lingua tocca alternativamente le commissure labiali." },
  mann: { hint: "Test che valuta il tono e la forza della lingua." },
  esposizione_incisale: { hint: "Visibilità degli incisivi superiori in fonazione: indice estetico-funzionale." },
  esposizione_gengivale: { hint: "Gummy smile: esposizione gengivale eccessiva al sorriso." },
  conta_60_70: { hint: "Test fonatorio dinamico: rivela compensi e fatica." },
  protrusiva_eccessiva: { hint: "Spinta linguale anteriore: tipica della deglutizione atipica." },

  // frenulo vestibolare
  frenulo_sup_interincisale: { hint: "Inserzione bassa = possibile diastema interincisale." },
  frenulo_inf_interincisale: { hint: "Inserzione alta = possibile recessione gengivale." },
  bambino_8_anni: { hint: "Età di riferimento per decisione chirurgica sul frenulo." },
  incisivi_sup_spuntati: { hint: "Eruzione laterali superiori: aiuta a chiudere fisiologicamente il diastema." },
  incisivi_inf_spuntati: { hint: "Eruzione laterali inferiori: stabilizza l'arcata anteriore." },

  // frenulo linguale (Marchesan)
  max_apertura_4cm: { hint: "Apertura ridotta = sospetta anchiloglossia." },
  apertura_lingua_spot: { hint: "Riduzione ≥50% conferma vincolo linguale." },
  forma_lingua_punta: { hint: "Punta a cuore o bifida = frenulo corto." },
  inserzione_pavimento: { hint: "Inserzione anteriore = limita il movimento linguale." },
  inserzione_lingua: { hint: "Inserzione vicino alla punta = grado severo." },
  protrusione_lingua: { hint: "Deviazioni o depressioni in protrusione = positivo." },

  // lingua
  forma_standard: { hint: "Lingua di forma e dimensione fisiologiche." },
  forma_piatta_larga: { hint: "Spesso associata a postura linguale bassa." },
  forma_lunga_sottile: { hint: "Possibile compenso miofunzionale." },
  forma_improntata: { hint: "Impronte dentali = macroglossia funzionale o iperattività linguale." },
  lesioni_macchie: { hint: "Documentare con foto eventuali lesioni." },
  lesioni_15gg: { hint: "Lesioni persistenti >15 gg richiedono biopsia." },
  lesioni_peggiorate: { hint: "Peggioramento rapido = segnale di allarme." },
  dolore_aumentato: { hint: "Aumento del dolore in 5 giorni: valutare urgenza." },
  sanguinante: { hint: "Sanguinamento spontaneo: red flag." },
  fattori_scatenanti: { hint: "Identifica eventuali fattori traumatici/abitudinari." },
  linfonodi_ingrossati: { hint: "Linfoadenopatia: associare a contesto clinico." },
  patologie_pregresse: { hint: "Patologie sistemiche che impattano la mucosa orale." },
  impronte_denti: { hint: "Indicano postura linguale interdentale." },

  // guance
  macchie_placche: { hint: "Documentare con foto." },
  macchie_15gg: { hint: ">15 gg: indicazione a biopsia." },
  macchie_peggiorate: { hint: "Peggioramento rapido = red flag." },
  dolore_aumentato_guance: { hint: "Valuta urgenza diagnostica." },
  sanguinante_guance: { hint: "Sanguinamento spontaneo: red flag oncologico." },
  fattori_scatenanti_guance: { hint: "Mordicchiamento, protesi, fumo, alcol." },
  linfonodi_guance: { hint: "Linfoadenopatia loco-regionale." },
  patologie_pregresse_guance: { hint: "Comorbidità rilevanti." },

  // tonsille
  normotrofiche: { hint: "Volume tonsillare nella norma." },
  ipertrofiche: { hint: "Aumento di volume: valutare grado (Brodsky 1-4)." },
  ipertrofia_cronica: { hint: "Persistente: indicazione potenziale a tonsillectomia." },

  // funzione respiratoria
  facies_adenoidea: { hint: "Volto allungato, bocca aperta, occhiaie: respiratore orale cronico." },
  occhiaie: { hint: "Frequenti nel respiratore orale e nelle allergie." },
  glatzel: {
    hint: "Specchietto di Glatzel sotto le narici: misura l'aria espirata.",
  },

  // ATM
  dolore_masticatori: { hint: "Dolore spontaneo o evocato dalla masticazione." },
  dolore_palpazione: { hint: "Almeno un sito muscolare omolaterale al dolore riferito." },
  apertura_40mm: { hint: "Misura interincisiva normale ≥ 40 mm (≈3 dita del paziente)." },
  disloc_con_riduzione: { hint: "Click reciproco apertura/chiusura." },
  disloc_senza_rid_limit: { hint: "Apertura <35 mm + assenza di click." },
  disloc_senza_rid_no_limit: { hint: "Storia di blocco articolare risolto." },
  dolore_articolazioni: { hint: "Artralgia pura: dolore al condilo." },
  crepitio: { hint: "Rumore osseo continuo = degenerazione articolare." },
  ipoplasie_condilari: { hint: "Sviluppo condilare ridotto: spesso unilaterale." },

  // palpazione muscoli (scala 0-10)
  massetere_dx: { hint: "Palpazione bimanuale (intra ed extraorale). 0=nessun dolore, 10=massimo." },
  massetere_sx: { hint: "Palpazione bimanuale. 0=nessun dolore, 10=massimo." },
  temporale_dx: { hint: "Palpazione del temporale anteriore/medio/posteriore." },
  temporale_sx: { hint: "Palpazione del temporale anteriore/medio/posteriore." },
  pterigoideo_lat_dx: { hint: "Palpazione intraorale, accesso difficile: valutare con cautela." },
  pterigoideo_lat_sx: { hint: "Palpazione intraorale, accesso difficile: valutare con cautela." },
  pterigoideo_med_dx: { hint: "Palpazione lungo il bordo mandibolare interno." },
  pterigoideo_med_sx: { hint: "Palpazione lungo il bordo mandibolare interno." },
  trapezio_dx: { hint: "Fascio superiore: trigger points cervicali." },
  trapezio_sx: { hint: "Fascio superiore: trigger points cervicali." },
  scm_dx: { hint: "Sternocleidomastoideo: postura cefalica e vertigini cervicogene." },
  scm_sx: { hint: "Sternocleidomastoideo: postura cefalica e vertigini cervicogene." },

  // OPT
  condili_asimmetrici: { hint: "Asimmetria condilare = possibile asimmetria scheletrica." },
  condili_simmetrici: { hint: "Simmetria condilare fisiologica." },
  condilo_piatto_tozzo: { hint: "Condilo lavorante: rimodellamento da carico." },
  condilo_esile_fine: { hint: "Possibile ipoplasia o riassorbimento." },
  seni_dim_standard: { hint: "Dimensione dei seni mascellari nella norma." },
  seni_simmetrici: { hint: "Simmetria sinusale fisiologica." },
  seni_trasparenti: { hint: "Seno aerato (radiotrasparente) = sano." },
  radio_opacita_diffusa: { hint: "Sospetto sinusite cronica/ispessimento mucoso diffuso." },
  radio_opacita_localizzata: { hint: "Sospetto cisti, polipi o lesioni focali." },
  agenesie_decidui: { hint: "Mancata formazione di denti decidui." },
  agenesie_definitivi: { hint: "Più frequente su laterali superiori, premolari, ottavi." },
  impianti: { hint: "Presenza di impianti osteointegrati." },
  germi_ottavi: { hint: "Presenza dei germi dei terzi molari." },
  ottavi_inclusi: { hint: "Ottavi non erotti: valutare disodontiasi." },
  recessioni_gengivali: { hint: "Indicano sofferenza parodontale." },
  agenesie_chart: { hint: "Mappa su FDI i denti agenesici." },
  lacune_chart: { hint: "Mappa su FDI le lacune (denti mancanti per altre cause)." },
  carie_granulomi_cisti: { hint: "Mappa su FDI lesioni carie/endodontiche." },

  // RX AP
  simmetria_facciale_cranica: { hint: "Simmetria globale del cranio." },
  rapporti_trasversali: { hint: "Rapporti trasversali mascellari/mandibolari simmetrici." },
  posizione_mascellari: { hint: "Allineamento dei mascellari rispetto alla linea mediana." },
  asimmetria_marcata: { hint: "Asimmetria evidente: scheletrica vera." },

  // Teleradiografia
  limiti_rialzo: { hint: "Spazio disponibile per rialzo occlusale." },
  lordosi_cervicale: { hint: "Curvatura cervicale: rettilinizzazione/iperlordosi/normale." },
  osso_ioide_c2_c3: { hint: "Posizione ioide normale tra C2 e C3." },
  forma_vertebre: { hint: "Indice di maturazione scheletrica (CVM)." },
  vie_aeree: { hint: "Pervietà delle vie aeree faringee." },

  // posturale
  cicatrici_visibili: { hint: "Marca sul body-map cicatrici e lesioni cutanee." },
  diff_lunghezza_mani: { hint: "Test di Barré: confronto lunghezza pollici a braccia tese." },
  normalizza_testa_estensione: { hint: "Se normalizza con testa estesa = origine cervicale alta." },
  romberg_bipodalico: { hint: "Stazione bipodalica, occhi chiusi 30''." },
  romberg_mono_dx: { hint: "Stazione monopodalica destra, occhi chiusi." },
  romberg_mono_sx: { hint: "Stazione monopodalica sinistra, occhi chiusi." },
  marcia_neutra: { hint: "Marcia sul posto 50 passi a occhi chiusi, posizione neutra." },
  marcia_testa_dx: { hint: "Stessa marcia con testa ruotata a destra." },
  marcia_testa_sx: { hint: "Stessa marcia con testa ruotata a sinistra." },
  normalizza_uf: { hint: "Identifica il recettore correttivo (linguale/occlusale)." },
  fontana_mano_dx: { hint: "Forza di prensione mano dx in Kg (dinamometro)." },
  fontana_mano_sx: { hint: "Forza di prensione mano sx in Kg (dinamometro)." },
  fontana_lingua_spot_dx: { hint: "Forza mano dx con lingua allo spot palatino." },
  fontana_lingua_spot_sx: { hint: "Forza mano sx con lingua allo spot palatino." },
  fontana_placca_dx: { hint: "Forza mano dx con placca/bite in bocca." },
  fontana_placca_sx: { hint: "Forza mano sx con placca/bite in bocca." },
  bassani_sale: { hint: "Lato di salita preferenziale sulla pedana." },
  rotazione_dx_vede: { hint: "Range di rotazione cervicale destra (riferimento corporeo raggiunto)." },
  rotazione_sx_vede: { hint: "Range di rotazione cervicale sinistra (riferimento corporeo raggiunto)." },
  pelvic_balance: { hint: "Palpazione delle creste iliache: simmetria del bacino." },
  acromion_balance: { hint: "Palpazione degli acromion: simmetria delle spalle." },
  leg_balance: { hint: "Allineamento e lunghezza degli arti inferiori." },
  piede_normalizza: { hint: "Recettore che corregge l'asimmetria podalica." },
  restrizione_intrarotazionale: { hint: "Limitazione della rotazione interna passiva delle anche." },
  normalizza_autet: { hint: "Manovra/recettore che corregge la restrizione = chiave diagnostica." },
  sindrome_posturale: { hint: "Classificazione finale della sindrome posturale del paziente." },
  oculare_note: { hint: "Annotazioni libere su convergenza, motilità, dominanza visiva." },
  corde_viste: { hint: "Numero di corde viste in convergenza sulla biglia (normale = 2)." },
  visione_piedi: { hint: "Cambia la visione modificando l'appoggio podalico?" },

  terapie_consigliate: { hint: "Selezione delle terapie integrate proposte al paziente." },
  mappa_dolore_marker: { hint: "Mappa visiva del dolore percepito." },
};

const TYPE_DEFAULTS: Record<string, string> = {
  radio_si_no: "Risposta dicotomica al rilievo clinico.",
  radio: "Selezionare l'opzione che descrive il rilievo.",
  multi_checkbox: "Selezione multipla: spuntare tutte le opzioni pertinenti.",
  radio_scale_1_10: "Scala numerica 0–10 (0 = assente, 10 = massimo).",
  textarea: "Annotazioni libere del professionista.",
  numeric_kg: "Inserire il valore numerico misurato (Kg).",
  dental_chart_fdi: "Cliccare i denti coinvolti sullo schema FDI.",
  body_map: "Cliccare le zone del corpo da segnalare sul body-map.",
};

export function getQuestionInfo(id: string, type: string): InfoEntry {
  return QUESTION_INFO[id] ?? { hint: TYPE_DEFAULTS[type] ?? "Rilievo clinico." };
}

export function getSectionInfo(id: string): InfoEntry | undefined {
  return SECTION_INFO[id];
}
