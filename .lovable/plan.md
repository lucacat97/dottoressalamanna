# Piano: estensione Chrome MILA/MIND Companion

## Obiettivo
Creare un pacchetto Chrome Extension che permetta di caricare un PDF clinico e ricevere una consulenza MILA direttamente dal browser, usando il nuovo endpoint sicuro `mind-companion-consultation` (token per installazione).

## Cosa costruire

1. **Cartella `extension/`** con i file necessari:
   - `manifest.json` (Manifest V3)
   - `popup.html` + `popup.js` + `popup.css` — interfaccia per caricare PDF e inserire note
   - `background.js` — service worker per salvare/recuperare il token di installazione
   - `options.html` + `options.js` — pagina per configurare il token dell'estensione
   - `icon.png` — icona dell'estensione

2. **Flusso utente**
   - L'utente installa l'estensione in Chrome (modalità sviluppatore → carica cartella decompressa)
   - Inserisce il token di installazione nelle opzioni (es. `mind_...`)
   - Clicca l'icona, trascina o seleziona un PDF
   - Aggiunge eventuali note cliniche opzionali
   - Clicca "Invia a MILA"
   - L'estensione chiama `POST .../functions/v1/mind-companion-consultation` con `Authorization: Bearer <token>` e `multipart/form-data`
   - Mostra il link al documento Word generato e conferma l'invio email

3. **Pacchetto distribuibile**
   - Comprimere la cartella `extension/` in `public/mind-companion-extension.zip`
   - Aggiungere nella UI del sito un pulsante di download sicuro (fetch + blob)
   - Aggiornare `docs/MIND-COMPANION-INSTALLAZIONI.md` con le istruzioni di installazione passo-passo

## Sicurezza
- Il token viene salvato in `chrome.storage.local`, mai nel codice sorgente pubblicato
- Nessuna chiave API o credenziale professionista richiesta lato utente: nome/cognome/email sono associati al token nel database
- Il PDF viene inviato solo all'endpoint autorizzato

## Nota sulle due versioni
- **MIND Companion (nuovo)**: token diverso per ogni PC/installazione, endpoint `mind-companion-consultation`
- **MIND Extension (vecchio)**: unico token fisso, endpoint `mind-mila-consultation`

Questo piano realizza la versione nuova (per-PC). Se serve anche la vecchia, si può duplicare la cartella con un token hardcoded.