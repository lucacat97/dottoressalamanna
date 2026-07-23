import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Sparkles, User as UserIcon } from "lucide-react";

type Plan = "base" | "pro" | "platinum";

const META: Record<Plan, { label: string; icon: typeof UserIcon; className: string }> = {
  base: { label: "MILA Basic", icon: UserIcon, className: "bg-muted text-foreground border-border" },
  pro: { label: "MILA Pro", icon: Sparkles, className: "bg-primary/10 text-petrolio border-primary/30" },
  platinum: { label: "MILA Platinum", icon: Crown, className: "bg-gold/15 text-gold border-gold/40" },
};

interface Props {
  userId: string;
  onClick?: () => void;
}

const PlanBadge = ({ userId, onClick }: Props) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [renewsAt, setRenewsAt] = useState<string | null>(null);

  const load = async () => {
    const { data: p } = await supabase
      .from("user_plans")
      .select("plan")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: s } = await supabase
      .from("subscriptions")
      .select("current_period_end,status,cancel_at_period_end")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setPlan(((p?.plan as Plan) ?? "base"));
    setRenewsAt(s?.current_period_end ?? null);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`plan-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_plans", filter: `user_id=eq.${userId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!plan) return null;
  const meta = META[plan];
  const Icon = meta.icon;
  const renews = renewsAt ? new Date(renewsAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : null;

  return (
    <button
      onClick={onClick}
      title={renews ? `Rinnovo: ${renews}` : "Il tuo piano"}
      className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-body text-xs font-semibold transition-all hover:shadow-sm ${meta.className}`}
    >
      <Icon size={13} />
      <span>{meta.label}</span>
      {renews && <span className="font-normal opacity-70 hidden lg:inline">· rinnovo {renews}</span>}
    </button>
  );
};

export default PlanBadge;
