import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { getSectionInfo } from "./explanations";

interface Props {
  sectionId: string;
  label: string;
}

export default function SectionHeader({ sectionId, label }: Props) {
  const info = getSectionInfo(sectionId);
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3 pb-2 border-b border-border">
      <div className="flex items-start gap-2">
        <h3 className="font-display text-lg font-bold text-foreground flex-1">{label}</h3>
        {info && (
          <>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-primary transition-colors mt-1"
                    aria-label="Spiegazione sezione"
                  >
                    <Info size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm text-xs">
                  {info.hint}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {info.details && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1.5"
              >
                Dettagli Test
                <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
            )}
          </>
        )}
      </div>
      {info && !open && (
        <p className="text-xs text-muted-foreground mt-1 italic">{info.hint}</p>
      )}
      {info?.details && open && (
        <div className="mt-2 px-3 py-2 rounded bg-muted/60 border border-border text-xs text-foreground whitespace-pre-line">
          {info.details}
        </div>
      )}
    </div>
  );
}
