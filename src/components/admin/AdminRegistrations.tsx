import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Calendar, Trash2, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => handleDelete(reg.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
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
