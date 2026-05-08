import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { motion } from "framer-motion";
import { Sparkles, Leaf, Activity, Brain, Moon, Soup, Heart, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Question = {
  id: string;
  icon: typeof Moon;
  text: string;
};

const QUESTIONS: Question[] = [
  { id: "sleep", icon: Moon, text: "Hai difficoltà a dormire o ti svegli stanco/a?" },
  { id: "gi", icon: Soup, text: "Soffri spesso di disturbi gastro-intestinali (gonfiore, reflusso, stitichezza)?" },
  { id: "anxiety", icon: Brain, text: "Vivi periodi frequenti di ansia, stress o tensione mentale?" },
  { id: "posture", icon: Activity, text: "Avverti dolori posturali, cervicali o mal di testa ricorrenti?" },
  { id: "jaw", icon: Heart, text: "Stringi i denti di notte, hai click mandibolari o problemi di masticazione?" },
];

const screeningSchema = z.object({
  first_name: z.string().trim().min(1, "Nome richiesto").max(100),
  last_name: z.string().trim().min(1, "Cognome richiesto").max(100),
  email: z.string().trim().email("Email non valida").max(255),
});

const PatientLanding = () => {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("src") || undefined;
  const testRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({ first_name: "", last_name: "", email: "" });
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ score: number } | null>(null);

  useEffect(() => {
    document.title = "Metodo Olistico La Manna · Spazio Pazienti";
    const init: Record<string, null> = {};
    QUESTIONS.forEach((q) => (init[q.id] = null));
    setAnswers(init);
  }, []);

  const scrollToTest = () => {
    testRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = screeningSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (Object.values(answers).some((v) => v === null)) {
      toast.error("Rispondi a tutte le domande prima di inviare");
      return;
    }

    setSubmitting(true);
    const score = Object.values(answers).filter((v) => v === true).length;

    const { error } = await supabase.from("patient_screenings").insert({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email,
      answers: QUESTIONS.reduce<Record<string, boolean>>((acc, q) => {
        acc[q.id] = answers[q.id] === true;
        return acc;
      }, {}),
      score,
      source,
    });

    setSubmitting(false);

    if (error) {
      toast.error("Errore nell'invio. Riprova.");
      return;
    }

    setDone({ score });
    setTimeout(() => {
      document.getElementById("risultato")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <>
      <Helmet>
        <title>Metodo Olistico La Manna · Spazio Pazienti</title>
        <meta
          name="description"
          content="Un approccio olistico che integra postura, occlusione, respirazione e benessere generale. Fai il test gratuito di 5 domande."
        />
        <link rel="canonical" href="https://dottoressalamanna.com/pazienti" />
      </Helmet>

      <div className="min-h-screen bg-[hsl(var(--cream))]">
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-[hsl(var(--cream)/0.92)] backdrop-blur border-b border-[hsl(var(--border))]">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/benvenuto" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--petrolio))]">
              ← Torna alla home
            </Link>
            <Button onClick={scrollToTest} variant="default" size="sm" className="bg-[hsl(var(--petrolio))] hover:bg-[hsl(var(--petrolio-dark))]">
              Fai il test
            </Button>
          </div>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gold-light)/0.25)] via-transparent to-[hsl(var(--petrolio)/0.08)]" />
          <div className="container mx-auto px-6 relative z-10 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center"
            >
              <p className="text-xs uppercase tracking-[0.4em] text-[hsl(var(--gold-warm))] mb-6 font-medium">
                Metodo Olistico La Manna
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl text-[hsl(var(--petrolio-dark))] leading-tight mb-8">
                Quando il sorriso parla<br />
                <em className="text-[hsl(var(--gold-warm))]">di tutto il corpo</em>
              </h1>
              <p className="text-lg md:text-xl text-[hsl(var(--muted-foreground))] leading-relaxed max-w-2xl mx-auto mb-10">
                Un approccio integrato che guarda la persona nella sua interezza:
                <strong className="text-[hsl(var(--petrolio))]"> postura, occlusione, respirazione, deglutizione</strong> e
                benessere generale lavorano insieme.
              </p>
              <Button onClick={scrollToTest} size="lg" className="bg-[hsl(var(--petrolio))] hover:bg-[hsl(var(--petrolio-dark))] text-[hsl(var(--cream))]">
                <Sparkles className="w-4 h-4 mr-2" />
                Fai il test gratuito
              </Button>
            </motion.div>
          </div>
        </section>

        {/* METODO */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--gold-warm))] mb-4 font-medium">
                  L'approccio
                </p>
                <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[hsl(var(--petrolio-dark))] mb-6">
                  Una visione olistica della persona
                </h2>
                <div className="space-y-4 text-[hsl(var(--muted-foreground))] leading-relaxed">
                  <p>
                    Il Metodo La&nbsp;Manna nasce dall'integrazione tra <strong>ortodonzia, posturologia, miofunzionale e medicina tradizionale cinese</strong>.
                  </p>
                  <p>
                    Spesso un disturbo apparentemente "locale" — mal di testa, cervicalgia, bruxismo, problemi digestivi —
                    è il risultato di squilibri più ampi che coinvolgono mandibola, lingua, respirazione e postura.
                  </p>
                  <p>
                    Lavorare in modo integrato significa <strong className="text-[hsl(var(--petrolio))]">trattare la causa, non solo il sintomo</strong>,
                    restituendo equilibrio a tutto il sistema.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Leaf, label: "Posturale" },
                  { icon: Activity, label: "Occlusale" },
                  { icon: Brain, label: "Funzionale" },
                  { icon: Heart, label: "Emozionale" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="aspect-square rounded-2xl bg-[hsl(var(--cream))] border border-[hsl(var(--border))] flex flex-col items-center justify-center p-6 hover:shadow-[var(--shadow-card)] transition-shadow"
                  >
                    <Icon className="w-10 h-10 text-[hsl(var(--gold-warm))] mb-3" strokeWidth={1.5} />
                    <span className="font-[family-name:var(--font-display)] text-lg text-[hsl(var(--petrolio-dark))]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TEST */}
        <section ref={testRef} className="py-20 bg-[hsl(var(--cream))]">
          <div className="container mx-auto px-6 max-w-2xl">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--gold-warm))] mb-4 font-medium">
                Test gratuito · 2 minuti
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[hsl(var(--petrolio-dark))] mb-4">
                Il Metodo La Manna può aiutarti?
              </h2>
              <p className="text-[hsl(var(--muted-foreground))]">
                Rispondi sinceramente a 5 brevi domande sul tuo stato generale.
              </p>
            </div>

            {!done ? (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-[var(--shadow-card)] p-8 md:p-10 space-y-8 border border-[hsl(var(--border))]"
              >
                {/* Anagrafica */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Nome *</Label>
                    <Input
                      id="first_name"
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Cognome *</Label>
                    <Input
                      id="last_name"
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      maxLength={100}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    maxLength={255}
                    required
                  />
                </div>

                <div className="h-px bg-[hsl(var(--border))]" />

                {/* Domande */}
                <div className="space-y-5">
                  {QUESTIONS.map((q, idx) => {
                    const Icon = q.icon;
                    const value = answers[q.id];
                    return (
                      <div key={q.id} className="rounded-xl border border-[hsl(var(--border))] p-4 md:p-5 bg-[hsl(var(--cream)/0.5)]">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="shrink-0 w-9 h-9 rounded-full bg-[hsl(var(--gold-warm)/0.15)] flex items-center justify-center">
                            <Icon className="w-4 h-4 text-[hsl(var(--gold-warm))]" strokeWidth={2} />
                          </div>
                          <p className="text-[hsl(var(--petrolio-dark))] font-medium leading-snug">
                            <span className="text-[hsl(var(--muted-foreground))] mr-1">{idx + 1}.</span>
                            {q.text}
                          </p>
                        </div>
                        <div className="flex gap-3 ml-12">
                          {[
                            { val: true, label: "Sì" },
                            { val: false, label: "No" },
                          ].map(({ val, label }) => (
                            <button
                              type="button"
                              key={label}
                              onClick={() => setAnswers((a) => ({ ...a, [q.id]: val }))}
                              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                                value === val
                                  ? "bg-[hsl(var(--petrolio))] text-[hsl(var(--cream))] shadow-md"
                                  : "bg-white border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--petrolio))]"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                  className="w-full bg-[hsl(var(--petrolio))] hover:bg-[hsl(var(--petrolio-dark))] text-[hsl(var(--cream))]"
                >
                  {submitting ? "Invio..." : "Vedi il risultato"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
                  I tuoi dati sono trattati nel rispetto della privacy e usati solo per ricontattarti.
                </p>
              </form>
            ) : (
              <motion.div
                id="risultato"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-[var(--shadow-elevated)] p-10 text-center border border-[hsl(var(--border))]"
              >
                <CheckCircle2 className="w-16 h-16 text-[hsl(var(--gold-warm))] mx-auto mb-6" strokeWidth={1.5} />
                <h3 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-[hsl(var(--petrolio-dark))] mb-4">
                  Grazie {form.first_name}!
                </h3>
                {done.score >= 2 ? (
                  <>
                    <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-6">
                      Hai risposto <strong>“sì”</strong> a {done.score} {done.score === 1 ? "domanda" : "domande"} su 5.
                      I segnali che descrivi sono spesso correlati a squilibri che il
                      <strong className="text-[hsl(var(--petrolio))]"> Metodo Olistico La Manna</strong> sa riconoscere
                      e affrontare in modo integrato.
                    </p>
                    <p className="text-[hsl(var(--petrolio-dark))] font-medium mb-8">
                      Ti consigliamo di prenotare una valutazione personalizzata.
                    </p>
                    <a
                      href="mailto:dott.lamanna.a@gmail.com?subject=Richiesta%20valutazione%20Metodo%20La%20Manna"
                      className="inline-flex items-center gap-2 bg-[hsl(var(--petrolio))] hover:bg-[hsl(var(--petrolio-dark))] text-[hsl(var(--cream))] px-8 py-3 rounded-full font-medium transition-colors"
                    >
                      Richiedi un consulto
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-6">
                      I tuoi risultati ({done.score}/5) suggeriscono un buon equilibrio generale.
                      Se vuoi approfondire o hai dubbi specifici, puoi sempre contattarci.
                    </p>
                    <a
                      href="mailto:dott.lamanna.a@gmail.com"
                      className="inline-flex items-center gap-2 text-[hsl(var(--petrolio))] underline underline-offset-4"
                    >
                      Scrivici per qualsiasi domanda
                    </a>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </section>

        <footer className="py-10 text-center text-sm text-[hsl(var(--muted-foreground))] border-t border-[hsl(var(--border))]">
          © {new Date().getFullYear()} Dott.ssa Annarita La Manna · Metodo Olistico
        </footer>
      </div>
    </>
  );
};

export default PatientLanding;
