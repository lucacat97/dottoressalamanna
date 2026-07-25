import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Calendar, Trash2, ChevronDown, ChevronUp, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Registration {
  id: string;
  edition_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  confirmed: boolean;
}

interface Edition {
  id: string;
  title: string;
  date: string;
}

const AdminRegistrations = ({ editions }: { editions: Edition[] }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [expandedEdition, setExpandedEdition] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newReg, setNewReg] = useState<Record<string, { full_name: string; email: string; phone: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const getForm = (editionId: string) =>
    newReg[editionId] || { full_name: "", email: "", phone: "" };
  const setForm = (editionId: string, patch: Partial<{ full_name: string; email: string; phone: string }>) =>
    setNewReg((prev) => ({ ...prev, [editionId]: { ...getForm(editionId), ...patch } }));

  const handleAdd = async (editionId: string) => {
    const form = getForm(editionId);
    const email = form.email.trim().toLowerCase();
    const fullName = form.full_name.trim();
    if (!email || !fullName) {
      toast({ title: "Dati mancanti", description: "Inserisci nome e email.", variant: "destructive" });
      return;
    }
    setSubmitting(editionId);
    const { data, error } = await supabase
      .from("course_registrations")
      .insert({
        edition_id: editionId,
        full_name: fullName,
        email,
        phone: form.phone.trim() || null,
        confirmed: true,
        registered_by: "admin",
      } as any)
      .select()
      .single();
    setSubmitting(null);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else if (data) {
      setRegistrations((prev) => [data as Registration, ...prev]);
      setForm(editionId, { full_name: "", email: "", phone: "" });
      toast({ title: "Iscritto aggiunto", description: `${fullName} è stato aggiunto al corso.` });
    }
  };

  const fetchRegistrations = async () => {
    const { data } = await supabase
      .from("course_registrations")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setRegistrations(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleToggleConfirm = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("course_registrations")
      .update({ confirmed: !currentValue } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Errore", description: "Impossibile aggiornare lo stato.", variant: "destructive" });
    } else {
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, confirmed: !currentValue } : r))
      );
      toast({ title: !currentValue ? "Iscrizione confermata" : "Conferma revocata" });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("course_registrations").delete().eq("id", id);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Iscrizione eliminata" });
    }
  };

  const getRegistrationsForEdition = (editionId: string) =>
    registrations.filter((r) => r.edition_id === editionId);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) return <p className="font-body text-sm text-muted-foreground">Caricamento iscrizioni...</p>;

  return (
    <div className="space-y-3">
      {editions.map((edition) => {
        const editionRegs = getRegistrationsForEdition(edition.id);
        const isExpanded = expandedEdition === edition.id;

        return (
          <div key={edition.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedEdition(isExpanded ? null : edition.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div>
                <h4 className="font-display text-sm font-semibold text-foreground">{edition.title}</h4>
                <p className="font-body text-xs text-muted-foreground mt-0.5">
                  <Calendar size={10} className="inline mr-1" />
                  {formatDate(edition.date)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-body text-xs font-semibold px-2 py-0.5 rounded-full ${editionRegs.length > 0 ? "bg-primary/10 text-petrolio" : "bg-muted text-muted-foreground"}`}>
                  {editionRegs.length} iscrizioni
                </span>
                {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border p-4 space-y-3">
                {/* Manual add form */}
                <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                    <UserPlus size={12} /> Aggiungi iscritto manualmente
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={getForm(edition.id).full_name}
                      onChange={(e) => setForm(edition.id, { full_name: e.target.value })}
                      placeholder="Nome e cognome"
                      className="sm:col-span-1 px-3 py-2 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      type="email"
                      value={getForm(edition.id).email}
                      onChange={(e) => setForm(edition.id, { email: e.target.value })}
                      placeholder="Email"
                      className="sm:col-span-1 px-3 py-2 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      type="tel"
                      value={getForm(edition.id).phone}
                      onChange={(e) => setForm(edition.id, { phone: e.target.value })}
                      placeholder="Telefono (opzionale)"
                      className="sm:col-span-1 px-3 py-2 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button
                      onClick={() => handleAdd(edition.id)}
                      disabled={submitting === edition.id}
                      className="bg-primary text-primary-foreground font-body"
                    >
                      <UserPlus size={14} className="mr-1" />
                      {submitting === edition.id ? "Aggiungo..." : "Aggiungi"}
                    </Button>
                  </div>
                  <p className="font-body text-xs text-muted-foreground mt-2">
                    L'iscrizione verrà creata già confermata e l'utente potrà accedere ai materiali.
                  </p>
                </div>

                {editionRegs.length === 0 ? (
                  <p className="font-body text-sm text-muted-foreground italic">Nessuna iscrizione ricevuta.</p>
                ) : (
                  editionRegs.map((reg) => (
                    <div key={reg.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-md gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-sm font-semibold text-foreground">{reg.full_name}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail size={10} />
                            {reg.email}
                          </span>
                          {reg.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={10} />
                              {reg.phone}
                            </span>
                          )}
                          <span>{formatDateTime(reg.created_at)}</span>
                        </div>
                        {reg.notes && (
                          <p className="font-body text-xs text-muted-foreground mt-1 italic">"{reg.notes}"</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={reg.confirmed ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-muted-foreground hover:text-foreground hover:bg-muted"}
                          onClick={() => handleToggleConfirm(reg.id, reg.confirmed)}
                          title={reg.confirmed ? "Confermata – clicca per revocare" : "Non confermata – clicca per confermare"}
                        >
                          {reg.confirmed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(reg.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdminRegistrations;
