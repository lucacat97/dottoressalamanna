import { useState } from "react";
import { ScrollText, Download, X } from "lucide-react";

const ContractFab = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Consulta Contratto MILA"
        className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-petrolio text-primary-foreground shadow-lg hover:shadow-xl hover:bg-petrolio-dark transition-all font-body text-sm"
      >
        <ScrollText size={16} />
        <span className="hidden sm:inline">Consulta Contratto</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
                  Condizioni Generali di Contratto — Piattaforma MILA
                </h2>
                <p className="font-body text-xs text-muted-foreground mt-0.5">
                  Consultabile in ogni momento durante la navigazione
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/documenti/contratto-mila.docx"
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-petrolio/10 text-foreground hover:text-petrolio border border-border hover:border-petrolio/30 transition-all font-body text-xs"
                >
                  <Download size={12} />
                  <span className="hidden sm:inline">Scarica</span>
                </a>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Chiudi"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-muted/70 text-muted-foreground transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            <div className="overflow-y-auto p-6 space-y-5 font-body text-sm text-foreground/90 leading-relaxed">
              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Parti</h3>
                <p>
                  <strong>Titolare / Licenziante:</strong> Studio Odontoiatrico Carella Lamanna SRL (P.IVA 13101640012),
                  in persona del legale rappresentante pro tempore dott. Michele Carella, con sede in Chivasso,
                  via Demetrio Cosola 5/A — PEC{" "}
                  <a href="mailto:studioodontoiatricocarellalamannasrl@legalmail.it" className="text-petrolio underline">
                    studioodontoiatricocarellalamannasrl@legalmail.it
                  </a>.
                </p>
                <p className="mt-2">
                  <strong>Utente Professionista / Licenziatario:</strong> il professionista odontoiatrico/ortodontico che si
                  registra sulla piattaforma, compila l'anagrafica di fatturazione e accetta telematicamente il presente accordo.
                </p>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Premesse</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Il Titolare ha ideato, sviluppato e registrato il metodo proprietario <strong>MILA – Metodo Integrato Lamanna Annarita</strong>, dedicato all'ottimizzazione dei flussi di lavoro clinici e operativi in ambito odontoiatrico e ortodontico.</li>
                  <li>Il Titolare è proprietario esclusivo della Piattaforma digitale "MILA" destinata a professionisti del settore (B2B), che offre abbonamenti a contenuti formativi, un assistente virtuale basato su intelligenza artificiale, la vendita di corsi digitali e un servizio di consulenza professionale specialistica tra colleghi.</li>
                  <li>L'Utente Professionista dichiara di agire esclusivamente per scopi riferibili alla propria attività professionale, essendo regolarmente iscritto al relativo Albo.</li>
                  <li>Premesse e allegati costituiscono parte integrante e sostanziale del contratto.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Art. 1 — Oggetto del contratto</h3>
                <p>
                  Il Titolare concede all'Utente il diritto non esclusivo, temporaneo e non trasferibile di accedere alla
                  Piattaforma e ai relativi servizi (Abbonamenti, Acquisto Contenuti, Assistente AI e Consulenza Specialistica).
                </p>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Art. 2 — Livelli di abbonamento e integrazione DELTAMED</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-foreground">MILA Basic — € 5,99/mese + IVA · € 59,99/anno + IVA</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Accesso ai contenuti riservati, aggiornamenti continui, download di protocolli, schede e documenti, community esclusiva.</li>
                      <li>Servizio opzionale: singola consulenza diretta con il Titolare a <strong>€ 20,00</strong> per consulto.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">MILA Pro — € 19,99/mese + IVA · € 199,99/anno + IVA</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Tutto quanto compreso nel piano Basic; ricerca intelligente dei protocolli ed esecuzione dei test; accesso anticipato ai nuovi contenuti.</li>
                      <li>Assistente AI "MILA" fino a <strong>5 consulti mensili</strong>; per i possessori del gestionale <strong>DELTAMED</strong>, integrazione e chiave di accesso diretta dal software.</li>
                      <li>Sottoscrizione annuale: <strong>sconto 5%</strong> su un corso durante la validità dell'abbonamento.</li>
                      <li>Consulenze AI o cliniche aggiuntive: <strong>€ 10,00</strong> a consulto.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">MILA Platinum — € 49,99/mese + IVA · € 499,99/anno + IVA</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Tutto quanto compreso nel piano Pro; utilizzo <strong>illimitato</strong> dell'assistente AI "MILA".</li>
                      <li>Tutti gli aggiornamenti futuri inclusi; accesso prioritario e in anteprima a funzionalità e contenuti esclusivi.</li>
                      <li>Chiave di accesso e integrazione diretta dal software <strong>DELTAMED</strong> (per gli utenti provvisti di licenza d'uso di tale software esterno).</li>
                      <li>Sconto <strong>10%</strong> su tutti i corsi di formazione acquistati in piattaforma.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Art. 3 — Durata, rinnovo automatico e disdetta</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>L'abbonamento (mensile o annuale) si intende stipulato a tempo determinato con <strong>rinnovo automatico</strong> per pari durata.</li>
                  <li>La disdetta telematica può essere inviata tramite le funzionalità del profilo utente o a mezzo PEC.</li>
                  <li>Deve pervenire tassativamente <strong>entro il giorno 15 del mese precedente</strong> alla scadenza del periodo di fatturazione in corso. Se successiva, l'abbonamento si rinnova e la quota è pienamente dovuta.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Art. 4 — Vendita di contenuti digitali singoli</h3>
                <p>
                  Anche senza abbonamento, l'Utente può acquistare prodotti digitali stand-alone (videocorsi, masterclass,
                  protocolli clinici e altro materiale formativo). Trattandosi di contenuti digitali su supporto non
                  materiale, con l'inizio del download o dello streaming decade qualsiasi diritto di ripensamento o
                  rimborso (rapporto B2B).
                </p>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Art. 5 — Consulenza professionale individuale (B2B)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Servizio di consulenza specialistica su caso clinico al costo fisso di <strong>€ 300,00 a caso</strong>.</li>
                  <li>Modalità operative, limitazione di responsabilità medica e flusso documentale sono regolati dall'<strong>Allegato A</strong>, parte inscindibile del contratto.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Art. 6 — Proprietà intellettuale, tutela del Metodo e restrizioni AI</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tutti i diritti di proprietà intellettuale e industriale sul software, sui contenuti e sul <strong>Metodo MILA</strong> sono di titolarità esclusiva del Titolare.</li>
                  <li>È vietato copiare, riprodurre, ridistribuire o rendere pubblico materiale della Piattaforma o del Metodo.</li>
                  <li>È vietato utilizzare data scraping, web crawling o estrazione dati.</li>
                  <li>È vietato <strong>utilizzare testi, risposte dell'AI o protocolli clinici per addestrare, testare o migliorare sistemi di IA</strong> proprietari o di terze parti.</li>
                  <li>In caso di violazione, il Titolare può disattivare immediatamente l'account trattenendo le somme pagate a titolo di penale, salvo il risarcimento del maggior danno.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Art. 7 — Disponibilità del servizio e manutenzione</h3>
                <p>
                  Il Titolare mantiene attiva la Piattaforma secondo standard di ragionevole diligenza, senza garantire la
                  continuità assoluta del servizio. L'accesso può essere sospeso o limitato temporaneamente per manutenzione
                  ordinaria o straordinaria, aggiornamenti, interventi correttivi o motivi di sicurezza, senza diritto a
                  rimborsi, indennizzi o risarcimenti.
                </p>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Art. 8 — Limitazione di responsabilità e forza maggiore</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Il Titolare non risponde di danni diretti o indiretti derivanti dall'utilizzo o dall'impossibilità di utilizzo della Piattaforma, salvo dolo o colpa grave.</li>
                  <li>Nessuna Parte risponde dell'inadempimento dovuto a forza maggiore (blackout, attacchi informatici, indisponibilità dei provider cloud, eventi naturali, provvedimenti delle autorità).</li>
                  <li>Sono esclusi ritardi o malfunzionamenti causati da fattori fuori dal ragionevole controllo: disservizi di rete, guasti a server o data center terzi, malware, manomissioni, cause imputabili a fornitori terzi.</li>
                  <li>L'Utente Professionista rimane unico ed esclusivo responsabile dell'applicazione pratica, clinica e diagnostica delle informazioni, dei protocolli e dei contenuti ottenuti tramite la Piattaforma o l'Assistente AI.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Art. 9 — Pagamenti, modifica delle tariffe e risoluzione di diritto</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>I pagamenti avvengono con addebito ricorrente su carta di credito o altro sistema autorizzato in piattaforma.</li>
                  <li>Il Titolare può risolvere il contratto ex art. 1456 c.c. in caso di mancato pagamento o violazione degli obblighi di riservatezza e proprietà intellettuale (Art. 6).</li>
                  <li>Le tariffe possono essere modificate con preavviso scritto di almeno <strong>30 giorni</strong> (e-mail, PEC o avviso in Piattaforma). L'Utente può recedere senza costi prima dell'entrata in vigore del nuovo prezzo; il proseguimento dell'utilizzo costituisce accettazione della variazione.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Art. 10 — Uso improprio e abuso del servizio</h3>
                <p>L'account è personale, riservato e non cedibile. È vietato:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>cedere, condividere o sublicenziare le credenziali di accesso a colleghi, collaboratori o terzi;</li>
                  <li>utilizzare la Piattaforma o l'Assistente AI per scopi illeciti o contrari alla deontologia professionale;</li>
                  <li>effettuare utilizzi anomali, sproporzionati o automatizzati (bot, script) che sovraccarichino le infrastrutture;</li>
                  <li>tentare di bypassare, manomettere o disabilitare misure di sicurezza o limiti d'uso dei piani.</li>
                </ul>
                <p className="mt-2">
                  Il Titolare può monitorare l'utilizzo e, in presenza di uso anomalo, condivisione illegittima dell'account o
                  abuso, sospendere cautelativamente o disattivare definitivamente l'accesso senza preavviso né rimborso,
                  fatto salvo il risarcimento dei danni.
                </p>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Art. 11 — Foro competente e legge applicabile</h3>
                <p>Il contratto è regolato dalla Legge Italiana. Foro competente esclusivo: quello della sede legale del Titolare.</p>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Art. 12 — Rinvii normativi</h3>
                <p>Per tutto quanto non espressamente previsto, si applicano le norme del Codice Civile.</p>
              </section>

              <section>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Art. 13 — Elenco allegati al contratto</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Allegato A</strong> — Contratto per Consulenze Professionali</li>
                  <li><strong>Allegato B</strong> — Regolamento e Condizioni d'uso Assistente AI MILA</li>
                  <li><strong>Allegato C</strong> — Informativa Privacy, Accordo GDPR e Cookie Policy</li>
                </ul>
                <p className="mt-2 text-xs text-muted-foreground italic">
                  Gli allegati completi sono consultabili e scaricabili nel tab "Documenti" dell'area riservata.
                </p>
              </section>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContractFab;
