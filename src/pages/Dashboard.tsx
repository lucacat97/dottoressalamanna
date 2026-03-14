import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, BookOpen, FileText, User, Download, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User as SupaUser } from "@supabase/supabase-js";

interface CourseEdition {
  id: string;
  title: string;
  date: string;
  location: string | null;
  status: string;
}

interface CourseMaterial {
  id: string;
  edition_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
}

const Dashboard = () => {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editions, setEditions] = useState<CourseEdition[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
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

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [editionsRes, materialsRes] = await Promise.all([
        supabase.from("course_editions").select("*").order("date", { ascending: false }),
        supabase.from("course_materials").select("*"),
      ]);
      if (editionsRes.data) setEditions(editionsRes.data);
      if (materialsRes.data) setMaterials(materialsRes.data);
    };
    fetchData();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDownload = (material: CourseMaterial) => {
    const { data } = supabase.storage
      .from("course-materials")
      .getPublicUrl(material.file_path);
    window.open(data.publicUrl, "_blank");
  };

  const getMaterialsForEdition = (editionId: string) =>
    materials.filter((m) => m.edition_id === editionId);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

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
          Benvenuto/a, {displayName.split(" ")[0] || "utente"}. Qui trovi i corsi e il materiale didattico.
        </p>

        {/* Courses */}
        <section className="mb-12">
          <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <BookOpen size={20} className="text-petrolio" />
            Corsi & Materiali
          </h2>
          <div className="grid gap-6">
            {editions.map((edition) => {
              const editionMaterials = getMaterialsForEdition(edition.id);
              return (
                <div
                  key={edition.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-card transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {edition.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(edition.date)}
                        </span>
                        {edition.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {edition.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`font-body text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                        edition.status === "completed"
                          ? "bg-primary/10 text-petrolio"
                          : "bg-gold/10 text-gold"
                      }`}
                    >
                      {edition.status === "completed" ? "Completato" : "In programma"}
                    </span>
                  </div>

                  {editionMaterials.length > 0 ? (
                    <div className="border-t border-border pt-4 space-y-2">
                      <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-3">
                        <FileText size={12} className="inline mr-1" />
                        {editionMaterials.length} materiale/i disponibile/i
                      </p>
                      {editionMaterials.map((mat) => (
                        <button
                          key={mat.id}
                          onClick={() => handleDownload(mat)}
                          className="w-full flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors group"
                        >
                          <span className="font-body text-sm text-foreground group-hover:text-petrolio transition-colors">
                            {mat.file_name}
                          </span>
                          <Download size={16} className="text-muted-foreground group-hover:text-petrolio transition-colors" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="border-t border-border pt-4">
                      <p className="font-body text-sm text-muted-foreground italic">
                        Nessun materiale disponibile al momento.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {editions.length === 0 && (
          <div className="bg-cream rounded-lg p-8 text-center">
            <p className="font-body text-muted-foreground">
              I corsi e i materiali verranno aggiornati dalla Dott.ssa Lamanna.
              <br />
              Torna a controllare dopo aver partecipato a un corso.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
