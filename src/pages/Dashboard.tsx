import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, BookOpen, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User as SupaUser } from "@supabase/supabase-js";

const mockCourses = [
  {
    title: "Check-up Ortodontico-Posturale",
    date: "15 Gen 2026",
    status: "Completato",
    materials: 3,
  },
  {
    title: "Esercizi Correttivi Integrati",
    date: "20 Mar 2026",
    status: "In arrivo",
    materials: 0,
  },
];

const Dashboard = () => {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        if (!session) navigate("/login");
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) navigate("/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-display text-xl font-semibold text-foreground">
            Dott.ssa <span className="text-petrolio">Lamanna</span>
          </a>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={16} className="text-petrolio" />
              </div>
              <span className="font-body text-sm text-foreground hidden sm:block">
                {displayName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="font-body text-muted-foreground hover:text-foreground"
            >
              <LogOut size={16} className="mr-2" />
              Esci
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Area Riservata
        </h1>
        <p className="font-body text-muted-foreground mb-10">
          Benvenuto/a, {displayName.split(" ")[0] || "utente"}. Qui trovi i tuoi corsi e il materiale didattico.
        </p>

        {/* Courses */}
        <section className="mb-12">
          <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <BookOpen size={20} className="text-petrolio" />
            I Tuoi Corsi
          </h2>
          <div className="grid gap-4">
            {mockCourses.map((course) => (
              <div
                key={course.title}
                className="bg-card border border-border rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-card transition-shadow"
              >
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {course.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    Data: {course.date}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-body text-xs font-semibold px-3 py-1 rounded-full ${
                      course.status === "Completato"
                        ? "bg-primary/10 text-petrolio"
                        : "bg-gold/10 text-gold"
                    }`}
                  >
                    {course.status}
                  </span>
                  {course.materials > 0 && (
                    <Button variant="outline" size="sm" className="font-body text-sm">
                      <FileText size={14} className="mr-2" />
                      {course.materials} materiali
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Empty state hint */}
        <div className="bg-cream rounded-lg p-8 text-center">
          <p className="font-body text-muted-foreground">
            I corsi e i materiali verranno aggiornati dalla Dott.ssa Lamanna.
            <br />
            Torna a controllare dopo aver partecipato a un corso.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
