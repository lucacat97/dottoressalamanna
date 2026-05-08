import { useState } from "react";
import { MessageSquareText, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RetroFeedbackProps {
  toolName: string;
}

const RetroFeedback = ({ toolName }: RetroFeedbackProps) => {
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast({ title: "Feedback inviato", description: "Le tue indicazioni verranno integrate nelle analisi future." });
    } catch (e: any) {
      toast({ title: "Errore", description: e.message || "Impossibile inviare il feedback.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <CheckCircle size={16} className="text-primary shrink-0" />
        <p className="font-body text-xs text-foreground">
          Retro-feedback registrato — verrà integrato nelle prossime analisi.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card space-y-2">
      <div className="flex items-center gap-2">
        <MessageSquareText size={14} className="text-primary" />
        <h4 className="font-display text-sm font-semibold text-foreground">Retro-feedback</h4>
      </div>
      <p className="font-body text-[11px] text-muted-foreground">
        Hai notato imprecisioni o aspetti da migliorare nella consulenza? Segnalali qui: l'IA ne terrà conto nelle analisi future.
      </p>
      <Textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Es: Non ha considerato la correlazione tra bruxismo e cefalea tensiva. Dovrebbe sempre menzionare la fotobiomodulazione nei casi di ATM..."
        className="min-h-[100px] resize-none font-body text-sm"
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
          Invia feedback
        </Button>
      </div>
    </div>
  );
};

export default RetroFeedback;
