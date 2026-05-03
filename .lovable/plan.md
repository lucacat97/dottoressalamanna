## Panoramica

Tre macro-blocchi indipendenti, da rilasciare in sequenza:

1. **Landing ibrida** con due "porte" (Pazienti / Professionisti) e nuova landing pubblica per pazienti basata sul Metodo Lamanna ("Il paziente globale").
2. **Rinomina + Consulenza Singola** nella dashboard professionisti, con richiesta diretta via email a `dott.lamanna.a@gmail.com`.
3. **Tool "Check-up Ortodontico Posturale"** con questionario strutturato in sezioni (estratto dalla cartella di Cilenti), salvataggio su database con anagrafica e storico.

---

## 1) Landing ibrida + landing pazienti

### Routing
- `/` → nuovo **HomeChooser** (full-screen, due metà animate: "Sono un Paziente" / "Sono un Professionista")
- `/pazienti` → **PatientLanding** (nuova landing dedicata)
- `/professionisti` → attuale `Index` (Hero + Chi Sono + Corsi + Edizioni + Galleria + Contatti) — rinominata e con CTA "Area Riservata" che resta verso `/login`
- Il vecchio `Index.tsx` viene riusato in `/professionisti`. Nessuna sezione persa.

### HomeChooser (`/`)
- Layout split-screen 50/50 (stack verticale su mobile)
- Lato sinistro: foto/illustrazione paziente, claim "Soffri di problemi posturali, mal di testa, dolori cervicali o malocclusione?" → bottone "Scopri il Check-up"
- Lato destro: tema petrolio, claim "Sei un odontoiatra, posturologo o logopedista?" → bottone "Area Professionisti"
- Hover/animazione: l'area attiva si espande leggermente (framer-motion)

### PatientLanding (`/pazienti`)
Sezioni dinamiche (framer-motion, semantic tokens, Playfair/Raleway):
1. **Hero** — "Il tuo corpo parla. Impariamo ad ascoltarlo." Sottotitolo sull'approccio globale. CTA "Prenota un Check-up" (scroll a contatti) + "Scopri il metodo".
2. **Il Paziente Globale** — testo editoriale dal Capitolo 1: superare la visione settoriale.
3. **Sintomi che ti riguardano** — griglia di card icone+titolo: cefalee tensive, bruxismo, cervicalgia, stanchezza cronica, recidive ortodontiche, russamento/sonno disturbato, dolori muscolari, postura alterata.
4. **Il linguaggio dei compensi** — sezione narrativa con immagine/illustrazione, parallax leggero. Concetto: sintomo = ultima manifestazione, non origine.
5. **I 4 pilastri** — quattro colonne animate: Lingua (architetto del volto), Respirazione (nasale vs orale), Occlusione & ATM, Sonno & Stanchezza.
6. **Cosa è il Check-up Ortodontico Posturale** — descrive cosa succede in visita: anamnesi globale, esame orale/funzione/fonazione, frenuli, ATM, esami strumentali, esame posturale (Romberg, Fukuda, Bassani, Autet…). Scritto in linguaggio paziente, NO termini tecnici intimidatori.
7. **L'orchestra multidisciplinare** — quattro card: ORL, Logopedista miofunzionale, Osteopata/Posturologo, Specialista del sonno.
8. **CTA finale + Contatti** — "Prenota la tua visita" con form (riusa logica `ContactSection`) o link diretto a contatti studio.
9. **Footer** condiviso.

### File nuovi
- `src/pages/HomeChooser.tsx`
- `src/pages/PatientLanding.tsx`
- `src/components/patient/PatientHero.tsx`
- `src/components/patient/SymptomsGrid.tsx`
- `src/components/patient/PillarsSection.tsx`
- `src/components/patient/CheckupExplained.tsx`
- `src/components/patient/MultidisciplinaryTeam.tsx`
- `src/components/patient/PatientCTA.tsx`

### File modificati
- `src/App.tsx` — nuove route, `/` → HomeChooser, `/professionisti` → Index attuale.
- `src/components/Navbar.tsx` — link "Area Riservata" → "Consulenza per Professionisti".

---

## 2) Dashboard: rinomina + Consulenza Singola

### Rinomine
- Etichetta menu/CTA "Area Riservata" → **"Consulenza per Professionisti"** (Navbar, link landing).
- La rotta `/area-riservata` resta invariata per non rompere bookmark.

### Nuova sezione "Consulenza Singola"
Sotto "Strumenti", aggiungere card/tab **Consulenza Singola** che contiene:
- **Stesso identico contenuto del Metodo MILA** (riuso `MilaMethodTool`) → idealmente refactor: estrarre il body in un componente condiviso e includerlo qui.
- **Sotto**, blocco "Richiedi Consulenza Diretta" con bottone elegante (gradient petrolio, icona busta).

### Flusso "Richiedi Consulenza Diretta"
1. Click → `Dialog` di conferma con:
   - Textarea **Note** (opzionale, max 4000 char, validata zod)
   - Upload **allegati** (drag-drop, max 5 file, max 10MB ciascuno, accept: pdf/jpg/png/dcm)
2. Conferma → upload allegati a bucket privato `consultation-attachments`, poi chiamata edge function.
3. Edge function `request-consultation` (transactional email via Lovable Emails):
   - Auth richiesta (verifica JWT)
   - Salva record in tabella `consultation_requests`
   - Genera signed URL 7gg per ogni allegato
   - Invia email a `dott.lamanna.a@gmail.com` con: nome+email professionista, note, link agli allegati, timestamp
4. Toast di conferma: "Richiesta inviata. La Dott.ssa Lamanna ti contatterà al più presto."

### Backend
- **Nuova tabella** `consultation_requests`:
  - `id`, `user_id`, `user_email`, `notes`, `attachments` (jsonb: array di {path, name, size}), `status` (default 'pending'), `created_at`
  - RLS: SELECT/INSERT proprio record per utenti autenticati; admin ALL.
- **Nuovo bucket privato** `consultation-attachments` con policies: utenti autenticati possono uploadare solo nella propria cartella `{user_id}/...`; admin SELECT all.
- **Nuova edge function** `request-consultation` con `verify_jwt = false` ma validazione `supabase.auth.getUser(token)` interna, schema zod.

### File nuovi
- `src/components/dashboard/SingleConsultationTool.tsx`
- `src/components/dashboard/RequestConsultationDialog.tsx`
- `supabase/functions/request-consultation/index.ts`

### File modificati
- `src/components/dashboard/ToolsSection.tsx` — aggiunta card "Consulenza Singola"
- `src/components/Navbar.tsx`, `src/components/AboutSection.tsx`/altri CTA che dicono "Area Riservata".

### Email
Dominio `notify.dottoressalamanna.com` già verificato. Riuso pattern esistente `send-transactional-email` (se presente) o uso diretto del gateway con tipo "transactional". Setup infra email già attivo (queue presente).

---

## 3) Tool "Il Check-up Ortodontico Posturale"

Nuovo strumento per il professionista per compilare e archiviare il questionario clinico.

### Struttura del questionario (estratta dal PDF Cilenti, suddivisa per sezioni):
1. **Anagrafica & Anamnesi**: nome, cognome, data esecuzione, sesso, età, sintomi/motivo visita, tipo parto, sonno (multi: intermittente/respira oralmente/russa/si sveglia stanco), bruxismo, sport, traumi emotivi, interventi chirurgici, occhiali, apparecchi ortodontici, apparecchi acustici, suolette/plantari.
2. **Recettore vestibolare e salute dell'orecchio**: otiti ricorrenti, acufeni, labirintite/sbandamento.
3. **Esame Orale**: dentizione (decidua/mista/permanente), dismorfosi (multi: palato stretto, profondo, asimmetrico…), classe dentale (I/II/III).
4. **Funzione**: precontatti laterality SX/DX/protrusiva, deviazione apertura, prevalenza masticazione (DX/SX/no).
5. **Fonazione**: farfalla coordinata, Mann tono linguale, esposizione incisale (III), esposizione gengivale, conta 60-70 dinamica.
6. **Frenulo Vestibolare**: inserzione superiore/inferiore interincisale, età>8, eruzione laterali sup/inf.
7. **Frenulo Linguale (Marchesan)**: 6 item booleani.
8. **Lingua**: forma standard, lesioni/macchie.
9. **Guance**: macchie/placche.
10. **Tonsille**: normotrofiche/ipertrofiche/ipertrofia cronica.
11. **Funzione Respiratoria**: facies adenoidea, occhiaie, Glatzel (Positivo/Negativo).
12. **ATM Disordini Muscolari**: dolore riferito, dolore palpazione, apertura <40mm.
13. **ATM Dislocazione del Disco**: click.
14. **Palpazione Muscoli** (numerici 0-10): massetere DX/SX, temporale DX/SX, pterigoideo mediale DX/SX, pterigoideo laterale DX/SX, trapezio DX/SX, SCM DX/SX.
15. **Esami Strumentali - OPT**: condili asimmetrici/simmetrici, seni dimensione/trasparenza/simmetria, agenesie decidui/definitivi, germi ottavi.
16. **Esame Posturale - Test Colpo di Frusta (Barré)**: differenza lunghezza mano DX/SX.
17. **Romberg**: bipodalico/monopodalico DX/SX (Pos/Neg).
18. **Unterberger-Fukuda**: marcia neutra (Spin SX/DX/no), testa DX, testa SX, normalizza con (multi: lingua spot, deglutizione corretta, altro).
19. **Fontana**: mano SX (Forte/Debole), con lingua allo spot.
20. **Bassani**: sale a (DX/SX/no).
21. **Rotazione del Capo**: rot DX vede (occhio/braccio/altro), rot SX vede.
22. **Valutazione Simmetria**: Pelvic balance, Acromion balance, Leg balance, normalizza con.
23. **Test dei Rotatori dell'Anca (Autet)**: restrizione (DX/SX/no), normalizza con (multi).
24. **Sindrome posturale**: Ascendente/Discendente/Mista.
25. **Test Oculare e Oculomotricità**: convergenza sincrona.
26. **Protocollo Terapeutico** (multi-checkbox + textarea libera): miofunzionale, elastodontica, fotobiomodulazione, rialzi occlusali, molaggi selettivi, espansore, altro.

### UI
- Componente `CheckupTool.tsx` con due viste:
  - **Lista questionari salvati** (tabella: Nome, Cognome, Data esecuzione, azioni: Apri/Esporta PDF/Elimina)
  - **Editor questionario** con accordion per ogni sezione (auto-save bozza in localStorage durante compilazione)
- Schema centralizzato `checkupSchema.ts` (array di sezioni → array di domande tipizzate: bool/select/multi/number/text). Renderer dinamico per evitare 600 righe di JSX.
- Validazione con zod prima del salvataggio (richiesti: nome, cognome, data).
- Pulsante "Esporta PDF" → `window.print()` con CSS dedicato (riusa pattern esistente).

### Backend
- **Nuova tabella** `posturographic_checkups`:
  - `id`, `user_id` (professionista), `patient_first_name`, `patient_last_name`, `exam_date`, `data` (jsonb con tutte le risposte), `created_at`, `updated_at`
  - RLS: solo proprio record (SELECT/INSERT/UPDATE/DELETE), admin ALL
  - Index su `(user_id, exam_date desc)`

### File nuovi
- `src/components/dashboard/checkup/CheckupTool.tsx`
- `src/components/dashboard/checkup/CheckupEditor.tsx`
- `src/components/dashboard/checkup/CheckupList.tsx`
- `src/components/dashboard/checkup/checkupSchema.ts`
- `src/components/dashboard/checkup/QuestionRenderer.tsx`

### File modificati
- `src/components/dashboard/ToolsSection.tsx` — card "Check-up Ortodontico Posturale"

---

## Privacy / GDPR
- Nessun dato del paziente del check-up viene mai inviato a IA esterne in questa fase (è solo archiviazione clinica).
- Allegati consulenza singola: bucket privato, signed URL a tempo, mai pubblici.

---

## Ordine di esecuzione
1. **Migration unica** (3 tabelle + 1 bucket + RLS) — richiede approvazione utente.
2. Edge function `request-consultation` + deploy.
3. PatientLanding + HomeChooser + routing + rinomine.
4. SingleConsultationTool + dialog richiesta.
5. CheckupTool con tutte le sezioni.
6. QA visivo del flusso.

## Dettagli tecnici riassuntivi
- Stack invariato: React 18 + Vite + Tailwind + shadcn + framer-motion + zod.
- Email tramite Lovable Emails sul dominio già verificato `notify.dottoressalamanna.com`.
- Tutti i nuovi colori/spaziature usano semantic tokens esistenti (petrolio, accent, muted…). Nessun hex inline.
- Mobile-first: HomeChooser stack verticale sotto `md`, PatientLanding con grid responsive.
- Accessibilità: alt text immagini, semantic HTML (h1 unico per pagina), focus states, prefers-reduced-motion rispettato sulle animazioni.