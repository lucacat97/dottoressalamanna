import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Crown, Star, User as UserIcon, Search } from "lucide-react";

type Plan = "base" | "pro" | "platinum";

interface Row {
  user_id: string;
  email: string;
  plan: Plan;
  assigned_at: string | null;
}

const PLAN_META: Record<Plan, { label: string; icon: typeof UserIcon; className: string }> = {
  base: { label: "Base", icon: UserIcon, className: "bg-muted text-muted-foreground" },
  pro: { label: "Pro", icon: Star, className: "bg-primary/10 text-petrolio" },
  platinum: { label: "Platinum", icon: Crown, className: "bg-gold/15 text-gold" },
};

const AdminUserPlans = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_user_plans");
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setPlan = async (email: string, plan: Plan) => {
    const { error } = await supabase.rpc("admin_set_user_plan", { _email: email, _plan: plan });
    if (error) return toast({ title: "Errore", description: error.message, variant: "destructive" });
    toast({ title: `${email} → ${PLAN_META[plan].label}` });
    load();
  };

  const filtered = rows.filter((r) => r.email.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-display text-base font-semibold mb-1">Piani di abbonamento</h3>
        <p className="font-body text-xs text-muted-foreground mb-4">
          Ogni utente parte automaticamente da <strong>Base</strong>. Promuovi manualmente a Pro o Platinum.
        </p>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cerca per email…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 font-body"
          />
        </div>

        {loading ? (
          <p className="font-body text-sm text-muted-foreground">Caricamento…</p>
        ) : filtered.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground italic">Nessun utente trovato.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => {
              const meta = PLAN_META[r.plan];
              const Icon = meta.icon;
              return (
                <div key={r.user_id} className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-muted/30 border border-border">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${meta.className}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-foreground truncate">{r.email}</p>
                    <p className="font-body text-[11px] text-muted-foreground">
                      Piano corrente: <span className="font-semibold">{meta.label}</span>
                    </p>
                  </div>
                  <Select value={r.plan} onValueChange={(v) => setPlan(r.email, v as Plan)}>
                    <SelectTrigger className="w-36 font-body"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserPlans;
