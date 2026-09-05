# Attivazione dell'estensione Chrome MILA con Activation Code

L'estensione **non** contiene nessun token MILA. Alla prima apertura chiede un
**Activation Code** dello studio; lo scambia una sola volta con il backend e
riceve un **token di installazione** valido solo per quel PC, che salva in
`chrome.storage.local`.

```
Activation Code (studio)  ──►  POST /mind-activate  ──►  install_token (per PC)
                                                          │
                                       usato in ogni chiamata successiva a
                                       POST /mind-companion-consultation
```

---

## 1. Endpoint di attivazione

```
POST https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/mind-activate
Content-Type: application/json
```

Body:

```json
{
  "activation_code": "MILA-XXXX-XXXX-XXXX",
  "device_label": "Studio - PC reception"
}
```

`device_label` è facoltativo ma consigliato (serve a riconoscere il PC in caso di revoca).

### Risposta 200

```json
{
  "success": true,
  "install_token": "mind_dev_....",
  "device_label": "Studio - PC reception",
  "studio_label": "Studio Lamanna",
  "professional_first_name": "Annarita",
  "professional_last_name": "Lamanna",
  "professional_email": "dott.lamanna.a@gmail.com",
  "consultation_url": "https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/mind-companion-consultation"
}
```

L'estensione deve salvare **solo** `install_token` (e opzionalmente
`consultation_url`). L'Activation Code non va conservato.

### Errori

| Status | `code`                     | Significato                                   |
| ------ | -------------------------- | --------------------------------------------- |
| 400    | `invalid_payload`          | Codice mancante o malformato                  |
| 401    | `invalid_activation_code`  | Codice non riconosciuto                       |
| 403    | `activation_code_disabled` | Codice revocato                               |
| 403    | `activation_code_expired`  | Codice scaduto                                |
| 409    | `activation_limit_reached` | Raggiunto il numero massimo di PC attivabili  |
| 503    | `service_unavailable`      | Configurazione server mancante                |

---

## 2. Codice per l'estensione

```js
const ACTIVATE_URL = "https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/mind-activate";

async function activate(activationCode, deviceLabel) {
  const res = await fetch(ACTIVATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activation_code: activationCode, device_label: deviceLabel }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Attivazione non riuscita");

  await chrome.storage.local.set({
    milaInstallToken: data.install_token,
    milaConsultationUrl: data.consultation_url,
    milaProfessionalEmail: data.professional_email,
  });
  return data;
}

async function isActivated() {
  const { milaInstallToken } = await chrome.storage.local.get("milaInstallToken");
  return Boolean(milaInstallToken);
}
```

Invio del PDF dopo l'attivazione:

```js
async function sendPdf(file, extra = {}) {
  const { milaInstallToken, milaConsultationUrl } = await chrome.storage.local.get([
    "milaInstallToken",
    "milaConsultationUrl",
  ]);
  if (!milaInstallToken) throw new Error("Estensione non attivata");

  const form = new FormData();
  form.append("file", file, file.name);
  for (const [k, v] of Object.entries(extra)) if (v) form.append(k, v);

  const res = await fetch(milaConsultationUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${milaInstallToken}` },
    body: form,
  });
  return res.json();
}
```

Se una chiamata torna **401** o **403 `installation_disabled`**, l'estensione deve
cancellare il token salvato e mostrare di nuovo la schermata "Attivazione MILA".

---

## 3. Gestione dei codici (lato amministrazione)

Generare un codice:

```bash
python3 -c "
import secrets,hashlib
raw=secrets.token_hex(6).upper()
code='MILA-'+'-'.join([raw[i:i+4] for i in range(0,12,4)])
print('CODICE:',code)
print('HASH  :',hashlib.sha256(code.encode()).hexdigest())
"
```

Registrarlo (solo l'hash finisce nel database):

```sql
INSERT INTO public.mind_activation_codes
  (code_hash, studio_label, professional_first_name, professional_last_name,
   professional_email, max_activations, expires_at, note)
VALUES
  ('INCOLLA_HASH', 'Studio Lamanna', 'Annarita', 'Lamanna',
   'dott.lamanna.a@gmail.com', 5, NULL, 'Estensione Chrome');
```

Revocare un codice (i PC già attivati continuano a funzionare):

```sql
UPDATE public.mind_activation_codes SET active = false WHERE studio_label = 'Studio Lamanna';
```

Revocare un singolo PC:

```sql
UPDATE public.mind_companion_installations SET active = false WHERE device_label ILIKE '%reception%';
```

Vedere i PC attivi:

```sql
SELECT device_label, professional_email, active, created_at, last_seen_at
FROM public.mind_companion_installations
ORDER BY created_at DESC;
```

---

## 4. Codice attivo attuale

- **Studio Lamanna** — `MILA-9444-E7AC-80C0` — fino a 5 PC, nessuna scadenza.
