import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TOOL_LABELS: Record<string, string> = {
  diagnosis: "Consulenza clinica",
  orthodontic: "Consulenza ortodontica",
  mtc_sistemica: "MTC Sistemica",
  mtc_organica: "MTC Organica",
  checkup: "Check-up posturale",
};

interface Allowance {
  unlimited: boolean;
  monthly_limit?: number;
  monthly_remaining?: number;
  oneoff_credits?: number;
  total_remaining?: number;
}

const UsageWidget = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [allowance, setAllowance] = useState<Allowance | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("ai_usage_log")
        .select("tool_name")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString());

      const map: Record<string, number> = {};
      (data ?? []).forEach((r: { tool_name: string }) => {
        map[r.tool_name] = (map[r.tool_name] ?? 0) + 1;
      });
      setCounts(map);
      setTotal((data ?? []).length);

      const { data: allow } = await (supabase.rpc as any)("get_ai_allowance", { _user_id: user.id });
      if (allow) setAllowance(allow as Allowance);
      setLoading(false);
    })();
  }, []);


  const monthLabel = new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity size={18} className="text-petrolio" />
          </div>
          <div>
            <p className="font-body text-[11px] uppercase tracking-wider text-muted-foreground">Utilizzo del mese</p>
            <h3 className="font-display text-base font-bold text-foreground capitalize">{monthLabel}</h3>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold text-foreground leading-none">
            {loading ? "—" : total}
          </p>
          <p className="font-body text-[11px] text-muted-foreground mt-1">
            consulenze generate
          </p>
        </div>
      </div>

      {!loading && allowance && (
        <div className="flex flex-wrap gap-2 mb-3">
          {allowance.unlimited ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/15 font-body text-xs text-foreground">
              <span className="text-muted-foreground">Consulenze disponibili</span>
              <span className="font-semibold text-gold">Illimitate</span>
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 font-body text-xs text-foreground">
                <span className="text-muted-foreground">Residue questo mese</span>
                <span className="font-semibold text-petrolio">{allowance.monthly_remaining ?? 0}/{allowance.monthly_limit ?? 0}</span>
              </span>
              {(allowance.oneoff_credits ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/15 font-body text-xs text-foreground">
                  <span className="text-muted-foreground">Consulti una tantum</span>
                  <span className="font-semibold text-gold">{allowance.oneoff_credits}</span>
                </span>
              )}
            </>
          )}
        </div>
      )}



      {!loading && total > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
          {Object.entries(counts).map(([tool, n]) => (
            <span
              key={tool}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 font-body text-xs text-foreground"
            >
              <span className="text-muted-foreground">{TOOL_LABELS[tool] ?? tool}</span>
              <span className="font-semibold text-petrolio">{n}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsageWidget;
