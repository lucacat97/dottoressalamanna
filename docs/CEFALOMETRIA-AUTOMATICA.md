# Cefalometria Automatica: stato e contratto del riconoscitore

## Stato
La pagina integrata funziona come editor **manuale sperimentale**: caricamento immagine/PDF, punti trascinabili, calibrazione, geometria, esportazione PNG/PDF, fascicolo JSON locale e consulenza MILA dai valori confermati. Nessun modello di riconoscimento è addestrato o operativo. Non invia la radiografia a un modello generico.

## Convenzioni da validare clinicamente
- Coordinate in pixel della pagina rasterizzata, origine in alto a sinistra; niente ridimensionamenti dei punti dopo l’importazione.
- Angoli minori N–S–Ar, S–Ar–Go, Ar–Go–Me; ANB = SNA − SNB. Prima di uso clinico verificare con Annarita i casi limite e le convenzioni sagittali su tracciati di riferimento.
- NS/GoMe = distanza N–S divisa per distanza Go–Me.
- OP1 posteriore e OP2 anteriore: Wits è la differenza delle proiezioni di A e B sull’asse OP1→OP2, moltiplicata per mm/pixel. La scelta anatomica del piano è responsabilità del professionista e va standardizzata.
- C1 e C2 su una scala attendibile; distanza reale positiva. In assenza di calibrazione Wits resta nullo. Importare una pagina PDF non certifica una scala fisica.

## Modello dedicato: attività bloccate e prerequisiti
Occorrono dataset autorizzato, annotazioni esperte e criteri clinici di accettazione. Non usare fascicoli clinici salvati nel sito per addestramento senza autorizzazione specifica.
1. Annarita approva definizioni dei landmark, protocollo del piano occlusale e trattamento dei casi ambigui.
2. Acquisire radiografie con licenza/consenso appropriati; rimuovere identificativi dall’immagine e dai metadati.
3. Annotazioni indipendenti e adjudication professionale; divisione train/validation/test per paziente e controllo duplicati.
4. Addestrare un localizzatore a heatmap, ad esempio U-Net, su ambiente GPU dedicato. Questa architettura è una proposta di ricerca, non un modello già disponibile nel progetto.
5. Valutare errori per landmark in mm sui casi calibrati, percentuali entro soglie concordate e errori per misura. Analizzare sottogruppi, immagini anomale e fallimenti.
6. Esportare e versionare pesi, preprocessing e specifiche. Valutare ONNX/inferenza browser; non inserire nel browser un modello non verificato.

## Contratto previsto
Input: immagine raster con larghezza/altezza note, orientamento verificato e trasformazioni documentate.
Output: coordinate in pixel originali, identificativo/versione del modello, incertezza per punto e stato esplicito per punti non localizzati. OP1/OP2 e scala devono seguire un protocollo approvato, non essere inventati dal modello.
Il riconoscitore non restituisce interpretazioni terapeutiche: il modulo geometrico calcola i valori. Il professionista conferma prima di MILA. Fallback manuale esplicito, mai coordinate simulate.

## Conservazione e limiti
Il fascicolo JSON contiene immagine, punti, calibrazione, dati demografici non nominativi e consulenza se disponibile. È salvato dall’utente sul dispositivo, non aggiunto a un nuovo archivio remoto. La riapertura richiede il file; uscire dalla pagina senza salvarlo perde l’analisi. Le radiografie possono contenere nominativi impressi: l’assenza di campi nome/cognome non le rende anonime.
La generazione MILA usa il flusso esistente; nessuna nuova garanzia di assenza di conservazione dei suoi output o log. Il riconoscimento automatico e la validazione clinica restano bloccati dai prerequisiti sopra elencati.

## Verifiche
Test numerici in `src/test/cephalometry.test.ts`. Prova autenticata con immagine geometrica sintetica: inserimento punti, calibrazione, PDF/PNG, salvataggio/riapertura JSON, consulenza reale attraverso MILA e suo PDF, invalidazione dopo modifica; nessuna radiografia o dato clinico reale usato. Questa prova dimostra il collegamento software, non accuratezza clinica.