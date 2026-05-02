import { useState } from "react";
import { UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TOOL_LABELS: Record<string, string> = {
  diagnosis: "Supporto Diagnosi",
  orthodontic: "Diagnosi Ortodontica",
  mtc_sistemica: "MTC Sistemica",
  mtc_organica: "MTC Organica",
  tests: "Test Ortodontico-Posturali",
  breathing: "Respirazione e Sonno",
};

const ALL_TOOLS = Object.keys(TOOL_LABELS);

const AdminInviteUser = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createLicense, setCreateLicense] = useState(true);
  const [selectedTools, setSelectedTools] = useState<string[]>([...ALL_TOOLS]);
  const [toolLimits, setToolLimits] = useState<Record<string, number>>(
    Object.fromEntries(ALL_TOOLS.map((t) => [t, 30]))
  );
  const { toast } = useToast();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const license = createLicense && selectedTools.length > 0
        ? {
            tools: selectedTools,
            toolLimits: Object.fromEntries(
              selectedTools.map((t) => [t, toolLimits[t] || 30])
            ),
          }
        : undefined;

      const { data, error } = await supabase.functions.invoke("admin-invite-user", {
        body: {
          email: email.trim(),
          fullName: fullName.trim() || undefined,
          redirectTo: `${window.location.origin}/reset-password`,
          license,
        },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "Errore invito");
      }
      toast({
        title: "Invito inviato",
        description: license
          ? `Email a ${email.trim()} con licenza per ${selectedTools.length} strumenti.`
          : `Email di invito inviata a ${email.trim()}`,
      });
      setEmail("");
      setFullName("");
    } catch (err) {
      toast({
        title: "Errore",
        description: err instanceof Error ? err.message : "Impossibile inviare l'invito",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus size={18} className="text-gold" />
        <h3 className="font-display text-lg font-semibold text-foreground">Invita un nuovo utente</h3>
      </div>
      <p className="font-body text-sm text-muted-foreground mb-5">
        L'utente riceverà un'email di invito con il link per creare la propria password. Puoi pre-assegnare già accessi e limiti agli strumenti.
      </p>

      <form onSubmit={handleInvite} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
              Nome completo (opzionale)
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Mario Rossi"
              style={{ fontSize: "16px" }}
            />
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="utente@esempio.it"
              style={{ fontSize: "16px" }}
            />
          </div>
        </div>

        <div className="border border-border rounded-lg p-4 bg-muted/20">
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={createLicense}
              onChange={(e) => setCreateLicense(e.target.checked)}
              className="rounded border-input"
            />
            <span className="font-body text-sm font-semibold text-foreground">
              Pre-assegna accessi agli strumenti (crea licenza)
            </span>
          </label>

          {createLicense && (
            <div className="space-y-2 mt-2">
              <p className="font-body text-xs text-muted-foreground mb-2">
                Seleziona gli strumenti abilitati e il limite mensile per ciascuno.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_TOOLS.map((key) => {
                  const checked = selectedTools.includes(key);
                  return (
                    <div
                      key={key}
                      className={`border rounded-lg p-2.5 ${checked ? "border-primary/40 bg-primary/5" : "border-border bg-background opacity-60"}`}
                    >
                      <label className="flex items-center justify-between gap-2 font-body text-xs font-medium cursor-pointer">
                        <span className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedTools([...selectedTools, key]);
                              else setSelectedTools(selectedTools.filter((t) => t !== key));
                            }}
                            className="rounded border-input"
                          />
                          {TOOL_LABELS[key]}
                        </span>
                        {checked && (
                          <span className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              value={toolLimits[key] || 30}
                              onChange={(e) =>
                                setToolLimits({ ...toolLimits, [key]: parseInt(e.target.value) || 30 })
                              }
                              className="w-16 px-2 py-1 rounded border border-input bg-background font-body text-xs text-foreground"
                            />
                            <span className="font-body text-[10px] text-muted-foreground">/mese</span>
                          </span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading} className="font-body">
          <Mail size={16} className="mr-2" />
          {loading ? "Invio in corso..." : "Invia invito"}
        </Button>
      </form>
    </div>
  );
};

export default AdminInviteUser;
