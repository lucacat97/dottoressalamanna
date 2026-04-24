import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedSection from "./AnimatedSection";

interface CourseEdition {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  max_participants: number | null;
  status: string;
}

const EditionsSection = () => {
  const [editions, setEditions] = useState<CourseEdition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEditions = async () => {
      const { data } = await supabase
        .from("course_editions")
        .select("*")
        .order("date", { ascending: true });
      if (data) setEditions(data);
      setLoading(false);
    };
    fetchEditions();
  }, []);

  const upcoming = editions.filter((e) => e.status === "upcoming");
  const past = editions.filter((e) => e.status === "completed");

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) return null;

  return (
    <section id="edizioni" className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <p className="font-body text-sm uppercase tracking-[0.2em] text-gold mb-4">
              Calendario
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Edizioni dei Corsi
            </h2>
            <p className="font-body text-muted-foreground max-w-2xl mx-auto">
              Scopri le prossime edizioni e iscriviti direttamente. Posti limitati per garantire
              un'esperienza formativa di qualità.
            </p>
          </div>
        </AnimatedSection>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="mb-16">
            <AnimatedSection>
              <h3 className="font-display text-xl font-semibold text-foreground mb-8 flex items-center gap-2">
                <Calendar size={20} className="text-petrolio" />
                Prossime Edizioni
              </h3>
            </AnimatedSection>
            <div className="grid gap-6">
              {upcoming.map((edition, i) => (
                <AnimatedSection key={edition.id} delay={i * 0.1}>
                  <div className="group bg-card border border-border rounded-lg p-8 hover:shadow-elevated transition-all duration-500 hover:border-petrolio/30">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-block font-body text-xs uppercase tracking-wider text-primary-foreground bg-petrolio px-3 py-1 rounded-full font-semibold">
                            Posti Disponibili
                          </span>
                        </div>
                        <h4 className="font-display text-2xl font-semibold text-foreground mb-2 group-hover:text-petrolio transition-colors">
                          {edition.title}
                        </h4>
                        {edition.description && (
                          <p className="font-body text-sm text-muted-foreground mb-4 max-w-xl">
                            {edition.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Calendar size={14} className="text-petrolio" />
                            {formatDate(edition.date)}
                          </span>
                          {edition.location && (
                            <span className="flex items-center gap-2">
                              <MapPin size={14} className="text-petrolio" />
                              {edition.location}
                            </span>
                          )}
                          {edition.max_participants && (
                            <span className="flex items-center gap-2">
                              <Users size={14} className="text-petrolio" />
                              Max {edition.max_participants} partecipanti
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        asChild
                        className="bg-primary hover:bg-accent text-primary-foreground font-body font-semibold group-hover:scale-105 transition-transform"
                      >
                        <Link to={`/corso/${edition.id}`}>
                          Scopri di più
                          <ArrowRight size={16} className="ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div>
            <AnimatedSection>
              <h3 className="font-display text-xl font-semibold text-foreground mb-8 flex items-center gap-2">
                <CheckCircle size={20} className="text-gold" />
                Edizioni Passate
              </h3>
            </AnimatedSection>
            <div className="grid md:grid-cols-2 gap-4">
              {past.map((edition, i) => (
                <AnimatedSection key={edition.id} delay={i * 0.1}>
                  <Link to={`/corso/${edition.id}`} className="block bg-muted/50 border border-border rounded-lg p-6 opacity-80 hover:opacity-100 hover:border-petrolio/30 transition-all">
                    <h4 className="font-display text-lg font-semibold text-foreground mb-2">
                      {edition.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Calendar size={14} />
                        {formatDate(edition.date)}
                      </span>
                      {edition.location && (
                        <span className="flex items-center gap-2">
                          <MapPin size={14} />
                          {edition.location}
                        </span>
                      )}
                    </div>
                    <span className="inline-block mt-3 font-body text-xs uppercase tracking-wider text-gold font-semibold">
                      Completato
                    </span>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EditionsSection;
