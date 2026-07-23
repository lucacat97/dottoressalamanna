import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId: string;
  onClick?: () => void;
}

const CreditsBadge = ({ userId, onClick }: Props) => {
  const [used, setUsed] = useState<number | null>(null);

  const load = async () => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("ai_usage_log")
      .select("id", { count: "exact", head: false })
      .eq("user_id", userId)
      .gte("created_at", start.toISOString());
    setUsed((data ?? []).length);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`credits-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_usage_log", filter: `user_id=eq.${userId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (used === null) return null;

  return (
    <button
      onClick={onClick}
      title={`Consulenze generate questo mese: ${used}`}
      className="hidden md:inline-flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-border/60 bg-background/60 backdrop-blur-sm hover:border-gold/50 hover:bg-gold/5 transition-all group"
    >
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold/15 text-gold">
        <Sparkles size={12} strokeWidth={2.5} />
      </span>
      <span className="flex items-baseline gap-1 font-body">
        <span className="text-sm font-semibold text-foreground tabular-nums">{used}</span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">questo mese</span>
      </span>
    </button>
  );
};

export default CreditsBadge;
