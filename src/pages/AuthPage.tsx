import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AuthPage = () => {
  const [params] = useSearchParams();
  const inviteToken = params.get("invite");

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Invite flow state
  const [inviteState, setInviteState] = useState<"loading" | "valid" | "invalid" | "done" | null>(
    inviteToken ? "loading" : null
  );
  const [inviteError, setInviteError] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState<string>("");

  const navigate = useNavigate();
  const { toast } = useToast();

  // Validate invite token
  useEffect(() => {
    if (!inviteToken) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("accept-invitation", {
          body: { _check: true, token: inviteToken },
          method: "GET" as any,
        });
        // Fallback to direct GET via fetch (functions.invoke posts by default)
        const url = `https://pjgpducvkdrtigorpzrm.supabase.co/functions/v1/accept-invitation?token=${encodeURIComponent(inviteToken)}`;
        const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const j = await res.json();
        if (j.valid) {
          setInviteEmail(j.email);
          setEmail(j.email);
          setInviteState("valid");
        } else {
          setInviteEmail(j.email || "");
          setInviteError(
            j.reason === "expired" ? "Questo invito è scaduto."
            : j.reason === "already_used" ? "Questo invito è già stato utilizzato."
            : "Invito non valido."
          );
          setInviteState("invalid");
        }
        // unused var to silence TS
        void data; void error;
      } catch (e: any) {
        setInviteError("Impossibile validare l'invito.");
        setInviteState("invalid");
      }
    })();
  }, [inviteToken]);

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      toast({ title: "Password troppo corta", description: "Minimo 8 caratteri.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("accept-invitation", {
      body: { token: inviteToken, password, fullName },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast({ title: "Errore", description: (data as any)?.error || error?.message, variant: "destructive" });
      return;
    }
    setInviteState("done");
    toast({
      title: "Account creato",
      description: "Ti abbiamo inviato una email per confermare l'indirizzo.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/area-riservata");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Registrazione completata",
          description: "Per favore, controlla la tua email per confermare l'account.",
        });
      }
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else { setResetSent(true); toast({ title: "Email inviata", description: "Controlla la tua email per il link di reset." }); }
    setLoading(false);
  };

  // ----- INVITE FLOW UI -----
  if (inviteToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <a href="/" className="block text-center mb-10">
            <span className="font-display text-2xl font-semibold text-foreground">
              Dott.ssa <span className="text-petrolio">Lamanna</span>
            </span>
          </a>
          <div className="bg-card rounded-lg p-8 shadow-elevated border border-border">
            <h1 className="font-display text-2xl font-bold text-foreground mb-2 text-center">
              Attiva il tuo account
            </h1>

            {inviteState === "loading" && (
              <p className="font-body text-sm text-muted-foreground text-center mt-4">Verifica invito...</p>
            )}

            {inviteState === "invalid" && (
              <div className="mt-4 space-y-3 text-center">
                <p className="font-body text-sm text-destructive">{inviteError}</p>
                <Button variant="outline" onClick={() => navigate("/auth")} className="font-body">
                  Vai al login
                </Button>
              </div>
            )}

            {inviteState === "done" && (
              <div className="mt-4 space-y-3 text-center">
                <p className="font-body text-sm text-foreground">
                  ✉️ Ti abbiamo inviato una email a <strong>{inviteEmail}</strong> per confermare l'indirizzo.
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  Dopo la conferma potrai accedere con email e password.
                </p>
                <Button onClick={() => navigate("/auth")} className="font-body">Vai al login</Button>
              </div>
            )}

            {inviteState === "valid" && (
              <>
                <p className="font-body text-sm text-muted-foreground text-center mb-6">
                  Imposta una password per <strong>{inviteEmail}</strong>. Riceverai poi una email per confermare l'indirizzo.
                </p>
                <form onSubmit={handleAcceptInvite} className="space-y-5">
                  <div>
                    <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Nome Completo</label>
                    <input
                      type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-base md:text-sm text-foreground"
                      placeholder="Il tuo nome" required
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Email</label>
                    <input type="email" value={inviteEmail} disabled
                      className="w-full px-4 py-3 rounded-md border border-input bg-muted font-body text-base md:text-sm text-muted-foreground" />
                  </div>
                  <div>
                    <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Password (min 8 caratteri)</label>
                    <input
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-base md:text-sm text-foreground"
                      required minLength={8}
                    />
                  </div>
                  <Button type="submit" disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-body font-semibold hover:bg-accent">
                    {loading ? "Creazione..." : "Crea account"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----- FORGOT PASSWORD UI -----
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <a href="/" className="block text-center mb-10">
            <span className="font-display text-2xl font-semibold text-foreground">
              Dott.ssa <span className="text-petrolio">Lamanna</span>
            </span>
          </a>
          <div className="bg-card rounded-lg p-8 shadow-elevated border border-border">
            <h1 className="font-display text-2xl font-bold text-foreground mb-2 text-center">Recupera Password</h1>
            <p className="font-body text-sm text-muted-foreground text-center mb-8">
              Inserisci la tua email per ricevere il link di reset
            </p>
            {resetSent ? (
              <div className="text-center space-y-4">
                <p className="font-body text-sm text-foreground">✉️ Email inviata a <strong>{resetEmail}</strong></p>
                <Button variant="outline" onClick={() => { setShowForgotPassword(false); setResetSent(false); }} className="font-body">
                  Torna al login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Email</label>
                  <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-base md:text-sm text-foreground"
                    placeholder="La tua email" required />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-body font-semibold hover:bg-accent">
                  {loading ? "Invio..." : "Invia link di reset"}
                </Button>
              </form>
            )}
            {!resetSent && (
              <p className="font-body text-sm text-muted-foreground text-center mt-6">
                <button onClick={() => setShowForgotPassword(false)} className="text-petrolio font-semibold hover:underline">
                  Torna al login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----- LOGIN / SIGNUP UI (no Google) -----
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <a href="/" className="block text-center mb-10">
          <span className="font-display text-2xl font-semibold text-foreground">
            Dott.ssa <span className="text-petrolio">Lamanna</span>
          </span>
        </a>
        <div className="bg-card rounded-lg p-8 shadow-elevated border border-border">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2 text-center">
            {isLogin ? "Accedi" : "Registrati"}
          </h1>
          <p className="font-body text-sm text-muted-foreground text-center mb-8">
            {isLogin ? "Accedi alla tua area riservata" : "Crea il tuo account"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Nome Completo</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-base md:text-sm text-foreground"
                  placeholder="Il tuo nome" required />
              </div>
            )}
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-base md:text-sm text-foreground"
                placeholder="La tua email" required />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-base md:text-sm text-foreground"
                placeholder="La tua password" required minLength={6} />
            </div>
            {isLogin && (
              <div className="text-right">
                <button type="button" onClick={() => setShowForgotPassword(true)} className="font-body text-xs text-petrolio hover:underline">
                  Password dimenticata?
                </button>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-body font-semibold hover:bg-accent">
              {loading ? "Caricamento..." : isLogin ? "Accedi" : "Registrati"}
            </Button>
          </form>

          <p className="font-body text-sm text-muted-foreground text-center mt-6">
            {isLogin ? "Non hai un account?" : "Hai già un account?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-petrolio font-semibold hover:underline">
              {isLogin ? "Registrati" : "Accedi"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
