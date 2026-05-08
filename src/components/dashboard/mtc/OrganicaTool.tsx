import { useState } from "react";
import { Loader2, Download, FileDown, RotateCcw, AlertTriangle, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getBranding, generateHtmlHeader } from "../BrandingSettings";
import ReportRenderer from "./ReportRenderer";
import { SYMPTOM_CATEGORIES, type Symptom } from "./symptomCategories";
import RetroFeedback from "../RetroFeedback";

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
  </style></head><body>${header}${body}${disclaimer}</body></html>`;
};

export default function OrganicaTool() {
  const [sex, setSex] = useState<"M" | "F">("F");
  const [age, setAge] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<Map<string, Symptom>>(new Map());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultMarkdown, setResultMarkdown] = useState<string | null>(null);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const toggleSymptom = (symptom: Symptom, categoryName: string) => {
    setSelectedSymptoms(prev => {
      const next = new Map(prev);
      if (next.has(symptom.id)) next.delete(symptom.id);
      else next.set(symptom.id, { ...symptom, name: `${symptom.name}` });
      return next;
    });
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.size === 0) {
      toast({ title: "Seleziona almeno un sintomo", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResultMarkdown(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Sessione scaduta", variant: "destructive" });
        return;
      }

      // Map symptoms with their categories
      const symptoms = SYMPTOM_CATEGORIES.flatMap(cat =>
        cat.symptoms
          .filter(s => selectedSymptoms.has(s.id))
          .map(s => ({ category: cat.name, name: s.name }))
      );

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mtc-diagnosis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            subTool: "organica",
            sex,
            age: age ? parseInt(age) : undefined,
            symptoms,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Errore ${response.status}`);
      }

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
    a.download = `consulenza_mtc_organica.${type === "doc" ? "doc" : "html"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setSelectedSymptoms(new Map());
    setResultMarkdown(null);
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
      {/* Patient info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <span className="font-body text-sm text-muted-foreground">Sesso:</span>
          <RadioGroup value={sex} onValueChange={(v) => setSex(v as "M" | "F")} className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="F" id="org-sex-f" />
              <Label htmlFor="org-sex-f" className="font-body text-sm">♀ Femminile</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="M" id="org-sex-m" />
              <Label htmlFor="org-sex-m" className="font-body text-sm">♂ Maschile</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="org-age" className="font-body text-sm text-muted-foreground">Età:</Label>
          <input
            id="org-age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min={0}
            max={120}
            placeholder="—"
            className="w-20 px-3 py-1.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Symptom categories */}
      <div className="space-y-2">
        <p className="font-body text-xs text-muted-foreground">Seleziona i sintomi del paziente:</p>
        {SYMPTOM_CATEGORIES.map(cat => {
          const isExpanded = expandedCategories.has(cat.id);
          const selectedInCat = cat.symptoms.filter(s => selectedSymptoms.has(s.id)).length;
          return (
            <div key={cat.id} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-card hover:bg-muted/50 transition text-left"
              >
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="font-display text-sm font-semibold text-foreground">{cat.name}</span>
                  {selectedInCat > 0 && (
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {selectedInCat}
                    </span>
                  )}
                </div>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isExpanded && (
                <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-muted/20">
                  {cat.symptoms.map(symptom => {
                    const isSelected = selectedSymptoms.has(symptom.id);
                    return (
                      <button
                        key={symptom.id}
                        onClick={() => toggleSymptom(symptom, cat.name)}
                        className={`text-left px-3 py-2 rounded-md font-body text-xs transition ${
                          isSelected
                            ? "bg-primary/10 text-primary border border-primary/30 font-medium"
                            : "bg-card border border-border text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        {symptom.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected summary */}
      {selectedSymptoms.size > 0 && (
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="font-body text-xs text-muted-foreground mb-2">
            Sintomi selezionati ({selectedSymptoms.size}):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(selectedSymptoms.entries()).map(([id, symptom]) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-body cursor-pointer hover:bg-primary/20 transition"
                onClick={() => {
                  setSelectedSymptoms(prev => {
                    const next = new Map(prev);
                    next.delete(id);
                    return next;
                  });
                }}
              >
                {symptom.name} ✕
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleAnalyze} disabled={loading || selectedSymptoms.size === 0} className="bg-primary text-primary-foreground">
          {loading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Analisi in corso...
            </>
          ) : (
            <>
              <Sparkles size={16} className="mr-2" />
              Identifica Pattern
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={loading}>
          <RotateCcw size={14} className="mr-1.5" />
          Reset
        </Button>
      </div>

      {/* Results */}
      {resultMarkdown && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h3 className="font-display text-sm font-bold text-foreground">Pattern di Disarmonia Identificato</h3>
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
          <RetroFeedback toolName="mtc_organica" />
        </div>
      )}
    </div>
  );
}
