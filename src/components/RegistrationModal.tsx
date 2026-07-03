import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface RegistrationModalProps {
  edition: {
    id: string;
    title: string;
    date: string;
  };
  onClose: () => void;
}

const RegistrationModal = ({ edition, onClose }: RegistrationModalProps) => {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("course_registrations").insert({
      edition_id: edition.id,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    });

    setSubmitting(false);
    if (error) {
      toast({ title: "Errore", description: "Si è verificato un errore. Riprova.", variant: "destructive" });
    } else {
      setSuccess(true);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card rounded-lg shadow-elevated max-w-md w-full p-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} aria-label="Chiudi" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} aria-hidden="true" />
          </button>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <CheckCircle size={48} className="text-petrolio mx-auto mb-4" />
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">Iscrizione Inviata!</h3>
              <p className="font-body text-muted-foreground mb-6">
                Riceverai una conferma via email a breve.
              </p>
              <Button onClick={onClose} className="bg-primary text-primary-foreground font-body">
                Chiudi
              </Button>
            </motion.div>
          ) : (
            <>
              <h3 className="font-display text-xl font-bold text-foreground mb-1">Iscriviti al Corso</h3>
              <p className="font-body text-sm text-muted-foreground mb-6">
                {edition.title} — {formatDate(edition.date)}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                    Nome e Cognome *
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={100}
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Il tuo nome completo"
                  />
                </div>
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="La tua email"
                  />
                </div>
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    maxLength={20}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="+39 ..."
                  />
                </div>
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                    Note
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Eventuali note o richieste..."
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground font-body font-semibold"
                >
                  {submitting ? "Invio in corso..." : (
                    <>
                      <Send size={16} className="mr-2" />
                      Invia Iscrizione
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RegistrationModal;
