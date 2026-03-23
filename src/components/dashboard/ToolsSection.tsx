import { useState } from "react";
import { Brain, Sparkles, ArrowLeft, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import DiagnosisTool from "./DiagnosisTool";
import OrthodonticTool from "./OrthodonticTool";

interface ToolCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Brain;
  gradient: string;
  accentColor: string;
}

const tools: ToolCard[] = [
  {
    id: "diagnosis",
    title: "Supporto alla Diagnosi Clinica",
    subtitle: "Referto AI da documento clinico",
    description: "Carica un PDF clinico e genera un referto strutturato con analisi posturale, ipotesi diagnostiche e piano terapeutico.",
    icon: Brain,
    gradient: "from-petrolio via-petrolio-dark to-petrolio",
    accentColor: "text-gold",
  },
  {
    id: "orthodontic",
    title: "Diagnosi Ortodontica",
    subtitle: "Cefalometria Bjork-Jarabak",
    description: "Inserisci i valori cefalometrici e ottieni classe scheletrica, divergenza e dispositivo terapeutico consigliato.",
    icon: Ruler,
    gradient: "from-[hsl(var(--gold))]/80 via-[hsl(var(--gold))]/60 to-[hsl(var(--gold))]/40",
    accentColor: "text-petrolio",
  },
];

const ToolsSection = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  if (activeTool) {
    const tool = tools.find(t => t.id === activeTool);
    return (
      <div className="space-y-6">
        {/* Back button + title */}
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

        {/* Tool header */}
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

        {/* Tool content */}
        {activeTool === "diagnosis" && <DiagnosisTool />}
        {activeTool === "orthodontic" && <OrthodonticTool />}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Sparkles size={14} className="text-gold" />
          <span className="font-body text-xs font-medium text-foreground uppercase tracking-wider">AI-Powered Tools</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">Strumenti Professionali</h2>
        <p className="font-body text-sm text-muted-foreground max-w-lg">
          Strumenti intelligenti per supportare il tuo lavoro clinico quotidiano.
        </p>
      </div>

      {/* Tool cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
          >
            {/* Gradient top strip */}
            <div className={`h-2 bg-gradient-to-r ${tool.gradient}`} />

            <div className="p-6 space-y-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform">
                <tool.icon size={24} className={tool.accentColor} />
              </div>

              {/* Text */}
              <div className="space-y-1.5">
                <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="font-body text-xs font-medium text-primary/70 uppercase tracking-wider">
                  {tool.subtitle}
                </p>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {/* CTA hint */}
              <div className="flex items-center gap-1.5 font-body text-xs font-semibold text-primary group-hover:gap-2.5 transition-all">
                Apri strumento
                <ArrowLeft size={12} className="rotate-180" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ToolsSection;
