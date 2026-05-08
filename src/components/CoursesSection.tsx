import { BookOpen, Activity, Brain, Monitor } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const liveCourses = [
  {
    icon: BookOpen,
    title: "Check-up Ortodontico-Posturale",
    description:
      "Approccio multidisciplinare per un equilibrio occlusale, neuromuscolare e posturale. Impara a eseguire un check-up completo che integra valutazione ortodontica e analisi posturale.",
    tag: "Corso Base",
  },
  {
    icon: Activity,
    title: "Terapia Miofunzionale",
    description:
      "Protocolli di terapia miofunzionale per la rieducazione delle funzioni orali. Dall'interpretazione al piano di trattamento individualizzato per correggere abitudini viziate e disfunzioni neuromuscolari.",
    tag: "Pratico",
  },
];

const webinars = [
  {
    icon: Brain,
    title: "Integrazione dell'IA a Supporto della Diagnosi",
    description:
      "Come l'intelligenza artificiale può affiancare il clinico nell'analisi cefalometrica, nella valutazione posturale e nella pianificazione del trattamento ortodontico. Strumenti pratici e casi clinici.",
    tag: "Webinar",
  },
];

const CourseCard = ({ course, index }: { course: (typeof liveCourses)[0]; index: number }) => (
  <AnimatedSection delay={index * 0.1}>
    <div className="group bg-card rounded-lg p-8 shadow-card hover:shadow-elevated transition-all duration-500 border border-border hover:border-petrolio-light/30 hover:-translate-y-1">
      <div className="flex items-start gap-5">
        <div className="flex-shrink-0 w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
          <course.icon
            size={22}
            className="text-petrolio group-hover:text-primary-foreground transition-colors duration-300"
          />
        </div>
        <div>
          <span className="inline-block font-body text-xs uppercase tracking-wider text-gold font-semibold mb-2">
            {course.tag}
          </span>
          <h3 className="font-display text-xl font-semibold text-foreground mb-3">{course.title}</h3>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">{course.description}</p>
        </div>
      </div>
    </div>
  </AnimatedSection>
);

const CoursesSection = () => {
  return (
    <section id="corsi" className="py-24 md:py-32 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <p className="font-body text-sm uppercase tracking-[0.2em] text-gold mb-4">Formazione</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">I Miei Corsi</h2>
            <p className="font-body text-muted-foreground max-w-2xl mx-auto">
              Percorsi formativi pensati per professionisti che vogliono integrare ortodonzia, postura e approccio
              neuromuscolare nella propria pratica clinica.
            </p>
          </div>
        </AnimatedSection>

        <Tabs defaultValue="live" className="w-full">
          <AnimatedSection>
            <div className="flex justify-center mb-10">
              <TabsList className="bg-muted/80 p-1 rounded-lg">
                <TabsTrigger
                  value="live"
                  className="flex items-center gap-2 px-6 py-2.5 font-body text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Monitor size={16} />
                  Corsi Live
                </TabsTrigger>
                <TabsTrigger
                  value="webinar"
                  className="flex items-center gap-2 px-6 py-2.5 font-body text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Brain size={16} />
                  Webinar
                </TabsTrigger>
              </TabsList>
            </div>
          </AnimatedSection>

          <TabsContent value="live">
            <div className="grid md:grid-cols-2 gap-8">
              {liveCourses.map((course, i) => (
                <CourseCard key={course.title} course={course} index={i} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="webinar">
            <div className="grid md:grid-cols-2 gap-8">
              {webinars.map((course, i) => (
                <CourseCard key={course.title} course={course} index={i} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

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
