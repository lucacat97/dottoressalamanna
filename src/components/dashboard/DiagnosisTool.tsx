import { useState, useRef, useEffect } from "react";
import { Upload, Brain, AlertTriangle, FileText, Loader2, RotateCcw, Download, FileDown, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getBranding, generateHtmlHeader } from "./BrandingSettings";

const MONTHLY_LIMIT = 30;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const DISCLAIMER = `⚠️ Disclaimer: Questo strumento fornisce esclusivamente un supporto all'analisi clinica e NON costituisce in alcun modo una diagnosi medica. La responsabilità diagnostica resta interamente in capo al professionista sanitario. L'utilizzo di questo strumento non sostituisce il giudizio clinico del medico.`;

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
    <head><meta charset="utf-8"><title>Referto Clinico</title>
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

const DiagnosisTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [result, setResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [monthlyUsage, setMonthlyUsage] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.rpc("get_monthly_ai_usage", {
        _user_id: user.id,
        _tool_name: "diagnosis-support",
      });
      setMonthlyUsage(data ?? 0);
    };
    fetchUsage();
  }, [result]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      toast({ title: "Formato non supportato", description: "Carica un file PDF.", variant: "destructive" });
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast({ title: "File troppo grande", description: "Il file deve essere inferiore a 10MB.", variant: "destructive" });
      return;
    }
    setFile(selected);
    setResult("");
    try {
      const text = await extractTextFromPDF(selected);
      if (text.trim().length < 20) {
        toast({ title: "Testo insufficiente", description: "Il PDF non contiene abbastanza testo leggibile.", variant: "destructive" });
        setFile(null);
        return;
      }
      setExtractedText(text);
    } catch {
      toast({ title: "Errore lettura PDF", description: "Impossibile leggere il contenuto del PDF.", variant: "destructive" });
      setFile(null);
    }
  };

  const extractTextFromPDF = async (pdfFile: File): Promise<string> => {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }
    return fullText;
  };

  const handleAnalyze = async () => {
    if (!extractedText) return;
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnosis-support`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ documentText: extractedText.slice(0, 15000) }),
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
    setFile(null);
    setExtractedText("");
    setResult("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getFilenameBase = () => {
    const name = file?.name?.replace(/\.pdf$/i, "") || "referto";
    return `Referto_${name}`;
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

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-5">
      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="font-body text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          Solo supporto clinico — la diagnosi è responsabilità del professionista.
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
        <div>
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="pdf-upload" />
          {!file ? (
            <label htmlFor="pdf-upload" className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
              <Upload size={32} className="text-muted-foreground" />
              <div className="text-center">
                <p className="font-body text-sm font-medium text-foreground">Carica documento clinico</p>
                <p className="font-body text-xs text-muted-foreground mt-1">PDF fino a 10MB — referti, test, anamnesi</p>
              </div>
            </label>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-petrolio" />
                <span className="font-body text-sm text-foreground">{file.name}</span>
                <span className="font-body text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw size={14} />
              </Button>
            </div>
          )}
        </div>
      )}

      {file && !result && !isAnalyzing && (
        <Button onClick={handleAnalyze} className="w-full font-body gap-2">
          <Brain size={16} />
          Genera Referto Clinico
        </Button>
      )}

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <Loader2 size={32} className="animate-spin text-petrolio" />
          <p className="font-body text-sm text-muted-foreground">Generazione referto in corso...</p>
          <p className="font-body text-xs text-muted-foreground">Potrebbe richiedere fino a 30 secondi</p>
        </div>
      )}

      {result && !isAnalyzing && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <Brain size={18} className="text-petrolio" />
            <div>
              <h4 className="font-display text-base font-semibold text-foreground">Referto pronto</h4>
              <p className="font-body text-xs text-muted-foreground">Scarica il referto nel formato desiderato.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" onClick={() => downloadAsWord(result, getFilenameBase())} className="font-body gap-2">
              <FileDown size={14} />
              Scarica Word (editabile)
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
        </div>
      )}
    </div>
  );
};

export default DiagnosisTool;
