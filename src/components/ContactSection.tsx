import { Mail, Phone, MapPin } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contatti" className="py-24 md:py-32 bg-petrolio-dark">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Info */}
          <div>
            <p className="font-body text-sm uppercase tracking-[0.2em] text-gold mb-4">
              Contatti
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              Restiamo in Contatto
            </h2>
            <p className="font-body text-primary-foreground/75 leading-relaxed mb-10">
              Vuoi saperne di più sui corsi o richiedere una consulenza?
              Compila il modulo oppure contattaci direttamente.
            </p>

            <div className="space-y-6">
              {[
                { icon: Mail, text: "info@dottssalamanna.it" },
                { icon: Phone, text: "+39 XXX XXX XXXX" },
                { icon: MapPin, text: "Italia" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-md bg-primary-foreground/10 flex items-center justify-center">
                    <Icon size={18} className="text-gold" />
                  </div>
                  <span className="font-body text-sm text-primary-foreground/85">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-card rounded-lg p-8 shadow-elevated">
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Nome e Cognome
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Il tuo nome"
                />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="La tua email"
                />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Messaggio
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Scrivi il tuo messaggio..."
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-primary text-primary-foreground font-body font-semibold text-sm rounded-md hover:bg-accent transition-colors"
              >
                Invia Messaggio
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
