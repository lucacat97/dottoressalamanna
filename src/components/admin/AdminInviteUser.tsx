import { useState } from "react";
import { UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminInviteUser = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-invite-user", {
        body: {
          email: email.trim(),
          fullName: fullName.trim() || undefined,
          redirectTo: `${window.location.origin}/area-riservata`,
        },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "Errore invito");
      }
      toast({
        title: "Invito inviato",
        description: `Email di invito inviata a ${email.trim()}`,
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
    <div className="bg-card border border-border rounded-lg p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus size={18} className="text-gold" />
        <h3 className="font-display text-lg font-semibold text-foreground">Invita un nuovo utente</h3>
      </div>
      <p className="font-body text-sm text-muted-foreground mb-5">
        L'utente riceverà un'email di invito con il link per creare la propria password e accedere all'Area Riservata.
      </p>

      <form onSubmit={handleInvite} className="space-y-4">
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
        <Button type="submit" disabled={loading} className="font-body">
          <Mail size={16} className="mr-2" />
          {loading ? "Invio in corso..." : "Invia invito"}
        </Button>
      </form>
    </div>
  );
};

export default AdminInviteUser;
