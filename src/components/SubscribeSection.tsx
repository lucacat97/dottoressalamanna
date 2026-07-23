import { useState, useEffect } from "react";
import { Check, Crown, Sparkles, X, FileText, Loader2, AlertTriangle, Calendar, CreditCard } from "lucide-react";
import { StripeEmbeddedCheckoutView } from "./StripeEmbeddedCheckout";
import { isPaymentsConfigured, getStripeEnvironment } from "@/lib/stripe";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  price_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

type Interval = "monthly" | "yearly";

interface Invoice {
  id: string;
  number: string | null;
  status: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: number;
  period_start: number | null;
  period_end: number | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  description: string | null;
}

const PLANS = [
  {
    id: "basic",
    name: "MILA Basic",
    tagline: "Contenuti riservati e aggiornamenti",
    monthly: { priceId: "mila_basic_monthly", amount: "€5,99" },
    yearly: { priceId: "mila_basic_yearly", amount: "€59,99" },
    features: [
      "Accesso ai materiali riservati",
      "Aggiornamenti continui dei protocolli",
      "Community esclusiva",
      "Download di documenti e checklist",
    ],
    highlight: false,
  },
  {
    id: "pro",
    name: "MILA Pro",
    tagline: "Basic + Assistente AI MILA",
    monthly: { priceId: "mila_pro_monthly", amount: "€19,99" },
    yearly: { priceId: "mila_pro_yearly", amount: "€199,99" },
    features: [
      "Tutto il piano Basic",
      "Fino a 5 consulti AI/mese",
      "Ricerca intelligente nei protocolli",
      "Accesso anticipato a nuovi contenuti",
    ],
    highlight: true,
    icon: Sparkles,
  },
  {
    id: "platinum",
    name: "MILA Platinum",
    tagline: "Uso illimitato + integrazione DELTAMED",
    monthly: { priceId: "mila_platinum_monthly", amount: "€49,99" },
    yearly: { priceId: "mila_platinum_yearly", amount: "€499,99" },
    features: [
      "Tutto il piano Pro",
      "Uso illimitato dell'AI MILA",
      "Integrazione DELTAMED",
      "Sconto 10% sui corsi in presenza",
    ],
    highlight: false,
    icon: Crown,
  },
];

const formatAmount = (amount: number, currency: string) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

const formatDate = (ts: number) => new Date(ts * 1000).toLocaleDateString("it-IT");

const priceToPlanName = (priceId: string) => {
  if (priceId.includes("platinum")) return "MILA Platinum";
  if (priceId.includes("pro")) return "MILA Pro";
  if (priceId.includes("basic")) return "MILA Basic";
  if (priceId.includes("test")) return "MILA Test";
  return "MILA";
};

const SubscribeSection = () => {
  const [interval, setInterval] = useState<Interval>("monthly");
  const [checkout, setCheckout] = useState<{ priceId: string; label: string } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const configured = isPaymentsConfigured();

  const loadSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setSubscriptionLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id,stripe_subscription_id,price_id,status,current_period_end,cancel_at_period_end")
        .eq("user_id", session.user.id)
        .eq("environment", getStripeEnvironment())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setSubscription(data as Subscription | null);
    } catch (e: any) {
      console.error("loadSubscription error:", e);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    const loadInvoices = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setInvoicesLoading(true);
      setInvoicesError(null);
      try {
        const { data, error } = await supabase.functions.invoke("get-stripe-invoices", {
          body: { environment: getStripeEnvironment() },
        });
        if (error) throw error;
        setInvoices(data?.invoices || []);
      } catch (e: any) {
        setInvoicesError(e?.message || "Errore caricamento fatture");
      } finally {
        setInvoicesLoading(false);
      }
    };
    loadSubscription();
    loadInvoices();
  }, []);

  return (
    <section id="abbonamenti" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-gold mb-3">Abbonamenti MILA</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Scegli il tuo piano
          </h2>
          <p className="font-body text-base text-muted-foreground max-w-2xl mx-auto">
            Attiva l'accesso al Metodo MILA direttamente dal sito. Puoi cambiare o annullare in qualsiasi momento dall'area riservata.
          </p>

          <div className="inline-flex items-center gap-1 mt-8 p-1 rounded-full bg-muted border border-border">
            {(["monthly", "yearly"] as Interval[]).map((k) => (
              <button
                key={k}
                onClick={() => setInterval(k)}
                className={`px-5 py-2 rounded-full text-sm font-body font-semibold transition-all ${
                  interval === k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {k === "monthly" ? "Mensile" : "Annuale · risparmi 2 mesi"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = plan[interval];
            const Icon = (plan as any).icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 flex flex-col border transition-all ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground border-primary shadow-elevated scale-[1.02]"
                    : "bg-card text-foreground border-border shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-primary text-[10px] font-body font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Più scelto
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  {Icon && <Icon size={18} className={plan.highlight ? "text-gold" : "text-petrolio"} />}
                  <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                </div>
                <p className={`font-body text-sm mb-6 ${plan.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {plan.tagline}
                </p>
                <div className="mb-6">
                  <span className="font-display text-4xl font-bold">{price.amount}</span>
                  <span className={`font-body text-sm ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {" "}/{interval === "monthly" ? "mese" : "anno"}
                  </span>
                  <p className={`font-body text-[11px] mt-1 ${plan.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    IVA esclusa
                  </p>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 font-body text-sm">
                      <Check size={16} className={`flex-shrink-0 mt-0.5 ${plan.highlight ? "text-gold" : "text-petrolio"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  disabled={!configured}
                  onClick={() => setCheckout({ priceId: price.priceId, label: `${plan.name} — ${price.amount}/${interval === "monthly" ? "mese" : "anno"}` })}
                  className={`w-full py-3 rounded-md font-body font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.highlight
                      ? "bg-gold text-primary hover:bg-gold-light"
                      : "bg-primary text-primary-foreground hover:bg-accent"
                  }`}
                >
                  {configured ? "Abbonati ora" : "Pagamenti in configurazione"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            disabled={!configured}
            onClick={() => setCheckout({ priceId: "mila_test_monthly", label: "MILA Test — €0,10/mese" })}
            className="text-xs font-body text-muted-foreground underline hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Piano di test €0,10/mese (verifica pagamento reale)
          </button>
        </div>

        <p className="text-center font-body text-xs text-muted-foreground mt-8 max-w-2xl mx-auto">
          Pagamenti sicuri gestiti tramite Stripe. Per informazioni fiscali e condizioni consulta il{" "}
          <a href="/documenti/contratto-mila.docx" className="underline hover:text-foreground">contratto MILA</a>.
        </p>

        {invoicesLoading && (
          <div className="mt-16 flex items-center justify-center gap-2 text-muted-foreground font-body text-sm">
            <Loader2 size={16} className="animate-spin" />
            Caricamento fatture...
          </div>
        )}

        {invoicesError && !invoices.length && (
          <div className="mt-16 p-4 rounded-lg bg-muted border border-border text-muted-foreground font-body text-sm">
            {invoicesError}
          </div>
        )}

        {invoices.length > 0 && (
          <div className="mt-16">
            <h3 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <FileText size={22} className="text-petrolio" />
              Fatture e ricevute
            </h3>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Numero</th>
                      <th className="px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Data</th>
                      <th className="px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Periodo</th>
                      <th className="px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Importo</th>
                      <th className="px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Stato</th>
                      <th className="px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-body text-sm text-foreground">{inv.number || inv.id}</td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{formatDate(inv.created)}</td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">
                          {inv.period_start && inv.period_end
                            ? `${formatDate(inv.period_start)} – ${formatDate(inv.period_end)}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 font-body text-sm text-foreground">{formatAmount(inv.amount_due, inv.currency)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-semibold uppercase ${
                              inv.status === "paid"
                                ? "bg-primary/10 text-primary"
                                : inv.status === "open"
                                ? "bg-gold/10 text-gold"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {inv.status === "paid" ? "Pagata" : inv.status === "open" ? "Da pagare" : inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {inv.hosted_invoice_url && (
                            <a
                              href={inv.hosted_invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-body text-sm text-petrolio hover:underline"
                            >
                              <FileText size={14} />
                              Visualizza
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {checkout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setCheckout(null)}>
          <div className="relative w-full max-w-2xl bg-card rounded-lg shadow-elevated max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setCheckout(null)}
              className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground bg-card rounded-full p-1"
              aria-label="Chiudi"
            >
              <X size={20} />
            </button>
            <PaymentTestModeBanner />
            <div className="p-6">
              <h3 className="font-display text-xl font-bold text-foreground mb-1">Completa l'abbonamento</h3>
              <p className="font-body text-sm text-muted-foreground mb-4">{checkout.label}</p>
              <StripeEmbeddedCheckoutView priceId={checkout.priceId} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SubscribeSection;
