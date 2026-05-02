import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_LIMIT = 30;

/**
 * Returns the per-tool monthly limit assigned to the current user via api_keys.tool_limits.
 * Admins (and any user with no specific override) fall back to DEFAULT_LIMIT.
 *
 * apiToolKey: "diagnosis" | "orthodontic" | "mtc_sistemica" | "mtc_organica"
 */
export function useToolLimits(apiToolKeys: string[]) {
  const [limits, setLimits] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    apiToolKeys.forEach((k) => (init[k] = DEFAULT_LIMIT));
    return init;
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        if (!cancelled) setLoaded(true);
        return;
      }
      // Admins keep default; for everyone else fetch personalised limits.
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin" as never,
      });
      if (isAdmin) {
        if (!cancelled) setLoaded(true);
        return;
      }
      try {
        const { data } = await supabase.functions.invoke("check-tool-access", {
          body: { email: user.email },
        });
        const tl = (data?.toolLimits ?? {}) as Record<string, number>;
        if (cancelled) return;
        setLimits((prev) => {
          const next = { ...prev };
          apiToolKeys.forEach((k) => {
            const v = tl[k];
            if (typeof v === "number" && v > 0) next[k] = v;
          });
          return next;
        });
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiToolKeys.join(",")]);

  return { limits, loaded };
}
