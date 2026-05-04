import { useState } from "react";
import { ArrowLeft, Activity, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import SistemicaTool from "./SistemicaTool";
import OrganicaTool from "./OrganicaTool";

type SubSection = "sistemica" | "organica" | null;

interface SubSectionCard {
  id: SubSection;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Activity;
  gradient: string;
}

const subSections: SubSectionCard[] = [
  {
    id: "sistemica",
    title: "Sistemica",
    subtitle: "Mappa 3D del corpo & Agopunti",
    description: "Segna i punti dolorosi su un modello 3D interattivo e ottieni agopunti consigliati con diagnosi integrata MTC + medicina occidentale.",
    icon: Activity,
    gradient: "from-emerald-500/80 via-teal-500/60 to-cyan-500/40",
  },
  {
    id: "organica",
    title: "Organica",
    subtitle: "Pattern di Disarmonia da Sintomi",
    description: "Seleziona i sintomi del paziente per identificare il pattern di disarmonia MTC con interpretazione duale e piano terapeutico.",
    icon: Stethoscope,
    gradient: "from-amber-500/80 via-orange-500/60 to-red-500/40",
  },
];

export default function MTCHub() {
  const [activeSection, setActiveSection] = useState<SubSection>(null);

  if (activeSection) {
    const section = subSections.find(s => s.id === activeSection);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection(null)}
            className="font-body gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            MTC
          </Button>
        </div>

        {section && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <section.icon size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-foreground">{section.title}</h3>
              <p className="font-body text-xs text-muted-foreground">{section.subtitle}</p>
            </div>
          </div>
        )}

        {activeSection === "sistemica" && <SistemicaTool />}
        {activeSection === "organica" && <OrganicaTool />}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {subSections.map((section) => (
        <button
          key={section.id}
          onClick={() => setActiveSection(section.id)}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
        >
          <div className={`h-2 bg-gradient-to-r ${section.gradient}`} />
          <div className="p-5 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center border border-emerald-500/10 group-hover:scale-110 transition-transform">
              <section.icon size={22} className="text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">
                {section.title}
              </h3>
              <p className="font-body text-xs font-medium text-primary/70 uppercase tracking-wider">
                {section.subtitle}
              </p>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                {section.description}
              </p>
            </div>
            <div className="flex items-center gap-1.5 font-body text-xs font-semibold text-primary group-hover:gap-2.5 transition-all">
              Apri strumento
              <ArrowLeft size={12} className="rotate-180" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
