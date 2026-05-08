import { Link } from "react-router-dom";
import { Stethoscope, HeartPulse } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Benvenuto = () => {
  return (
    <>
      <Helmet>
        <title>Benvenuto · Dott.ssa Annarita La Manna</title>
        <meta
          name="description"
          content="Scegli il tuo percorso: area dedicata ai professionisti o spazio informativo per i pazienti del Metodo Olistico La Manna."
        />
        <link rel="canonical" href="https://dottoressalamanna.com/benvenuto" />
      </Helmet>

      <main className="min-h-screen flex flex-col md:flex-row">
        {/* PAZIENTI */}
        <Link
          to="/pazienti"
          className="group relative flex-1 flex items-center justify-center overflow-hidden bg-[hsl(var(--cream))] transition-all duration-500 md:hover:flex-[1.15] focus:outline-none"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gold-light)/0.35)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 text-center px-8 py-20 max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[hsl(var(--gold-warm)/0.15)] mb-8 group-hover:scale-110 transition-transform duration-500">
              <HeartPulse className="w-10 h-10 text-[hsl(var(--gold-warm))]" strokeWidth={1.5} />
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--gold-warm))] mb-4 font-medium">
              Per te
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl text-[hsl(var(--petrolio-dark))] mb-6">
              Pazienti
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-8">
              Scopri il Metodo Olistico La&nbsp;Manna e fai un breve test
              gratuito per capire se può aiutarti.
            </p>
            <span className="inline-block text-sm font-medium text-[hsl(var(--petrolio))] border-b border-[hsl(var(--petrolio)/0.4)] pb-1 group-hover:border-[hsl(var(--petrolio))] transition-colors">
              Entra nello spazio pazienti →
            </span>
          </div>
        </Link>

        {/* Divider */}
        <div className="hidden md:block w-px bg-[hsl(var(--border))]" />
        <div className="md:hidden h-px bg-[hsl(var(--border))]" />

        {/* PROFESSIONISTI */}
        <Link
          to="/"
          className="group relative flex-1 flex items-center justify-center overflow-hidden bg-[hsl(var(--petrolio-dark))] transition-all duration-500 md:hover:flex-[1.15] focus:outline-none"
        >
          <div className="absolute inset-0 bg-gradient-to-tl from-[hsl(var(--petrolio-light)/0.4)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 text-center px-8 py-20 max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[hsl(var(--petrolio-light)/0.3)] mb-8 group-hover:scale-110 transition-transform duration-500">
              <Stethoscope className="w-10 h-10 text-[hsl(var(--gold-light))]" strokeWidth={1.5} />
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--gold-light))] mb-4 font-medium">
              Area clinica
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl text-[hsl(var(--cream))] mb-6">
              Professionisti
            </h2>
            <p className="text-[hsl(var(--cream)/0.75)] leading-relaxed mb-8">
              Corsi, strumenti clinici di IA, consulenze sui casi e Metodo
              MILA per ortodontisti, odontoiatri e fisioterapisti.
            </p>
            <span className="inline-block text-sm font-medium text-[hsl(var(--gold-light))] border-b border-[hsl(var(--gold-light)/0.5)] pb-1 group-hover:border-[hsl(var(--gold-light))] transition-colors">
              Vai al sito professionale →
            </span>
          </div>
        </Link>
      </main>
    </>
  );
};

export default Benvenuto;
