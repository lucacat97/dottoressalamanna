# MIND — Interroga MILA · endpoint dedicato alla Chrome Extension

Endpoint **nuovo e separato** (l'API MILA esistente `external-api` resta identica, nessun client
attuale viene toccato):

```
POST https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/mind-mila-consultation
Authorization: Bearer <MIND_EXTENSION_TOKEN>
Content-Type: multipart/form-data
```

Il token viene generato lato server (hash SHA-256 salvato in `mind_extension_tokens`, revocabile
mettendo `is_active = false`). Nessuna service-role key o segreto Supabase va nell'estensione.
Token assente/non valido → `401`.

## Campi

| Campo | Obbl. | Note |
|---|---|---|
| `tool` | sì | solo `diagnosis` (MILA check-up) |
| `professional_email` | sì | account registrato sul sito; riceve la consulenza |
| `professional_first_name` | sì | |
| `professional_last_name` | sì | |
| `file` | sì | il PDF (in JSON: `pdf_base64` + `pdf_filename`) |
| `reasonForVisit` / `clinicalNotes` / `terapie` | no | testo libero |
| `source` | no | default `mind_chrome_extension` |
| `mind_patient_id` | no | salvato nei metadati |
| `request_id` | no (consigliato) | idempotenza (anche come header `X-Request-Id`) |

## Risposta 200

```json
{
  "success": true,
  "consultation_id": "uuid",
  "tool": "diagnosis",
  "filename": "consulenza_Consulenza_sul_caso_2026-09-04_b16897dd.doc",
  "document_url": "https://.../storage/v1/object/sign/...",
  "document_url_expires_at": "2026-09-04T15:14:40.818Z",
  "download_url": "(alias di document_url)",
  "email_delivery": { "sent": true }
}
```

`document_url` è un URL firmato **valido 15 minuti** che punta direttamente al file Word generato
(bucket privato, nessun file pubblico permanente, nessun DOCX in base64). La stessa consulenza
continua ad arrivare via email al professionista, esattamente come oggi.

## Idempotenza

Con `request_id`:
- già completata → viene restituito **lo stesso** risultato (`idempotent_replay: true`), senza
  richiamare MILA e senza consumare una seconda consulenza;
- ancora in corso → `202` con `status: "processing"`;
- terminata in errore → `409` con il codice originale.

## Errori

Formato costante: `{ "success": false, "error": "...", "code": "..." }`

| HTTP | code | Significato |
|---|---|---|
| 400 | `invalid_payload`, `invalid_email`, `missing_pdf`, `missing_professional_name`, `unsupported_tool` | dati mancanti/non validi |
| 401 | `unauthorized` | token estensione mancante/revocato · oppure email non registrata (`email_not_registered`) |
| 402 | `no_credits` | consulenze esaurite per quell'account |
| 409 | vari | request_id già in errore |
| 410 | `document_unavailable` | documento non più disponibile |
| 422 | `pdf_unreadable` | PDF corrotto o protetto |
| 429 | `rate_limited` | limite raggiunto |
| 500 | `internal_error`, `db_error` | errore interno |
| 503 | `ai_unavailable` | AI temporaneamente non disponibile |

## Esempio (background della Chrome Extension)

```js
const API = "https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/mind-mila-consultation";

async function inviaAMila(pdfFile, { email, nome, cognome, patientId }) {
  const fd = new FormData();
  fd.append("tool", "diagnosis");
  fd.append("professional_email", email);
  fd.append("professional_first_name", nome);
  fd.append("professional_last_name", cognome);
  fd.append("file", pdfFile);
  fd.append("source", "mind_chrome_extension");
  if (patientId) fd.append("mind_patient_id", patientId);
  fd.append("request_id", crypto.randomUUID()); // riusa lo stesso valore sui retry

  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${MIND_EXTENSION_TOKEN}` },
    body: fd,
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(`${data.code}: ${data.error}`);
  return data; // data.document_url → scarica il Word entro 15 minuti
}
```

Tempo di elaborazione tipico: 40–120 secondi (parsing PDF + generazione). Imposta un timeout
generoso (≥180 s) e, sui retry, riusa lo stesso `request_id`.

## Audit

Ogni chiamata scrive una riga in `mila_consultations` (status, source, `mind_patient_id`, email
professionista, filename, path del documento, esito email, eventuale errore, timestamp). Nessun
dato clinico duplicato, nessun token in chiaro.
