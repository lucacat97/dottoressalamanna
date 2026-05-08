import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Status = "validating" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<Status>("validating");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
        const resp = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) { setStatus("invalid"); setErrorMsg(data?.error || ""); return; }
        if (data?.valid === false && data?.reason === "already_unsubscribed") { setStatus("already"); return; }
        if (data?.valid === true) { setStatus("valid"); return; }
        setStatus("invalid");
      } catch (e) {
        setStatus("error");
        setErrorMsg(String((e as Error)?.message || e));
      }
    };
    validate();
  }, [token]);

  const handleConfirm = async () => {
    setStatus("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) { setStatus("error"); setErrorMsg(String(error.message || error)); return; }
      if ((data as any)?.success || (data as any)?.reason === "already_unsubscribed") {
        setStatus("done");
      } else {
        setStatus("error");
        setErrorMsg("Operazione non completata.");
      }
    } catch (e) {
      setStatus("error");
      setErrorMsg(String((e as Error)?.message || e));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 space-y-5 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <MailX size={26} className="text-petrolio" />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">Disiscrizione email</h1>

        {status === "validating" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="animate-spin text-petrolio" size={24} />
            <p className="font-body text-sm text-muted-foreground">Verifica del link in corso...</p>
          </div>
        )}

        {status === "valid" && (
          <>
            <p className="font-body text-sm text-muted-foreground">
              Confermi di non voler più ricevere email da questo indirizzo?
            </p>
            <Button onClick={handleConfirm} className="w-full font-body">
              Sì, disiscrivimi
            </Button>
          </>
        )}

        {status === "submitting" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="animate-spin text-petrolio" size={24} />
            <p className="font-body text-sm text-muted-foreground">Elaborazione...</p>
          </div>
        )}

        {status === "done" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="text-emerald-600" size={28} />
            <p className="font-body text-sm text-foreground">Disiscrizione completata. Non riceverai più email.</p>
          </div>
        )}

        {status === "already" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="text-emerald-600" size={28} />
            <p className="font-body text-sm text-foreground">Risulti già disiscritto da questo indirizzo.</p>
          </div>
        )}

        {(status === "invalid" || status === "error") && (
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle className="text-destructive" size={28} />
            <p className="font-body text-sm text-foreground">
              {status === "invalid" ? "Link non valido o scaduto." : "Si è verificato un errore."}
            </p>
            {errorMsg && <p className="font-body text-xs text-muted-foreground">{errorMsg}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
