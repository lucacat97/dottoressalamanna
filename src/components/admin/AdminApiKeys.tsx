import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Key, Plus, Trash2, Copy, Eye, EyeOff, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ApiKey {
  id: string;
  key_hash: string;
  client_name: string;
  client_email: string | null;
  tools: string[];
  monthly_limit: number;
  tool_limits: Record<string, number> | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

const TOOL_LABELS: Record<string, string> = {
  diagnosis: "Supporto Diagnosi",
  orthodontic: "Diagnosi Ortodontica",
  mtc_sistemica: "MTC Sistemica",
  mtc_organica: "MTC Organica",
};

// Generate a random API key
function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(40);
  crypto.getRandomValues(array);
  let result = "sk_live_";
  for (const byte of array) {
    result += chars[byte % chars.length];
  }
  return result;
}

// SHA-256 hash
async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const AdminApiKeys = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newTools, setNewTools] = useState<string[]>(["diagnosis", "orthodontic", "mtc_sistemica", "mtc_organica"]);
  const [newLimit, setNewLimit] = useState(30);
  const [newToolLimits, setNewToolLimits] = useState<Record<string, number>>({ diagnosis: 30, orthodontic: 30, mtc_sistemica: 30, mtc_organica: 30 });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [usageCounts, setUsageCounts] = useState<Record<string, Record<string, number>>>({});

  const TOOL_KEYS = Object.keys(TOOL_LABELS);

  const fetchKeys = async () => {
    const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
    if (data) {
      setKeys(data as unknown as ApiKey[]);
      // Fetch usage per tool for each key
      const counts: Record<string, Record<string, number>> = {};
      for (const key of data) {
        counts[key.id] = {};
        for (const tool of TOOL_KEYS) {
          const { data: count } = await supabase.rpc("get_api_key_monthly_usage", {
            _api_key_id: key.id,
            _tool_name: tool,
          });
          counts[key.id][tool] = count || 0;
        }
      }
      setUsageCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async () => {
    if (!newClientName.trim()) return;
    setCreating(true);

    const plainKey = generateApiKey();
    const keyHash = await hashKey(plainKey);

    const { error } = await supabase.from("api_keys").insert({
      key_hash: keyHash,
      client_name: newClientName.trim(),
      client_email: newClientEmail.trim() || null,
      tools: newTools,
      monthly_limit: newLimit,
      tool_limits: Object.fromEntries(newTools.map(t => [t, newToolLimits[t] || newLimit])),
    } as any);

    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      setGeneratedKey(plainKey);
      setShowKey(true);
      setNewClientName("");
      setNewClientEmail("");
      toast({ title: "Chiave API creata", description: "Copia la chiave ora — non sarà più visibile." });
      fetchKeys();
    }
    setCreating(false);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: !currentActive } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentActive ? "Chiave disattivata" : "Chiave riattivata" });
      fetchKeys();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questa chiave API? L'azione è irreversibile.")) return;
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Chiave eliminata" });
      fetchKeys();
    }
  };

  const handleUpdateLimit = async (id: string, newLimitVal: number) => {
    const { error } = await supabase
      .from("api_keys")
      .update({ monthly_limit: newLimitVal } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Limite aggiornato" });
      fetchKeys();
    }
  };

  const handleUpdateTools = async (id: string, tools: string[]) => {
    const { error } = await supabase
      .from("api_keys")
      .update({ tools } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Permessi aggiornati" });
      fetchKeys();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiato negli appunti" });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) return <p className="font-body text-sm text-muted-foreground">Caricamento...</p>;

  return (
    <div className="space-y-6">
      {/* Generated key alert */}
      {generatedKey && (
        <div className="bg-gold/10 border border-gold/30 rounded-lg p-5">
          <h4 className="font-display text-sm font-semibold text-foreground mb-2">⚠️ Chiave API Generata</h4>
          <p className="font-body text-xs text-muted-foreground mb-3">
            Copia questa chiave ora. Non sarà più visibile dopo aver chiuso questo avviso.
          </p>
          <div className="flex items-center gap-2 bg-background rounded-md p-3 border border-border">
            <code className="font-mono text-sm text-foreground flex-1 break-all">
              {showKey ? generatedKey : "••••••••••••••••••••••••••••••••"}
            </code>
            <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedKey)}>
              <Copy size={14} />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setGeneratedKey(null)}>
            Ho copiato la chiave
          </Button>
        </div>
      )}

      {/* Create new key */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-1">Nuova Chiave API</h4>
        <p className="font-body text-xs text-muted-foreground mb-3">
          Ogni licenza software dovrebbe avere la propria chiave API univoca. L'email collega la licenza all'account sul sito.
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Nome cliente / licenza..."
              className="flex-1 px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="email"
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
              placeholder="Email cliente..."
              className="flex-1 px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-body text-xs text-muted-foreground">Strumenti e limiti:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(TOOL_LABELS).map(([key, label]) => (
              <div key={key} className={`border rounded-lg p-2.5 ${newTools.includes(key) ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20 opacity-50"}`}>
                <label className="flex items-center gap-1.5 font-body text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTools.includes(key)}
                    onChange={(e) => {
                      if (e.target.checked) setNewTools([...newTools, key]);
                      else setNewTools(newTools.filter((t) => t !== key));
                    }}
                    className="rounded border-input"
                  />
                  {label}
                </label>
                {newTools.includes(key) && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <input
                      type="number"
                      value={newToolLimits[key] || 30}
                      onChange={(e) => setNewToolLimits({ ...newToolLimits, [key]: parseInt(e.target.value) || 30 })}
                      min={1}
                      className="w-16 px-2 py-1 rounded border border-input bg-background font-body text-xs text-foreground"
                    />
                    <span className="font-body text-[10px] text-muted-foreground">/mese</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleCreate} disabled={!newClientName.trim() || creating || newTools.length === 0} className="w-fit bg-primary text-primary-foreground font-body">
            <Plus size={16} className="mr-2" />
            {creating ? "Creazione..." : "Genera Chiave API"}
          </Button>
        </div>
      </div>

      {/* Existing keys */}
      {keys.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground italic">Nessuna chiave API creata.</p>
      ) : (
        <div className="space-y-3">
          {keys.map((apiKey) => (
            <div key={apiKey.id} className={`bg-card border rounded-lg p-5 ${apiKey.is_active ? "border-border" : "border-destructive/30 opacity-60"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Key size={14} className={apiKey.is_active ? "text-petrolio" : "text-destructive"} />
                    <h4 className="font-display text-sm font-semibold text-foreground">{apiKey.client_name}</h4>
                    <span className={`font-body text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${apiKey.is_active ? "bg-primary/10 text-petrolio" : "bg-destructive/10 text-destructive"}`}>
                      {apiKey.is_active ? "Attiva" : "Disattivata"}
                    </span>
                  </div>
                  {(apiKey as any).client_email && (
                    <p className="font-body text-xs text-muted-foreground mb-1">📧 {(apiKey as any).client_email}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground font-body">
                    <span>Creata: {formatDate(apiKey.created_at)}</span>
                    {apiKey.last_used_at && <span>Ultimo uso: {formatDate(apiKey.last_used_at)}</span>}
                  </div>
                  {usageCounts[apiKey.id] && (
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <BarChart3 size={12} className="text-muted-foreground" />
                      {Object.entries(TOOL_LABELS).map(([toolKey, toolLabel]) => {
                        const count = usageCounts[apiKey.id]?.[toolKey] || 0;
                        const limit = (apiKey.tool_limits as Record<string, number> | null)?.[toolKey] ?? apiKey.monthly_limit;
                        const isOver = count >= limit;
                        return (
                          <span key={toolKey} className={`font-body text-[11px] px-2 py-0.5 rounded-full border ${isOver ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-muted/30 border-border text-muted-foreground"}`}>
                            {toolLabel}: <strong>{count}</strong>/{limit}
                          </span>
                        );
                      })}
                      <span className="font-body text-[11px] text-muted-foreground">
                        (tot: {Object.values(usageCounts[apiKey.id] || {}).reduce((a, b) => a + b, 0)})
                      </span>
                    </div>
                  )}
                  {/* Inline tools + limit editing */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="font-body text-xs text-muted-foreground">Strumenti:</span>
                    {Object.entries(TOOL_LABELS).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-1 font-body text-xs">
                        <input
                          type="checkbox"
                          checked={(apiKey.tools || []).includes(key)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...(apiKey.tools || []), key]
                              : (apiKey.tools || []).filter((t) => t !== key);
                            if (updated.length > 0) handleUpdateTools(apiKey.id, updated);
                          }}
                          className="rounded border-input"
                        />
                        {label}
                      </label>
                    ))}
                    <span className="font-body text-xs text-muted-foreground ml-2">Limite:</span>
                    <input
                      type="number"
                      defaultValue={apiKey.monthly_limit}
                      min={1}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value);
                        if (val && val !== apiKey.monthly_limit) handleUpdateLimit(apiKey.id, val);
                      }}
                      className="w-20 px-2 py-1 rounded border border-input bg-background font-body text-xs text-foreground"
                    />
                    <span className="font-body text-xs text-muted-foreground">/mese</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-xs ${apiKey.is_active ? "text-destructive" : "text-petrolio"}`}
                    onClick={() => handleToggleActive(apiKey.id, apiKey.is_active)}
                  >
                    {apiKey.is_active ? "Disattiva" : "Riattiva"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(apiKey.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApiKeys;
