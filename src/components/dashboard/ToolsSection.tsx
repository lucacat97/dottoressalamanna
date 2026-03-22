import { Wrench, Brain } from "lucide-react";
import DiagnosisTool from "./DiagnosisTool";

const ToolsSection = () => {
  return (
    <section className="mb-12">
      <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        <Wrench size={20} className="text-petrolio" />
        Strumenti
      </h2>

      <div className="space-y-6">
        {/* Diagnosis Support Tool */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain size={16} className="text-gold" />
            <h3 className="font-display text-base font-semibold text-foreground">
              Supporto alla Diagnosi (AI)
            </h3>
          </div>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Carica un documento clinico (referto, test neuropsicologico, anamnesi) e ricevi un'analisi AI
            con ipotesi diagnostiche differenziali e suggerimenti per approfondimenti.
          </p>
          <DiagnosisTool />
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
