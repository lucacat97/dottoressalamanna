import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Brain, Wind, Smile, Moon, Activity, Footprints, Stethoscope, Ear, Speech, Bone, ArrowRight, Sparkles } from "lucide-react";
import heroImg from "@/assets/patient-hero.jpg";
import compensiImg from "@/assets/patient-compensi.jpg";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.7 } };

const symptoms = [
  { icon: Brain, label: "Cefalee tensive ricorrenti" },
  { icon: Smile, label: "Bruxismo e serramento" },
  { icon: Bone, label: "Dolori cervicali e mandibolari" },
  { icon: Moon, label: "Sonno frammentato, stanchezza al risveglio" },
  { icon: Activity, label: "Recidive ortodontiche" },
  { icon: Wind, label: "Russamento e respirazione orale" },
  { icon: Footprints, label: "Postura alterata, dolori muscolari" },
  { icon: Sparkles, label: "Vertigini, instabilità, acufeni" },
];

const pillars = [
  { icon: Speech, title: "La lingua", text: "Architetto silenzioso del volto: la sua posizione modella palato, mascella e ATM. Una lingua bassa cambia la postura del cranio." },
  { icon: Wind, title: "La respirazione", text: "Respirare dal naso ossigena, filtra, equilibra il sistema nervoso. La respirazione orale altera mandibola, postura e qualità del sonno." },
  { icon: Smile, title: "Occlusione & ATM", text: "Una malocclusione non è solo un disallineamento: è un'interfaccia disfunzionale tra cranio e mandibola che si scarica sui muscoli." },
  { icon: Moon, title: "Sonno & Stanchezza", text: "Una via aerea ristretta produce micro-risvegli e stress cronico. Trattare la causa libera il riposo profondo." },
];

const team = [
  { icon: Ear, title: "Otorinolaringoiatra", text: "Per liberare le vie aeree superiori." },
  { icon: Speech, title: "Logopedista miofunzionale", text: "Per rieducare lingua e muscolatura periorale." },
  { icon: Footprints, title: "Osteopata / Posturologo", text: "Per integrare il cambiamento occlusale nella postura globale." },
  { icon: Moon, title: "Specialista del sonno", text: "Per monitorare l'impatto sul sistema nervoso e sul riposo." },
];

const PatientLanding = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Topbar minimale */}
      <header className="absolute top-0 left-0 right-0 z-30 px-6 py-5 flex items-center justify-between">
        <Link to="/" className="font-display text-lg font-semibold text-primary-foreground">Dott.ssa <span className="text-gold">Lamanna</span></Link>
        <Link to="/professionisti" className="font-body text-sm text-primary-foreground/80 hover:text-gold transition-colors">Sei un professionista? →</Link>
      </header>

      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-petrolio-dark">
        <img src={heroImg} alt="Approccio globale al paziente" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-petrolio-dark via-petrolio-dark/90 to-petrolio-dark/40" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="font-body uppercase tracking-[0.3em] text-gold mb-6 text-sm">
            Check-up Ortodontico Posturale
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[1.05] mb-6 max-w-3xl">
            Il tuo corpo parla.<br />
            <span className="italic font-medium text-gold-light">Impariamo ad ascoltarlo.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="font-body text-lg md:text-xl text-primary-foreground/85 leading-relaxed mb-10 max-w-2xl">
            La bocca è il crocevia di respirazione, postura, masticazione e sonno. Quando un sintomo si ripete o resiste alle cure, parla di un sistema in cerca di equilibrio. Il Check-up Ortodontico Posturale ascolta tutto il corpo.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-col sm:flex-row gap-4">
            <a href="#prenota" className="inline-flex items-center justify-center px-8 py-4 bg-gold text-petrolio-dark font-body font-semibold rounded-md hover:bg-gold-light transition-all duration-300 hover:scale-105 text-base">Prenota un Check-up</a>
            <a href="#metodo" className="inline-flex items-center justify-center px-8 py-4 border border-primary-foreground/30 text-primary-foreground font-body font-medium rounded-md hover:bg-primary-foreground/10 transition-all duration-300 text-base">Scopri il metodo</a>
          </motion.div>
        </div>
      </section>

      {/* PAZIENTE GLOBALE */}
      <section id="metodo" className="py-24 md:py-32 bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div {...fadeUp} className="space-y-6">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-petrolio">Il paziente globale</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight">Oltre la visione settoriale.</h2>
            <div className="space-y-5 font-body text-base md:text-lg text-foreground/80 leading-relaxed">
              <p>Per decenni la medicina ha trattato il corpo come un insieme di pezzi indipendenti: il dentista i denti, l'ortopedico la colonna, l'otorino le vie aeree. Ma l'esperienza clinica insegna che molte patologie croniche o resistenti vivono <em>nello spazio fra le specializzazioni</em>.</p>
              <p>Considerare il paziente come compartimenti stagni impedisce di vedere i fili invisibili che collegano respirazione, deglutizione, occlusione e postura. Il <strong>paziente globale</strong> viene osservato non per la singola patologia, ma per come il suo intero sistema biologico sta cercando di mantenere un equilibrio.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SINTOMI */}
      <section className="py-20 md:py-28 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-petrolio">Sintomi che ti riguardano</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Quando il corpo grida quello che la bocca ha sussurrato.</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {symptoms.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05 }}
                className="bg-card rounded-xl p-5 border border-border hover:shadow-card hover:-translate-y-1 transition-all">
                <s.icon size={26} className="text-petrolio mb-3" />
                <p className="font-body text-sm font-medium text-foreground leading-snug">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPENSI */}
      <section className="py-24 md:py-32 bg-petrolio-dark text-primary-foreground overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp} className="order-2 md:order-1">
            <img src={compensiImg} alt="Le catene posturali del corpo" loading="lazy" className="rounded-lg shadow-elevated w-full" />
          </motion.div>
          <motion.div {...fadeUp} className="order-1 md:order-2 space-y-5">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-gold">Il linguaggio dei compensi</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">Il sintomo non è il nemico.<br /><span className="italic text-gold-light">È un messaggio.</span></h2>
            <p className="font-body text-base md:text-lg text-primary-foreground/80 leading-relaxed">Quando una funzione si altera, il corpo non si ferma: si riorganizza. Un altro distretto si fa carico del lavoro. Ma ogni compenso ha un costo, e il sintomo — il dolore, la tensione, l'usura — è il segnale che il sistema ha esaurito le sue risorse.</p>
            <p className="font-body text-base md:text-lg text-primary-foreground/80 leading-relaxed">Per questo l'origine del problema raramente coincide con il punto in cui fa male.</p>
          </motion.div>
        </div>
      </section>

      {/* PILASTRI */}
      <section className="py-24 md:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-petrolio">I quattro pilastri</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">Le funzioni che reggono l'equilibrio.</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-card rounded-2xl p-7 border border-border hover:shadow-elevated transition-all">
                <div className="w-12 h-12 rounded-xl bg-petrolio/10 flex items-center justify-center mb-5">
                  <p.icon size={22} className="text-petrolio" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">{p.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CHECK-UP */}
      <section className="py-24 md:py-32 bg-cream">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div {...fadeUp} className="space-y-6 mb-12">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-petrolio">Il Check-up Ortodontico Posturale</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight">Una visita che ascolta tutto il corpo.</h2>
            <p className="font-body text-base md:text-lg text-foreground/75 leading-relaxed">Non contiamo solo carie e millimetri di overjet. Osserviamo come cammini, come tieni la testa, come respiri a riposo, come deglutisci. Ogni segnale costruisce una mappa, ogni domanda accorcia la distanza fra sintomo e origine.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ["Anamnesi globale", "Sonno, sport, traumi, abitudini, sintomi che si ripetono."],
              ["Esame orale e funzionale", "Dentizione, palato, occlusione, masticazione, frenuli."],
              ["Fonazione e deglutizione", "Tono linguale, dinamica orale, protocollo Marchesan."],
              ["ATM e muscoli", "Click articolari, dolore miofasciale, palpazione mirata."],
              ["Esami strumentali", "OPT, cefalometria, lettura integrata dei dati."],
              ["Esame posturale completo", "Test di Romberg, Fukuda, Bassani, Autet, Fontana."],
            ].map(([t, d]) => (
              <div key={t} className="flex gap-4 bg-card rounded-xl p-5 border border-border">
                <Stethoscope size={20} className="text-petrolio shrink-0 mt-1" />
                <div>
                  <h4 className="font-display text-base font-bold text-foreground mb-1">{t}</h4>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-24 md:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-petrolio">L'orchestra multidisciplinare</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">Da soli non si guarisce.</h2>
            <p className="font-body text-base text-muted-foreground leading-relaxed">Quando una disfunzione supera il confine dei denti, l'ortodontista coordina una squadra di professionisti che parlano la stessa lingua.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((t, i) => (
              <motion.div key={t.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                className="text-center p-6 rounded-2xl border border-border bg-card">
                <div className="w-14 h-14 mx-auto rounded-full bg-gold/15 flex items-center justify-center mb-4">
                  <t.icon size={24} className="text-gold" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{t.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{t.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Contatti */}
      <section id="prenota" className="bg-petrolio-dark">
        <ContactSection />
      </section>

      <Footer />
    </div>
  );
};
export default PatientLanding;
