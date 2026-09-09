# Prompt per sviluppatore — Cefalometria (MILA) dall'estensione Chrome MIND

Estensione del flusso già implementato (v. `docs/PROMPT-MIND-EXTENSION.md`). Ora la stessa
estensione, con lo **stesso token di installazione** salvato in `chrome.storage.local`
(`milaInstallToken`), può richiedere anche la **consulenza cefalometrica** oltre al check-up
posturale da PDF.

## Endpoint

Stesso del PDF:

```
POST https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/mind-companion-consultation
Authorization: Bearer <milaInstallToken>
Content-Type: application/json
```

**Differenza chiave:** per il check-up posturale usi `multipart/form-data` con il PDF; per la
cefalometria usi **JSON** con i valori numerici del tracciato. Il canale smista in automatico
in base al Content-Type.

## Body JSON

```json
{
  "tool": "orthodontic",
  "age": 10,
  "sex": "F",
  "angolo_sellare": 125,
  "anb": 3,
  "wits": 1,
  "angolo_articolare": 145,
  "angolo_goniaco": 132,
  "ns_mm": 71,
  "gome_mm": 74,
  "nome": "(opzionale) Anna",
  "cognome": "(opzionale) Bianchi",
  "classe_dentale": "(opzionale) II classe",
  "clinicalNotes": "(opzionale) note del professionista",
  "request_id": "(consigliato) uuid, riusa lo stesso su retry"
}
```

**Obbligatori:** `tool: "orthodontic"`, `age`, `sex` (`"M"`/`"F"`), `angolo_sellare`, `anb`,
`wits`, `angolo_articolare`, `angolo_goniaco`.

**NON inviare** `professional_email`, `professional_first_name`, `professional_last_name`:
il server li ricava dal token di installazione. Se li mandi vengono ignorati/sovrascritti.

Il rapporto NS/GoMe è calcolato in automatico da `ns_mm` e `gome_mm` (oppure passa
direttamente `rapporto_ns_gome`).

## Snippet JavaScript (nell'estensione)

```js
async function inviaCefalometria(valori) {
  const { milaInstallToken } = await chrome.storage.local.get("milaInstallToken");
  if (!milaInstallToken) throw new Error("Estensione non attivata");

  const res = await fetch(
    "https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/mind-companion-consultation",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${milaInstallToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tool: "orthodontic",
        request_id: crypto.randomUUID(),
        ...valori,
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401 || (res.status === 403 && data.code === "installation_disabled")) {
      await chrome.storage.local.remove("milaInstallToken"); // torna alla schermata di attivazione
    }
    throw new Error(data.error || `Errore ${res.status}`);
  }
  return data; // { success, download_url, document_url, email_delivery, ... }
}
```

## Risposta positiva

Identica a quella del PDF: `download_url` / `document_url` al documento Word (valido 15
minuti) e conferma `email_delivery.sent` — la consulenza arriva anche via email al
professionista associato al token.

## Errori

Stessa tabella del prompt principale (`docs/PROMPT-MIND-EXTENSION.md` sezione 7). In più,
per la cefalometria:

| HTTP | Causa tipica |
|------|--------------|
| 400 | Manca un valore obbligatorio (age, sex, angoli...) o `tool` diverso da `orthodontic` in JSON |
| 415 | Hai mandato il PDF come JSON o viceversa: multipart = check-up, JSON = cefalometria |
| 402 | Consulenze esaurite sull'account del professionista |

## Regole d'oro

- Un solo endpoint, un solo token: multipart con `file` → check-up posturale (MILA); JSON con
  `tool: "orthodontic"` → cefalometria.
- Il PDF di cefalometria NON va caricato: servono i valori numerici del tracciato. Se parti
  da un PDF, estrai i valori e fai compilare/confermare un piccolo form all'operatore.
- Ogni consulenza riuscita scala una consulenza dal pool del professionista, come sul sito.
- Riusa lo stesso `request_id` in caso di retry di rete.
