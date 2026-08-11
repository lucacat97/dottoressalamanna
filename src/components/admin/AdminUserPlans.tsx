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
  const [credits, setCredits] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: creditRows }] = await Promise.all([
      supabase.rpc("admin_list_user_plans"),
      (supabase.rpc as any)("admin_list_ai_credits"),
    ]);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else setRows((data ?? []) as Row[]);
    const map: Record<string, number> = {};
    ((creditRows ?? []) as { email: string; credits: number }[]).forEach((c) => { map[c.email] = c.credits; });
    setCredits(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setPlan = async (email: string, plan: Plan) => {
    const { error } = await supabase.rpc("admin_set_user_plan", { _email: email, _plan: plan });
    if (error) return toast({ title: "Errore", description: error.message, variant: "destructive" });
    toast({ title: `${email} → ${PLAN_META[plan].label}` });
    load();
  };

  const saveCredits = async (email: string) => {
    const value = parseInt(draft[email] ?? "", 10);
    if (Number.isNaN(value) || value < 0) return toast({ title: "Valore non valido", variant: "destructive" });
    const { error } = await (supabase.rpc as any)("admin_set_ai_credits", { _email: email, _credits: value });
    if (error) return toast({ title: "Errore", description: error.message, variant: "destructive" });
    toast({ title: `${email}: ${value} consulti una tantum` });
    setDraft((p) => ({ ...p, [email]: "" }));
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
                      {" · "}Consulti una tantum: <span className="font-semibold text-gold">{credits[r.email] ?? 0}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Consulti"
                      value={draft[r.email] ?? ""}
                      onChange={(e) => setDraft((p) => ({ ...p, [r.email]: e.target.value }))}
                      className="w-24 font-body"
                    />
                    <Button size="sm" variant="outline" className="font-body" onClick={() => saveCredits(r.email)}>
                      Assegna
                    </Button>
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
