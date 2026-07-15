// Shared Claude Sonnet refinement pipeline for Consulenza Clinica MILA.
// Used by both deliver-mila-consultation (site) and external-api (public API).

const CLAUDE_EXEMPLAR = `CONSULENZA CHECK-UP ORTODONTICO POSTURALE

Disclaimer: Questo strumento fornisce esclusivamente un supporto all'analisi clinica e NON costituisce in alcun modo una diagnosi medica. La responsabilità diagnostica resta interamente in capo al professionista sanitario. L'utilizzo di questo strumento non sostituisce il giudizio clinico del medico.

Paziente: Crola Pietro
Età: 7 anni e 7 mesi
Data visita: 17/03/2026

Motivo della visita
Check-up ortodontico posturale. Pietro non riferisce sintomi.

Introduzione
Il check-up ortodontico posturale osserva l'organismo nella sua interezza: bocca, lingua, respirazione, postura, occhi e sistema neuromuscolare lavorano in rete. L'obiettivo è distinguere ciò che è primario da ciò che è compenso, così da guidare la crescita in modo più armonico e stabile.

Le cose che funzionano
Il sistema mostra buone risorse di base. La storia è lineare, l'igiene orale è buona e non c'è dolore a carico di muscoli masticatori o ATM. La cinematica mandibolare è pulita. Il reperto più significativo è la reattività posturale all'input linguale: portando la lingua allo spot palatino, il piede destro "corto" e la restrizione intrarotatoria d'anca si normalizzano.

Le cose da correggere e il loro significato
Gli elementi critici si distribuiscono su tre piani coerenti fra loro:
- Occlusale: palato stretto, morso aperto e precontatti in protrusiva.
- Miofunzionale: lingua potenzialmente capace ma poco allenata.
- Posturale: assetto tipo sindrome discendente, con asimmetrie di bacino e spalle.
Il significato clinico è chiaro: la lingua e i recettori alti sono i driver funzionali dell'organizzazione posturale.

Analisi dettagliata dei risultati

Anamnesi
Parto spontaneo, sonno continuo, attività sportiva regolare; nessun trauma né intervento. È presente respirazione orale abituale.

Esame orale e occlusale
Dentizione mista, igiene buona. Palato stretto e morso aperto. Precontatti in protrusiva.

Funzione linguale e frenulo
Farfalla non coordinata, MANN negativo, conta 60–70 poco efficiente. Il suono "III" è ben eseguito. Freno muscolare funzionale, non strutturale.

Respirazione e distretto ORL
Specchietto di Glatzel negativo, ma facies adenoidea e occhiaie suggeriscono respirazione prevalentemente orale.

Muscoli e ATM
Nessun dolore. Ipertono marcato degli pterigoidei a sinistra (9/10).

Esame radiografico (OPT)
Vie aeree ben rappresentate. Osso ioide non compreso tra C2 e C3.

Esame posturale
- Romberg bipodalico: negativo. - Romberg monopodalico: positivo bilaterale. - Fukuda: rotazione a sinistra. - Bacino alto a sinistra, spalla alta a destra, piede corto a destra che normalizza con lingua allo spot.

Sistema visivo
Occhio dominante destro; convergenza non sincrona.

Terapie consigliate

Terapia elastodontica
Durata orientativa: circa 12 mesi. Utilizzo: 2 ore durante il giorno e tutta la notte. In caso di perdita: 350,00 euro.

Terapia miofunzionale
Durata orientativa: 6–12 mesi.

Terapie di supporto
- Fotobiomodulazione. - Valutazione optometrica funzionale. - Approfondimento ORL.

Messaggio conclusivo
Il corpo sta già facendo molto per restare in equilibrio. Con costanza e una guida adeguata possiamo accompagnare la crescita verso un equilibrio più naturale.

Dott.ssa Lamanna Annarita
Odontoiatra — Ortodontista — Agopuntrice — Nanotectherapist
Studio Carella & Lamanna`;

const CLAUDE_SYSTEM_PROMPT = `Sei un editor clinico. Ricevi un referto di check-up ortodontico posturale già
redatto e restituisci la stessa consulenza riscritta in modo più asciutto e meno
ripetitivo, SENZA alterare, aggiungere o rimuovere alcun dato clinico.

REGOLE INVIOLABILI
- Non inventare reperti, valori, diagnosi o terapie. Non rimuovere dati clinici.
- Mantieni invariati: disclaimer, dati anagrafici, valori numerici, nomi dei test,
  durate e note economiche delle terapie, firma del professionista.
- CONSERVAZIONE INTEGRALE DEI TEST: ogni test/manovra/segno citato nel referto
  originale DEVE comparire, con il suo nome esplicito, nella sezione
  "Analisi dettagliata dei risultati" — anche se il risultato è negativo,
  normale o non significativo, anche se ritieni sia ridondante. Vale in
  particolare per: Farfalla/MANN, Romberg, Fukuda, Bassani, Meersseman,
  De Cyon/convergenza, test dei rotatori, test podalico/baropodometrico,
  cicatrici, ioide, apertura orale, lingua allo spot, facies adenoidea.
  Se un test compare nell'input, DEVE comparire nell'output. Vietato omettere
  un test per "sintesi" o perché "già implicito".
- Il tuo compito è SOLO de-duplicare frasi ridondanti e compattare la prosa,
  MAI rimuovere test o reperti dal registro dei dati.

STRUTTURA (il principio più importante)
Il referto ripete le stesse cose perché le sezioni narrative e l'analisi dettagliata
coprono lo stesso terreno. Assegna a ciascun livello un ruolo distinto:
- Sezioni narrative ("Le cose che funzionano", "Le cose da correggere",
  "Messaggio conclusivo") = INTERPRETAZIONE: dicono che cosa significano i reperti,
  senza elencare i singoli test.
- "Analisi dettagliata" = REGISTRO DEI DATI: ogni reperto compare qui, una volta
  sola, in forma sintetica (un test = una riga o una frase breve).

CONSOLIDAMENTI (ogni concetto va detto UNA sola volta)
- Reattività posturale all'input linguale (piede/anca che normalizzano con lingua
  allo spot): enunciala una volta come reperto-chiave nella sezione positiva, poi
  limitati a richiamarla dove serve.
- La frase "non è solo un apparecchio / non serve solo a raddrizzare i denti":
  tienila una sola volta in tutto il documento.
- Ioide non tra C2-C3 → lingua bassa a riposo: una volta.
- Apertura orale <4 cm + "non oltre il 50% con lingua allo spot": una volta.
- Farfalla/MANN, facies adenoidea/occhiaie, vie aeree ben rappresentate:
  ciascuno una sola volta.

STILE
- Elimina le frasi-cornice ridondanti ("Osserviamo diversi segnali che…",
  "Sono emersi elementi che meritano attenzione…"): entra subito nel merito.
- Varia la struttura sintattica: non tutte le frasi nella forma "il test X è Y,
  segno che Z". Riserva il commento interpretativo ai 2-3 reperti davvero decisivi;
  per gli altri basta il dato.
- Raggruppa i reperti per sistema (respirazione, lingua/deglutizione, appoggio,
  occlusione) invece di procedere test per test.
- Tono professionale, italiano, niente linguaggio pubblicitario.

Restituisci solo il referto riscritto, con le stesse sezioni dell'originale.
Nessun commento tuo, nessuna spiegazione delle modifiche.

APPENDICE DIDATTICA (obbligatoria, in coda al referto)
Dopo il "Messaggio conclusivo" e PRIMA della firma, aggiungi una sezione
<h2>Appendice — a cosa servono i test utilizzati</h2> che spieghi in linguaggio
piano, per il paziente, il significato clinico dei soli test/segni effettivamente
citati in questo referto. Non aggiungere test che non compaiono nel testo, non
inventare valori. Per ciascun test: una riga con <strong>Nome del test</strong>
seguita da 1-2 frasi che dicono che cosa valuta e perché è rilevante per il caso.
Copri, se presenti nel referto: cicatrici (perché una cicatrice — anche vecchia,
appendicectomia, cesareo, tonsillectomia — può alterare le catene fasciali e la
postura), Romberg (equilibrio con occhi chiusi, informa sull'integrazione
propriocettiva/vestibolare), Fukuda (marcia sul posto a occhi chiusi, rotazione
del corpo che segnala asimmetrie vestibolari o cervicali), Bassani (test dei
rotatori, competenza del sistema tonico posturale), Meersseman (test dei filtri
occlusale/podalico per capire chi comanda la postura), test di De Cyon /
convergenza oculare, farfalla / MANN (competenza labiale e respirazione),
apertura orale e lingua allo spot (funzione linguale), ioide (posizione della
lingua a riposo), appoggio podalico e baropodometria, facies adenoidea /
occhiaie / vie aeree (respirazione orale cronica). Usa <p> o <ul><li> a tua
scelta ma mantieni il tono divulgativo e sintetico.

FORMATO DI OUTPUT (vincolo tecnico obbligatorio)
Restituisci il referto come frammento HTML puro (senza <html>, <head>, <style>,
senza attributi style o color inline). Usa esclusivamente questi tag:
- <h1> per il titolo (una sola volta)
- <div class="disclaimer">…</div> per il disclaimer
- <p class="meta"> per Paziente / Età / Data visita
- <h2> per le sezioni principali (Motivo, Introduzione, Le cose che funzionano,
  Le cose da correggere e il loro significato, Analisi dettagliata dei risultati,
  Terapie consigliate, Messaggio conclusivo, Appendice — a cosa servono i test utilizzati)
- <h3> per le sottosezioni di Analisi dettagliata e Terapie
- <p>, <ul>, <li>, <strong> per il corpo
- <div class="signature">…</div> per la firma finale
Nessun testo fuori dai tag, nessun commento, solo il frammento HTML.

===== ESEMPIO DI RIFERIMENTO STRUTTURALE (solo per struttura/tono/sintesi, NON copiare i dati) =====
${CLAUDE_EXEMPLAR}
===== FINE ESEMPIO =====`;

export function applyInlineStyles(html: string): string {
  const ACCENT = "#1F3864";
  const DISC_BG = "#FBF3D9";
  const DISC_BORDER = "#E0C97A";
  const GREY = "#444444";
  return html
    .replace(/<h1(\s|>)/gi, `<h1 style="color:${ACCENT};font-family:Georgia,serif;font-size:20pt;margin:28px 0 12px;border-bottom:1px solid #eee;padding-bottom:8px;"$1`)
    .replace(/<h2(\s|>)/gi, `<h2 style="color:${ACCENT};font-family:Georgia,serif;font-size:16pt;margin:24px 0 10px;"$1`)
    .replace(/<h3(\s|>)/gi, `<h3 style="color:#333;font-size:12pt;margin:18px 0 6px;"$1`)
    .replace(/<div class="disclaimer"(\s|>)/gi, `<div style="background:${DISC_BG};border:1px solid ${DISC_BORDER};padding:12px 16px;border-radius:6px;margin:16px 0;color:#5b4708;font-size:11pt;line-height:1.5;"$1`)
    .replace(/<div class="signature"(\s|>)/gi, `<div style="color:${GREY};font-style:italic;margin-top:28px;padding-top:12px;border-top:1px solid #ddd;font-size:11pt;"$1`)
    .replace(/<p class="meta"(\s|>)/gi, `<p style="color:${GREY};font-size:11pt;margin:4px 0;"$1`);
}

export function extractIntroFromHtml(html: string): string {
  const stripped = html
    .replace(/<div[^>]*(?:disclaimer|signature)[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<p[^>]*class="meta"[^>]*>[\s\S]*?<\/p>/gi, "");
  const paragraphs: string[] = [];
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) && paragraphs.length < 2) {
    const inner = m[1].trim();
    if (inner) paragraphs.push(`<p style="margin:8px 0;line-height:1.6;">${inner}</p>`);
  }
  return paragraphs.join("\n") || "<p>La consulenza completa è disponibile nel documento allegato.</p>";
}

export async function refineWithClaude(markdown: string): Promise<string | null> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) {
    console.warn("[refineWithClaude] ANTHROPIC_API_KEY missing, skip refine");
    return null;
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      temperature: 0.2,
      system: CLAUDE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: markdown }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Anthropic HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const fragment = (data?.content ?? [])
    .filter((b: any) => b?.type === "text")
    .map((b: any) => b.text as string)
    .join("")
    .trim();
  const cleaned = fragment
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  if (!cleaned || cleaned.length < 50) return null;
  return applyInlineStyles(cleaned);
}
