# Roadmap

- [x] Creare e collaudare una modalità cefalometrica API sperimentale senza AI, con recupero AMCOP e PDF restituito direttamente senza archiviazione clinica
- [x] Consegnare un PDF fittizio di prova e documentare limiti e attivazione della modalità
- [x] Verificare che ogni singolo valore cefalometrico continui a essere interpretato e che il flusso attuale resti invariato
- [x] Ridurre nome e cognome paziente alle iniziali nell'API e verificare il flusso
- [x] Revisionare il PDF architetturale con cifratura in transito, minimizzazione e conservazione effettiva
- [ ] Assenza totale di conservazione su tutti i percorsi: bloccata dalla verifica delle politiche infrastrutturali e dei fornitori; la prova cefalometrica senza AI non archivia documenti clinici né invia email, ma conserva metadati di utilizzo account
- [x] Verificare che cefalometria e check-up API consegnino entrambi Word e PDF

- [x] Rendere il PDF cefalometrico API fedele al template AMCOP a due colonne verticali
- [x] Aggiornare immagini e indicazioni AMCOP senza determinare le forme DCM
- [x] Collaudare PDF e distribuzione API (scansione esclusa, rinviata dall'utente)

- [x] Impostare 6 consulti condivisi utilizzabili via API per studiodentac@gmail.com
- [x] Indicare 10€ a consulto nel piano Basic e 10€ per gli extra nel piano Pro
- [x] Verificare saldo e offerte aggiornate

- [x] Creare archivio protetto delle installazioni MIND per PC
- [x] Creare proxy `mind-companion-consultation`
- [x] Documentare registrazione, revoca e chiamata dall'estensione
- [x] Configurare l'indirizzo server MILA e usare il token master server già protetto
- [x] Distribuire e collaudare il nuovo indirizzo
- [x] Attivazione estensione con Activation Code (scambio codice → token per PC)
