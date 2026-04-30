import { useEffect, useState } from "react";
import { MessageSquareText, Send, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RetroFeedbackProps {
  toolName: string;
}

interface FeedbackEntry {
  feedback: string;
  created_at: string;
}

const RetroFeedback = ({ toolName }: RetroFeedbackProps) => {
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existing, setExisting] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_tool_feedback", { _tool_name: toolName });
      if (error) throw error;
      setExisting((data as FeedbackEntry[]) || []);
    } catch {
      setExisting([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolName]);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Errore", description: "Sessione scaduta.", variant: "destructive" });
        return;
      }
      const email = user.email || "";
      const { error } = await supabase.from("tool_feedback").insert({
        tool_name: toolName,
        feedback: feedback.trim(),
        submitted_by: user.id,
        submitted_by_email: email,
      });
      if (error) throw error;
      setSubmitted(true);
      setFeedback("");
      toast({ title: "Feedback registrato", description: "Grazie per il contributo." });
      loadFeedbacks();
    } catch (e: any) {
      toast({ title: "Errore", description: e.message || "Impossibile inviare il feedback.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquareText size={14} className="text-primary" />
        <h4 className="font-display text-sm font-semibold text-foreground">Retro-feedback</h4>
      </div>

      <div className="flex items-start gap-2 p-2.5 bg-muted/40 border border-border/60 rounded-md">
        <Info size={12} className="text-muted-foreground mt-0.5 shrink-0" />
        <p className="font-body text-[11px] text-muted-foreground leading-relaxed">
          Sezione informativa: raccoglie osservazioni e annotazioni cliniche sui referti.
          I contributi vengono archiviati e potranno essere valutati manualmente per
          migliorare il servizio.
        </p>
      </div>

      {/* Existing feedbacks */}
      {!loading && existing.length > 0 && (
        <div className="space-y-2">
          <p className="font-body text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Annotazioni precedenti ({existing.length})
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {existing.map((f, i) => (
              <div key={i} className="p-2.5 bg-primary/5 border border-primary/15 rounded-md">
                <p className="font-body text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {f.feedback}
                </p>
                <p className="font-body text-[10px] text-muted-foreground/70 mt-1">
                  {formatDate(f.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submission form */}
      {submitted ? (
        <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-md">
          <CheckCircle size={14} className="text-primary shrink-0" />
          <p className="font-body text-xs text-foreground">
            Annotazione registrata.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="ml-auto font-body text-[11px] text-primary hover:underline"
          >
            Aggiungine un'altra
          </button>
        </div>
      ) : (
        <>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Aggiungi una nota o un'osservazione su questo referto..."
            className="min-h-[90px] resize-none font-body text-sm"
          />
          <div className="flex items-center justify-between">
            {feedback.length > 0 && (
              <p className="font-body text-[10px] text-muted-foreground/60">{feedback.length} caratteri</p>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleSubmit}
              disabled={!feedback.trim() || isSubmitting}
              className="ml-auto font-body gap-1.5"
            >
              <Send size={12} />
              Registra annotazione
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default RetroFeedback;
