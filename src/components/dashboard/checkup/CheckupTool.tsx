import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, FileText, Search, Save, Printer, Trash2, ArrowLeft,
  CheckCircle2, Clock, Send, Loader2, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SECTIONS, MODULE_NAME } from "./form-schema";
import QuestionRenderer from "./QuestionRenderer";
import {
  buildQAMarkdown, printQA, downloadQAJson, MILA_IMPORT_KEY,
  type CheckupRecord,
} from "./exportUtils";

interface Props {
  /** When provided, switches to MILA dashboard tab after sending. */
  onSendToMila?: () => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyRecord = (userId: string): CheckupRecord & { user_id: string } => ({
  id: "",
  user_id: userId,
  patient_first_name: "",
  patient_last_name: "",
  patient_birth_date: null,
  patient_sex: null,
  exam_date: todayISO(),
  status: "draft",
  form_data: {},
  notes_data: {},
  current_section: SECTIONS[0].id,
  updated_at: new Date().toISOString(),
});

export default function CheckupTool({ onSendToMila }: Props) {
  const [view, setView] = useState<"list" | "editor">("list");
  const [list, setList] = useState<CheckupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [record, setRecord] = useState<(CheckupRecord & { user_id: string }) | null>(null);
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);
  const [search, setSearch] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savingNow, setSavingNow] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  // ---------- load list ----------
  const loadList = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);
    const { data, error } = await supabase
      .from("checkup_questionnaires")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      toast({ title: "Errore caricamento", description: error.message, variant: "destructive" });
    } else {
      setList((data || []) as CheckupRecord[]);
    }
    setLoading(false);
  };

  useEffect(() => { loadList(); }, []);

  // ---------- autosave ----------
  const scheduleSave = (next: CheckupRecord & { user_id: string }) => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => doSave(next, true), 2000);
  };

  const doSave = async (rec: CheckupRecord & { user_id: string }, silent = false) => {
    if (!rec) return;
    setSavingNow(true);
    const payload = {
      user_id: rec.user_id,
      patient_first_name: rec.patient_first_name,
      patient_last_name: rec.patient_last_name,
      patient_birth_date: rec.patient_birth_date,
      patient_sex: rec.patient_sex,
      exam_date: rec.exam_date,
      status: rec.status,
      form_data: rec.form_data,
      notes_data: rec.notes_data,
      current_section: rec.current_section,
    };
    let resultId = rec.id;
    if (!rec.id) {
      const { data, error } = await supabase
        .from("checkup_questionnaires")
        .insert(payload)
        .select()
        .single();
      if (error) {
        if (!silent) toast({ title: "Salvataggio fallito", description: error.message, variant: "destructive" });
        setSavingNow(false);
        return;
      }
      resultId = data.id;
      setRecord((prev) => prev ? { ...prev, id: data.id } : prev);
    } else {
      const { error } = await supabase
        .from("checkup_questionnaires")
        .update(payload)
        .eq("id", rec.id);
      if (error) {
        if (!silent) toast({ title: "Salvataggio fallito", description: error.message, variant: "destructive" });
        setSavingNow(false);
        return;
      }
    }
    setSavedAt(new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));
    setSavingNow(false);
    if (!silent) toast({ title: "Salvato" });
    return resultId;
  };

  // ---------- mutators ----------
  const updateField = (patch: Partial<CheckupRecord>) => {
    setRecord((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      scheduleSave(next);
      return next;
    });
  };

  const updateAnswer = (qid: string, v: any) => {
    setRecord((prev) => {
      if (!prev) return prev;
      const next = { ...prev, form_data: { ...prev.form_data, [qid]: v } };
      scheduleSave(next);
      return next;
    });
  };

  const updateNote = (qid: string, n: string) => {
    setRecord((prev) => {
      if (!prev) return prev;
      const next = { ...prev, notes_data: { ...prev.notes_data, [qid]: n } };
      scheduleSave(next);
      return next;
    });
  };

  // ---------- list actions ----------
  const startNew = async () => {
    if (!userId) return;
    const rec = emptyRecord(userId);
    setRecord(rec);
    setActiveSection(SECTIONS[0].id);
    setSavedAt(null);
    setView("editor");
  };

  const openExisting = (r: CheckupRecord) => {
    setRecord({ ...r, user_id: userId });
    setActiveSection(r.current_section || SECTIONS[0].id);
    setSavedAt(null);
    setView("editor");
  };

  const deleteRecord = async (id: string) => {
    if (!confirm("Eliminare questo Check Up?")) return;
    const { error } = await supabase.from("checkup_questionnaires").delete().eq("id", id);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else { toast({ title: "Eliminato" }); loadList(); }
  };

  const completeAndSave = async () => {
    if (!record) return;
    const next = { ...record, status: "completed" as const };
    setRecord(next);
    await doSave(next);
    toast({ title: "Check Up completato" });
  };

  const sendToMila = async () => {
    if (!record) return;
    // ensure persisted first
    const idAfter = await doSave(record, true) ?? record.id;
    const md = buildQAMarkdown(record);
    const payload = {
      checkupId: idAfter,
      patientFirstName: record.patient_first_name,
      patientLastName: record.patient_last_name,
      patientBirthDate: record.patient_birth_date,
      patientSex: record.patient_sex,
      examDate: record.exam_date,
      qaMarkdown: md,
      timestamp: Date.now(),
    };
    try {
      sessionStorage.setItem(MILA_IMPORT_KEY, JSON.stringify(payload));
      toast({ title: "Inviato al Metodo MILA", description: "Apertura del tool MILA in corso..." });
      onSendToMila?.();
    } catch (e: any) {
      toast({ title: "Errore", description: e?.message ?? String(e), variant: "destructive" });
    }
  };

  // ---------- editor: search + section filter ----------
  const filteredSections = useMemo(() => {
    if (!search.trim()) return SECTIONS;
    const s = search.toLowerCase();
    return SECTIONS
      .map((sec) => ({
        ...sec,
        questions: sec.questions.filter((q) => q.label.toLowerCase().includes(s)),
      }))
      .filter((sec) => sec.questions.length > 0);
  }, [search]);

  const currentSection = filteredSections.find((s) => s.id === activeSection) ?? filteredSections[0];

  // ===================== LIST VIEW =====================
  if (view === "list") {
    const drafts = list.filter((r) => r.status === "draft");
    const completed = list.filter((r) => r.status === "completed");

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-body text-sm text-muted-foreground">{MODULE_NAME}</p>
            <p className="font-body text-xs text-muted-foreground/70">
              Compila il check up clinico-posturale, lo salviamo in automatico, lo esporti in PDF o lo invii direttamente al Metodo MILA.
            </p>
          </div>
          <Button onClick={startNew}>
            <Plus size={16} /> Nuovo Check Up
          </Button>
        </div>

        {loading ? (
          <p className="font-body text-sm text-muted-foreground">Caricamento...</p>
        ) : (
          <>
            <Section title="Bozze" icon={<Clock size={14} className="text-amber-600" />} count={drafts.length}>
              {drafts.length === 0 ? (
                <EmptyState text="Nessuna bozza in corso." />
              ) : (
                drafts.map((r) => (
                  <RecordRow key={r.id} record={r} onOpen={openExisting} onDelete={deleteRecord} />
                ))
              )}
            </Section>

            <Section title="Completati" icon={<CheckCircle2 size={14} className="text-emerald-600" />} count={completed.length}>
              {completed.length === 0 ? (
                <EmptyState text="Nessun check up completato." />
              ) : (
                completed.map((r) => (
                  <RecordRow key={r.id} record={r} onOpen={openExisting} onDelete={deleteRecord} />
                ))
              )}
            </Section>
          </>
        )}
      </div>
    );
  }

  // ===================== EDITOR VIEW =====================
  if (!record) return null;

  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap border border-border rounded-lg p-3 bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setRecord(null); setView("list"); loadList(); }}>
            <ArrowLeft size={16} /> Lista
          </Button>
          <Badge variant={record.status === "completed" ? "default" : "secondary"} className="text-[10px]">
            {record.status === "completed" ? "Completato" : "Bozza"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {savingNow && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Salvataggio...</span>}
          {!savingNow && savedAt && <span className="text-xs text-muted-foreground">Salvato alle {savedAt}</span>}
          <Button variant="outline" size="sm" onClick={() => doSave(record)}>
            <Save size={14} /> Salva
          </Button>
          <Button variant="outline" size="sm" onClick={() => printQA(record)}>
            <Printer size={14} /> Stampa / PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadQAJson(record)}>
            <Download size={14} /> JSON
          </Button>
          <Button size="sm" onClick={sendToMila}>
            <Send size={14} /> Invia al Metodo MILA
          </Button>
          {record.status !== "completed" && (
            <Button variant="default" size="sm" onClick={completeAndSave}>
              <CheckCircle2 size={14} /> Completa
            </Button>
          )}
        </div>
      </div>

      {/* Patient demographics */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Anagrafica Paziente</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input
              value={record.patient_first_name}
              onChange={(e) => updateField({ patient_first_name: e.target.value })}
              className="text-base md:text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Cognome</Label>
            <Input
              value={record.patient_last_name}
              onChange={(e) => updateField({ patient_last_name: e.target.value })}
              className="text-base md:text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Data nascita</Label>
            <Input
              type="date"
              value={record.patient_birth_date ?? ""}
              onChange={(e) => updateField({ patient_birth_date: e.target.value || null })}
              className="text-base md:text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Sesso</Label>
            <Select
              value={record.patient_sex ?? ""}
              onValueChange={(v) => updateField({ patient_sex: v || null })}
            >
              <SelectTrigger className="text-base md:text-sm"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="F">F</SelectItem>
                <SelectItem value="Altro">Altro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Data esame</Label>
            <Input
              type="date"
              value={record.exam_date}
              onChange={(e) => updateField({ exam_date: e.target.value })}
              className="text-base md:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cerca tra le domande..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-base md:text-sm"
        />
      </div>

      {/* Layout: sidebar + content */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Sidebar */}
        <aside className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="max-h-[75vh] overflow-y-auto py-1">
            {filteredSections.map((sec, i) => {
              const totalQ = sec.questions.length;
              const answered = sec.questions.filter((q) => {
                const v = record.form_data[q.id];
                return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
              }).length;
              const isActive = sec.id === currentSection?.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(sec.id);
                    updateField({ current_section: sec.id });
                  }}
                  className={`w-full text-left px-3 py-2 text-xs border-l-2 transition-colors ${
                    isActive
                      ? "bg-primary/10 border-l-primary font-semibold text-foreground"
                      : `border-l-transparent hover:bg-muted/50 ${i % 2 === 0 ? "bg-[#EAF2F8]/40" : ""}`
                  }`}
                >
                  <div className="leading-tight">{sec.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {answered}/{totalQ}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main panel */}
        <main className="border border-border rounded-lg bg-card p-4 min-h-[60vh]">
          {currentSection ? (
            <>
              <h3 className="font-display text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">
                {currentSection.label}
              </h3>
              <div className="space-y-1">
                {currentSection.questions.map((q) => (
                  <QuestionRenderer
                    key={q.id}
                    question={q}
                    value={record.form_data[q.id]}
                    note={record.notes_data[q.id] ?? ""}
                    onValueChange={(v) => updateAnswer(q.id, v)}
                    onNoteChange={(n) => updateNote(q.id, n)}
                  />
                ))}
              </div>

              {/* Section nav */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                {(() => {
                  const idx = filteredSections.findIndex((s) => s.id === currentSection.id);
                  const prev = filteredSections[idx - 1];
                  const next = filteredSections[idx + 1];
                  return (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!prev}
                        onClick={() => prev && (setActiveSection(prev.id), updateField({ current_section: prev.id }))}
                      >
                        ← {prev ? prev.label : ""}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!next}
                        onClick={() => next && (setActiveSection(next.id), updateField({ current_section: next.id }))}
                      >
                        {next ? next.label : ""} →
                      </Button>
                    </>
                  );
                })()}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nessuna sezione corrisponde alla ricerca.</p>
          )}
        </main>
      </div>
    </div>
  );
}

// ---------- subcomponents ----------

const Section = ({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">{title}</h3>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="border border-dashed border-border rounded-lg p-4 text-center">
    <p className="text-xs text-muted-foreground">{text}</p>
  </div>
);

const RecordRow = ({
  record, onOpen, onDelete,
}: { record: CheckupRecord; onOpen: (r: CheckupRecord) => void; onDelete: (id: string) => void }) => {
  const fullName = `${record.patient_first_name} ${record.patient_last_name}`.trim() || "Senza nome";
  const updated = new Date(record.updated_at).toLocaleString("it-IT", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return (
    <div className="flex items-center justify-between gap-3 border border-border rounded-lg p-3 bg-card hover:border-primary/40 transition-colors">
      <button onClick={() => onOpen(record)} className="flex items-center gap-3 flex-1 text-left min-w-0">
        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <FileText size={16} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
          <p className="text-[11px] text-muted-foreground">
            Esame: {record.exam_date} • Ultima modifica: {updated}
          </p>
        </div>
      </button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(record.id)} className="text-destructive">
        <Trash2 size={14} />
      </Button>
    </div>
  );
};
