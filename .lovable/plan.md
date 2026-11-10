# Cefalometria Automatica MILA

## Obiettivo
Una sezione «Cefalometria Automatica» in «MILA e Strumenti»: caricare una teleradiografia, riconoscere automaticamente i punti anatomici, calcolare gli angoli, verificare il tracciato e ottenere due risultati distinti: tracciato cefalometrico e consulenza MILA.

Il riconoscitore sarà un modello dedicato sviluppato per il progetto, non un LLM che stima coordinate o angoli. L’attuale funzionamento di MILA resta invariato.

## 1. Preparare il riconoscitore
- Definire con Annarita i punti e le convenzioni: S, N, Ar, Go, Me, A, B e i riferimenti necessari per il piano occlusale e Wits.
- Preparare radiografie utilizzabili legalmente per addestramento, con identificativi rimossi anche dall’immagine e punti annotati da professionisti. Verificare licenze e autorizzazioni prima dell’uso.
- Realizzare un modello di localizzazione dei punti con indicazione dell’incertezza; addestramento su risorse di calcolo dedicate, non nelle funzioni del sito.
- Separare i casi di addestramento, validazione e test per paziente. Misurare errore dei punti in millimetri sui casi calibrati, errore degli angoli e prestazioni sui diversi tipi di immagini.
- Stabilire con Annarita criteri di accettazione prima dell’impiego clinico. Un primo prototipo non sarà presentato come validato o certificato.

**Dipendenza:** non sono ancora disponibili nel progetto un modello addestrato né un insieme di radiografie annotate. Senza questi si può costruire l’interfaccia e il calcolo geometrico, ma non dichiarare operativo il riconoscimento automatico.

## 2. Costruire il percorso nella piattaforma
- Caricamento di immagine o PDF, età e sesso; selezione della pagina se il PDF contiene più pagine.
- Visualizzazione della radiografia con punti, etichette e linee; spostamento e aggiunta dei punti, zoom e ricalcolo immediato.
- Calcolo deterministico di angolo sellare, ANB, articolare, goniaco e rapporto NS/GoMe; Wits con piano occlusale definito e calibrazione attendibile.
- Se manca la scala, richiedere due riferimenti e la distanza reale prima di produrre misure in millimetri. Non inventare distanze o punti mancanti.
- Quando il modello sarà disponibile, collegare il riconoscimento automatico alla stessa interfaccia di verifica. Evidenziare punti incerti ed errori di analisi.

## 3. Collegare i due risultati
- Conferma esplicita del professionista prima di inviare le misure a MILA.
- Usare il flusso cefalometrico e i documenti AMCOP già esistenti, senza modificare le regole terapeutiche.
- Due schede: «Tracciato cefalometrico», scaricabile come PDF e immagine, e «Consulenza MILA», scaricabile come Word/PDF.
- Se cambiano punti, calibrazione o dati dopo la generazione, marcare la consulenza come da aggiornare.

## 4. Riapertura e tutela dei dati
Il documento richiede uno storico completo, mentre il vincolo precedente richiede che i dati paziente non restino sui server. Per questa fase, conservare e riaprire l’analisi sul dispositivo del professionista, con esportazione/importazione di un fascicolo contenente immagine, punti, calibrazione, misure e risultati. Nessun nuovo archivio clinico remoto o sincronizzazione MIND in questa fase. Non promettere anonimizzazione o assenza di conservazione nei flussi MILA già esistenti senza verifica.

## Dettagli tecnici
- Moduli separati per localizzazione dei punti, geometria, editor del tracciato ed esportazione.
- Inferenza del modello dedicato nel browser se formato e prestazioni lo permettono; altrimenti valutare un servizio di inferenza protetto e le relative condizioni di trattamento prima dell’invio di radiografie.
- Test numerici su coordinate note per angoli, rapporto, calibrazione e Wits; gestione esplicita di punti coincidenti, mancanti o piano occlusale indefinito.
- Verifica del caricamento, modifica, ricalcolo, conferma, download e riapertura su computer e telefono.

## Prima consegna
Interfaccia del tracciato e calcoli verificabili, pronta per collegare il nostro modello. Il riconoscimento automatico diventa utilizzabile soltanto dopo addestramento e valutazione: niente punti simulati o generati da un LLM presentati come riconoscimento reale.
