import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Trash2, Clock, CheckCircle2, XCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const TOOL_LABELS: Record<string, string> = {
  diagnosis: "Supporto Diagnosi",
  orthodontic: "Consulenza Ortodontica",
  mtc_sistemica: "MTC Sistemica",
  mtc_organica: "MTC Organica",
};
const TOOL_KEYS = Object.keys(TOOL_LABELS);

interface Invitation {
  id: string;
  email: string;
  tools: string[];
  monthly_limit: number;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  note: string | null;
  token: string;
}

export default function AdminInvitations() {
  const [list, setList] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState("");
  const [tools, setTools] = useState<string[]>([...TOOL_KEYS]);
  const [monthlyLimit, setMonthlyLimit] = useState(30);
  const [toolLimits, setToolLimits] = useState<Record<string, number>>(
    Object.fromEntries(TOOL_KEYS.map(k => [k, 30]))
  );
  const [note, setNote] = useState("");

  const fetchList = async () => {
    setLoading(true);
    const { data } = await supabase.from("invitations" as any).select("*").order("created_at", { ascending: false });
    setList((data as unknown as Invitation[]) || []);
    setLoading(false);
  };
  useEffect(() => { fetchList(); }, []);

  const sendInvite = async () => {
    if (!email.trim() || tools.length === 0) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-invitation", {
      body: {
        email: email.trim(),
        tools,
        monthlyLimit,
        toolLimits: Object.fromEntries(tools.map(t => [t, toolLimits[t] || monthlyLimit])),
        note: note.trim() || null,
      },
    });
    if (error || (data as any)?.error) {
      toast({ title: "Errore invio invito", description: (data as any)?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Invito inviato", description: `Email inviata a ${email}` });
      setEmail(""); setNote("");
      fetchList();
    }
    setSending(false);
  };

  const deleteInvite = async (id: string) => {
    if (!confirm("Eliminare questo invito? La licenza associata resta attiva.")) return;
    const { error } = await supabase.from("invitations" as any).delete().eq("id", id);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else { toast({ title: "Invito eliminato" }); fetchList(); }
  };

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/login?invite=${token}`;
    try { await navigator.clipboard.writeText(url); toast({ title: "Link copiato" }); }
    catch { window.prompt("Copia il link:", url); }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const statusBadge = (inv: Invitation) => {
    const expired = new Date(inv.expires_at).getTime() < Date.now();
    if (inv.status === "accepted") return { icon: CheckCircle2, label: "Accettato", cls: "bg-primary/10 text-petrolio" };
    if (expired) return { icon: XCircle, label: "Scaduto", cls: "bg-destructive/10 text-destructive" };
    return { icon: Clock, label: "In attesa", cls: "bg-gold/10 text-gold" };
  };

  return (
    <div className="space-y-6">
      {/* Form nuovo invito */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <Mail size={16} className="text-petrolio" />
          <h4 className="font-display text-sm font-semibold text-foreground">Nuovo Invito</h4>
        </div>
        <p className="font-body text-xs text-muted-foreground mb-4">
          Invia un invito email a un professionista. Verrà creata una licenza con gli strumenti e i limiti scelti,
          e il destinatario potrà impostare la propria password e verificare l'email.
        </p>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@professionista.com"
            className="px-4 py-2.5 rounded-md border border-input bg-background font-body text-base md:text-sm text-foreground"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TOOL_KEYS.map((k) => (
              <div key={k} className={`border rounded-lg p-2.5 ${tools.includes(k) ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20 opacity-60"}`}>
                <label className="flex items-center gap-1.5 font-body text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tools.includes(k)}
                    onChange={(e) => setTools(e.target.checked ? [...tools, k] : tools.filter(t => t !== k))}
                  />
                  {TOOL_LABELS[k]}
                </label>
                {tools.includes(k) && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={toolLimits[k] || 30}
                      onChange={(e) => setToolLimits({ ...toolLimits, [k]: parseInt(e.target.value) || 30 })}
                      className="w-16 px-2 py-1 rounded border border-input bg-background font-body text-xs"
                    />
                    <span className="font-body text-[10px] text-muted-foreground">/mese</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-body text-xs text-muted-foreground">Limite globale fallback:</span>
            <input
              type="number"
              min={1}
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(parseInt(e.target.value) || 30)}
              className="w-20 px-2 py-1 rounded border border-input bg-background font-body text-xs"
            />
            <span className="font-body text-xs text-muted-foreground">/mese</span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota interna (opzionale)..."
            rows={2}
            className="px-4 py-2 rounded-md border border-input bg-background font-body text-base md:text-sm text-foreground"
          />
          <Button
            onClick={sendInvite}
            disabled={!email.trim() || tools.length === 0 || sending}
            className="w-fit bg-primary text-primary-foreground font-body"
          >
            <Send size={14} className="mr-2" />
            {sending ? "Invio..." : "Crea licenza & invia invito"}
          </Button>
        </div>
      </div>

      {/* Lista inviti */}
      {loading ? (
        <p className="font-body text-sm text-muted-foreground">Caricamento...</p>
      ) : list.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground italic">Nessun invito inviato.</p>
      ) : (
        <div className="space-y-2">
          {list.map((inv) => {
            const b = statusBadge(inv);
            return (
              <div key={inv.id} className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Mail size={13} className="text-muted-foreground" />
                    <span className="font-display text-sm font-semibold text-foreground truncate">{inv.email}</span>
                    <span className={`inline-flex items-center gap-1 font-body text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${b.cls}`}>
                      <b.icon size={10} /> {b.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-body">
                    <span>Inviato: {fmt(inv.created_at)}</span>
                    <span>Scade: {fmt(inv.expires_at)}</span>
                    {inv.accepted_at && <span>Accettato: {fmt(inv.accepted_at)}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(inv.tools || []).map((t) => (
                      <span key={t} className="font-body text-[10px] bg-muted/60 px-1.5 py-0.5 rounded">{TOOL_LABELS[t] || t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {inv.status === "pending" && (
                    <Button variant="outline" size="sm" onClick={() => copyLink(inv.token)} className="font-body">
                      <Copy size={12} className="mr-1" /> Link
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteInvite(inv.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
