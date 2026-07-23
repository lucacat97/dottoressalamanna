import { useState } from "react";
import { X, Send, CheckCircle2, Paperclip, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Inserisci nome e cognome").max(120),
  email: z.string().trim().email("Email non valida").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Descrivi brevemente la richiesta").max(2000),
  consent: z.literal(true, { errorMap: () => ({ message: "Consenso obbligatorio" }) }),
});

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED = /^(image\/(png|jpe?g|webp|heic|heif)|application\/pdf)$/i;

interface Props {
  open: boolean;
  onClose: () => void;
  recipientEmail?: string;
  variant?: "standard" | "pec" | "direct";
  eyebrow?: string;
  title?: string;
  description?: string;
  allowAttachments?: boolean;
}

const ConsultationRequestModal = ({
  open,
  onClose,
  recipientEmail = "dott.lamanna.a@gmail.com",
  variant = "standard",
  eyebrow = "Consulenza personalizzata",
  title = "Richiedi una consulenza",
  description = "Compila il modulo: la richiesta arriverà direttamente alla Dott.ssa Annarita Lamanna, che la ricontatterà personalmente.",
  allowAttachments = false,
}: Props) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", consent: false });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const valid: File[] = [];
    for (const f of incoming) {
      if (!ALLOWED.test(f.type)) {
        toast({ title: "Formato non supportato", description: `${f.name}: usa immagini o PDF.`, variant: "destructive" });
        continue;
      }
      if (f.size > MAX_SIZE) {
        toast({ title: "File troppo grande", description: `${f.name}: massimo 10MB.`, variant: "destructive" });
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid].slice(0, MAX_FILES));
  };

  const uploadFiles = async (): Promise<{ name: string; url: string }[]> => {
    if (files.length === 0) return [];
    const uploaded: { name: string; url: string }[] = [];
    const folder = `web/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${folder}/${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("consultation-attachments")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw new Error(`Upload fallito per ${file.name}: ${upErr.message}`);
      const { data: signed, error: sErr } = await supabase.storage
        .from("consultation-attachments")
        .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days
      if (sErr || !signed?.signedUrl) throw new Error(`URL fallito per ${file.name}`);
      uploaded.push({ name: file.name, url: signed.signedUrl });
    }
    return uploaded;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Controlla i dati", description: parsed.error.errors[0]?.message, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const attachments = allowAttachments ? await uploadFiles() : [];
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "consultation-request",
          recipientEmail,
          idempotencyKey: `consult-req-${variant}-${Date.now()}-${form.email}`,
          purpose: "transactional",
          templateData: {
            requesterName: form.name,
            requesterEmail: form.email,
            requesterPhone: form.phone,
            message: form.message,
            sourcePage: typeof window !== "undefined" ? window.location.href : "",
            channel: variant === "pec"
              ? "PEC — Richiesta diretta alla Dott.ssa"
              : variant === "direct"
              ? "Diretto — Scrivi alla Dott.ssa"
              : "Web — Richiesta consulenza",
            attachments,
          },
          replyTo: form.email,
        },
      });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      toast({ title: "Invio non riuscito", description: err?.message || "Riprova tra qualche istante.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-card rounded-lg shadow-elevated max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Chiudi"
        >
          <X size={20} />
        </button>

        {done ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 text-petrolio" size={48} />
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">Richiesta inviata</h3>
            <p className="font-body text-sm text-muted-foreground mb-6">
              La Dott.ssa Lamanna riceverà la sua richiesta e la ricontatterà personalmente all'indirizzo indicato.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-body font-semibold text-sm rounded-md hover:bg-accent transition-colors"
            >
              Chiudi
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-8">
            <p className="font-body text-xs uppercase tracking-[0.2em] text-gold mb-2">{eyebrow}</p>
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">{title}</h3>
            <p className="font-body text-sm text-muted-foreground mb-6">
              {description}
            </p>

            <div className="space-y-4">
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nome e cognome*</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Email*</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Telefono</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Descrivi la tua richiesta*</label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  required
                />
              </div>

              {allowAttachments && (
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Allega immagini o PDF (facoltativo, max {MAX_FILES})
                  </label>
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-md border border-dashed border-input bg-background/50 font-body text-sm text-muted-foreground hover:bg-background hover:text-foreground cursor-pointer transition-colors">
                    <Paperclip size={16} />
                    <span>{files.length < MAX_FILES ? "Aggiungi file (immagini, radiografie, PDF)" : "Limite raggiunto"}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      className="hidden"
                      disabled={files.length >= MAX_FILES}
                      onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                    />
                  </label>
                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {files.map((f, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/50 font-body text-xs text-foreground">
                          <span className="truncate">{f.name} <span className="text-muted-foreground">· {(f.size / 1024).toFixed(0)} KB</span></span>
                          <button type="button" onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <label className="flex items-start gap-2 text-xs text-muted-foreground font-body cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                  className="mt-0.5"
                  required
                />
                <span>
                  Acconsento al trattamento dei dati personali ai sensi del GDPR (Reg. UE 2016/679) per la sola finalità di essere ricontattato/a in merito a questa richiesta. I documenti completi (informativa privacy, regolamento AI MILA, contratto) sono consultabili nell'area riservata.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-body font-semibold text-sm rounded-md hover:bg-accent transition-colors disabled:opacity-60"
            >
              <Send size={16} />
              {loading ? "Invio in corso..." : "Invia richiesta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ConsultationRequestModal;
