import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Fail closed; the server checks the signed-in user's verified email. */
export function useAutomaticCephalometryAccess() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const check = async (current: number) => {
      try {
        const { data, error } = await supabase.rpc("can_use_automatic_cephalometry");
        if (active && current === revision) setAllowed(!error && data === true);
      } catch {
        if (active && current === revision) setAllowed(false);
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = ++revision;
      setAllowed(false);
      if (session) queueMicrotask(() => { if (active) void check(current); });
    });
    void check(revision);
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return allowed;
}