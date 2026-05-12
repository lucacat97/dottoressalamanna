import { useState, useEffect, useRef } from "react";
import {
  Upload, Brain, AlertTriangle, FileText, Loader2, RotateCcw,
  Download, FileDown, Info, Ruler, ClipboardList, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractPdfTextWithFallback } from "@/lib/pdf-extract";
import { getBranding, generateHtmlHeader } from "./BrandingSettings";
import RetroFeedback from "./RetroFeedback";

const MONTHLY_LIMIT = 30;
const DIAGNOSIS_TOOL = "diagnosis-support";
const ORTHO_TOOL = "orthodontic-diagnosis";

const DISCLAIMER = `⚠️ Disclaimer: Questo strumento fornisce esclusivamente un supporto all'analisi clinica e cefalometrica e NON costituisce in alcun modo una diagnosi medica. La responsabilità diagnostica e terapeutica resta interamente in capo al professionista sanitario.`;

// ---------- Markdown -> HTML (shared) ----------
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
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:4px solid #f0b400;padding:12px 16px;margin:14px 0;background:#fff8e1;color:#5b4708;border-radius:6px;">$1</blockquote>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">')
    .replace(/^(?!<[hublot]|<\/)(.+)$/gm, '<p style="margin:8px 0;line-height:1.6;">$1</p>');
  return html;
};

const generateHtmlDocument = (markdown: string, title: string) => {
  const branding = getBranding();
  const header = generateHtmlHeader(branding);
  const body = mdToHtml(markdown);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #222; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
    table { page-break-inside: avoid; } h1 { page-break-after: avoid; }
    @media print { body { padding: 20px; } }
  </style></head><body>${header}${body}</body></html>`;
};

const downloadAsWord = (markdown: string, filename: string, title: string) => {
  const html = generateHtmlDocument(markdown, title);
  const blob = new Blob(
    [`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset="utf-8"><title>${title}</title>
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

const downloadAsPdf = (markdown: string, title: string) => {
  const html = generateHtmlDocument(markdown, title);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast({ title: "Errore", description: "Abilita i popup per scaricare il PDF.", variant: "destructive" });
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => { setTimeout(() => printWindow.print(), 500); };
};

// ---------- PDF text extraction (with OCR fallback) ----------
const extractTextFromPDF = (pdfFile: File): Promise<string> => extractPdfTextWithFallback(pdfFile);

// ---------- Cephalometric parsing ----------
interface CefValues {
  nome?: string;
  cognome?: string;
  age?: string;
  sex?: "M" | "F";
  angolo_sellare?: string;
  anb?: string;
  wits?: string;
  angolo_articolare?: string;
  angolo_goniaco?: string;
  rapporto_ns_gome?: string;
}

const parseNumber = (s: string | undefined): string => {
  if (!s) return "";
  return s.replace(",", ".").replace(/[^\d.\-]/g, "");
};

const extractCefValues = (text: string): CefValues => {
  const v: CefValues = {};
  const norm = text.replace(/\s+/g, " ");

  // Anagrafica: "Paziente: COGNOME NOME"
  const pazMatch = norm.match(/Paziente:\s*([A-ZÀ-Ÿ'’\-]+)\s+([A-ZÀ-Ÿ'’\-]+(?:\s+[A-ZÀ-Ÿ'’\-]+)*)/);
  if (pazMatch) {
    v.cognome = pazMatch[1].trim();
    // Take only first token of given names to avoid grabbing "MASCHIO" etc.
    v.nome = pazMatch[2].split(/\s+/)[0].trim();
  }
  // Sesso
  const sexMatch = norm.match(/SESSO:\s*(Maschio|Femmina|M|F)/i) || norm.match(/Sesso:\s*(Maschio|Femmina|M|F)/i);
  if (sexMatch) {
    const s = sexMatch[1].toUpperCase();
    v.sex = s.startsWith("M") ? "M" : "F";
  }
  // Età: "Età: 8a 2m" oppure "Età: 9"
  const ageMatch = norm.match(/Et[àa]:\s*(\d+)\s*a/i) || norm.match(/Et[àa]:\s*(\d+)/i);
  if (ageMatch) v.age = ageMatch[1];

  // Helper to grab numeric value after a label, before °/mm
  const grab = (labelRegex: RegExp): string | undefined => {
    const m = norm.match(labelRegex);
    return m ? parseNumber(m[1]) : undefined;
  };

  v.angolo_sellare = grab(/Angolo Sellare\s+([\d.,\-]+)/i);
  v.angolo_articolare = grab(/Angolo Articolare\s+([\d.,\-]+)/i);
  v.angolo_goniaco = grab(/Angolo Goniaco\s+([\d.,\-]+)/i);
  v.wits = grab(/Wits\s+([\d.,\-]+)/i);
  v.anb = grab(/\bANB\s+([\d.,\-]+)/i);

  // Rapp. SN/GoMe in % -> divide by 100
  const nsgomeMatch = norm.match(/Rapp\.?\s*SN\s*\/\s*GoMe\s+([\d.,\-]+)\s*%?/i);
  if (nsgomeMatch) {
    const raw = parseFloat(nsgomeMatch[1].replace(",", "."));
    if (!isNaN(raw)) {
      v.rapporto_ns_gome = (raw > 5 ? raw / 100 : raw).toFixed(2);
    }
  }

  // Clean undefined
  (Object.keys(v) as (keyof CefValues)[]).forEach(k => { if (!v[k]) delete v[k]; });
  return v;
};

// ---------- Component ----------
interface OrthoForm {
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

const initialOrtho: OrthoForm = {
  nome: "", cognome: "", age: "", sex: "F",
  angolo_sellare: "", anb: "", wits: "",
  angolo_articolare: "", angolo_goniaco: "", rapporto_ns_gome: "", classe_dentale: "",
};

type ClinicalMode = "pdf" | "manual";
type CefMode = "pdf" | "manual";

const MilaMethodTool = () => {
  const [accepted, setAccepted] = useState(false);

  // Clinical (cartella) state
  const [clinicalMode, setClinicalMode] = useState<ClinicalMode>("pdf");
  const [clinicalFile, setClinicalFile] = useState<File | null>(null);
  const [clinicalText, setClinicalText] = useState("");
  const [clinicalManual, setClinicalManual] = useState("");
  const clinicalInputRef = useRef<HTMLInputElement>(null);

  // Cephalometric state
  const [cefMode, setCefMode] = useState<CefMode>("pdf");
  const [cefFile, setCefFile] = useState<File | null>(null);
  const [orthoForm, setOrthoForm] = useState<OrthoForm>(initialOrtho);
  const cefInputRef = useRef<HTMLInputElement>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState("");
  const [orthoResult, setOrthoResult] = useState("");

  // Usage
  const [diagUsage, setDiagUsage] = useState<number | null>(null);
  const [orthoUsage, setOrthoUsage] = useState<number | null>(null);

  // ---------- Check Up import ----------
  const [importedCheckup, setImportedCheckup] = useState<{ patient: string; examDate: string } | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("mila:imported-checkup");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data?.qaMarkdown) return;
      setClinicalMode("manual");
      setClinicalManual((prev) => {
        const header = `=== CHECK UP ORTODONTICO POSTURALE ===\n`;
        // Avoid double-import
        if (prev.includes(header)) return prev;
        return `${header}${data.qaMarkdown}\n\n${prev}`.trim();
      });
      if (data.patientFirstName || data.patientLastName) {
        setOrthoForm((p) => ({
          ...p,
          nome: p.nome || data.patientFirstName || "",
          cognome: p.cognome || data.patientLastName || "",
          sex: p.sex || (data.patientSex === "M" ? "M" : data.patientSex === "F" ? "F" : p.sex),
        }));
      }
      setImportedCheckup({
        patient: `${data.patientFirstName ?? ""} ${data.patientLastName ?? ""}`.trim() || "Paziente",
        examDate: data.examDate ?? "",
      });
      sessionStorage.removeItem("mila:imported-checkup");
      toast({ title: "Check Up importato", description: "I dati sono stati caricati come cartella clinica manuale." });
    } catch {/* noop */}
  }, []);

  useEffect(() => {
    const fetchUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [d, o] = await Promise.all([
        supabase.rpc("get_monthly_ai_usage", { _user_id: user.id, _tool_name: DIAGNOSIS_TOOL }),
        supabase.rpc("get_monthly_ai_usage", { _user_id: user.id, _tool_name: ORTHO_TOOL }),
      ]);
      setDiagUsage(d.data ?? 0);
      setOrthoUsage(o.data ?? 0);
    };
    fetchUsage();
  }, [diagnosisResult, orthoResult]);

  // ---------- Clinical handlers ----------
  const handleClinicalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      toast({ title: "Formato non supportato", description: "Carica un file PDF.", variant: "destructive" });
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast({ title: "File troppo grande", description: "Massimo 10MB.", variant: "destructive" });
      return;
    }
    setClinicalFile(selected);
    try {
      const text = await extractTextFromPDF(selected);
      if (text.trim().length < 20) {
        toast({ title: "Testo insufficiente", description: "Il PDF non contiene abbastanza testo leggibile.", variant: "destructive" });
        setClinicalFile(null);
        return;
      }
      setClinicalText(text);
      toast({ title: "Cartella caricata", description: `Estratti ${text.length} caratteri.` });
    } catch (err: any) {
      console.error("PDF extraction failed:", err);
      toast({ title: "Errore lettura PDF", description: err?.message ?? "Impossibile leggere il contenuto, neanche con OCR.", variant: "destructive" });
      setClinicalFile(null);
    }
  };

  const resetClinical = () => {
    setClinicalFile(null);
    setClinicalText("");
    setClinicalManual("");
    if (clinicalInputRef.current) clinicalInputRef.current.value = "";
  };

  // ---------- Cef handlers ----------
  const handleCefFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      toast({ title: "Formato non supportato", description: "Carica un file PDF.", variant: "destructive" });
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast({ title: "File troppo grande", description: "Massimo 10MB.", variant: "destructive" });
      return;
    }
    setCefFile(selected);
    try {
      const text = await extractTextFromPDF(selected);
      const parsed = extractCefValues(text);
      const merged: OrthoForm = {
        ...orthoForm,
        ...parsed,
        sex: (parsed.sex ?? orthoForm.sex) as "M" | "F",
      } as OrthoForm;
      setOrthoForm(merged);
      const found = Object.keys(parsed).length;
      if (found === 0) {
        toast({ title: "Estrazione parziale", description: "Nessun valore riconosciuto. Inseriscili manualmente.", variant: "destructive" });
      } else {
        toast({ title: "Cefalometria caricata", description: `Estratti ${found} campi. Verificali prima di generare.` });
      }
    } catch (err: any) {
      console.error("PDF extraction failed:", err);
      toast({ title: "Errore lettura PDF", description: err?.message ?? "Impossibile leggere il contenuto, neanche con OCR.", variant: "destructive" });
      setCefFile(null);
    }
  };

  const resetCef = () => {
    setCefFile(null);
    setOrthoForm(initialOrtho);
    if (cefInputRef.current) cefInputRef.current.value = "";
  };

  const updateOrthoField = (field: keyof OrthoForm, value: string) => {
    setOrthoForm(prev => ({ ...prev, [field]: value }));
  };

  // ---------- Validity ----------
  const clinicalReady = clinicalMode === "pdf"
    ? clinicalText.trim().length >= 20
    : clinicalManual.trim().length >= 20;

  const orthoReady = orthoForm.nome && orthoForm.cognome && orthoForm.age &&
    orthoForm.angolo_sellare && orthoForm.anb && orthoForm.wits &&
    orthoForm.angolo_articolare && orthoForm.angolo_goniaco;

  const canGenerate = clinicalReady || orthoReady;

  // ---------- Generation ----------
  const callDiagnosis = async (token: string, documentText: string) => {
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnosis-support`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentText: documentText.slice(0, 15000) }),
      }
    );
    if (!resp.ok || !resp.body) {
      const err = await resp.json().catch(() => ({ error: "Errore sconosciuto" }));
      throw new Error(err.error || "Errore consulenza clinica");
    }
    return await readSseStream(resp.body);
  };

  const callOrtho = async (token: string, f: OrthoForm) => {
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orthodontic-diagnosis`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nome: f.nome,
          cognome: f.cognome,
          age: parseFloat(f.age),
          sex: f.sex,
          angolo_sellare: parseFloat(f.angolo_sellare),
          anb: parseFloat(f.anb),
          wits: parseFloat(f.wits),
          angolo_articolare: parseFloat(f.angolo_articolare),
          angolo_goniaco: parseFloat(f.angolo_goniaco),
          rapporto_ns_gome: f.rapporto_ns_gome ? parseFloat(f.rapporto_ns_gome) : null,
          classe_dentale: f.classe_dentale || null,
        }),
      }
    );
    if (!resp.ok || !resp.body) {
      const err = await resp.json().catch(() => ({ error: "Errore sconosciuto" }));
      throw new Error(err.error || "Errore consulenza ortodontica");
    }
    return await readSseStream(resp.body);
  };

  const readSseStream = async (body: ReadableStream<Uint8Array>): Promise<string> => {
    const reader = body.getReader();
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
    return assistantText;
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;

    // Limit checks (only for sections actually being run)
    if (clinicalReady && diagUsage !== null && diagUsage >= MONTHLY_LIMIT) {
      toast({ title: "Limite mensile consulenza clinica", description: `Hai raggiunto ${MONTHLY_LIMIT} analisi.`, variant: "destructive" });
      return;
    }
    if (orthoReady && orthoUsage !== null && orthoUsage >= MONTHLY_LIMIT) {
      toast({ title: "Limite mensile cefalometria", description: `Hai raggiunto ${MONTHLY_LIMIT} analisi.`, variant: "destructive" });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Errore", description: "Sessione scaduta. Effettua nuovamente il login.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setDiagnosisResult("");
    setOrthoResult("");

    const tasks: Promise<unknown>[] = [];
    if (clinicalReady) {
      const txt = clinicalMode === "pdf" ? clinicalText : clinicalManual;
      tasks.push(
        callDiagnosis(session.access_token, txt)
          .then(r => setDiagnosisResult(r))
          .catch(e => toast({ title: "Errore consulenza clinica", description: String(e.message || e), variant: "destructive" }))
      );
    }
    if (orthoReady) {
      tasks.push(
        callOrtho(session.access_token, orthoForm)
          .then(r => setOrthoResult(r))
          .catch(e => toast({ title: "Errore cefalometria", description: String(e.message || e), variant: "destructive" }))
      );
    }

    await Promise.all(tasks);
    setIsGenerating(false);
  };

  const handleResetAll = () => {
    resetClinical();
    resetCef();
    setDiagnosisResult("");
    setOrthoResult("");
  };

  // ---------- Disclaimer screen ----------
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

  const orthoFields: { key: keyof OrthoForm; label: string; norma: string; required?: boolean; unit?: string }[] = [
    { key: "angolo_sellare", label: "Angolo Sellare (N-S-Ar)", norma: "123° ± 5", required: true, unit: "°" },
    { key: "anb", label: "ANB", norma: "2° ± 2", required: true, unit: "°" },
    { key: "wits", label: "Wits", norma: "0 ± 2 mm (F) / -1 ± 2 mm (M)", required: true, unit: "mm" },
    { key: "angolo_articolare", label: "Angolo Articolare (S-Ar-Go)", norma: "143° ± 5", required: true, unit: "°" },
    { key: "angolo_goniaco", label: "Angolo Goniaco (Ar-Go-Me)", norma: "130° ± 7", required: true, unit: "°" },
    { key: "rapporto_ns_gome", label: "Rapporto NS/GoMe", norma: "< 1.0 (≥1 = alert III classe)", unit: "" },
  ];

  return (
    <div className="space-y-6">
      {/* Top alert */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="font-body text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          Compila almeno una delle due sezioni. Puoi caricare un PDF o inserire i dati manualmente. Verranno generati consulenze separati.
        </p>
      </div>

      {/* Usage badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {diagUsage !== null && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="font-body text-xs text-muted-foreground">Diagnosi clinica — questo mese</span>
            <span className={`font-body text-sm font-semibold ${diagUsage >= MONTHLY_LIMIT ? "text-destructive" : "text-petrolio"}`}>
              {diagUsage}/{MONTHLY_LIMIT}
            </span>
          </div>
        )}
        {orthoUsage !== null && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="font-body text-xs text-muted-foreground">Cefalometria — questo mese</span>
            <span className={`font-body text-sm font-semibold ${orthoUsage >= MONTHLY_LIMIT ? "text-destructive" : "text-petrolio"}`}>
              {orthoUsage}/{MONTHLY_LIMIT}
            </span>
          </div>
        )}
      </div>

      {/* Two input sections side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ===== CLINICAL CARD ===== */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-petrolio" />
            <h3 className="font-display text-base font-semibold text-foreground">Cartella clinica / posturale</h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setClinicalMode("pdf")}
              className={`flex-1 py-2 rounded-md font-body text-xs border transition-colors ${
                clinicalMode === "pdf" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Carica PDF
            </button>
            <button
              onClick={() => setClinicalMode("manual")}
              className={`flex-1 py-2 rounded-md font-body text-xs border transition-colors ${
                clinicalMode === "manual" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Inserisci a mano
            </button>
          </div>

          {clinicalMode === "pdf" ? (
            <>
              <input ref={clinicalInputRef} type="file" accept=".pdf" onChange={handleClinicalFile} className="hidden" id="clinical-pdf" />
              {!clinicalFile ? (
                <label htmlFor="clinical-pdf" className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <Upload size={24} className="text-muted-foreground" />
                  <p className="font-body text-xs font-medium text-foreground">Carica cartella clinica</p>
                  <p className="font-body text-[11px] text-muted-foreground">PDF fino a 10MB</p>
                </label>
              ) : (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="text-petrolio shrink-0" />
                    <span className="font-body text-xs text-foreground truncate">{clinicalFile.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetClinical}>
                    <RotateCcw size={12} />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Textarea
              placeholder="Incolla qui le note cliniche, anamnesi, esame posturale, test eseguiti, ATM, occlusione..."
              value={clinicalManual}
              onChange={(e) => setClinicalManual(e.target.value)}
              className="font-body text-base min-h-[200px]"
            />
          )}
        </div>

        {/* ===== CEPHALOMETRIC CARD ===== */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Ruler size={18} className="text-petrolio" />
            <h3 className="font-display text-base font-semibold text-foreground">Cefalometria</h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCefMode("pdf")}
              className={`flex-1 py-2 rounded-md font-body text-xs border transition-colors ${
                cefMode === "pdf" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Carica PDF
            </button>
            <button
              onClick={() => setCefMode("manual")}
              className={`flex-1 py-2 rounded-md font-body text-xs border transition-colors ${
                cefMode === "manual" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Inserisci a mano
            </button>
          </div>

          {cefMode === "pdf" && (
            <>
              <input ref={cefInputRef} type="file" accept=".pdf" onChange={handleCefFile} className="hidden" id="cef-pdf" />
              {!cefFile ? (
                <label htmlFor="cef-pdf" className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <Upload size={24} className="text-muted-foreground" />
                  <p className="font-body text-xs font-medium text-foreground">Carica tracciato cefalometrico</p>
                  <p className="font-body text-[11px] text-muted-foreground">PDF con tabella misure</p>
                </label>
              ) : (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="text-petrolio shrink-0" />
                    <span className="font-body text-xs text-foreground truncate">{cefFile.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetCef}>
                    <RotateCcw size={12} />
                  </Button>
                </div>
              )}
              {cefFile && (
                <p className="font-body text-[11px] text-muted-foreground italic">
                  Valori estratti automaticamente — controllali e correggili sotto se necessario.
                </p>
              )}
            </>
          )}

          {/* Form (visible always when in manual mode, or after PDF upload to allow review) */}
          {(cefMode === "manual" || cefFile) && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-body text-xs">Nome *</Label>
                  <Input type="text" placeholder="Mario" value={orthoForm.nome} onChange={(e) => updateOrthoField("nome", e.target.value)} className="font-body" />
                </div>
                <div className="space-y-1">
                  <Label className="font-body text-xs">Cognome *</Label>
                  <Input type="text" placeholder="Rossi" value={orthoForm.cognome} onChange={(e) => updateOrthoField("cognome", e.target.value)} className="font-body" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-body text-xs">Età *</Label>
                  <Input type="number" placeholder="9" value={orthoForm.age} onChange={(e) => updateOrthoField("age", e.target.value)} className="font-body" />
                </div>
                <div className="space-y-1">
                  <Label className="font-body text-xs">Sesso *</Label>
                  <div className="flex gap-1.5">
                    {(["F", "M"] as const).map(s => (
                      <button key={s} onClick={() => updateOrthoField("sex", s)} className={`flex-1 py-1.5 rounded-md font-body text-xs border transition-colors ${orthoForm.sex === s ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}>
                        {s === "F" ? "F" : "M"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-display text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Info size={12} className="text-petrolio" />
                  Valori Cefalometrici
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {orthoFields.map(({ key, label, norma, required, unit }) => (
                    <div key={key} className="space-y-1">
                      <Label className="font-body text-[11px] text-foreground">
                        {label} {required && <span className="text-destructive">*</span>}
                      </Label>
                      <div className="relative">
                        <Input type="number" step="0.1" placeholder={norma} value={orthoForm[key as keyof OrthoForm] as string} onChange={(e) => updateOrthoField(key, e.target.value)} className="font-body pr-10" />
                        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-body">{unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {orthoForm.rapporto_ns_gome && parseFloat(orthoForm.age) > 0 && parseFloat(orthoForm.age) < 11 && (
                <div className={`flex items-start gap-2 p-3 rounded-md border ${
                  parseFloat(orthoForm.rapporto_ns_gome) >= 1
                    ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800"
                    : parseFloat(orthoForm.rapporto_ns_gome) >= 0.95
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                      : "hidden"
                }`}>
                  <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${parseFloat(orthoForm.rapporto_ns_gome) >= 1 ? "text-red-600" : "text-amber-600"}`} />
                  <p className={`font-body text-xs leading-relaxed ${parseFloat(orthoForm.rapporto_ns_gome) >= 1 ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200"}`}>
                    {parseFloat(orthoForm.rapporto_ns_gome) >= 1
                      ? "🔴 ALERT ROSSO: Rapporto NS/GoMe ≥ 1 in paziente < 11 anni — rischio III classe evolutiva. Intercettare subito!"
                      : "🟠 ALERT ARANCIO: Rapporto NS/GoMe tra 0.95 e 1.0 in paziente < 11 anni — monitorare attentamente."}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <Label className="font-body text-[11px] text-foreground">Classe dentale (opzionale)</Label>
                <div className="flex gap-1.5">
                  {["II classe", "III classe", ""].map(val => (
                    <button key={val || "none"} onClick={() => updateOrthoField("classe_dentale", val)} className={`px-3 py-1.5 rounded-md font-body text-[11px] border transition-colors ${orthoForm.classe_dentale === val ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}>
                      {val || "Non spec."}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {!isGenerating && !diagnosisResult && !orthoResult && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleGenerate} disabled={!canGenerate} className="flex-1 font-body gap-2">
            <Sparkles size={16} />
            Genera Consulenze — Metodo MILA
          </Button>
          {(clinicalFile || clinicalManual || cefFile || orthoForm.nome) && (
            <Button variant="ghost" onClick={handleResetAll} className="font-body gap-2">
              <RotateCcw size={14} />
              Azzera tutto
            </Button>
          )}
        </div>
      )}

      {!canGenerate && !isGenerating && (
        <p className="font-body text-xs text-muted-foreground text-center">
          Compila almeno una delle due sezioni per generare i consulenze.
        </p>
      )}

      {/* Generating state */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 bg-card border border-border rounded-lg">
          <Loader2 size={32} className="animate-spin text-petrolio" />
          <p className="font-body text-sm text-muted-foreground">Generazione consulenze in corso...</p>
          <p className="font-body text-xs text-muted-foreground">Potrebbe richiedere fino a 30 secondi</p>
        </div>
      )}

      {/* Results */}
      {!isGenerating && (diagnosisResult || orthoResult) && (
        <div className="space-y-5">
          {diagnosisResult && (
            <div className="bg-card border border-border rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-petrolio" />
                <div>
                  <h4 className="font-display text-base font-semibold text-foreground">Consulenza Clinico-Posturale pronto</h4>
                  <p className="font-body text-xs text-muted-foreground">Scarica nel formato desiderato.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="default" onClick={() => downloadAsWord(diagnosisResult, `Consulenza_Clinico_${clinicalFile?.name?.replace(/\.pdf$/i, "") || "paziente"}`, "Consulenza Clinica")} className="font-body gap-2">
                  <FileDown size={14} />
                  Word (editabile)
                </Button>
                <Button variant="outline" onClick={() => downloadAsPdf(diagnosisResult, "Consulenza Clinica")} className="font-body gap-2">
                  <Download size={14} />
                  Stampa / PDF
                </Button>
              </div>
              <RetroFeedback toolName={DIAGNOSIS_TOOL} />
            </div>
          )}

          {orthoResult && (
            <div className="bg-card border border-border rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Ruler size={18} className="text-petrolio" />
                <div>
                  <h4 className="font-display text-base font-semibold text-foreground">Consulenza Cefalometrica pronta</h4>
                  <p className="font-body text-xs text-muted-foreground">Scarica nel formato desiderato.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="default" onClick={() => downloadAsWord(orthoResult, `Cefalometria_${orthoForm.cognome}_${orthoForm.nome}`, "Consulenza Cefalometrica")} className="font-body gap-2">
                  <FileDown size={14} />
                  Word (editabile)
                </Button>
                <Button variant="outline" onClick={() => downloadAsPdf(orthoResult, "Consulenza Cefalometrica")} className="font-body gap-2">
                  <Download size={14} />
                  Stampa / PDF
                </Button>
              </div>
              <RetroFeedback toolName={ORTHO_TOOL} />
            </div>
          )}

          <Button variant="ghost" onClick={handleResetAll} className="w-full font-body gap-2">
            <RotateCcw size={14} />
            Nuova analisi
          </Button>
        </div>
      )}
    </div>
  );
};

export default MilaMethodTool;
