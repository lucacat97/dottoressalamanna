import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HeartPulse, GraduationCap, ArrowRight } from "lucide-react";

const HomeChooser = () => {
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <motion.button
        onClick={() => nav("/pazienti")}
        whileHover={{ flexGrow: 1.05 }}
        className="group relative flex-1 min-h-[50vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-cream text-petrolio-dark px-8 py-16 text-left transition-all"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-secondary to-cream opacity-80" />
        <div className="relative z-10 max-w-md space-y-5">
          <HeartPulse size={36} className="text-petrolio" />
          <p className="font-body text-xs uppercase tracking-[0.3em] text-petrolio/70">Per i pazienti</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">Il tuo corpo parla. Impariamo ad <span className="italic text-petrolio">ascoltarlo</span>.</h2>
          <p className="font-body text-base text-foreground/75 leading-relaxed">Cefalee, bruxismo, dolori cervicali, recidive ortodontiche, sonno disturbato? Scopri il <strong>Check-up Ortodontico Posturale</strong>.</p>
          <span className="inline-flex items-center gap-2 font-body font-semibold text-petrolio group-hover:gap-3 transition-all">
            Scopri il Check-up <ArrowRight size={18} />
          </span>
        </div>
      </motion.button>

      <motion.button
        onClick={() => nav("/professionisti")}
        whileHover={{ flexGrow: 1.05 }}
        className="group relative flex-1 min-h-[50vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-petrolio-dark text-primary-foreground px-8 py-16 text-left transition-all"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-petrolio-dark via-petrolio to-petrolio-dark opacity-90" />
        <div className="relative z-10 max-w-md space-y-5">
          <GraduationCap size={36} className="text-gold" />
          <p className="font-body text-xs uppercase tracking-[0.3em] text-gold/80">Per i professionisti</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">Formazione, strumenti e <span className="italic text-gold">consulenza</span> clinica.</h2>
          <p className="font-body text-base text-primary-foreground/75 leading-relaxed">Sei odontoiatra, posturologo, logopedista? Accedi a corsi, edizioni live e ai supporti diagnostici basati sul Metodo MILA.</p>
          <span className="inline-flex items-center gap-2 font-body font-semibold text-gold group-hover:gap-3 transition-all">
            Area Professionisti <ArrowRight size={18} />
          </span>
        </div>
      </motion.button>
    </div>
  );
};
export default HomeChooser;
