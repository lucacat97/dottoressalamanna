import { useState, useEffect } from "react";
import { Brain, Sparkles, ArrowLeft, Leaf, Lock, ClipboardList } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import MilaMethodTool from "./MilaMethodTool";
import BrandingSettings from "./BrandingSettings";
import MTCHub from "./mtc/MTCHub";
import CheckupTool from "./checkup/CheckupTool";

interface ToolCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Brain;
  gradient: string;
  accentColor: string;
  /** API key tool keys that grant access to this card */
  apiToolKeys: string[];
}

const tools: ToolCard[] = [
  {
    id: "checkup",
    title: "Check Up Ortodontico Posturale",
    subtitle: "Questionario clinico-posturale",
    description: "Compila il check up del paziente sezione per sezione, salva in automatico le bozze, esporta in PDF Q/R o invia direttamente al Metodo MILA per la consulenza.",
    icon: ClipboardList,
    gradient: "from-amber-500/80 via-orange-500/60 to-rose-500/40",
    accentColor: "text-amber-600",
    apiToolKeys: ["diagnosis", "orthodontic"],
  },
  {
    id: "mila",
    title: "Interpretazione secondo Metodo MILA",
    subtitle: "Cartella clinica + Cefalometria",
    description: "Carica i PDF della cartella clinico-posturale e del tracciato cefalometrico (oppure inserisci i dati a mano) e ottieni due consulenze separati secondo il Metodo MILA.",
    icon: Brain,
    gradient: "from-petrolio via-petrolio-dark to-petrolio",
    accentColor: "text-gold",
    apiToolKeys: ["diagnosis", "orthodontic"],
  },
  {
    id: "mtc",
    title: "Medicina Tradizionale Cinese",
    subtitle: "MTC — Sistemica & Organica",
    description: "Strumenti integrati di MTC: mappa 3D del corpo per agopunti (Sistemica) e identificazione pattern di disarmonia da sintomi (Organica).",
    icon: Leaf,
    gradient: "from-emerald-500/80 via-teal-500/60 to-cyan-500/40",
    accentColor: "text-emerald-600",
    apiToolKeys: ["mtc_sistemica", "mtc_organica"],
  },
];

const ToolsSection = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [allowedTools, setAllowedTools] = useState<string[] | null>(null); // null = loading
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingPerms(false); return; }

      // Check admin
      const { data: adminCheck } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin" as any,
      });
      if (adminCheck) {
        setIsAdmin(true);
        setAllowedTools(null); // admin sees everything
        setLoadingPerms(false);
        return;
      }

      // Get user email
      const email = user.email;
      if (!email) { setAllowedTools([]); setLoadingPerms(false); return; }

      // Look up API key for this email
      // We need a server-side function since api_keys is admin-only via RLS
      const { data: keyData } = await supabase.functions.invoke("check-tool-access", {
        body: { email },
      });

      if (keyData?.tools && Array.isArray(keyData.tools)) {
        setAllowedTools(keyData.tools);
      } else {
        setAllowedTools([]);
      }
      setLoadingPerms(false);
    };
    fetchPermissions();
  }, []);

  const isToolAllowed = (tool: ToolCard): boolean => {
    if (isAdmin) return true;
    if (!allowedTools) return true; // still loading
    return tool.apiToolKeys.some((k) => allowedTools.includes(k));
  };

  if (activeTool) {
    const tool = tools.find(t => t.id === activeTool);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTool(null)}
            className="font-body gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Tutti gli strumenti
          </Button>
        </div>

        {tool && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <tool.icon size={20} className="text-petrolio" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">{tool.title}</h2>
              <p className="font-body text-xs text-muted-foreground">{tool.subtitle}</p>
            </div>
          </div>
        )}

        {activeTool === "mila" && <MilaMethodTool />}
        {activeTool === "mtc" && <MTCHub />}
        {activeTool === "checkup" && <CheckupTool onSendToMila={() => setActiveTool("mila")} />}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Sparkles size={14} className="text-gold" />
          <span className="font-body text-xs font-medium text-foreground uppercase tracking-wider">AI-Powered Tools</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">Strumenti Professionali</h2>
        <p className="font-body text-sm text-muted-foreground max-w-lg">
          Strumenti intelligenti per supportare il tuo lavoro clinico quotidiano.
        </p>
        <BrandingSettings />
      </div>

      {loadingPerms ? (
        <p className="font-body text-sm text-muted-foreground">Caricamento permessi...</p>
      ) : (
        <TooltipProvider delayDuration={300}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tools.map((tool) => {
              const allowed = isToolAllowed(tool);
              const card = (
                <button
                  key={tool.id}
                  onClick={() => allowed && setActiveTool(tool.id)}
                  className={`group relative overflow-hidden rounded-2xl border text-left transition-all w-full border-border bg-card ${
                    allowed
                      ? "hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 cursor-pointer"
                      : "cursor-not-allowed"
                  }`}
                >
                  <div className={`h-2 bg-gradient-to-r ${tool.gradient}`} />
                  <div className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-gradient-to-br from-primary/10 to-primary/5 border-primary/10 transition-transform group-hover:scale-110 relative">
                      <tool.icon size={24} className={tool.accentColor} />
                      {!allowed && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive/90 flex items-center justify-center">
                          <Lock size={10} className="text-destructive-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-display text-base font-bold transition-colors text-foreground group-hover:text-primary">
                        {tool.title}
                      </h3>
                      <p className="font-body text-xs font-medium uppercase tracking-wider text-primary/70">
                        {tool.subtitle}
                      </p>
                      <p className="font-body text-sm text-muted-foreground leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 font-body text-xs font-semibold transition-all ${
                      allowed ? "text-primary group-hover:gap-2.5" : "text-muted-foreground"
                    }`}>
                      {allowed ? (
                        <>
                          Apri strumento
                          <ArrowLeft size={12} className="rotate-180" />
                        </>
                      ) : (
                        <>
                          <Lock size={11} />
                          Accesso non abilitato
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );

              if (!allowed) {
                return (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <div>{card}</div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="flex items-center gap-2 max-w-xs">
                      <Lock size={14} className="text-muted-foreground shrink-0" />
                      <span>Non sei abilitato a questo strumento. Contatta l'amministratore per richiedere l'accesso.</span>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return card;
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
};

export default ToolsSection;
