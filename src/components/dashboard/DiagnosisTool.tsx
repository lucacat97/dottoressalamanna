import { useState, useRef } from "react";
import { Upload, Brain, AlertTriangle, FileText, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const DISCLAIMER = `⚠️ Disclaimer: Questo strumento fornisce esclusivamente un supporto all'analisi clinica e NON costituisce in alcun modo una diagnosi medica. La responsabilità diagnostica resta interamente in capo al professionista sanitario. L'utilizzo di questo strumento non sostituisce il giudizio clinico del medico.`;

const DiagnosisTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [result, setResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        toast({ title: "Testo insufficiente", description: "Il PDF non contiene abbastanza testo leggibile. Prova con un altro file.", variant: "destructive" });
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
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
    setIsAnalyzing(true);
    setResult("");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnosis-support`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
            if (content) {
              assistantText += content;
              setResult(assistantText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
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
      {/* Disclaimer banner */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="font-body text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          Solo supporto clinico — la diagnosi è responsabilità del professionista.
        </p>
      </div>

      {/* Upload area */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload"
        />
        {!file ? (
          <label
            htmlFor="pdf-upload"
            className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
          >
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
              <span className="font-body text-xs text-muted-foreground">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw size={14} />
            </Button>
          </div>
        )}
      </div>

      {/* Analyze button */}
      {file && !result && (
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full font-body gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analisi in corso...
            </>
          ) : (
            <>
              <Brain size={16} />
              Analizza documento
            </>
          )}
        </Button>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          <h4 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
            <Brain size={16} className="text-petrolio" />
            Risultato Analisi
          </h4>
          <div className="prose prose-sm max-w-none dark:prose-invert font-body border border-border rounded-lg p-5 bg-muted/20">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
          <Button variant="outline" onClick={handleReset} className="font-body gap-2">
            <RotateCcw size={14} />
            Nuova analisi
          </Button>
        </div>
      )}
    </div>
  );
};

export default DiagnosisTool;
