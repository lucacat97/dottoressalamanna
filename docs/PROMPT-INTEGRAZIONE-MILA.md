# Prompt per integrazione — Pulsante "Analisi MILA" su sito esterno

## Cosa deve fare

Aggiungere al sito del cliente un pulsante che permetta di caricare un PDF clinico e ricevere una **Consulenza sul caso** generata dal sistema MILA (check-up ortodontico posturale).

Il PDF viene inviato al nostro endpoint; tutto il parsing, l'elaborazione AI e l'invio del referto avvengono lato nostro.

---

## Endpoint

```
POST https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/external-api
```

- **Nessuna API key richiesta**: l'autenticazione avviene tramite `professional_email`.
- L'email deve corrispondere a un account registrato sul sito della dottoressa.
- Ogni chiamata consuma una consulenza dal pool dell'account (crediti/abbonamento condivisi tra sito e API).

---

## Payload: multipart/form-data

Campi obbligatori:

| Campo | Valore | Note |
|---|---|---|
| `tool` | `diagnosis` | Identifica lo strumento MILA/check-up posturale |
| `professional_email` | email dell'account | Riceve la consulenza e il link di download |
| `professional_first_name` | nome del professionista | Intestazione email |
| `professional_last_name` | cognome del professionista | Intestazione email |
| `file` | file PDF | Il PDF caricato dall'utente |

Campi opzionali utili:

- `reasonForVisit` — motivo della visita
- `clinicalNotes` — note del professionista
- `terapie` — terapie da includere nella valutazione

---

## Snippet HTML/JS pronto

```html
<input type="file" id="pdfInput" accept="application/pdf" />
<button id="analisiBtn">Genera consulenza MILA</button>
<div id="status"></div>

<script>
const API = "https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/external-api";

document.getElementById("analisiBtn").addEventListener("click", async () => {
  const file = document.getElementById("pdfInput").files[0];
  if (!file) return alert("Seleziona un PDF");

  const status = document.getElementById("status");
  status.textContent = "Invio in corso...";

  const form = new FormData();
  form.append("tool", "diagnosis");
  form.append("professional_email", "mario.rossi@example.com"); // sostituire con l'email reale
  form.append("professional_first_name", "Mario");
  form.append("professional_last_name", "Rossi");
  form.append("file", file);

  try {
    const res = await fetch(API, { method: "POST", body: form });
    const data = await res.json();

    if (!res.ok) {
      status.textContent = "Errore: " + (data.error || res.statusText);
      return;
    }

    status.innerHTML = `
      Consulenza generata.<br>
      <a href="${data.download_url}" target="_blank">Scarica il documento Word</a><br>
      Il referto è stato inviato anche via email.
    `;
  } catch (err) {
    status.textContent = "Errore di rete: " + err.message;
  }
});
</script>
```

---

## Risposta di successo (200)

```json
{
  "success": true,
  "tool": "diagnosis",
  "consultation_type": "Consulenza sul caso",
  "professional": {
    "first_name": "Mario",
    "last_name": "Rossi",
    "email": "mario.rossi@example.com"
  },
  "email_delivery": { "sent": true },
  "download_url": "https://.../download-consultation?token=..."
}
```

- `download_url` è valido 5 giorni, max 5 download.
- Il documento Word viene comunque inviato via email all'indirizzo del professionista.

---

## Errori principali da gestire

| HTTP | Significato | Azione consigliata |
|---|---|---|
| `400` | Payload non valido o PDF illeggibile | Verifica i campi e il file |
| `401` | Email non registrata | L'utente deve registrarsi sul sito prima |
| `402` | Consulenze esaurite | Richiedere ricarica crediti/abbonamento |
| `422` | PDF corrotto o protetto da password | Chiedere di rigenerare il file |
| `503` | AI temporaneamente non disponibile | Ritentare dopo qualche secondo |

---

## Cosa NON deve fare il frontend esterno

- **Non estrarre testo dal PDF**: invia il file così com'è.
- **Non fare OCR**: il parsing avviene lato server.
- **Non memorizzare chiavi API**: non servono.

---

## Note per il cliente

- Il PDF può essere:
  - il modulo "Check-up ortodontico posturale compilabile" compilato a video;
  - lo stesso modulo stampato, compilato a mano e scansionato;
  - un qualsiasi documento clinico in formato PDF.
- Per la **cefalometria** (`tool: "orthodontic"`) il flusso è diverso: non si invia un PDF, ma i valori numerici del tracciato. Vedi `docs/API-ESTERNA.md` sezione 2.

---

## Riferimento completo

Per dettagli su JSON base64, OCR fallback, MTC, cefalometria e campi opzionali:  
**`docs/API-ESTERNA.md`**
