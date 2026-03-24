import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BODY_REGIONS, type BodyRegion, regionKey } from "./bodyRegions";

// Anatomical grouping for the checkbox tree
const SECTION_ORDER = [
  { key: "head", label: "Testa e Viso", ids: ["head_top", "forehead", "temple", "eye", "nose", "ear", "jaw", "occiput"] },
  { key: "neck", label: "Collo", ids: ["neck_front", "neck_back", "neck_lateral"] },
  { key: "shoulder", label: "Spalle", ids: ["shoulder", "scapula"] },
  { key: "chest", label: "Torace", ids: ["chest_upper", "chest", "ribs_lateral"] },
  { key: "back", label: "Schiena", ids: ["upper_back", "mid_back", "lower_back"] },
  { key: "abdomen", label: "Addome", ids: ["epigastrium", "umbilical", "lower_abdomen", "flank", "inguinal"] },
  { key: "arm", label: "Arti superiori", ids: ["upper_arm", "elbow", "forearm", "wrist", "hand"] },
  { key: "pelvis", label: "Bacino e Anca", ids: ["sacrum", "gluteal", "hip"] },
  { key: "leg", label: "Arti inferiori", ids: ["thigh_front", "thigh_lateral", "thigh_back", "knee", "knee_back", "lower_leg", "calf", "ankle", "heel", "foot"] },
];

interface BodyRegionCheckboxesProps {
  selectedRegions: Set<string>;
  onToggleRegion: (region: BodyRegion) => void;
}

export default function BodyRegionCheckboxes({ selectedRegions, onToggleRegion }: BodyRegionCheckboxesProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const sections = useMemo(() => {
    return SECTION_ORDER.map(section => {
      const regions = section.ids.flatMap(id =>
        BODY_REGIONS.filter(r => r.id === id)
      );
      return { ...section, regions };
    });
  }, []);

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSectionToggleAll = (sectionRegions: BodyRegion[]) => {
    const allSelected = sectionRegions.every(r => selectedRegions.has(regionKey(r)));
    sectionRegions.forEach(r => {
      const rk = regionKey(r);
      const isSelected = selectedRegions.has(rk);
      if (allSelected && isSelected) onToggleRegion(r);
      if (!allSelected && !isSelected) onToggleRegion(r);
    });
  };

  return (
    <div className="border border-border rounded-xl bg-card p-3">
      <p className="font-display text-xs font-bold text-foreground mb-2">Seleziona zone corporee</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
        {sections.map(section => {
          const sectionSelected = section.regions.filter(r => selectedRegions.has(regionKey(r))).length;
          const allSelected = sectionSelected === section.regions.length;
          const someSelected = sectionSelected > 0 && !allSelected;
          const isOpen = openSections.has(section.key);

          return (
            <Collapsible key={section.key} open={isOpen} onOpenChange={() => toggleSection(section.key)}>
              <div className="rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-center gap-2 px-2.5 py-1.5">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={() => handleSectionToggleAll(section.regions)}
                    className="h-3.5 w-3.5"
                  />
                  <CollapsibleTrigger className="flex-1 flex items-center justify-between cursor-pointer">
                    <span className="font-body text-xs font-medium text-foreground">
                      {section.label}
                      {sectionSelected > 0 && (
                        <span className="ml-1.5 text-[10px] text-primary font-normal">({sectionSelected})</span>
                      )}
                    </span>
                    <ChevronDown size={12} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="px-2.5 pb-2 pt-0.5 space-y-0.5">
                    {section.regions.map(region => {
                      const rk = regionKey(region);
                      const sideLabel = region.side === "left" ? " (sx)" : region.side === "right" ? " (dx)" : "";
                      return (
                        <label
                          key={rk}
                          className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-accent/50 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={selectedRegions.has(rk)}
                            onCheckedChange={() => onToggleRegion(region)}
                            className="h-3 w-3"
                          />
                          <span className="font-body text-[11px] text-foreground/80">
                            {region.name}{sideLabel}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
