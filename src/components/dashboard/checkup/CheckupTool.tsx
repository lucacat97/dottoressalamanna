import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, Save, Trash2, FileText, Loader2, FileDown, ShieldCheck, Cloud, CloudOff } from "lucide-react";
import { CHECKUP_SECTIONS } from "./checkupSchema";
import QuestionRenderer from "./QuestionRenderer";
import { generateCheckupPdf } from "./generateCheckupPdf";

interface CheckupRow {
  id: string;
  patient_first_name: string;
  patient_last_name: string;
  exam_date: string;
  data: any;
  updated_at: string;
}

type View = "list" | "edit";
type SaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 1500;

export default function CheckupTool() {
  const [view, setView] = useState<View>("list");
  const [items, setItems] = useState<CheckupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [autoStatus, setAutoStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const editingIdRef = useRef<string | null>(null);
  useEffect(() => { editingIdRef.current = editingId; }, [editingId]);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: rows } = await supabase
      .from("posturographic_checkups")
      .select("id, patient_first_name, patient_last_name, exam_date, data, updated_at")
      .order("updated_at", { ascending: false });
    setItems((rows || []) as CheckupRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEditingId(null);
    setFirst(""); setLast(""); setDate(new Date().toISOString().slice(0, 10)); setData({});
    setAutoStatus("idle"); setLastSavedAt(null); dirtyRef.current = false;
    setView("edit");
  };
  const startEdit = (r: CheckupRow) => {
    setEditingId(r.id);
    setFirst(r.patient_first_name); setLast(r.patient_last_name); setDate(r.exam_date); setData(r.data || {});
    setAutoStatus("saved"); setLastSavedAt(new Date(r.updated_at)); dirtyRef.current = false;
    setView("edit");
  };

  const persist = async (silent: boolean): Promise<string | null> => {
    if (!first.trim() || !last.trim() || !date) {
      if (!silent) toast({ title: "Dati mancanti", description: "Nome, cognome e data sono obbligatori per salvare.", variant: "destructive" });
      return null;
    }
    if (silent) setAutoStatus("saving"); else setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); setAutoStatus("error"); return null; }
    const payload = { patient_first_name: first.trim(), patient_last_name: last.trim(), exam_date: date, data };
    const currentId = editingIdRef.current;
    let resultId = currentId;
    let error: any = null;
    if (currentId) {
      const r = await supabase.from("posturographic_checkups").update(payload).eq("id", currentId);
      error = r.error;
    } else {
      const r = await supabase.from("posturographic_checkups").insert({ ...payload, user_id: user.id }).select("id").single();
      error = r.error;
      if (r.data?.id) { resultId = r.data.id; setEditingId(r.data.id); editingIdRef.current = r.data.id; }
    }
    if (silent) setAutoStatus(error ? "error" : "saved"); else setSaving(false);
    if (!error) { setLastSavedAt(new Date()); dirtyRef.current = false; }
    if (error && !silent) toast({ title: "Errore", description: error.message, variant: "destructive" });
    return error ? null : resultId;
  };

  // Autosave debounced
  useEffect(() => {
    if (view !== "edit") return;
    if (!dirtyRef.current) return;
    if (!first.trim() || !last.trim()) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => { persist(true); }, AUTOSAVE_MS);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, first, last, date, view]);

  // Flush on unmount / view change
  useEffect(() => {
    return () => {
      if (dirtyRef.current && first.trim() && last.trim()) {
        persist(true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markDirty = () => { dirtyRef.current = true; setAutoStatus("idle"); };

  const updateField = (key: string, v: any) => { setData((d) => ({ ...d, [key]: v })); markDirty(); };
  const updateNote = (sectionId: string, v: string) => {
    setData((d) => ({ ...d, _notes: { ...(d._notes || {}), [sectionId]: v } }));
    markDirty();
  };
  const setConsent = (v: boolean) => {
    setData((d) => ({ ...d, _gdpr_consent: v, _gdpr_consent_date: v ? new Date().toISOString() : undefined }));
    markDirty();
  };

  const saveAndExit = async () => {
    const id = await persist(false);
    if (id) { toast({ title: "Questionario salvato" }); await load(); setView("list"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare definitivamente questo questionario? L'azione non è reversibile.")) return;
    await supabase.from("posturographic_checkups").delete().eq("id", id);
    await load();
  };

  const exportPdf = (row?: CheckupRow) => {
    const payload = row
      ? { first: row.patient_first_name, last: row.patient_last_name, date: row.exam_date, data: row.data || {} }
      : { first, last, date, data };
    if (!payload.first || !payload.last) {
      toast({ title: "Dati mancanti", description: "Servono nome e cognome del paziente per generare il referto.", variant: "destructive" });
      return;
    }
    generateCheckupPdf(payload);
  };

  const StatusBadge = () => {
    if (autoStatus === "saving") return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Loader2 size={12} className="animate-spin" />Salvataggio…</span>;
    if (autoStatus === "saved" && lastSavedAt) return <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Cloud size={12} />Salvato {lastSavedAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span>;
    if (autoStatus === "error") return <span className="inline-flex items-center gap-1 text-xs text-destructive"><CloudOff size={12} />Errore di salvataggio</span>;
    return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Cloud size={12} />Bozza</span>;
  };

  if (view === "edit") {
    const consent = !!data._gdpr_consent;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" size="sm" onClick={async () => { if (dirtyRef.current) await persist(true); setView("list"); load(); }}>
            <ArrowLeft size={14} className="mr-1" />Lista questionari
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge />
            <Button variant="outline" size="sm" onClick={() => exportPdf()} disabled={!consent}>
              <FileDown size={14} className="mr-1" />Genera referto PDF
            </Button>
            <Button onClick={saveAndExit} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
              Salva e chiudi
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-start gap-2">
            <ShieldCheck size={18} className="mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm font-body">
              <p className="font-semibold">Trattamento dei dati (GDPR — Reg. UE 2016/679)</p>
              <p>I dati del paziente sono memorizzati in modo cifrato sul cloud sanitario e visibili esclusivamente al professionista che li ha inseriti. Non vengono condivisi con terzi né utilizzati per addestrare modelli di IA. Il paziente può richiederne in qualsiasi momento la cancellazione.</p>
              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <Checkbox checked={consent} onCheckedChange={(c) => setConsent(!!c)} />
                <span>Confermo di aver acquisito il <strong>consenso informato del paziente</strong> (o del genitore/tutore) al trattamento dei dati per finalità sanitarie.</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">Nome paziente *</label>
            <Input value={first} onChange={(e) => { setFirst(e.target.value); markDirty(); }} />
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">Cognome paziente *</label>
            <Input value={last} onChange={(e) => { setLast(e.target.value); markDirty(); }} />
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">Data di nascita</label>
            <Input type="date" value={data._birth_date || ""} onChange={(e) => updateField("_birth_date", e.target.value || undefined)} />
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">Data esecuzione *</label>
            <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); markDirty(); }} />
          </div>
        </div>

        <Accordion type="multiple" className="space-y-2">
          {CHECKUP_SECTIONS.map((s) => (
            <AccordionItem key={s.id} value={s.id} className="border border-border rounded-lg bg-card px-4">
              <AccordionTrigger className="font-display text-base font-semibold">{s.title}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {s.questions.map((q) => (
                    <div key={q.key}>
                      <label className="font-body text-sm font-medium text-foreground block mb-1.5">{q.label}</label>
                      <QuestionRenderer q={q} value={data[q.key]} onChange={(v) => updateField(q.key, v)} />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border/60">
                    <label className="font-body text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">Note libere — {s.title}</label>
                    <Textarea
                      rows={2}
                      placeholder="Annotazioni aggiuntive su questa sezione…"
                      value={(data._notes && data._notes[s.id]) || ""}
                      onChange={(e) => updateNote(s.id, e.target.value)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex justify-end pt-2 gap-2">
          <Button variant="outline" onClick={() => exportPdf()} disabled={!consent}>
            <FileDown size={14} className="mr-1" />Genera referto PDF
          </Button>
          <Button onClick={saveAndExit} disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
            Salva e chiudi
          </Button>
        </div>
        {!consent && (
          <p className="text-xs text-muted-foreground text-right">Il referto PDF è disponibile dopo aver confermato il consenso del paziente.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Questionari salvati</h3>
          <p className="font-body text-sm text-muted-foreground">{items.length} questionario/i — autosalvataggio attivo durante la compilazione</p>
        </div>
        <Button onClick={startNew} className="bg-primary text-primary-foreground"><Plus size={14} className="mr-1" />Nuovo questionario</Button>
      </div>

      {loading ? (
        <p className="font-body text-sm text-muted-foreground">Caricamento...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
          <FileText size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nessun questionario salvato. Crea il primo!</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Paziente</th>
                <th className="text-left px-4 py-3 font-semibold">Data esame</th>
                <th className="text-left px-4 py-3 font-semibold">Aggiornato</th>
                <th className="text-right px-4 py-3 font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{r.patient_last_name.toUpperCase()} {r.patient_first_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.exam_date).toLocaleDateString("it-IT")}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.updated_at).toLocaleString("it-IT")}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(r)}>Apri</Button>
                    <Button variant="ghost" size="sm" onClick={() => exportPdf(r)} disabled={!r.data?._gdpr_consent} title={r.data?._gdpr_consent ? "Genera referto PDF" : "Consenso paziente non confermato"}>
                      <FileDown size={13} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(r.id)} className="text-destructive hover:bg-destructive/10"><Trash2 size={13} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
