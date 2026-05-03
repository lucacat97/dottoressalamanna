import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Paperclip, X, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export default function RequestConsultationDialog({ open, onOpenChange }: Props) {
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setNotes(""); setFiles([]); };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    const next: File[] = [...files];
    for (const f of picked) {
      if (f.size > MAX_SIZE) { toast({ title: `${f.name} troppo grande`, description: "Max 10MB per file.", variant: "destructive" }); continue; }
      if (next.length >= MAX_FILES) { toast({ title: "Troppi file", description: `Massimo ${MAX_FILES} allegati.`, variant: "destructive" }); break; }
      next.push(f);
    }
    setFiles(next);
    e.target.value = "";
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessione scaduta");
      const userId = session.user.id;

      const uploaded: { path: string; name: string; size: number }[] = [];
      for (const f of files) {
        const safeName = f.name.replace(/[^\w.\-]/g, "_");
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
        const { error } = await supabase.storage.from("consultation-attachments").upload(path, f, { upsert: false });
        if (error) throw new Error(`Upload fallito: ${error.message}`);
        uploaded.push({ path, name: f.name, size: f.size });
      }

      const { data, error } = await supabase.functions.invoke("request-consultation", {
        body: { notes, attachments: uploaded },
      });
      if (error || !data?.success) throw new Error(error?.message || "Invio non riuscito");

      toast({ title: "Richiesta inviata", description: "La Dott.ssa Lamanna ti contatterà al più presto." });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Errore", description: e.message || "Riprova più tardi.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Richiedi una consulenza diretta</DialogTitle>
          <DialogDescription className="font-body">
            Invia una richiesta riservata alla Dott.ssa Lamanna. Puoi allegare cartelle, cefalometrie o foto del caso.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">Note (opzionali)</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 4000))} rows={5} placeholder="Descrivi il caso, le domande che vuoi porre, eventuali tentativi terapeutici..." />
            <p className="text-[11px] text-muted-foreground mt-1">{notes.length}/4000</p>
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">Allegati ({files.length}/{MAX_FILES})</label>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-input bg-background cursor-pointer hover:bg-muted transition-colors text-sm font-body">
              <Paperclip size={14} /> Aggiungi file
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.dcm" onChange={onPick} className="hidden" disabled={files.length >= MAX_FILES} />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between bg-muted/40 rounded px-3 py-1.5 text-xs font-body">
                    <span className="truncate">{f.name} <span className="text-muted-foreground">({(f.size / 1024 / 1024).toFixed(2)}MB)</span></span>
                    <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Annulla</Button>
          <Button onClick={submit} disabled={submitting} className="bg-gradient-to-r from-petrolio to-petrolio-light text-primary-foreground">
            {submitting ? <><Loader2 size={14} className="animate-spin mr-1.5" />Invio...</> : <><Send size={14} className="mr-1.5" />Conferma e invia</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
