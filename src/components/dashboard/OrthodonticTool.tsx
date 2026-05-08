import { useState, useEffect } from "react";
import { Brain, AlertTriangle, Loader2, RotateCcw, Download, FileDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getBranding, generateHtmlHeader } from "./BrandingSettings";
import RetroFeedback from "./RetroFeedback";

const MONTHLY_LIMIT = 30;
const TOOL_NAME = "orthodontic-diagnosis";

const DISCLAIMER = `⚠️ Disclaimer: Questo strumento fornisce esclusivamente un supporto all'analisi cefalometrica e alla scelta del dispositivo ortodontico. NON costituisce in alcun modo una diagnosi medica. La responsabilità diagnostica e terapeutica resta interamente in capo al professionista sanitario.`;

const mdToHtml = (markdown: string) => {
  let html = markdown
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split("|").filter(c => c.trim());
      if (cells.every(c => /^[\s-]+$/.test(c))) return "<!--table-sep-->";
      const isHeader = cells.some(c => c.includes("**"));
      const tag = isHeader ? "th" : "td";
      const cellsHtml = cells.map(c =>
        `<${tag} style="padding:8px 12px;border:1px solid #ddd;text-align:left;">${c.replace(/\*\*/g, "").trim()}</${tag}>`
      ).join("");
      return `<tr>${cellsHtml}</tr>`;
    })
    .replace(/((<tr>.*<\/tr>\n?)+)/g, '<table style="width:100%;border-collapse:collapse;margin:16px 0;">$1</table>')
    .replace(/<!--table-sep-->\n?/g, "")
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;color:#2a6f6f;margin:28px 0 12px;font-family:Georgia,serif;border-bottom:1px solid #eee;padding-bottom:8px;">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;color:#2a6f6f;margin:24px 0 10px;font-family:Georgia,serif;">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;color:#333;margin:20px 0 8px;">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0;">$1</li>')
    .replace(/((<li[^>]*>.*<\/li>\n?)+)/g, '<ul style="margin:8px 0 8px 20px;padding:0;">$1</ul>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #2a6f6f;padding:8px 16px;margin:12px 0;background:#f0f7f7;color:#333;">$1</blockquote>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">')
    .replace(/^(?!<[hublot]|<\/)(.+)$/gm, '<p style="margin:8px 0;line-height:1.6;">$1</p>');
  return html;
};

const generateHtmlDocument = (markdown: string) => {
  const branding = getBranding();
  const header = generateHtmlHeader(branding);
  const body = mdToHtml(markdown);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #222; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
    table { page-break-inside: avoid; } h1 { page-break-after: avoid; }
    @media print { body { padding: 20px; } }
  </style></head><body>${header}${body}</body></html>`;
};

const downloadAsWord = (markdown: string, filename: string) => {
  const html = generateHtmlDocument(markdown);
  const blob = new Blob(
    [`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset="utf-8"><title>Consulenza Ortodontica</title>
    <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
    </head><body>${html.match(/<body>([\s\S]*)<\/body>/)?.[1] || ""}</body></html>`],
    { type: "application/msword" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.doc`;
  a.click();
  URL.revokeObjectURL(url);
};

const downloadAsPdf = (markdown: string) => {
  const html = generateHtmlDocument(markdown);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast({ title: "Errore", description: "Abilita i popup per scaricare il PDF.", variant: "destructive" });
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => { setTimeout(() => printWindow.print(), 500); };
};

interface FormData {
  nome: string;
  cognome: string;
  age: string;
  sex: "M" | "F";
  angolo_sellare: string;
  anb: string;
  wits: string;
  angolo_articolare: string;
  angolo_goniaco: string;
  rapporto_ns_gome: string;
  classe_dentale: string;
}

const initialForm: FormData = {
  nome: "", cognome: "", age: "", sex: "F", angolo_sellare: "", anb: "", wits: "",
  angolo_articolare: "", angolo_goniaco: "", rapporto_ns_gome: "", classe_dentale: "",
};

const OrthodonticTool = () => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [result, setResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [monthlyUsage, setMonthlyUsage] = useState<number | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.rpc("get_monthly_ai_usage", {
        _user_id: user.id,
        _tool_name: TOOL_NAME,
      });
      setMonthlyUsage(data ?? 0);
    };
    fetchUsage();
  }, [result]);

  const updateField = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return form.nome && form.cognome && form.age && form.angolo_sellare && form.anb && form.wits && form.angolo_articolare && form.angolo_goniaco;
  };

  const handleAnalyze = async () => {
    if (!isFormValid()) return;
    if (monthlyUsage !== null && monthlyUsage >= MONTHLY_LIMIT) {
      toast({ title: "Limite mensile raggiunto", description: `Hai raggiunto il limite di ${MONTHLY_LIMIT} analisi per questo mese.`, variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    setResult("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Errore", description: "Sessione scaduta. Effettua nuovamente il login.", variant: "destructive" });
      setIsAnalyzing(false);
      return;
    }

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orthodontic-diagnosis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            nome: form.nome,
            cognome: form.cognome,
            age: parseFloat(form.age),
            sex: form.sex,
            angolo_sellare: parseFloat(form.angolo_sellare),
            anb: parseFloat(form.anb),
            wits: parseFloat(form.wits),
            angolo_articolare: parseFloat(form.angolo_articolare),
            angolo_goniaco: parseFloat(form.angolo_goniaco),
            rapporto_ns_gome: form.rapporto_ns_gome ? parseFloat(form.rapporto_ns_gome) : null,
            classe_dentale: form.classe_dentale || null,
          }),
        }
      );

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Errore sconosciuto" }));
        toast({ title: "Errore analisi", description: err.error, variant: "destructive" });
        setIsAnalyzing(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

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
            if (content) assistantText += content;
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
      setResult(assistantText);
    } catch (e) {
      console.error(e);
      toast({ title: "Errore", description: "Si è verificato un errore durante l'analisi.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setResult("");
  };

  if (!accepted) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="font-body text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{DISCLAIMER}</p>
        </div>
        <Button onClick={() => setAccepted(true)} className="w-full font-body">
          Ho letto e accetto — Procedi
        </Button>
      </div>
    );
  }

  const inputFields: { key: keyof FormData; label: string; norma: string; required?: boolean; unit?: string }[] = [
    { key: "angolo_sellare", label: "Angolo Sellare (N-S-Ar)", norma: "123° ± 5", required: true, unit: "°" },
    { key: "anb", label: "ANB", norma: "2° ± 2", required: true, unit: "°" },
    { key: "wits", label: "Wits", norma: "0 ± 2 mm (F) / -1 ± 2 mm (M)", required: true, unit: "mm" },
    { key: "angolo_articolare", label: "Angolo Articolare (S-Ar-Go)", norma: "143° ± 5", required: true, unit: "°" },
    { key: "angolo_goniaco", label: "Angolo Goniaco (Ar-Go-Me)", norma: "130° ± 7", required: true, unit: "°" },
    { key: "rapporto_ns_gome", label: "Rapporto NS/GoMe", norma: "< 1.0 (≥1 = alert III classe)", unit: "" },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-5">
      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="font-body text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          Solo supporto clinico — l'interpretazione è responsabilità del professionista.
        </p>
      </div>

      {monthlyUsage !== null && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <span className="font-body text-xs text-muted-foreground">Analisi utilizzate questo mese</span>
          <span className={`font-body text-sm font-semibold ${monthlyUsage >= MONTHLY_LIMIT ? "text-destructive" : "text-petrolio"}`}>
            {monthlyUsage}/{MONTHLY_LIMIT}
          </span>
        </div>
      )}

      {!result && !isAnalyzing && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Nome *</Label>
              <Input type="text" placeholder="es. Mario" value={form.nome} onChange={(e) => updateField("nome", e.target.value)} className="font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Cognome *</Label>
              <Input type="text" placeholder="es. Rossi" value={form.cognome} onChange={(e) => updateField("cognome", e.target.value)} className="font-body" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Età del paziente *</Label>
              <Input type="number" placeholder="es. 9" value={form.age} onChange={(e) => updateField("age", e.target.value)} className="font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Sesso *</Label>
              <div className="flex gap-2">
                {(["F", "M"] as const).map(s => (
                  <button key={s} onClick={() => updateField("sex", s)} className={`flex-1 py-2 rounded-md font-body text-sm border transition-colors ${form.sex === s ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}>
                    {s === "F" ? "Femmina" : "Maschio"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              <Info size={14} className="text-petrolio" />
              Valori Cefalometrici
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inputFields.map(({ key, label, norma, required, unit }) => (
                <div key={key} className="space-y-1">
                  <Label className="font-body text-xs text-foreground">
                    {label} {required && <span className="text-destructive">*</span>}
                  </Label>
                  <div className="relative">
                    <Input type="number" step="0.1" placeholder={norma} value={form[key]} onChange={(e) => updateField(key, e.target.value)} className="font-body pr-10" />
                    {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-body">{unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert III classe */}
          {form.rapporto_ns_gome && parseFloat(form.age) > 0 && parseFloat(form.age) < 11 && (
            <div className={`flex items-start gap-2 p-3 rounded-md border ${
              parseFloat(form.rapporto_ns_gome) >= 1
                ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800"
                : parseFloat(form.rapporto_ns_gome) >= 0.95
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                  : "hidden"
            }`}>
              <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${parseFloat(form.rapporto_ns_gome) >= 1 ? "text-red-600" : "text-amber-600"}`} />
              <p className={`font-body text-xs leading-relaxed ${parseFloat(form.rapporto_ns_gome) >= 1 ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200"}`}>
                {parseFloat(form.rapporto_ns_gome) >= 1
                  ? "🔴 ALERT ROSSO: Rapporto NS/GoMe ≥ 1 in paziente < 11 anni — rischio III classe evolutiva. Intercettare subito!"
                  : "🟠 ALERT ARANCIO: Rapporto NS/GoMe tra 0.95 e 1.0 in paziente < 11 anni — monitorare attentamente."}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="font-body text-xs text-foreground">Classe dentale/funzionale (opzionale)</Label>
            <div className="flex gap-2">
              {["II classe", "III classe", ""].map(val => (
                <button key={val || "none"} onClick={() => updateField("classe_dentale", val)} className={`px-4 py-2 rounded-md font-body text-xs border transition-colors ${form.classe_dentale === val ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}>
                  {val || "Non specificato"}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleAnalyze} disabled={!isFormValid()} className="w-full font-body gap-2">
            <Brain size={16} />
            Analizza e Suggerisci Dispositivo
          </Button>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <Loader2 size={32} className="animate-spin text-petrolio" />
          <p className="font-body text-sm text-muted-foreground">Analisi cefalometrica in corso...</p>
          <p className="font-body text-xs text-muted-foreground">Potrebbe richiedere fino a 30 secondi</p>
        </div>
      )}

      {result && !isAnalyzing && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <Brain size={18} className="text-petrolio" />
            <div>
              <h4 className="font-display text-base font-semibold text-foreground">Diagnosi pronta</h4>
              <p className="font-body text-xs text-muted-foreground">Scarica il report nel formato desiderato.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" onClick={() => downloadAsWord(result, `Cefalometria_${form.cognome}_${form.nome}`)} className="font-body gap-2">
              <FileDown size={14} />
              Scarica Word
            </Button>
            <Button variant="outline" onClick={() => downloadAsPdf(result)} className="font-body gap-2">
              <Download size={14} />
              Stampa / Salva PDF
            </Button>
            <Button variant="ghost" onClick={handleReset} className="font-body gap-2">
              <RotateCcw size={14} />
              Nuova analisi
            </Button>
          </div>
          <RetroFeedback toolName="orthodontic-diagnosis" />
        </div>
      )}
    </div>
  );
};

export default OrthodonticTool;
