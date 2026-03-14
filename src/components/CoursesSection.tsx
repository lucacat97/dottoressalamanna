import { BookOpen, Eye, Activity, Users } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const courses = [
  {
    icon: BookOpen,
    title: "Check-up Ortodontico-Posturale",
    description:
      "Approccio multidisciplinare per un equilibrio occlusale, neuromuscolare e posturale. Impara a eseguire un check-up completo che integra valutazione ortodontica e analisi posturale.",
    tag: "Corso Base",
  },
  {
    icon: Eye,
    title: "Test dell'Occhio Dominante",
    description:
      "Come la dominanza oculare influenza la postura e l'occlusione. Tecniche pratiche per il test e l'integrazione dei risultati nella diagnosi ortodontica.",
    tag: "Workshop",
  },
  {
    icon: Activity,
    title: "Esercizi Correttivi Integrati",
    description:
      "Protocolli di esercizi correttivi per accompagnare il trattamento ortodontico. Pochi ma buoni: una corretta diagnosi guida verso un piano di trattamento individualizzato.",
    tag: "Pratico",
  },
  {
    icon: Users,
    title: "Ortodonzia e Fibre Trigeminali",
    description:
      "Quando i denti vengono messi a contatto si stimolano le fibre trigeminali. Comprendi la connessione neurologica tra occlusione e sistema neuromuscolare.",
    tag: "Avanzato",
  },
];

const CoursesSection = () => {
  return (
    <section id="corsi" className="py-24 md:py-32 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <p className="font-body text-sm uppercase tracking-[0.2em] text-gold mb-4">
              Formazione
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              I Nostri Corsi
            </h2>
            <p className="font-body text-muted-foreground max-w-2xl mx-auto">
              Percorsi formativi pensati per professionisti che vogliono integrare
              ortodonzia, postura e approccio neuromuscolare nella propria pratica clinica.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-8">
          {courses.map((course, i) => (
            <AnimatedSection key={course.title} delay={i * 0.1}>
              <div className="group bg-card rounded-lg p-8 shadow-card hover:shadow-elevated transition-all duration-500 border border-border hover:border-petrolio-light/30 hover:-translate-y-1">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <course.icon size={22} className="text-petrolio group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                  <div>
                    <span className="inline-block font-body text-xs uppercase tracking-wider text-gold font-semibold mb-2">
                      {course.tag}
                    </span>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                      {course.title}
                    </h3>
                    <p className="font-body text-sm text-muted-foreground leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.4}>
          <div className="text-center mt-12">
            <a
              href="#edizioni"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-body font-semibold text-sm rounded-md hover:bg-accent transition-all duration-300 hover:scale-105"
            >
              Vedi le Prossime Edizioni
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default CoursesSection;
