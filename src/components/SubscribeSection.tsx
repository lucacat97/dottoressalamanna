import { useState } from "react";
import { Check, Crown, Sparkles, X } from "lucide-react";
import { StripeEmbeddedCheckoutView } from "./StripeEmbeddedCheckout";
import { isPaymentsConfigured } from "@/lib/stripe";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";

type Interval = "monthly" | "yearly";

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

const SubscribeSection = () => {
  const [interval, setInterval] = useState<Interval>("monthly");
  const [checkout, setCheckout] = useState<{ priceId: string; label: string } | null>(null);
  const configured = isPaymentsConfigured();

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
