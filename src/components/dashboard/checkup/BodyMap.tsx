import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { BodyMarker, BodyView } from "./form-schema";

interface Props {
  value: BodyMarker[];
  onChange: (next: BodyMarker[]) => void;
}

const VIEWS: { id: BodyView; label: string }[] = [
  { id: "fronte", label: "Frontale" },
  { id: "retro", label: "Posteriore" },
  { id: "lato_dx", label: "Laterale DX" },
  { id: "lato_sx", label: "Laterale SX" },
  { id: "testa_fronte", label: "Testa F" },
  { id: "testa_lat_dx", label: "Testa DX" },
  { id: "testa_lat_sx", label: "Testa SX" },
  { id: "addome", label: "Addome" },
  { id: "piedi", label: "Piedi" },
];

// Simple human silhouettes per view
const Silhouette = ({ view }: { view: BodyView }) => {
  const stroke = "hsl(var(--foreground) / 0.5)";
  const fill = "hsl(var(--muted) / 0.4)";
  switch (view) {
    case "fronte":
    case "retro":
      return (
        <>
          <circle cx="100" cy="35" r="22" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <path d="M75 60 L125 60 L135 110 L130 180 L120 250 L115 330 L105 330 L100 250 L95 330 L85 330 L80 250 L70 180 L65 110 Z"
            fill={fill} stroke={stroke} strokeWidth="1.2" />
          <path d="M65 110 L40 200 L42 220" fill="none" stroke={stroke} strokeWidth="1.2" />
          <path d="M135 110 L160 200 L158 220" fill="none" stroke={stroke} strokeWidth="1.2" />
          <line x1="100" y1="60" x2="100" y2="180" stroke={stroke} strokeWidth="0.4" strokeDasharray="2,2" />
        </>
      );
    case "lato_dx":
    case "lato_sx":
      return (
        <>
          <circle cx="100" cy="35" r="22" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <path d="M85 60 L115 60 L120 130 L115 200 L120 280 L110 330 L95 330 L90 280 L85 200 L80 130 Z"
            fill={fill} stroke={stroke} strokeWidth="1.2" />
          <path d="M115 100 L130 180" fill="none" stroke={stroke} strokeWidth="1.2" />
        </>
      );
    case "testa_fronte":
      return (
        <>
          <ellipse cx="100" cy="100" rx="55" ry="75" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <ellipse cx="80" cy="90" rx="6" ry="4" fill="none" stroke={stroke} />
          <ellipse cx="120" cy="90" rx="6" ry="4" fill="none" stroke={stroke} />
          <path d="M85 130 Q100 140 115 130" fill="none" stroke={stroke} strokeWidth="1.2" />
        </>
      );
    case "testa_lat_dx":
    case "testa_lat_sx":
      return (
        <>
          <path d="M70 100 Q60 50 110 40 Q160 50 155 110 L160 140 L150 145 L145 165 L100 170 Q70 165 65 140 Z"
            fill={fill} stroke={stroke} strokeWidth="1.2" />
          <circle cx="115" cy="100" r="3" fill={stroke} />
          <ellipse cx="135" cy="120" rx="8" ry="12" fill="none" stroke={stroke} />
        </>
      );
    case "addome":
      return (
        <>
          <path d="M50 30 L150 30 L160 100 L150 180 L130 220 L70 220 L50 180 L40 100 Z"
            fill={fill} stroke={stroke} strokeWidth="1.2" />
          <line x1="100" y1="30" x2="100" y2="220" stroke={stroke} strokeWidth="0.4" strokeDasharray="2,2" />
          <line x1="40" y1="125" x2="160" y2="125" stroke={stroke} strokeWidth="0.4" strokeDasharray="2,2" />
          <circle cx="100" cy="140" r="4" fill="none" stroke={stroke} />
        </>
      );
    case "piedi":
      return (
        <>
          <ellipse cx="65" cy="160" rx="28" ry="80" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <ellipse cx="135" cy="160" rx="28" ry="80" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <text x="48" y="260" fontSize="11" fill={stroke}>SX</text>
          <text x="125" y="260" fontSize="11" fill={stroke}>DX</text>
        </>
      );
  }
};

export default function BodyMap({ value, onChange }: Props) {
  const [view, setView] = useState<BodyView>("fronte");
  const [side, setSide] = useState<"dx" | "sx">("dx");

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 200;
    const y = ((e.clientY - rect.top) / rect.height) * 360;
    onChange([...value, { x, y, view, side }]);
  };

  const removeMarker = (i: number, currentView: BodyView) => {
    const viewMarkers = value.filter((m) => m.view === currentView);
    const target = viewMarkers[i];
    onChange(value.filter((m) => m !== target));
  };

  const markersHere = value.filter((m) => m.view === view);

  return (
    <div className="space-y-2 p-3 border border-border rounded-md bg-muted/20">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Lato:</span>
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setSide("dx")}
              className={`px-2 py-1 text-xs ${side === "dx" ? "bg-red-500 text-white" : "bg-background"}`}
            >
              DX
            </button>
            <button
              type="button"
              onClick={() => setSide("sx")}
              className={`px-2 py-1 text-xs ${side === "sx" ? "bg-blue-500 text-white" : "bg-background"}`}
            >
              SX
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{value.length} marker totali</p>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as BodyView)}>
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {VIEWS.map((v) => (
            <TabsTrigger
              key={v.id}
              value={v.id}
              className="text-[11px] py-1 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {v.label}
              {value.filter((m) => m.view === v.id).length > 0 && (
                <span className="ml-1 text-[9px] opacity-80">
                  ({value.filter((m) => m.view === v.id).length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {VIEWS.map((v) => (
          <TabsContent key={v.id} value={v.id} className="mt-2">
            <div className="flex justify-center bg-background rounded-md border border-border p-2">
              <svg
                viewBox="0 0 200 360"
                width="180"
                height="320"
                className="cursor-crosshair"
                onClick={handleClick}
              >
                <Silhouette view={v.id} />
                {markersHere.map((m, i) => (
                  <g key={i} onClick={(e) => { e.stopPropagation(); removeMarker(i, v.id); }} className="cursor-pointer">
                    <circle
                      cx={m.x}
                      cy={m.y}
                      r="6"
                      fill={m.side === "dx" ? "rgb(239 68 68 / 0.7)" : "rgb(59 130 246 / 0.7)"}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </g>
                ))}
              </svg>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-1">
              Clicca per aggiungere un marker • clicca un marker per rimuoverlo
            </p>
          </TabsContent>
        ))}
      </Tabs>

      {value.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([])}
          className="text-xs text-destructive h-7"
        >
          <Trash2 size={12} /> Rimuovi tutti
        </Button>
      )}
    </div>
  );
}
