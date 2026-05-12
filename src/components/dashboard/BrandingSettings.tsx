import { useState, useEffect } from "react";
import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export interface BrandingConfig {
  studioName: string;
  subtitle: string;
}

const STORAGE_KEY = "report-branding";

const DEFAULT_BRANDING: BrandingConfig = {
  studioName: "",
  subtitle: "",
};

export function getBranding(): BrandingConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_BRANDING;
}

export function generateHtmlHeader(branding: BrandingConfig): string {
  if (!branding.studioName && !branding.subtitle) return "";
  return `
    <div style="text-align:center;margin-bottom:24px;border-bottom:2px solid #2a6f6f;padding-bottom:16px;">
      ${branding.studioName ? `<h2 style="margin:0;font-size:18px;color:#2a6f6f;font-family:Georgia,serif;">${branding.studioName.replace(/&/g, "&amp;")}</h2>` : ""}
      ${branding.subtitle ? `<p style="margin:4px 0 0;font-size:11px;color:#666;">${branding.subtitle}</p>` : ""}
    </div>
  `;
}

const BrandingSettings = () => {
  const [config, setConfig] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setConfig(getBranding());
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    toast({ title: "Intestazione salvata", description: "I prossimi referti useranno questa intestazione." });
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all font-body text-xs"
      >
        <Settings size={12} />
        Intestazione referti
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <h4 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
        <Settings size={14} className="text-petrolio" />
        Intestazione Referti (Header / Footer)
      </h4>
      <p className="font-body text-xs text-muted-foreground">
        Personalizza l'intestazione che appare nei referti scaricati. Lascia vuoto per non mostrare intestazione.
      </p>
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="font-body text-xs">Nome Studio</Label>
          <Input
            value={config.studioName}
            onChange={(e) => setConfig(prev => ({ ...prev, studioName: e.target.value }))}
            placeholder="es. Studio Rossi"
            className="font-body text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="font-body text-xs">Sottotitolo</Label>
          <Input
            value={config.subtitle}
            onChange={(e) => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
            placeholder="es. Studio Dentistico — Ortodonzia"
            className="font-body text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} className="font-body gap-1.5">
          <Save size={12} />
          Salva
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="font-body">
          Annulla
        </Button>
      </div>
    </div>
  );
};

export default BrandingSettings;
