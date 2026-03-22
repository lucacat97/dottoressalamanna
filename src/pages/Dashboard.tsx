import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, BookOpen, FileText, User, Download, Calendar, MapPin, Shield, Users, Upload, Trash2, Monitor, Brain, KeyRound } from "lucide-react";
import ToolsSection from "@/components/dashboard/ToolsSection";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { User as SupaUser } from "@supabase/supabase-js";
import AdminCreateEdition from "@/components/admin/AdminCreateEdition";
import AdminRegistrations from "@/components/admin/AdminRegistrations";
import AdminMaterials from "@/components/admin/AdminMaterials";
import AdminAccessControl from "@/components/admin/AdminAccessControl";

interface CourseEdition {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  max_participants: number | null;
  status: string;
  type: string;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [editions, setEditions] = useState<CourseEdition[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [adminTab, setAdminTab] = useState<"editions" | "registrations" | "materials" | "access">("editions");
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
    // Check admin role
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .then(({ data }) => {
        setIsAdmin(data !== null && data.length > 0);
      });
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [editionsRes, materialsRes] = await Promise.all([
      supabase.from("course_editions").select("*").order("date", { ascending: false }),
      supabase.from("course_materials").select("*"),
    ]);
    if (editionsRes.data) setEditions(editionsRes.data);
    if (materialsRes.data) setMaterials(materialsRes.data);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDownload = async (material: CourseMaterial) => {
    const { data, error } = await supabase.storage
      .from("course-materials")
      .download(material.file_path);

    if (error || !data) {
      toast({
        title: "Download non riuscito",
        description: "Impossibile scaricare il file, riprova.",
        variant: "destructive",
      });
      return;
    }

    const blobUrl = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = material.file_name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  };

  const handleDeleteEdition = async (id: string) => {
    const { error } = await supabase.from("course_editions").delete().eq("id", id);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Edizione eliminata" });
      fetchData();
    }
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
                {isAdmin ? <Shield size={16} className="text-gold" /> : <User size={16} className="text-petrolio" />}
              </div>
              <div className="hidden sm:block">
                <span className="font-body text-sm text-foreground block leading-tight">{displayName}</span>
                {isAdmin && <span className="font-body text-[10px] uppercase tracking-wider text-gold font-semibold">Admin</span>}
              </div>
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

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          {isAdmin ? "Dashboard Admin" : "Area Riservata"}
        </h1>
        <p className="font-body text-muted-foreground mb-10">
          Benvenuto/a, {displayName.split(" ")[0] || "utente"}.
          {isAdmin ? " Gestisci corsi, iscrizioni e materiali." : " Qui trovi i corsi e il materiale didattico."}
        </p>

        {/* Admin Panel */}
        {isAdmin && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Shield size={20} className="text-gold" />
              <h2 className="font-display text-xl font-semibold text-foreground">Pannello Admin</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit">
              {([
                { key: "editions" as const, label: "Edizioni", icon: BookOpen },
                { key: "registrations" as const, label: "Iscrizioni", icon: Users },
                { key: "materials" as const, label: "Materiali", icon: Upload },
                { key: "access" as const, label: "Accessi", icon: KeyRound },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setAdminTab(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-body text-sm transition-all ${
                    adminTab === key
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {adminTab === "editions" && (
              <div className="space-y-4">
                <AdminCreateEdition onCreated={fetchData} />
                <div className="space-y-3">
                  {editions.map((edition) => (
                    <div key={edition.id} className="bg-card border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-display text-base font-semibold text-foreground">{edition.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(edition.date)}</span>
                          {edition.location && <span className="flex items-center gap-1"><MapPin size={11} />{edition.location}</span>}
                          <span className={`font-semibold px-2 py-0.5 rounded-full ${edition.status === "completed" ? "bg-primary/10 text-petrolio" : "bg-gold/10 text-gold"}`}>
                            {edition.status === "completed" ? "Completato" : edition.status === "ongoing" ? "In corso" : "In programma"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteEdition(edition.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminTab === "registrations" && (
              <AdminRegistrations editions={editions} />
            )}

            {adminTab === "materials" && (
              <AdminMaterials editions={editions} materials={materials} onUpdated={fetchData} />
            )}

            {adminTab === "access" && (
              <AdminAccessControl editions={editions} />
            )}
          </section>
        )}

        {/* User view: Courses & Materials */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <BookOpen size={20} className="text-petrolio" />
            Corsi & Materiali
          </h2>

          <Tabs defaultValue="live" className="w-full">
            <TabsList className="mb-6 bg-muted/80 p-1 rounded-lg">
              <TabsTrigger value="live" className="flex items-center gap-2 px-5 py-2 font-body text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Monitor size={14} />
                Corsi Live
              </TabsTrigger>
              <TabsTrigger value="webinar" className="flex items-center gap-2 px-5 py-2 font-body text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Brain size={14} />
                Webinar
              </TabsTrigger>
            </TabsList>

            {["live", "webinar"].map((type) => (
              <TabsContent key={type} value={type}>
                <div className="grid gap-6">
                  {editions.filter((e) => (e.type || "live") === type).map((edition) => {
                    const editionMaterials = getMaterialsForEdition(edition.id);
                    return (
                      <div key={edition.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-card transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div>
                            <h3 className="font-display text-lg font-semibold text-foreground">{edition.title}</h3>
                            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar size={14} />{formatDate(edition.date)}</span>
                              {edition.location && <span className="flex items-center gap-1"><MapPin size={14} />{edition.location}</span>}
                            </div>
                          </div>
                          <span className={`font-body text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${edition.status === "completed" ? "bg-primary/10 text-petrolio" : "bg-gold/10 text-gold"}`}>
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
                                <span className="font-body text-sm text-foreground group-hover:text-petrolio transition-colors">{mat.file_name}</span>
                                <Download size={16} className="text-muted-foreground group-hover:text-petrolio transition-colors" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="border-t border-border pt-4">
                            <p className="font-body text-sm text-muted-foreground italic">Nessun materiale disponibile al momento.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {editions.filter((e) => (e.type || "live") === type).length === 0 && (
                    <div className="bg-cream rounded-lg p-8 text-center">
                      <p className="font-body text-muted-foreground">
                        Nessun {type === "live" ? "corso live" : "webinar"} disponibile al momento.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </section>

      </main>
    </div>
  );
};

export default Dashboard;
