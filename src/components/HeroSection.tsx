import lamannaHero from "@/assets/lamanna-hero.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={lamannaSpeaking}
          alt="Dott.ssa Annarita Lamanna durante un corso"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-petrolio-dark/90 via-petrolio-dark/70 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 md:py-40">
        <div className="max-w-2xl">
          <p className="font-body text-sm uppercase tracking-[0.3em] text-gold mb-6 opacity-90">
            Ortodonzia · Postura · Formazione
          </p>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6">
            Dott.ssa Annarita
            <br />
            <span className="italic font-medium">Lamanna</span>
          </h1>
          <p className="font-body text-lg md:text-xl text-primary-foreground/85 leading-relaxed mb-10 max-w-lg">
            Odontoiatra, Ortodontista, Agopuntrice e Nanotectherapist.
            Approccio multidisciplinare per un equilibrio occlusale, neuromuscolare e posturale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#corsi"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-foreground text-petrolio-dark font-body font-semibold text-sm rounded-md hover:bg-gold-light transition-colors"
            >
              Scopri i Corsi
            </a>
            <a
              href="#chi-sono"
              className="inline-flex items-center justify-center px-8 py-4 border border-primary-foreground/30 text-primary-foreground font-body font-medium text-sm rounded-md hover:bg-primary-foreground/10 transition-colors"
            >
              Chi Sono
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
