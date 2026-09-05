# Backend MIND con token separato per ogni PC

## Obiettivo
Sostituire il token unico dell’estensione con un token dedicato a ciascun PC. L’estensione invierà solo il PDF e i dati del caso; nome, cognome ed email del professionista saranno recuperati dal backend e non potranno essere modificati dal browser.

## Interventi
1. Creare `mind_companion_installations` con hash SHA-256 del token, etichetta del PC, dati del professionista, stato attivo e ultimo utilizzo.
2. Proteggere la tabella con RLS, senza accesso pubblico, concedendo l’accesso soltanto al servizio backend.
3. Creare il nuovo indirizzo `mind-companion-consultation`, accessibile senza login del sito ma protetto dal token del PC:
   - token mancante o sconosciuto: `401`;
   - token conosciuto ma disattivato: `403`;
   - accetta solo `multipart/form-data` e il PDF richiesto;
   - ignora eventuali dati del professionista inviati dal browser;
   - aggiunge server-side `tool=diagnosis` e i dati del professionista registrati;
   - aggiorna `last_seen_at`;
   - inoltra la richiesta al servizio MILA configurato nei segreti e restituisce invariati stato, tipo di contenuto e risposta.
4. Configurare CORS e disabilitare la verifica JWT standard solo per questo indirizzo, perché l’autenticazione avviene con il token del PC.
5. Aggiungere una guida breve con:
   - generazione sicura di un `INSTALL_TOKEN` casuale;
   - SQL per registrare un PC salvando esclusivamente l’hash;
   - SQL per revocare/riattivare un PC;
   - esempio della chiamata dall’estensione.
6. Distribuire tabella e funzione nel backend e verificare almeno: preflight CORS, token mancante, token invalido e installazione disattivata.

## Dettagli tecnici
- Il token master MILA resterà esclusivamente nei segreti `MILA_UPSTREAM_URL` e `MILA_UPSTREAM_TOKEN` e non sarà incluso nel codice o nella risposta.
- Non verranno aggiunti codici di attivazione, licenze, limiti dispositivi, pagina amministrativa, login amministratore o registrazione automatica.
- Il precedente indirizzo `mind-mila-consultation` resterà invariato per non interrompere integrazioni esistenti; la Chrome Extension dovrà passare al nuovo indirizzo quando sarà pronta.
