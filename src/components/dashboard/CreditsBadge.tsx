import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MONTHLY_INCLUDED = 5;

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
  const remaining = Math.max(0, MONTHLY_INCLUDED - used);
  const over = Math.max(0, used - MONTHLY_INCLUDED);

  return (
    <button
      onClick={onClick}
      title={`Consulenze utilizzate questo mese: ${used}`}
      className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold/40 bg-gold/10 text-gold font-body text-xs font-semibold transition-all hover:shadow-sm"
    >
      <Sparkles size={13} />
      {over > 0 ? (
        <span>+{over} extra · {used} usate</span>
      ) : (
        <span>{remaining}/{MONTHLY_INCLUDED} consulenze residue</span>
      )}
    </button>
  );
};

export default CreditsBadge;
