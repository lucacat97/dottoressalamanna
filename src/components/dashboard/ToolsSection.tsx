import { Brain, Sparkles, ShieldCheck, Zap } from "lucide-react";
import DiagnosisTool from "./DiagnosisTool";

const ToolsSection = () => {
  return (
    <div className="space-y-8">
      {/* Hero card for the AI tool */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-petrolio via-petrolio-dark to-petrolio border border-petrolio-light/20">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
        
        <div className="relative p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Left: info */}
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <Sparkles size={14} className="text-gold" />
                <span className="font-body text-xs font-medium text-white/90 uppercase tracking-wider">AI-Powered</span>
              </div>
              
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight">
                Supporto alla<br />Diagnosi Clinica
              </h2>
              
              <p className="font-body text-sm text-white/70 leading-relaxed max-w-md">
                Carica un documento clinico e ricevi un'analisi AI strutturata con ipotesi diagnostiche 
                differenziali, aree di attenzione e suggerimenti per approfondimenti.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { icon: Brain, label: "Analisi neuropsicologica" },
                  { icon: ShieldCheck, label: "Privacy garantita" },
                  { icon: Zap, label: "Risultati in tempo reale" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <Icon size={12} className="text-gold" />
                    <span className="font-body text-xs text-white/80">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: decorative brain icon */}
            <div className="hidden md:flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-gold/20">
                <Brain size={48} className="text-gold" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tool card */}
      <DiagnosisTool />
    </div>
  );
};

export default ToolsSection;
