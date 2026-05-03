import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import MilaMethodTool from "./MilaMethodTool";
import RequestConsultationDialog from "./RequestConsultationDialog";

export default function SingleConsultationTool() {
  const [openDialog, setOpenDialog] = useState(false);
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-cream via-card to-cream p-6 md:p-8 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/30">
              <Sparkles size={12} className="text-gold" />
              <span className="font-body text-[11px] font-semibold text-petrolio-dark uppercase tracking-wider">Consulenza riservata</span>
            </div>
            <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">Hai un caso che merita uno sguardo personale?</h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              Invia una richiesta diretta alla Dott.ssa Lamanna. Allega cartella, cefalometria o foto del paziente: riceverai una risposta personale.
            </p>
          </div>
          <Button onClick={() => setOpenDialog(true)} size="lg" className="bg-gradient-to-r from-petrolio to-petrolio-light hover:from-petrolio-dark hover:to-petrolio text-primary-foreground shadow-card font-body whitespace-nowrap">
            <Mail size={16} className="mr-2" />
            Richiedi consulenza diretta
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-base font-bold text-foreground">Studia il caso secondo Metodo MILA</h3>
        <p className="font-body text-sm text-muted-foreground">Compila l'analisi qui sotto: potrai poi usarla anche come traccia per la consulenza diretta.</p>
      </div>
      <MilaMethodTool />

      <RequestConsultationDialog open={openDialog} onOpenChange={setOpenDialog} />
    </div>
  );
}
