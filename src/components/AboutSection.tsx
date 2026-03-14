import lammannaPresentazione from "@/assets/lamanna-presentazione.jpg";
import AnimatedSection from "./AnimatedSection";

const AboutSection = () => {
  return (
    <section id="chi-sono" className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <AnimatedSection>
            <div className="relative">
              <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-elevated">
                <img
                  src={lammannaPresentazione}
                  alt="Dott.ssa Annarita Lamanna"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-lg -z-10" />
              <div className="absolute -top-6 -left-6 w-24 h-24 border-2 border-gold-light rounded-lg -z-10" />
            </div>
          </AnimatedSection>

          {/* Text */}
          <AnimatedSection delay={0.2}>
            <div>
              <p className="font-body text-sm uppercase tracking-[0.2em] text-gold mb-4">Chi Sono</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
                Un approccio
                <br />
                <span className="text-gradient-petrolio italic">multidisciplinare</span>
              </h2>
              <div className="space-y-4 font-body text-muted-foreground leading-relaxed">
                <p>
                  Sono un'odontoiatra specializzata in ortodonzia con un approccio unico che integra la valutazione
                  ortodontica con l'analisi posturale e neuromuscolare.
                </p>
                <p>
                  Con anni di esperienza clinica e formativa, ho sviluppato un metodo che coniuga ortodonzia
                  tradizionale, agopuntura e nanotecnologie terapeutiche per un trattamento davvero personalizzato.
                </p>
                <p>
                  I miei corsi si rivolgono a professionisti del settore odontoiatrico e sanitario che desiderano
                  ampliare le proprie competenze verso una visione olistica del paziente.
                </p>
              </div>
              <div className="mt-8 flex gap-8">
                {[
                  { value: "15+", label: "Anni di esperienza" },
                  { value: "100+", label: "Professionisti formati" },
                  { value: "5+", label: "Corsi tenuti" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="font-display text-2xl font-bold text-petrolio">{stat.value}</div>
                    <div className="font-body text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
