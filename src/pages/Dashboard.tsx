import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, BookOpen, User, Shield, Wrench, Library, FileText, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { User as SupaUser } from "@supabase/supabase-js";
import CoursesTab from "@/components/dashboard/CoursesTab";
import ToolsSection from "@/components/dashboard/ToolsSection";
import AdminTab from "@/components/dashboard/AdminTab";
import LibraryTab from "@/components/dashboard/LibraryTab";
import DocumentsTab from "@/components/dashboard/DocumentsTab";
import ContractFab from "@/components/dashboard/ContractFab";
import PecAvatarFab from "@/components/PecAvatarFab";
import SubscribeSection from "@/components/SubscribeSection";

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

type MainTab = "corsi" | "strumenti" | "libreria" | "documenti" | "abbonamento" | "admin";

const Dashboard = () => {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editions, setEditions] = useState<CourseEdition[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const validTabs: MainTab[] = ["strumenti", "corsi", "libreria", "documenti", "abbonamento", "admin"];
  const activeTab: MainTab = validTabs.includes(tabParam as MainTab) ? (tabParam as MainTab) : "strumenti";
  const setActiveTab = (tab: MainTab) => setSearchParams({ tab });
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

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDownload = async (material: CourseMaterial) => {
    const { data, error } = await supabase.storage
      .from("course-materials")
      .createSignedUrl(material.file_path, 120);
    if (error || !data?.signedUrl) {
      toast({ title: "Download non riuscito", description: "Impossibile scaricare il file, riprova.", variant: "destructive" });
      return;
    }
    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.download = material.file_name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email || "";

  const tabs: { key: MainTab; label: string; icon: typeof BookOpen; adminOnly?: boolean }[] = [
    { key: "strumenti", label: "Strumenti", icon: Wrench },
    { key: "libreria", label: "Libreria", icon: Library },
    { key: "corsi", label: "Corsi", icon: BookOpen },
    { key: "documenti", label: "Documenti", icon: FileText },
    ...(isAdmin ? [{ key: "admin" as MainTab, label: "Admin", icon: Shield, adminOnly: true }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="font-display text-xl font-semibold text-foreground">
              Dott.ssa <span className="text-petrolio">Lamanna</span>
            </a>

            {/* Main navigation tabs */}
            <nav className="hidden sm:flex items-center gap-1 bg-muted/60 rounded-full p-1">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full font-body text-sm transition-all ${
                    activeTab === key
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {isAdmin ? <Shield size={16} className="text-gold" /> : <User size={16} className="text-petrolio" />}
                </div>
                <div className="hidden md:block">
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
                <LogOut size={16} className="mr-1" />
                <span className="hidden sm:inline">Esci</span>
              </Button>
            </div>
          </div>

          {/* Mobile tab bar */}
          <div className="flex sm:hidden gap-1 pb-3 overflow-x-auto">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-xs whitespace-nowrap transition-all ${
                  activeTab === key
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Tab content */}
        {activeTab === "corsi" && (
          <CoursesTab editions={editions} materials={materials} onDownload={handleDownload} />
        )}

        {activeTab === "strumenti" && (
          <ToolsSection />
        )}

        {activeTab === "libreria" && (
          <LibraryTab />
        )}

        {activeTab === "documenti" && (
          <DocumentsTab />
        )}

        {activeTab === "admin" && isAdmin && (
          <AdminTab
            editions={editions}
            materials={materials}
            onFetchData={fetchData}
            onDeleteEdition={handleDeleteEdition}
          />
        )}
      </main>
      <ContractFab />
      <PecAvatarFab />
    </div>
  );
};

export default Dashboard;
