# Prompt per sviluppatore — Estensione Chrome MIND Companion

Stiamo realizzando un’estensione Chrome Manifest V3 che permetta a medici/ortodontisti di caricare un PDF clinico e ricevere una consulenza MILA generata da AI.

## Logica generale (cosa devi implementare)

L’estensione **non deve mai contenere un token fisso o credenziali**. Deve chiedere all’utente, **una sola volta**, un Activation Code dello studio. Quel codice viene scambiato con il backend e restituisce un **token di installazione** valido solo per quel PC, che l’estensione salva in `chrome.storage.local`. Da quel momento in poi tutte le chiamate al backend usano quel token.

## Flusso passo-passo

### 1. Schermata iniziale — Attivazione

Se in `chrome.storage.local` non è salvato `milaInstallToken`, mostra una schermata con:

- Campo **Activation Code** (es. `MILA-XXXX-XXXX-XXXX`)
- Campo opzionale **Nome del PC / studio** (es. "Studio - PC reception")
- Pulsante **Attiva MILA**

Al click chiama:

```
POST https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/mind-activate
Content-Type: application/json
```

Body:

```json
{
  "activation_code": "MILA-9444-E7AC-80C0",
  "device_label": "Studio - PC reception"
}
```

### 2. Cosa salvare dopo l’attivazione

Se la risposta è `200 OK` con `success: true`, salva in `chrome.storage.local`:

- `milaInstallToken` → `data.install_token`
- `milaConsultationUrl` → `data.consultation_url` (opzionale, puoi anche hardcodarlo)
- `milaProfessionalEmail` → `data.professional_email` (solo per mostrarlo in UI)

**NON salvare l’Activation Code.**
**NON salvare nome, cognome o email del professionista come input utente: li prende il server dal token.**

### 3. Schermata principale — Invio PDF

Una volta attivata, l’estensione mostra:

- Area drag & drop o input file per PDF
- Campo opzionale **ID paziente** (`mind_patient_id`)
- Campo opzionale **Motivo della visita** (`reasonForVisit`)
- Campo opzionale **Note cliniche** (`clinicalNotes`)
- Campo opzionale **Terapie in corso** (`terapie`)
- Pulsante **Invia a MILA**

Al click costruisci un `FormData` e chiama:

```
POST https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/mind-companion-consultation
Authorization: Bearer <milaInstallToken>
Content-Type: multipart/form-data
```

Body `FormData`:

- `file` (obbligatorio) → il PDF
- `source` (opzionale) → es. `mind_chrome_extension`
- `mind_patient_id` (opzionale)
- `request_id` (consigliato) → `crypto.randomUUID()`, riusa lo stesso valore su retry
- `reasonForVisit` (opzionale)
- `clinicalNotes` (opzionale)
- `terapie` (opzionale)

### 4. Durante l’elaborazione

Mostra uno stato di caricamento. Il backend impiega tipicamente 40–120 secondi. Imposta un timeout generoso (≥ 180 secondi).

### 5. Risposta positiva

```json
{
  "success": true,
  "consultation_id": "uuid",
  "tool": "diagnosis",
  "filename": "consulenza_...",
  "document_url": "https://.../storage/v1/object/sign/...",
  "document_url_expires_at": "2026-09-05T15:14:40.818Z",
  "download_url": "...",
  "email_delivery": { "sent": true }
}
```

Mostra:

- Link al documento Word (`download_url` o `document_url`), valido **15 minuti**
- Conferma che la consulenza è stata inviata anche per email al professionista

### 6. Idempotenza

Se la rete cade o l’utente chiude per sbaglio, **riusa lo stesso `request_id`** nella richiesta ripetuta. Se la consulenza era già completata, il backend restituisce lo stesso risultato senza consumare una seconda consulenza.

### 7. Gestione errori fondamentali

| HTTP | code | Azione da fare nell’estensione |
|------|------|--------------------------------|
| 400 | `invalid_payload` | Mostra messaggio: dati mancanti o troppo lunghi |
| 401 | `unauthorized` / `invalid_activation_code` | Cancella `milaInstallToken` e torna alla schermata di attivazione |
| 403 | `installation_disabled` | Cancella `milaInstallToken` e torna alla schermata di attivazione |
| 402 | `no_credits` | Avvisa: consulenze esaurite, contatta l’amministratore |
| 409 | vari / `activation_limit_reached` | Codice già usato su troppi PC |
| 413 | `pdf_too_large` | PDF superiore a 20 MB |
| 415 | `invalid_content_type` | Devi usare `multipart/form-data`, non JSON |
| 422 | `pdf_unreadable` | PDF corrotto o protetto |
| 429 | `rate_limited` | Troppo veloce, riprova più tardi |
| 500 / 502 / 503 | vari | Errore temporaneo, riprova con lo stesso `request_id` |

**Regola d’oro:** ogni risposta `401` o `403` con codice `installation_disabled` deve cancellare il token salvato e richiedere un nuovo Activation Code.

## Cosa NON deve fare l’estensione

- Non chiedere all’utente email, nome o cognome del professionista
- Non salvare l’Activation Code dopo il primo scambio
- Non inviare il PDF come base64 JSON: usa sempre `multipart/form-data`
- Non mostrare mai il token di installazione in chiaro all’utente
- Non salvare nulla in `localStorage` del browser normale: usa `chrome.storage.local`

## Riferimenti tecnici

- Endpoint attivazione: `POST /functions/v1/mind-activate`
- Endpoint consulenza: `POST /functions/v1/mind-companion-consultation`
- Documentazione completa: `docs/MIND-ACTIVATION-CODE.md`
- Documentazione vecchia estensione (solo per riferimento): `docs/MIND-CHROME-EXTENSION.md`

Activation Code attivo dello studio: **MILA-9444-E7AC-80C0** (max 5 PC, nessuna scadenza).
