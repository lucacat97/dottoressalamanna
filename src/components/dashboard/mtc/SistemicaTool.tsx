import { useState, useMemo } from "react";
import { Loader2, Download, FileDown, RotateCcw, AlertTriangle, Sparkles, MessageSquareText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getBranding, generateHtmlHeader } from "../BrandingSettings";
import BodyModel3D from "./BodyModel3D";
import ReportRenderer from "./ReportRenderer";
import { BODY_REGIONS, type BodyRegion, regionKey, meridianLabels } from "./bodyRegions";
import BodyRegionCheckboxes from "./BodyRegionCheckboxes";
import { cn } from "@/lib/utils";

const DISCLAIMER = `⚠️ Disclaimer: Questo strumento fornisce esclusivamente un supporto all'analisi clinica basata sui principi della Medicina Tradizionale Cinese e NON costituisce in alcun modo una diagnosi medica. La responsabilità diagnostica e terapeutica resta interamente in capo al professionista sanitario.`;

const mdToHtml = (markdown: string) => {
  let html = markdown
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split("|").filter(c => c.trim());
      if (cells.every(c => /^[\s:-]+$/.test(c))) return "<!--table-sep-->";
      const isHeader = cells.some(c => c.includes("**"));
      const tag = isHeader ? "th" : "td";
      const cellsHtml = cells.map(c =>
        `<${tag} style="padding:8px 12px;border:1px solid #ddd;text-align:left;${isHeader ? "background:#f0f7f7;font-weight:600;" : ""}">${c.replace(/\*\*/g, "").trim()}</${tag}>`
      ).join("");
      return `<tr>${cellsHtml}</tr>`;
    })
    .replace(/((<tr>.*<\/tr>\n?)+)/g, '<table style="width:100%;border-collapse:collapse;margin:16px 0;">$1</table>')
    .replace(/<!--table-sep-->\n?/g, "")
    .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;color:#2a6f6f;margin:24px 0 10px;font-family:Georgia,serif;">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;color:#333;margin:20px 0 8px;">$1</h3>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;color:#2a6f6f;margin:28px 0 12px;font-family:Georgia,serif;border-bottom:1px solid #eee;padding-bottom:8px;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0;">$1</li>')
    .replace(/((<li[^>]*>.*<\/li>\n?)+)/g, '<ul style="margin:8px 0 8px 20px;padding:0;">$1</ul>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #2a6f6f;padding:8px 16px;margin:12px 0;background:#f0f7f7;color:#333;">$1</blockquote>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">')
    .replace(/^(?!<[hublot]|<\/)(.+)$/gm, '<p style="margin:8px 0;line-height:1.6;">$1</p>');
  return html;
};

const generateDoc = (markdown: string) => {
  const branding = getBranding();
  const header = generateHtmlHeader(branding);
  const body = mdToHtml(markdown);
  const disclaimer = `<div style="margin-top:32px;padding:16px;background:#fff3cd;border:1px solid #ffc107;border-radius:8px;font-size:11px;color:#856404;">${DISCLAIMER}</div>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #222; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
    table { page-break-inside: avoid; } h1 { page-break-after: avoid; }
    @media print { body { padding: 20px; } }
  </style></head><body>${header}${body}${disclaimer}</body></html>`;
};

export default function SistemicaTool() {
  const [sex, setSex] = useState<"M" | "F">("F");
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultMarkdown, setResultMarkdown] = useState<string | null>(null);
  const [showAcupoints, setShowAcupoints] = useState(false);
  const [relevantMeridians, setRelevantMeridians] = useState<Set<string>>(new Set());
  const [clinicalNotes, setClinicalNotes] = useState("");

  const handleToggleRegion = (region: BodyRegion) => {
    setSelectedRegions(prev => {
      const next = new Set(prev);
      const rk = regionKey(region);
      if (next.has(rk)) {
        next.delete(rk);
      } else {
        next.add(rk);
      }
      return next;
    });
  };

  const handleAnalyze = async () => {
    if (selectedRegions.size === 0) {
      toast({ title: "Seleziona almeno un punto doloroso", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResultMarkdown(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Sessione scaduta", description: "Effettua nuovamente il login.", variant: "destructive" });
        return;
      }

      const painPoints = Array.from(selectedRegions).map(rk => {
        const region = BODY_REGIONS.find(r => regionKey(r) === rk)!;
        return { region: region.name, description: region.description, side: region.side };
      });

      // Collect meridians from selected regions
      const meridiansSet = new Set<string>();
      selectedRegions.forEach(rk => {
        const region = BODY_REGIONS.find(r => regionKey(r) === rk);
        region?.meridians.forEach(m => meridiansSet.add(m));
      });
      setRelevantMeridians(meridiansSet);
      setShowAcupoints(true);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mtc-diagnosis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
      body: JSON.stringify({ subTool: "sistemica", sex, painPoints, clinicalNotes: clinicalNotes.trim() || undefined }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Errore ${response.status}`);
      }

      // Stream SSE
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Nessun stream ricevuto");

      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullText += content;
          } catch {}
        }
      }

      setResultMarkdown(fullText);
    } catch (err: any) {
      toast({ title: "Errore Analisi", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadDoc = (type: "doc" | "pdf") => {
    if (!resultMarkdown) return;
    const html = generateDoc(resultMarkdown);
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referto_mtc_sistemica.${type === "doc" ? "doc" : "html"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setSelectedRegions(new Set());
    setResultMarkdown(null);
    setShowAcupoints(false);
    setRelevantMeridians(new Set());
    setClinicalNotes("");
  };

  if (!disclaimerAccepted) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-display text-sm font-bold text-amber-800 dark:text-amber-200">Disclaimer Obbligatorio</h3>
              <p className="font-body text-xs text-amber-700 dark:text-amber-300 mt-2 leading-relaxed">{DISCLAIMER}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setDisclaimerAccepted(true)} className="bg-primary text-primary-foreground">
          Ho letto e accetto — Procedi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sex selection */}
      <div className="flex items-center gap-4">
        <span className="font-body text-sm text-muted-foreground">Sesso:</span>
        <RadioGroup value={sex} onValueChange={(v) => setSex(v as "M" | "F")} className="flex gap-4">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="F" id="sex-f" />
            <Label htmlFor="sex-f" className="font-body text-sm">♀ Femminile</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="M" id="sex-m" />
            <Label htmlFor="sex-m" className="font-body text-sm">♂ Maschile</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Body region checkboxes */}
      <BodyRegionCheckboxes selectedRegions={selectedRegions} onToggleRegion={handleToggleRegion} />

      {/* 3D Body + Clinical Notes side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="border border-border rounded-xl overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
          <BodyModel3D
            sex={sex}
            selectedRegions={selectedRegions}
            onToggleRegion={handleToggleRegion}
            showAcupoints={showAcupoints}
            relevantMeridians={relevantMeridians}
          />
        </div>

        <div className="space-y-3">
          <div className="border border-border rounded-xl p-4 bg-card h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquareText size={16} className="text-primary" />
              <h3 className="font-display text-sm font-bold text-foreground">Note cliniche</h3>
            </div>
            <p className="font-body text-[11px] text-muted-foreground mb-3">
              Descrivi sintomi, anamnesi o osservazioni aggiuntive da includere nell'analisi AI.
            </p>
            <Textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Es: Paziente lamenta dolore lombare cronico da 6 mesi, peggioramento notturno, lingua pallida con patina bianca, polso profondo e debole..."
              className="flex-1 min-h-[200px] resize-none font-body text-sm"
            />
            <p className="font-body text-[10px] text-muted-foreground/60 mt-2">
              {clinicalNotes.length > 0 ? `${clinicalNotes.length} caratteri` : "Facoltativo — arricchisce l'analisi"}
            </p>
          </div>
        </div>
      </div>

      {/* Selected regions summary */}
      {selectedRegions.size > 0 && (
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="font-body text-xs text-muted-foreground mb-2">Punti dolorosi selezionati ({selectedRegions.size}):</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(selectedRegions).map(rk => {
              const region = BODY_REGIONS.find(r => regionKey(r) === rk);
              const label = region ? `${region.name}${region.side && region.side !== "center" ? ` (${region.side === "left" ? "sx" : "dx"})` : ""}` : rk;
              return (
                <span
                  key={rk}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-body cursor-pointer hover:bg-destructive/20 transition"
                  onClick={() => region && handleToggleRegion(region)}
                >
                  {label} ✕
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleAnalyze}
          disabled={loading || selectedRegions.size === 0}
          className="bg-primary text-primary-foreground"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Analisi in corso...
            </>
          ) : (
            <>
              <Sparkles size={16} className="mr-2" />
              Analizza con AI
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={loading}>
          <RotateCcw size={14} className="mr-1.5" />
          Reset
        </Button>
      </div>

      {/* Results - download only */}
      {resultMarkdown && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h3 className="font-display text-sm font-bold text-foreground">Referto MTC Generato</h3>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadDoc("doc")}>
                <Download size={14} className="mr-1.5" />
                Word
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadDoc("pdf")}>
                <FileDown size={14} className="mr-1.5" />
                PDF/HTML
              </Button>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <ReportRenderer markdown={resultMarkdown} />
          </div>
        </div>
      )}
    </div>
  );
}
