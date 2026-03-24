import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACUPOINTS, BODY_REGIONS, type BodyRegion, regionKey, meridianLabels } from "./bodyRegions";

interface BodyMap2DProps {
  sex: "M" | "F";
  selectedRegions: Set<string>;
  onToggleRegion: (region: BodyRegion) => void;
  showAcupoints: boolean;
  relevantMeridians: Set<string>;
}

interface AxisBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

type ViewMode = "front" | "back";

const FRONT_BACK_THRESHOLD = 0.015;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const regionBounds: AxisBounds = BODY_REGIONS.reduce(
  (acc, region) => ({
    minX: Math.min(acc.minX, region.position[0]),
    maxX: Math.max(acc.maxX, region.position[0]),
    minY: Math.min(acc.minY, region.position[1]),
    maxY: Math.max(acc.maxY, region.position[1]),
  }),
  {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  }
);

function toPercent(position: [number, number, number], bounds: AxisBounds): { x: number; y: number } {
  const xNorm = (position[0] - bounds.minX) / Math.max(bounds.maxX - bounds.minX, 1e-6);
  const yNorm = (position[1] - bounds.minY) / Math.max(bounds.maxY - bounds.minY, 1e-6);

  return {
    x: clamp(xNorm * 100, 8, 92),
    y: clamp((1 - yNorm) * 100, 6, 95),
  };
}

function belongsToView(z: number, view: ViewMode): boolean {
  if (view === "front") return z >= -FRONT_BACK_THRESHOLD;
  return z <= FRONT_BACK_THRESHOLD;
}

export default function BodyMap2D({
  sex,
  selectedRegions,
  onToggleRegion,
  showAcupoints,
  relevantMeridians,
}: BodyMap2DProps) {
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);

  const frontRegions = useMemo(
    () => BODY_REGIONS.filter((region) => belongsToView(region.position[2], "front")),
    []
  );

  const backRegions = useMemo(
    () => BODY_REGIONS.filter((region) => belongsToView(region.position[2], "back")),
    []
  );

  const visibleAcupoints = useMemo(() => {
    if (!showAcupoints) return [];
    return ACUPOINTS.filter((point) => relevantMeridians.has(point.meridian));
  }, [showAcupoints, relevantMeridians]);

  const renderMap = (regions: BodyRegion[], view: ViewMode) => (
    <div className="relative h-[560px] w-full rounded-xl border border-border bg-gradient-to-b from-muted/35 via-background to-muted/20 p-3">
      <div className="pointer-events-none absolute inset-y-8 left-1/2 w-20 -translate-x-1/2 rounded-[999px] border border-border/50 bg-muted/30" />
      <div className="pointer-events-none absolute left-1/2 top-[16%] h-14 w-14 -translate-x-1/2 rounded-full border border-border/50 bg-muted/35" />
      <div className="pointer-events-none absolute left-1/2 top-[28%] h-3 w-8 -translate-x-1/2 rounded-full border border-border/50 bg-muted/35" />

      {regions.map((region) => {
        const { x, y } = toPercent(region.position, regionBounds);
        const isSelected = selectedRegions.has(region.id);

        return (
          <button
            key={`${view}-${region.id}`}
            type="button"
            title={region.name}
            onMouseEnter={() => setHoveredRegion(region)}
            onMouseLeave={() => setHoveredRegion(null)}
            onClick={() => onToggleRegion(region)}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-sm border transition-all",
              "h-4 w-4 flex items-center justify-center",
              isSelected
                ? "border-destructive bg-destructive text-destructive-foreground shadow-sm"
                : "border-border bg-card hover:border-primary/70 hover:bg-accent"
            )}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {isSelected && <Check size={10} />}
          </button>
        );
      })}

      {visibleAcupoints
        .filter((point) => belongsToView(point.position[2], view))
        .map((point) => {
          const { x, y } = toPercent(point.position, regionBounds);
          return (
            <div
              key={`${view}-acu-${point.id}`}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border border-background bg-primary/80"
              style={{ left: `${x}%`, top: `${y}%` }}
              title={point.id}
            />
          );
        })}
    </div>
  );

  return (
    <div className="relative w-full space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fronte</p>
          {renderMap(frontRegions, "front")}
        </div>

        <div className="space-y-2">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Retro</p>
          {renderMap(backRegions, "back")}
        </div>
      </div>

      {hoveredRegion && (
        <div className="absolute left-3 top-8 z-10 max-w-xs rounded-lg border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm pointer-events-none">
          <p className="font-display text-xs font-bold text-foreground">{hoveredRegion.name}</p>
          <p className="mt-0.5 font-body text-[10px] text-muted-foreground">{hoveredRegion.description}</p>
          <p className="mt-1 font-body text-[10px] text-primary/70">
            Meridiani: {hoveredRegion.meridians.join(", ")}
          </p>
        </div>
      )}

      <div className="absolute right-3 top-3 rounded-lg border border-border bg-card/90 px-3 py-1.5 backdrop-blur-sm">
        <span className="font-body text-xs text-muted-foreground">
          {sex === "M" ? "♂ Maschile" : "♀ Femminile"}
        </span>
      </div>

      <div className="absolute bottom-3 left-3 rounded-lg border border-border bg-card/90 px-3 py-2 backdrop-blur-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm border border-border bg-card" />
          <span className="font-body text-[10px] text-muted-foreground">Zona cliccabile</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-destructive/85" />
          <span className="font-body text-[10px] text-muted-foreground">Punto doloroso selezionato</span>
        </div>
        {showAcupoints && (
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary/80" />
            <span className="font-body text-[10px] text-muted-foreground">Agopunto consigliato</span>
          </div>
        )}
        <p className="mt-1 font-body text-[10px] text-muted-foreground/70">Click = toggle zona (deterministico)</p>
      </div>
    </div>
  );
}
