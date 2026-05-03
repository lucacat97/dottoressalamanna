import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, Save, Trash2, FileText, Loader2 } from "lucide-react";
import { CHECKUP_SECTIONS } from "./checkupSchema";
import QuestionRenderer from "./QuestionRenderer";

interface CheckupRow {
  id: string;
  patient_first_name: string;
  patient_last_name: string;
  exam_date: string;
  data: any;
  updated_at: string;
}

type View = "list" | "edit";

export default function CheckupTool() {
  const [view, setView] = useState<View>("list");
  const [items, setItems] = useState<CheckupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CheckupRow | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: rows } = await supabase
      .from("posturographic_checkups")
      .select("id, patient_first_name, patient_last_name, exam_date, data, updated_at")
      .order("exam_date", { ascending: false });
    setItems((rows || []) as CheckupRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEditing(null);
    setFirst(""); setLast(""); setDate(new Date().toISOString().slice(0, 10)); setData({});
    setView("edit");
  };
  const startEdit = (r: CheckupRow) => {
    setEditing(r);
    setFirst(r.patient_first_name); setLast(r.patient_last_name); setDate(r.exam_date); setData(r.data || {});
    setView("edit");
  };

  const save = async () => {
    if (!first.trim() || !last.trim() || !date) {
      toast({ title: "Dati mancanti", description: "Nome, cognome e data sono obbligatori.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const payload = { patient_first_name: first.trim(), patient_last_name: last.trim(), exam_date: date, data };
    const { error } = editing
      ? await supabase.from("posturographic_checkups").update(payload).eq("id", editing.id)
      : await supabase.from("posturographic_checkups").insert({ ...payload, user_id: user.id });
    setSaving(false);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Questionario salvato" });
    await load();
    setView("list");
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questo questionario?")) return;
    await supabase.from("posturographic_checkups").delete().eq("id", id);
    await load();
  };

  if (view === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}><ArrowLeft size={14} className="mr-1" />Lista questionari</Button>
          <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
            Salva questionario
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">Nome paziente *</label>
            <Input value={first} onChange={(e) => setFirst(e.target.value)} />
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">Cognome paziente *</label>
            <Input value={last} onChange={(e) => setLast(e.target.value)} />
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">Data esecuzione *</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
                      <QuestionRenderer q={q} value={data[q.key]} onChange={(v) => setData({ ...data, [q.key]: v })} />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
            Salva questionario
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Questionari salvati</h3>
          <p className="font-body text-sm text-muted-foreground">{items.length} questionario/i</p>
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
                <th className="text-right px-4 py-3 font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{r.patient_last_name.toUpperCase()} {r.patient_first_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.exam_date).toLocaleDateString("it-IT")}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(r)}>Apri</Button>
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
