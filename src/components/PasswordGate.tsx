import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";

const STORAGE_KEY = "site-access-token";
const GATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/site-gate`;

const PasswordGate = ({ children }: { children: React.ReactNode }) => {
  const [granted, setGranted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // On mount, verify stored token server-side
  useEffect(() => {
    const token = sessionStorage.getItem(STORAGE_KEY);
    if (!token) {
      setChecking(false);
      return;
    }
    fetch(GATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify-token", token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) setGranted(true);
        else sessionStorage.removeItem(STORAGE_KEY);
      })
      .catch(() => sessionStorage.removeItem(STORAGE_KEY))
      .finally(() => setChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);

    try {
      const resp = await fetch(GATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-password", password: input }),
      });
      const data = await resp.json();
      if (data.valid && data.token) {
        sessionStorage.setItem(STORAGE_KEY, data.token);
        setGranted(true);
      } else {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } catch {
      setError(true);
      setTimeout(() => setError(false), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (granted) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Lock className="w-7 h-7 text-muted-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Sito in anteprima
        </h1>
        <p className="font-body text-sm text-muted-foreground mb-8">
          Inserisci la password per accedere al sito.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-center"
            autoFocus
            disabled={submitting}
          />
          {error && (
            <p className="font-body text-sm text-destructive">Password errata.</p>
          )}
          <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground font-body font-semibold hover:bg-accent">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accedi"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PasswordGate;
