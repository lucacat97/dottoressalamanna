# MIND Companion — configurazione manuale per PC

Ogni PC usa un proprio `INSTALL_TOKEN`. Il backend ne conserva soltanto l'impronta SHA-256 e associa il token ai dati del professionista. Il token master MILA non deve essere inserito nell'estensione.

## 1. Generare il token del PC

Eseguire sul proprio computer:

```bash
openssl rand -hex 32
```

Conservare il valore restituito: dovrà essere incollato nell'estensione una sola volta. Non inviarlo via email e non inserirlo nei log.

## 2. Registrare il PC

Sostituire i valori di esempio, incluso `INCOLLA_QUI_INSTALL_TOKEN`, quindi eseguire lo statement nel database:

```sql
INSERT INTO public.mind_companion_installations (
  token_hash,
  device_label,
  professional_first_name,
  professional_last_name,
  professional_email
)
VALUES (
  encode(extensions.digest('INCOLLA_QUI_INSTALL_TOKEN', 'sha256'), 'hex'),
  'Reception 1',
  'Anna',
  'Volpe',
  'email@example.com'
);
```

Nel database viene salvato soltanto l'hash. L'email deve essere quella dell'account MILA che riceve la consulenza e da cui vengono scalati i crediti condivisi con il sito.

## 3. Configurare l'estensione

```js
const API_URL = "https://<BACKEND_HOST>/functions/v1/mind-companion-consultation";
const INSTALL_TOKEN = "INCOLLA_QUI_INSTALL_TOKEN";

async function inviaCheckUpAMila(pdfFile, dati = {}) {
  const form = new FormData();
  form.append("file", pdfFile, pdfFile.name);
  form.append("source", "mind_chrome_extension");
  form.append("request_id", dati.requestId || crypto.randomUUID());
  if (dati.patientId) form.append("mind_patient_id", dati.patientId);
  if (dati.reasonForVisit) form.append("reasonForVisit", dati.reasonForVisit);
  if (dati.clinicalNotes) form.append("clinicalNotes", dati.clinicalNotes);
  if (dati.terapie) form.append("terapie", dati.terapie);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${INSTALL_TOKEN}` },
    body: form,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Errore ${response.status}`);
  return result;
}
```

L'estensione non deve inviare `tool`, nome, cognome o email: il backend imposta `tool=diagnosis` e recupera l'identità professionale associata al PC.

## 4. Revocare o riattivare un PC

```sql
UPDATE public.mind_companion_installations
SET active = false
WHERE device_label = 'Reception 1';
```

Per riattivarlo, usare lo stesso statement con `active = true`.

## Risposte di autenticazione

- `401 unauthorized`: token mancante o non riconosciuto.
- `403 installation_disabled`: PC registrato ma disattivato.
- Gli altri codici e il contenuto della risposta provengono da MILA.

Il PDF massimo accettato è 20 MB. Nei tentativi successivi riutilizzare lo stesso `request_id`.

## Configurazione server

Il backend richiede i segreti `MILA_UPSTREAM_URL` e `MILA_UPSTREAM_TOKEN`. Durante la transizione può usare il token server già protetto `EXTERNAL_API_KEY` come ripiego; nessuno di questi valori viene mai inviato all'estensione o restituito nelle risposte.