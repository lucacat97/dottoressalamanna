import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, FileText, Upload, Loader2, BookOpen, Power, PowerOff, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { extractPdfTextWithFallback } from "@/lib/pdf-extract";

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  scope: string;
  source_type: string;
  file_name: string | null;
  is_active: boolean;
  created_at: string;
}

const SCOPE_OPTIONS = [
  { value: "global", label: "Globale (tutti gli strumenti)" },
  { value: "diagnosis", label: "Supporto Consulenza Clinica" },
  { value: "orthodontic", label: "Consulenza Ortodontica" },
  { value: "mtc", label: "MTC" },
];

const SCOPE_LABELS: Record<string, string> = {
  global: "Globale",
  diagnosis: "Diagnosi",
  orthodontic: "Ortodontica",
  mtc: "MTC",
};

const AdminKnowledge = () => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    content: "",
    scope: "global",
    source_type: "text",
    file_name: "",
  });

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_knowledge")
      .select("*")
      .order("scope", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      setEntries((data as KnowledgeEntry[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const extractTextFromPDF = async (pdfFile: File): Promise<string> => {
    return await extractPdfTextWithFallback(pdfFile);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      let extracted = "";
      let sourceType = "text";
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        extracted = await extractTextFromPDF(file);
        sourceType = "pdf";
      } else if (file.type.startsWith("text/") || /\.(txt|md|markdown)$/i.test(file.name)) {
        extracted = await file.text();
        sourceType = file.name.toLowerCase().endsWith(".md") ? "markdown" : "text";
      } else {
        toast({ title: "Formato non supportato", description: "Carica PDF, TXT o MD.", variant: "destructive" });
        setParsing(false);
        return;
      }
      if (extracted.length < 10) {
        toast({ title: "Testo vuoto", description: "Impossibile estrarre contenuto dal file.", variant: "destructive" });
        setParsing(false);
        return;
      }
      setForm((f) => ({
        ...f,
        content: extracted,
        source_type: sourceType,
        file_name: file.name,
        title: f.title || file.name.replace(/\.[^.]+$/, ""),
      }));
      toast({ title: "File parsificato", description: `Estratti ${extracted.length} caratteri.` });
    } catch (err: any) {
      toast({ title: "Errore parsing", description: err.message, variant: "destructive" });
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setCreating(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("ai_knowledge").insert({
      title: form.title.trim(),
      content: form.content.trim(),
      scope: form.scope,
      source_type: form.source_type,
      file_name: form.file_name || null,
      created_by: userData.user?.id,
    });
    setCreating(false);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Istruzione aggiunta", description: "L'IA la userà dalla prossima generazione." });
      setForm({ title: "", content: "", scope: "global", source_type: "text", file_name: "" });
      fetchEntries();
    }
  };

  const toggleActive = async (entry: KnowledgeEntry) => {
    const { error } = await supabase
      .from("ai_knowledge")
      .update({ is_active: !entry.is_active })
      .eq("id", entry.id);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Eliminare definitivamente questa istruzione?")) return;
    const { error } = await supabase.from("ai_knowledge").delete().eq("id", id);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Eliminata" });
      fetchEntries();
    }
  };

  // ── Correzione da Esempio ──
  const [correction, setCorrection] = useState({
    scope: "diagnosis",
    example: "",
    problem: "",
    expected: "",
  });
  const [savingCorrection, setSavingCorrection] = useState(false);

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correction.example.trim() || !correction.problem.trim()) return;
    setSavingCorrection(true);
    const { data: userData } = await supabase.auth.getUser();
    const scopeLabel = SCOPE_LABELS[correction.scope] || correction.scope;
    const title = `Correzione da esempio — ${scopeLabel} — ${new Date().toLocaleDateString("it-IT")}`;
    const content = `REGOLA CORRETTIVA (derivata da un output di esempio giudicato non conforme).
Applica questa regola a TUTTE le consulenze future dello stesso strumento.

--- OUTPUT DI ESEMPIO NON CONFORME ---
${correction.example.trim()}
--- FINE ESEMPIO ---

PROBLEMA / COSA NON VA:
${correction.problem.trim()}
${correction.expected.trim() ? `\nCOMPORTAMENTO ATTESO:\n${correction.expected.trim()}` : ""}

ISTRUZIONE OPERATIVA: nelle prossime generazioni evita gli errori sopra descritti e adegua stile, struttura e contenuto di conseguenza.`;
    const { error } = await supabase.from("ai_knowledge").insert({
      title,
      content,
      scope: correction.scope,
      source_type: "correction",
      file_name: null,
      created_by: userData.user?.id,
    });
    setSavingCorrection(false);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Correzione salvata", description: "L'IA la applicherà dalla prossima generazione." });
      setCorrection({ scope: correction.scope, example: "", problem: "", expected: "" });
      fetchEntries();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-gold" />
          <h3 className="font-display text-lg font-semibold text-foreground">Nuova Istruzione / Materiale</h3>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Titolo *</label>
              <input
                required
                type="text"
                maxLength={200}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-md border border-input bg-background font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Es. Linee guida posturali aggiornate 2026"
              />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Strumento destinatario</label>
              <select
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}
                className="w-full px-4 py-2.5 rounded-md border border-input bg-background font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {SCOPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
              Carica materiale (opzionale — PDF, TXT, MD)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
              onChange={handleFileSelected}
              className="hidden"
              id="knowledge-upload"
            />
            <label
              htmlFor="knowledge-upload"
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              {parsing ? (
                <><Loader2 size={16} className="animate-spin" /><span className="font-body text-sm text-muted-foreground">Estrazione testo in corso...</span></>
              ) : (
                <><Upload size={16} className="text-muted-foreground" /><span className="font-body text-sm text-muted-foreground">{form.file_name || "Clicca per caricare un file"}</span></>
              )}
            </label>
          </div>

          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
              Contenuto da iniettare nel prompt *
            </label>
            <textarea
              required
              rows={10}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="Scrivi qui istruzioni aggiuntive, regole, esempi clinici, oppure carica un file qui sopra per popolare automaticamente questo campo..."
            />
            <p className="font-body text-xs text-muted-foreground mt-1">
              {form.content.length.toLocaleString()} caratteri
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={creating || !form.title.trim() || !form.content.trim()} className="bg-primary text-primary-foreground font-body">
              {creating ? <><Loader2 size={14} className="mr-2 animate-spin" />Salvataggio...</> : <><Plus size={14} className="mr-2" />Aggiungi</>}
            </Button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-3">Istruzioni attive</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 size={14} className="animate-spin" />Caricamento...</div>
        ) : entries.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground italic">Nessuna istruzione. Aggiungine una qui sopra.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`bg-card border border-border rounded-lg p-4 ${!entry.is_active ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-display text-sm font-semibold text-foreground truncate">{entry.title}</h4>
                      <span className="font-body text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold font-semibold">
                        {SCOPE_LABELS[entry.scope] || entry.scope}
                      </span>
                      {entry.file_name && (
                        <span className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                          <FileText size={11} />{entry.file_name}
                        </span>
                      )}
                      {!entry.is_active && (
                        <span className="font-body text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Disattivata</span>
                      )}
                    </div>
                    <p className="font-body text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(entry)}
                      title={entry.is_active ? "Disattiva" : "Attiva"}
                    >
                      {entry.is_active ? <Power size={14} className="text-petrolio" /> : <PowerOff size={14} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteEntry(entry.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminKnowledge;
