# API Consulenze MILA — documentazione rapida

Endpoint unico:

```
POST https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/external-api
Content-Type: application/json
```

Nessuna chiave obbligatoria: l'autorizzazione avviene tramite `professional_email`, che deve
corrispondere a un account registrato sul sito. Le consulenze vengono scalate dallo stesso
pool del sito (crediti/abbonamento). La chiave `x-api-key` resta accettata solo per
retrocompatibilità con i client legacy.

Campi comuni obbligatori:

| Campo | Tipo | Note |
|---|---|---|
| `tool` | string | `diagnosis` \| `orthodontic` \| `mtc_sistemica` \| `mtc_organica` |
| `professional_email` | string | email dell'account registrato; riceve la consulenza |
| `professional_first_name` | string | nome del professionista (intestazione email) |
| `professional_last_name` | string | cognome del professionista |

Risposta 200:

```json
{
  "success": true,
  "tool": "diagnosis",
  "consultation_type": "Consulenza sul caso",
  "professional": { "first_name": "Mario", "last_name": "Rossi", "email": "..." },
  "email_delivery": { "sent": true },
  "download_url": "https://.../download-consultation?token=..."
}
```

Il documento Word è scaricabile dal `download_url` (valido 5 giorni, max 5 download) ed è
comunque inviato via email all'indirizzo del professionista.

Errori: `400` payload non valido · `401` email non registrata · `402` consulenze esaurite ·
`403` email non coincidente con la chiave legacy · `429` limite mensile chiave · `503` AI non
disponibile.

---

## 1. Check-Up Posturale / Consulenza sul caso (`diagnosis`) — parte da un PDF

Questo è lo strumento che accetta un documento clinico. Puoi inviare **direttamente il PDF**
(vedi sezione 4, consigliato) oppure il testo già estratto in `documentText`.

```json
{
  "tool": "diagnosis",
  "professional_first_name": "Mario",
  "professional_last_name": "Rossi",
  "professional_email": "mario.rossi@example.com",
  "documentText": "Testo estratto dal PDF... (min 20 caratteri)",
  "reasonForVisit": "(opzionale) motivo della visita",
  "clinicalNotes": "(opzionale) considerazioni del professionista",
  "terapie": "(opzionale) terapie da includere"
}
```

### Pulsante "Carica PDF" su un sito esterno

Estrazione testo nel browser con pdf.js e invio all'API:

```html
<input type="file" id="pdf" accept="application/pdf" />
<button onclick="inviaPdf()">Genera consulenza</button>

<script type="module">
import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4/build/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4/build/pdf.worker.min.mjs";

const API = "https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/external-api";

window.inviaPdf = async () => {
  const file = document.getElementById("pdf").files[0];
  if (!file) return;

  // 1) PDF -> testo
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const content = await (await pdf.getPage(i)).getTextContent();
    text += content.items.map((it) => it.str).join(" ") + "\n\n";
  }

  // 2) invio all'API
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tool: "diagnosis",
      professional_first_name: "Mario",
      professional_last_name: "Rossi",
      professional_email: "mario.rossi@example.com",
      documentText: text,
    }),
  });
  const data = await res.json();
  if (!res.ok) return alert(data.error);
  window.open(data.download_url, "_blank"); // documento Word della consulenza
};
</script>
```

Da server (.NET, PHP, Node) è identico: estrai il testo con la tua libreria PDF e fai il POST
JSON. Nessun `multipart/form-data`, nessun upload di file.

### PDF scansionati (senza testo)

Se l'estrazione restituisce meno di ~200 caratteri il PDF è un'immagine. Renderizza le pagine
in JPEG (max 15) e chiama l'endpoint OCR, poi usa il testo ottenuto come `documentText`:

```
POST https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/pdf-ocr
{ "images": ["data:image/jpeg;base64,...", "..."] }
→ { "text": "..." }
```

---

## 2. Cefalometria (`orthodontic`) — richiede valori numerici

Lo strumento cefalometrico **non accetta un PDF**: lavora sui valori del tracciato. Se parti da
un PDF di cefalometria, estrai i valori (manualmente, con il tuo parser, oppure lasciando
compilare i campi all'operatore) e inviali così:

```json
{
  "tool": "orthodontic",
  "professional_first_name": "Mario",
  "professional_last_name": "Rossi",
  "professional_email": "mario.rossi@example.com",
  "nome": "(opzionale) Anna",
  "cognome": "(opzionale) Bianchi",
  "age": 10,
  "sex": "F",
  "angolo_sellare": 125,
  "anb": 3,
  "wits": 1,
  "angolo_articolare": 145,
  "angolo_goniaco": 132,
  "ns_mm": 71,
  "gome_mm": 74,
  "classe_dentale": "(opzionale) II classe",
  "clinicalNotes": "(opzionale)"
}
```

Obbligatori: `age`, `sex`, `angolo_sellare`, `anb`, `wits`, `angolo_articolare`,
`angolo_goniaco`. Il rapporto NS/GoMe è calcolato in automatico da `ns_mm` e `gome_mm`
(oppure passa direttamente `rapporto_ns_gome`).

Flusso consigliato per un pulsante "carica PDF cefalometria": carichi il PDF, estrai il testo
come sopra, precompili un piccolo form con i valori trovati, l'operatore conferma e poi invii
la chiamata `orthodontic`.

---

## 3. MTC

```json
{ "tool": "mtc_sistemica", "sex": "F",
  "painPoints": [{ "region": "Zona lombare", "description": "Dolore cronico" }] }
```

```json
{ "tool": "mtc_organica", "sex": "F", "age": 45,
  "symptoms": [{ "category": "Fegato", "name": "Irritabilità" }] }
```

(più i quattro campi comuni `tool` / `professional_*`).

---

## Note

- CORS aperto: la chiamata può partire direttamente dal browser.
- Ogni chiamata andata a buon fine consuma una consulenza dal pool dell'account.
- Nome e cognome del paziente sono facoltativi; se non servono, non inviarli (privacy).

---

## 4. Upload diretto del PDF (parsing lato server) — consigliato

Dal 4 settembre 2026 l'endpoint accetta **il PDF stesso**: nessuna estrazione testo lato tuo,
nessun OCR da orchestrare. Il parsing (testo, etichette, caselle spuntate dei moduli
compilabili come il "Check-up ortodontico posturale") e tutta la logica avvengono qui.

### multipart/form-data (pulsante "Carica PDF")

```html
<input type="file" id="pdf" accept="application/pdf" />
<button onclick="invia()">Genera consulenza</button>
<script>
const API = "https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/external-api";
async function invia() {
  const fd = new FormData();
  fd.append("tool", "diagnosis");
  fd.append("professional_email", "mario.rossi@example.com");
  fd.append("professional_first_name", "Mario");
  fd.append("professional_last_name", "Rossi");
  fd.append("file", document.getElementById("pdf").files[0]);
  // opzionali: fd.append("reasonForVisit", "..."); fd.append("clinicalNotes", "...");
  const res = await fetch(API, { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) return alert(data.error);
  window.open(data.download_url, "_blank");
}
</script>
```

### JSON con PDF in base64

```json
{
  "tool": "diagnosis",
  "professional_email": "mario.rossi@example.com",
  "professional_first_name": "Mario",
  "professional_last_name": "Rossi",
  "pdf_base64": "JVBERi0xLj...",
  "pdf_filename": "check-up.pdf"
}
```

`pdf_base64` accetta anche il formato `data:application/pdf;base64,...`.
`documentText` resta supportato per i client che estraggono il testo da soli; se invii entrambi
vince `documentText`.

Errore dedicato: **422** se il PDF non è leggibile (file corrotto o protetto da password).

### Note sul modulo compilabile

Il "Check-up ortodontico posturale compilabile" è un AcroForm di 8 pagine con ~584 campi: il
parsing lato server legge sia le etichette stampate sia le risposte selezionate, quindi puoi
inviare il file così com'è, compilato a video oppure stampato e scansionato.

### Se invece vuoi passare per la cefalometria

La cefalometria (`tool: "orthodontic"`) resta a valori numerici: da questo modulo non si ricava
automaticamente, servono i dati del tracciato.
