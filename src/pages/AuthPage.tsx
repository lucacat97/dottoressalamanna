import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: "Errore", description: "Impossibile accedere con Google.", variant: "destructive" });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      setResetSent(true);
      toast({ title: "Email inviata", description: "Controlla la tua email per il link di reset." });
    }
    setLoading(false);
  };

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
            <h1 className="font-display text-2xl font-bold text-foreground mb-2 text-center">
              Recupera Password
            </h1>
            <p className="font-body text-sm text-muted-foreground text-center mb-8">
              Inserisci la tua email per ricevere il link di reset
            </p>

            {resetSent ? (
              <div className="text-center space-y-4">
                <p className="font-body text-sm text-foreground">
                  ✉️ Email inviata a <strong>{resetEmail}</strong>
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  Controlla la tua casella di posta e segui il link per reimpostare la password.
                </p>
                <Button variant="outline" onClick={() => { setShowForgotPassword(false); setResetSent(false); }} className="font-body">
                  Torna al login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="La tua email"
                    required
                  />
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
            {isLogin ? "Accedi alla tua area riservata" : "Crea il tuo account per accedere ai corsi"}
          </p>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full mb-4 font-body text-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continua con Google
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 border-t border-border" />
            <span className="font-body text-xs text-muted-foreground">oppure</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Il tuo nome"
                  required
                />
              </div>
            )}
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="La tua email"
                required
              />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="La tua password"
                required
                minLength={6}
              />
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="font-body text-xs text-petrolio hover:underline"
                >
                  Password dimenticata?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-body font-semibold hover:bg-accent"
            >
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
