import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck, UserX, Plus, Trash2, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Edition {
  id: string;
  title: string;
  date: string;
}

interface AccessOverride {
  id: string;
  edition_id: string;
  user_email: string;
  granted: boolean;
  created_at: string;
}

interface Registration {
  id: string;
  edition_id: string;
  email: string;
  full_name: string;
}

const AdminAccessControl = ({ editions }: { editions: Edition[] }) => {
  const [overrides, setOverrides] = useState<AccessOverride[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [expandedEdition, setExpandedEdition] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [selectedEdition, setSelectedEdition] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [overridesRes, regsRes] = await Promise.all([
      supabase.from("course_access_overrides").select("*").order("created_at", { ascending: false }),
      supabase.from("course_registrations").select("id, edition_id, email, full_name"),
    ]);
    if (overridesRes.data) setOverrides(overridesRes.data);
    if (regsRes.data) setRegistrations(regsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGrantAccess = async () => {
    if (!newEmail.trim() || !selectedEdition) return;

    const { error } = await supabase.from("course_access_overrides").upsert({
      edition_id: selectedEdition,
      user_email: newEmail.trim().toLowerCase(),
      granted: true,
    }, { onConflict: "edition_id,user_email" });

    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Accesso concesso", description: `${newEmail} può ora accedere ai materiali.` });
      setNewEmail("");
      fetchData();
    }
  };

  const handleRevokeAccess = async (editionId: string, email: string) => {
    const { error } = await supabase.from("course_access_overrides").upsert({
      edition_id: editionId,
      user_email: email.toLowerCase(),
      granted: false,
    }, { onConflict: "edition_id,user_email" });

    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Accesso revocato" });
      fetchData();
    }
  };

  const handleDeleteOverride = async (id: string) => {
    const { error } = await supabase.from("course_access_overrides").delete().eq("id", id);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Override rimosso" });
      fetchData();
    }
  };

  const getOverridesForEdition = (editionId: string) =>
    overrides.filter((o) => o.edition_id === editionId);

  const getRegistrationsForEdition = (editionId: string) =>
    registrations.filter((r) => r.edition_id === editionId);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });

  if (loading) return <p className="font-body text-sm text-muted-foreground">Caricamento...</p>;

  return (
    <div className="space-y-6">
      {/* Grant access section */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-1">Concedi Accesso Manuale</h4>
        <p className="font-body text-xs text-muted-foreground mb-3">
          Gli iscritti hanno accesso automatico. Usa questo per aggiungere accesso extra o revocare.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedEdition}
            onChange={(e) => setSelectedEdition(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seleziona edizione...</option>
            {editions.map((ed) => (
              <option key={ed.id} value={ed.id}>{ed.title}</option>
            ))}
          </select>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email utente..."
            className="flex-1 px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            onClick={handleGrantAccess}
            disabled={!selectedEdition || !newEmail.trim()}
            className="bg-primary text-primary-foreground font-body"
          >
            <Plus size={16} className="mr-2" />
            Concedi
          </Button>
        </div>
      </div>

      {/* Per-edition access list */}
      {editions.map((edition) => {
        const edRegs = getRegistrationsForEdition(edition.id);
        const edOverrides = getOverridesForEdition(edition.id);
        const isExpanded = expandedEdition === edition.id;

        // Build unified access list
        const autoAccessEmails = edRegs.map((r) => r.email.toLowerCase());
        const overrideMap = new Map(edOverrides.map((o) => [o.user_email.toLowerCase(), o]));

        return (
          <div key={edition.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedEdition(isExpanded ? null : edition.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div>
                <h4 className="font-display text-sm font-semibold text-foreground">{edition.title}</h4>
                <p className="font-body text-xs text-muted-foreground mt-0.5">{formatDate(edition.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-body text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-petrolio">
                  {autoAccessEmails.length} iscritti
                </span>
                {edOverrides.length > 0 && (
                  <span className="font-body text-xs font-semibold px-2 py-0.5 rounded-full bg-gold/10 text-gold">
                    {edOverrides.length} override
                  </span>
                )}
                {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Auto-access from registrations */}
                {autoAccessEmails.length > 0 && (
                  <div>
                    <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">Accesso automatico (iscritti)</p>
                    <div className="space-y-1">
                      {edRegs.map((reg) => {
                        const override = overrideMap.get(reg.email.toLowerCase());
                        const isRevoked = override?.granted === false;
                        return (
                          <div key={reg.id} className={`flex items-center justify-between p-2.5 rounded-md ${isRevoked ? "bg-destructive/5" : "bg-muted/30"}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              {isRevoked ? (
                                <UserX size={14} className="text-destructive flex-shrink-0" />
                              ) : (
                                <UserCheck size={14} className="text-petrolio flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <span className="font-body text-sm text-foreground block truncate">{reg.full_name}</span>
                                <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail size={10} />{reg.email}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isRevoked ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-petrolio hover:text-petrolio"
                                  onClick={() => override && handleDeleteOverride(override.id)}
                                >
                                  Ripristina
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-destructive hover:text-destructive"
                                  onClick={() => handleRevokeAccess(edition.id, reg.email)}
                                >
                                  Revoca
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Manual overrides (granted, not already in registrations) */}
                {edOverrides.filter((o) => o.granted && !autoAccessEmails.includes(o.user_email.toLowerCase())).length > 0 && (
                  <div>
                    <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">Accesso manuale</p>
                    <div className="space-y-1">
                      {edOverrides
                        .filter((o) => o.granted && !autoAccessEmails.includes(o.user_email.toLowerCase()))
                        .map((o) => (
                          <div key={o.id} className="flex items-center justify-between p-2.5 bg-gold/5 rounded-md">
                            <div className="flex items-center gap-2">
                              <UserCheck size={14} className="text-gold" />
                              <span className="font-body text-sm text-foreground">{o.user_email}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteOverride(o.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {autoAccessEmails.length === 0 && edOverrides.length === 0 && (
                  <p className="font-body text-sm text-muted-foreground italic">Nessun utente ha accesso ai materiali di questo corso.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdminAccessControl;
