import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
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
