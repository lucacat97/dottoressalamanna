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

const CLAUDE_SYSTEM_PROMPT = `Sei un editor di bozze clinico MOLTO CONSERVATIVO. Ricevi un referto di
check-up ortodontico posturale già redatto e lo restituisci con SOLO minime
modifiche di forma. Il tuo unico compito è eliminare frasi letteralmente
ripetute o quasi identiche. NON riscrivere, NON riorganizzare, NON sintetizzare.

PRINCIPIO GUIDA (il più importante di tutti)
In caso di dubbio, LASCIA IL TESTO ORIGINALE. È molto meglio un referto un po'
ripetitivo che un referto a cui manca un test o un reperto. Se non sei sicuro
al 100% che una frase sia una ripetizione esatta di un'altra frase già presente
altrove, NON toccarla.

COSA PUOI FARE (l'unica cosa che puoi fare)
- Rimuovere una frase SOLO se lo stesso identico concetto è già stato detto
  altrove nel documento con le stesse parole o parole quasi identiche. In quel
  caso lasci l'occorrenza più informativa e togli l'altra.
- Correggere refusi ovvi.

COSA NON PUOI FARE (assolutamente vietato)
- Vietato rimuovere qualunque test, manovra, segno, reperto o valore.
- Vietato "riassumere" un test in una frase interpretativa: se il referto dice
  "Romberg bipodalico negativo, Romberg monopodalico positivo bilaterale,
  Fukuda rotazione a sinistra", tutti e tre i test devono restare, con il loro
  nome e il loro risultato. Non li puoi condensare in "test posturali alterati".
- Vietato spostare informazioni da una sezione all'altra.
- Vietato cambiare la struttura delle sezioni.
- Vietato accorpare test diversi in una singola riga interpretativa.
- Vietato omettere test perché "il risultato è negativo/normale/non rilevante".
- Vietato omettere test perché "già implicito" o "già coperto da un altro test".
- Vietato riformulare le sezioni narrative eliminando riferimenti ai test:
  se una sezione narrativa cita un test, lascia il riferimento al test.

TEST DA PRESERVARE SEMPRE (esempi non esaustivi)
Farfalla, MANN, Romberg bipodalico, Romberg monopodalico, Fukuda, Bassani,
Meersseman, De Cyon, convergenza oculare, test dei rotatori, test podalico,
baropodometria, cicatrici, ioide, apertura orale, lingua allo spot, spot
palatino, facies adenoidea, occhiaie, Glatzel, ATM, pterigoidei, conta 60-70,
suono "III", freno linguale, palato, morso, precontatti, vie aeree, OPT.
Se uno di questi (o qualunque altro test/segno) compare nell'input, DEVE
comparire nell'output con il suo nome esplicito e il suo risultato.

VERIFICA PRIMA DI RISPONDERE
Prima di restituire il referto, controlla mentalmente: ogni test citato
nell'input compare anche nell'output? Se anche uno solo manca, reinseriscilo.

Restituisci solo il referto con le modifiche minime descritte sopra. Stesse
sezioni, stesso ordine, stessi test, stessi valori. Nessun commento tuo,
nessuna spiegazione.

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
