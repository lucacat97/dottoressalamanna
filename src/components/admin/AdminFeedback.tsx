import { useState, useEffect } from "react";
import { MessageSquareText, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackEntry {
  id: string;
  tool_name: string;
  feedback: string;
  submitted_by_email: string | null;
  is_active: boolean;
  created_at: string;
}

const TOOL_LABELS: Record<string, string> = {
  "diagnosis-support": "Consulenza Clinica",
  "orthodontic-diagnosis": "Cefalometria",
  "mtc_sistemica": "MTC Sistemica",
  "mtc_organica": "MTC Organica",
};

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTool, setFilterTool] = useState<string>("all");

  const fetchFeedback = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tool_feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      setFeedback(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFeedback(); }, []);

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("tool_feedback")
      .update({ is_active: !currentActive })
      .eq("id", id);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, is_active: !currentActive } : f));
    }
  };

  const deleteFeedback = async (id: string) => {
    const { error } = await supabase
      .from("tool_feedback")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      setFeedback(prev => prev.filter(f => f.id !== id));
      toast({ title: "Feedback eliminato" });
    }
  };

  const filtered = filterTool === "all" ? feedback : feedback.filter(f => f.tool_name === filterTool);
  const tools = [...new Set(feedback.map(f => f.tool_name))];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareText size={18} className="text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">Retro-Feedback IA</h3>
          <span className="font-body text-xs text-muted-foreground">({filtered.length} feedback)</span>
        </div>
      </div>

      <p className="font-body text-xs text-muted-foreground">
        I feedback attivi vengono iniettati nel prompt di sistema dell'IA per migliorare progressivamente i consulenze. Disattiva o elimina quelli non più rilevanti.
      </p>

      {tools.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterTool("all")}
            className={`px-3 py-1.5 rounded-md font-body text-xs border transition-colors ${filterTool === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}
          >
            Tutti
          </button>
          {tools.map(t => (
            <button
              key={t}
              onClick={() => setFilterTool(t)}
              className={`px-3 py-1.5 rounded-md font-body text-xs border transition-colors ${filterTool === t ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}
            >
              {TOOL_LABELS[t] || t}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="font-body text-sm text-muted-foreground">Nessun feedback registrato.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(f => (
            <div key={f.id} className={`border rounded-lg p-4 space-y-2 transition-colors ${f.is_active ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {TOOL_LABELS[f.tool_name] || f.tool_name}
                    </span>
                    <span className={`font-body text-[10px] px-2 py-0.5 rounded-full ${f.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {f.is_active ? "Attivo" : "Disattivato"}
                    </span>
                    <span className="font-body text-[10px] text-muted-foreground">
                      {f.submitted_by_email || "—"} • {formatDate(f.created_at)}
                    </span>
                  </div>
                  <p className="font-body text-sm text-foreground mt-2 whitespace-pre-wrap">{f.feedback}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleActive(f.id, f.is_active)}
                    title={f.is_active ? "Disattiva" : "Attiva"}
                  >
                    {f.is_active ? <ToggleRight size={16} className="text-primary" /> : <ToggleLeft size={16} className="text-muted-foreground" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteFeedback(f.id)}
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
  );
};

export default AdminFeedback;
