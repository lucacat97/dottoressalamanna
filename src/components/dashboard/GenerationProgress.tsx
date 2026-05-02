import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  /** Tempo stimato totale in secondi (default 120 = 2 minuti) */
  estimatedSeconds?: number;
  label?: string;
}

/**
 * Barra di avanzamento "generica" per operazioni AI di durata incerta.
 * Avanza in modo asintotico verso il 95% nel tempo stimato; non raggiunge mai
 * il 100% finché il chiamante non smonta il componente (= operazione finita).
 */
export const GenerationProgress = ({
  estimatedSeconds = 120,
  label = "Generazione interpretazioni in corso...",
}: Props) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      setElapsed((Date.now() - start) / 1000);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  // Curva asintotica: a t=estimatedSeconds raggiunge ~95%, poi rallenta ma cresce ancora un po'
  const ratio = elapsed / estimatedSeconds;
  const progress = Math.min(98, 95 * (1 - Math.exp(-1.8 * ratio)) + Math.min(3, ratio * 0.5));

  const remaining = Math.max(0, Math.ceil(estimatedSeconds - elapsed));
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const remainingLabel = remaining > 0
    ? `Tempo stimato rimanente: circa ${mm > 0 ? `${mm} min ` : ""}${ss.toString().padStart(2, "0")} s`
    : "Quasi pronto...";

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 bg-card border border-border rounded-lg">
      <Loader2 size={28} className="animate-spin text-petrolio" />
      <p className="font-body text-sm text-foreground text-center">{label}</p>

      <div className="w-full max-w-md">
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-petrolio transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 font-body text-xs text-muted-foreground">
          <span>{Math.round(progress)}%</span>
          <span>{remainingLabel}</span>
        </div>
      </div>

      <p className="font-body text-xs text-muted-foreground text-center max-w-md">
        L'elaborazione può richiedere fino a 2 minuti. Lascia aperta questa pagina.
      </p>
    </div>
  );
};
