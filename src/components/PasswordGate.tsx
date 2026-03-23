import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const PASSWORD_HASH = "94499df1027d64ea9be1714dcb252fd0af43361196f95a184800696bb2457cac";
const STORAGE_KEY = "site-access-granted";

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const PasswordGate = ({ children }: { children: React.ReactNode }) => {
  const [granted, setGranted] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "true") {
      setGranted(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputHash = await sha256(input);
    if (inputHash === PASSWORD_HASH) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setGranted(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

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
          />
          {error && (
            <p className="font-body text-sm text-destructive">Password errata.</p>
          )}
          <Button type="submit" className="w-full bg-primary text-primary-foreground font-body font-semibold hover:bg-accent">
            Accedi
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PasswordGate;
