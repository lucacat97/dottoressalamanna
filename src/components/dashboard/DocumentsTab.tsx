import { useState } from "react";
import { FileText, Download, ChevronDown } from "lucide-react";

interface Doc {
  id: string;
  title: string;
  subtitle: string;
  file: string;
  content: React.ReactNode;
}

const DOCS: Doc[] = [
  {
    id: "a",
    title: "Allegato A — Contratto di Consulenza Professionale",
    subtitle: "Consulenze specialistiche su casi clinici e tutela medico-legale",
    file: "/documenti/allegato-a-contratto-consulenza.docx",
    content: (
      <div className="space-y-4 font-body text-sm text-foreground/90 leading-relaxed">
        <section>
          <h4 className="font-display font-semibold text-foreground mb-1">1. Oggetto e Flusso di Lavoro</h4>
          <p>L'Utente Professionista può richiedere una consulenza specialistica individuale su un proprio caso clinico in corso. Il servizio comprende:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Analisi</strong> della documentazione inviata.</li>
            <li><strong>Videochiamata</strong> di circa 1 ora per analizzare congiuntamente il caso.</li>
            <li><strong>Parere tecnico scritto</strong> redatto dal Titolare, applicando i principi scientifici del Metodo MILA.</li>
          </ul>
        </section>
        <section>
          <h4 className="font-display font-semibold text-foreground mb-1">2. Modalità di richiesta e invio documentazione</h4>
          <p>L'Utente trasmette la documentazione clinica (fotografie intra/extra-orali, radiografie, tracciati cefalometrici, scansioni STL) tramite PEC o altro canale crittografato idoneo specificato dal Titolare.</p>
        </section>
        <section>
          <h4 className="font-display font-semibold text-foreground mb-1">3. Tempistiche di Risposta</h4>
          <p>Il Titolare si impegna a inviare il parere scritto indicativamente <strong>entro 15 giorni lavorativi</strong> dalla ricezione della documentazione clinica completa. Qualora la documentazione risulti incompleta o sfocata, il termine decorre dalla ricezione delle integrazioni richieste.</p>
        </section>
        <section>
          <h4 className="font-display font-semibold text-foreground mb-1">4. Esclusione di Responsabilità Terapeutica e Diagnostica</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>La consulenza costituisce esclusivamente un <strong>supporto professionale e scientifico tra colleghi</strong> (parere inter-collegiale).</li>
            <li>Il Titolare <strong>non effettua alcuna diagnosi diretta</strong> sul paziente dell'Utente e non assume la cura o la responsabilità terapeutica del soggetto trattato.</li>
            <li>La piena ed esclusiva responsabilità delle decisioni diagnostiche, terapeutiche e cliniche rimane in capo all'Utente Professionista richiedente.</li>
            <li>L'Utente si impegna a tenere indenne il Titolare da qualsivoglia richiesta di risarcimento avanzata dal paziente o da terzi.</li>
          </ul>
        </section>
        <section>
          <h4 className="font-display font-semibold text-foreground mb-1">5. Politica di Conservazione dei Dati</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Nessun dato clinico o identificativo dei pazienti verrà memorizzato sui server della Piattaforma.</strong></li>
            <li>Tutti i materiali clinici (radiografie, foto, scansioni) inviati vengono utilizzati esclusivamente per l'analisi del caso e cancellati subito dopo la stesura del parere.</li>
            <li>Il parere tecnico-professionale finale viene spedito <strong>esclusivamente tramite PEC</strong>, garantendo tracciabilità e sicurezza della trasmissione.</li>
          </ul>
        </section>
      </div>
    ),
  },
  {
    id: "b",
    title: "Allegato B — Regolamento e Condizioni d'uso dell'Assistente AI \"MILA\"",
    subtitle: "Soglie di utilizzo e responsabilità sull'uso dell'AI",
    file: "/documenti/allegato-b-regolamento-mila-ai.docx",
    content: (
      <div className="space-y-4 font-body text-sm text-foreground/90 leading-relaxed">
        <section>
          <h4 className="font-display font-semibold text-foreground mb-1">1. Funzione dell'Assistente AI</h4>
          <p>L'assistente virtuale "MILA" fornisce risposte basate sull'elaborazione informatica di protocolli e testi relativi al <strong>Metodo Integrato Lamanna Annarita</strong>.</p>
        </section>
        <section>
          <h4 className="font-display font-semibold text-foreground mb-1">2. Soglie di Utilizzo</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Gli utenti in abbonamento <strong>MILA Pro</strong> dispongono di un massimo di <strong>5 consulti mensili</strong>, utilizzabili anche tramite l'integrazione diretta del software gestionale <strong>DELTAMED</strong>.</li>
            <li>Gli utenti in abbonamento <strong>MILA Platinum</strong> beneficiano di un accesso <strong>illimitato</strong> all'assistente AI.</li>
          </ul>
        </section>
        <section>
          <h4 className="font-display font-semibold text-foreground mb-1">3. Responsabilità sull'uso dell'AI</h4>
          <p>Le risposte generate dall'AI hanno valore <strong>puramente informativo, didattico e di orientamento generale</strong>. Non sostituiscono in alcun caso il giudizio clinico del medico professionista, che è tenuto a verificare l'esattezza scientifica delle risposte prima di qualsiasi applicazione clinica.</p>
        </section>
      </div>
    ),
  },
  {
    id: "c",
    title: "Allegato C — Documento Unico Privacy (Informativa, DPA, Cookie Policy)",
    subtitle: "GDPR — Regolamento UE 2016/679",
    file: "/documenti/allegato-c-privacy-gdpr.docx",
    content: (
      <div className="space-y-5 font-body text-sm text-foreground/90 leading-relaxed">
        <p className="italic text-muted-foreground">Il presente documento costituisce parte integrante del Contratto di Servizio della Piattaforma MILA. Con l'accettazione delle Condizioni Generali, l'Utente Professionista dichiara di aver letto, compreso e accettato integralmente quanto di seguito stabilito.</p>

        <section>
          <h4 className="font-display font-semibold text-foreground">Sezione I — Informativa sul trattamento dei dati personali dell'Utente</h4>
          <p className="text-xs text-muted-foreground italic mb-2">(Ai sensi dell'Art. 13 del Regolamento UE 2016/679 - GDPR)</p>
          <p><strong>1. Titolare del Trattamento.</strong> STUDIO ODONTOIATRICO CARELLA LAMANNA SRL (P.IVA 1310640012), in persona del legale rappresentante pro tempore dott. Michele Carella, con sede in Chivasso, via Demetrio Cosola 5/A. PEC: <a href="mailto:studioodontoiatricocarellalamannasrl@legalmail.it" className="text-petrolio underline">studioodontoiatricocarellalamannasrl@legalmail.it</a>.</p>
          <p className="mt-2"><strong>2. Tipologia di Dati Trattati:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dati anagrafici e di contatto:</strong> nome, cognome, indirizzo dello studio, e-mail, PEC, telefono, codice fiscale, P.IVA.</li>
            <li><strong>Dati finanziari:</strong> IBAN, estremi di pagamento e dati di fatturazione.</li>
            <li><strong>Dati di navigazione e accesso:</strong> IP, credenziali di accesso, log di utilizzo dei sistemi AI e dell'integrazione software.</li>
          </ul>
          <p className="mt-2"><strong>3. Finalità e basi giuridiche:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Esecuzione obblighi contrattuali</strong> (Art. 6.1.b GDPR): attivazione piani Basic/Pro/Platinum, fruizione dell'AI MILA, corsi digitali, consulenze individuali.</li>
            <li><strong>Adempimento obblighi di legge</strong> (Art. 6.1.c GDPR): obblighi fiscali, contabili e amministrativi.</li>
            <li><strong>Legittimo interesse</strong> (Art. 6.1.f GDPR): tutela dei sistemi informatici, sicurezza della Piattaforma, protezione del segreto industriale legato al Metodo MILA.</li>
          </ul>
          <p className="mt-2"><strong>4. Conservazione dei dati.</strong> I dati legati all'abbonamento sono conservati per tutta la durata del rapporto contrattuale. Cessato il rapporto, i soli dati necessari agli obblighi di legge (es. fatture) sono conservati per 10 anni.</p>
        </section>

        <section>
          <h4 className="font-display font-semibold text-foreground">Sezione II — Data Processing Agreement (DPA)</h4>
          <p className="text-xs text-muted-foreground italic mb-2">(Ai sensi dell'Art. 28 GDPR — Trattamento dei dati sanitari dei pazienti)</p>
          <p><strong>1. Ruoli e istruzioni di trattamento.</strong> L'<strong>Utente Professionista</strong> agisce come <strong>Titolare del Trattamento</strong> per i dati dei propri pazienti (radiografie, foto intraorali, STL). Lo Studio / Piattaforma MILA agisce come <strong>Responsabile del Trattamento</strong> limitatamente alle operazioni temporanee necessarie all'erogazione della consulenza specialistica richiesta.</p>
          <p className="mt-2"><strong>2. Obblighi di sicurezza — Politica di "Zero Retention":</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Assenza di memorizzazione:</strong> nessun file diagnostico, radiografia, fotografia clinica o scansione STL relativo ai pazienti dell'Utente viene memorizzato o archiviato in modo permanente sui server della Piattaforma.</li>
            <li><strong>Procedura di invio e cancellazione:</strong> l'Utente invia i materiali via canali crittografati; il Responsabile analizza la documentazione solo per elaborare la consulenza; il parere finale è trasmesso via PEC; <strong>immediatamente dopo la trasmissione, il Responsabile cancella definitivamente tutti i materiali clinici ricevuti</strong>.</li>
            <li><strong>Garanzie del Professionista:</strong> l'Utente trasmette i dati in modalità pseudonimizzata (codice paziente o iniziali) e garantisce di aver ottenuto dai pazienti il consenso informato per l'analisi inter-collegiale.</li>
          </ul>
        </section>

        <section>
          <h4 className="font-display font-semibold text-foreground">Sezione III — Cookie Policy</h4>
          <p><strong>1. Tipologie di cookie utilizzate:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Cookie tecnici (strettamente necessari):</strong> consentono la navigazione, il mantenimento della sessione di login nell'area riservata e la gestione del carrello per i corsi digitali. Non richiedono il preventivo consenso.</li>
            <li><strong>Cookie di integrazione funzionale (terze parti):</strong> necessari al collegamento API con DELTAMED per abilitare i consulti AI riservati agli abbonamenti Pro e Platinum.</li>
            <li><strong>Cookie analitici (anonimi):</strong> statistica aggregata (es. Google Analytics con IP mascherato) per analizzare il traffico in forma anonima, senza profilazione.</li>
          </ul>
          <p className="mt-2"><strong>2. Gestione del consenso.</strong> L'Utente può gestire le preferenze dal banner presente al primo accesso o configurando il proprio browser. La disattivazione dei cookie tecnici può compromettere l'accesso alle funzionalità riservate.</p>
        </section>
      </div>
    ),
  },
];

const DocumentsTab = () => {
  const [openId, setOpenId] = useState<string | null>("a");

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">Documenti e Condizioni</h2>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Documentazione contrattuale e informativa privacy della Piattaforma MILA. Consultabile e scaricabile in qualsiasi momento.
        </p>
      </div>

      <div className="space-y-3">
        {DOCS.map((doc) => {
          const isOpen = openId === doc.id;
          return (
            <article key={doc.id} className="bg-card border border-border rounded-lg overflow-hidden transition-shadow hover:shadow-soft">
              <header className="flex items-start gap-4 p-4 sm:p-5">
                <div className="w-10 h-10 rounded-lg bg-petrolio/10 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-petrolio" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base sm:text-lg font-semibold text-foreground leading-snug">{doc.title}</h3>
                  <p className="font-body text-xs sm:text-sm text-muted-foreground mt-1">{doc.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={doc.file}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-petrolio/10 text-foreground hover:text-petrolio border border-border hover:border-petrolio/30 transition-all font-body text-xs"
                  >
                    <Download size={12} />
                    <span className="hidden sm:inline">Scarica</span>
                  </a>
                  <button
                    onClick={() => setOpenId(isOpen ? null : doc.id)}
                    aria-expanded={isOpen}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-muted/70 text-muted-foreground transition-all"
                  >
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </header>
              {isOpen && (
                <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-border/60 bg-background/40">
                  {doc.content}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default DocumentsTab;
