import { Link } from "react-router-dom";
import { ArrowRight, Ruler, Activity, Zap, Brain } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const pillars = [
  { icon: Ruler, title: "Ortodonzia", desc: "Analisi cefalometrica e occlusale come punto di partenza clinico." },
  { icon: Activity, title: "Postura", desc: "Lettura delle catene muscolari e dell'equilibrio corporeo." },
  { icon: Zap, title: "Agopuntura", desc: "Modulazione del dolore e dei trigger point orofacciali." },
  { icon: Brain, title: "Neuromuscolare", desc: "Funzione stomatognatica e sistema neurofisiologico integrato." },
];

const MilaSection = () => {
  return (
    <section id="mila" className="relative py-24 md:py-32 bg-primary text-primary-foreground overflow-hidden">
      {/* Ambient decorations */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: narrative */}
          <AnimatedSection className="lg:col-span-6">
            <div>
              <p className="font-body text-sm uppercase tracking-[0.25em] text-gold mb-4">
                Approccio Integrato
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Metodo <span className="italic text-gold">MILA</span>
              </h2>
              <p className="font-display italic text-lg md:text-xl text-gold-light/90 mb-8">
                Metodo Integrato Lamanna
              </p>
              <div className="space-y-5 font-body text-base md:text-lg text-primary-foreground/85 leading-relaxed max-w-xl">
                <p>
                  MILA è uno strumento interpretativo clinico che legge il paziente come
                  un sistema unitario. Non un'ortodonzia tradizionale, ma una lettura
                  olistica che intreccia occlusione, postura, energia e funzione
                  neuromuscolare in un'unica visione.
                </p>
                <p>
                  Ogni consulenza nasce dall'integrazione di più discipline: i dati non
                  vengono letti isolati, ma messi in relazione, restituendo un quadro
                  clinico coerente e realmente personalizzato.
                </p>
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-gold text-primary font-body font-semibold uppercase tracking-wider text-sm rounded-sm hover:bg-gold-light transition-colors"
                >
                  Esplora MILA
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#chi-sono"
                  className="inline-flex items-center gap-3 px-8 py-4 border border-gold/40 text-primary-foreground font-body font-medium uppercase tracking-wider text-sm rounded-sm hover:bg-gold/10 transition-colors"
                >
                  Scopri il Metodo
                </a>
              </div>
            </div>
          </AnimatedSection>

          {/* Right: interconnected pillars */}
          <AnimatedSection delay={0.2} className="lg:col-span-6">
            <div className="relative">
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {pillars.map(({ icon: Icon, title, desc }, i) => (
                  <div
                    key={title}
                    className="group relative p-6 md:p-7 rounded-lg border border-gold/20 bg-primary-foreground/[0.03] backdrop-blur-sm hover:border-gold/60 hover:bg-primary-foreground/[0.06] transition-all"
                    style={{ transform: i % 2 === 1 ? "translateY(1.5rem)" : undefined }}
                  >
                    <div className="w-11 h-11 rounded-full border border-gold/40 flex items-center justify-center mb-4 text-gold group-hover:bg-gold group-hover:text-primary transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
                    <p className="font-body text-sm text-primary-foreground/70 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Central emblem */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:flex">
                <div className="w-20 h-20 rounded-full bg-primary border-2 border-gold flex items-center justify-center shadow-[0_0_40px_rgba(197,160,89,0.35)]">
                  <span className="font-display italic text-gold text-2xl font-bold">M</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default MilaSection;
