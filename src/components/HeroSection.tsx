import { useParallax } from "@/hooks/useParallax";
import { motion } from "framer-motion";
import lamannaHero from "@/assets/lamanna-hero-cutout-v2.png";

const HeroSection = () => {
  const parallaxOffset = useParallax(0.4);

  return (
    <section className="relative min-h-[110vh] flex items-center overflow-hidden">
      {/* Parallax background layer */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translateY(${parallaxOffset}px) scale(${1 + parallaxOffset * 0.0005})`
        }}>
        
        <div className="absolute inset-0 bg-petrolio-dark" />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-petrolio-dark via-petrolio-dark/60 to-petrolio-dark/30 z-[1]" />

      {/* Hero image - floating parallax with opposite direction */}
      <div
        className="absolute right-0 bottom-[-5%] h-[115%] w-auto z-[2] will-change-transform"
        style={{
          transform: `translateY(${-parallaxOffset * 0.6}px)`
        }}>
        
        <img
          src={lamannaHero}
          alt="Dott.ssa Annarita Lamanna"
          width="1200"
          height="1600"
          fetchPriority="high"
          decoding="async"
          className="h-full w-auto object-contain object-bottom drop-shadow-[0_0_80px_rgba(0,0,0,0.5)]"
          style={{ mixBlendMode: 'multiply' }} />
        
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-petrolio-dark/40 pointer-events-none" />
      </div>

      {/* Content */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-6 py-32 md:py-40 w-full"
        style={{
          transform: `translateY(${parallaxOffset * 0.15}px)`,
          opacity: Math.max(0, 1 - parallaxOffset * 0.002)
        }}>
        
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-body uppercase tracking-[0.3em] text-gold mb-6 text-lg">
            
            Ortodonzia · Postura · Formazione
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6">
            
            Dott.ssa Annarita
            <br />
            <span className="italic font-medium">Lamanna</span>
            <span className="sr-only"> — Ortodonzia e Postura</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="font-body text-lg md:text-xl text-primary-foreground/85 leading-relaxed mb-10 max-w-lg">
            
            Odontoiatra, Ortodontista, Agopuntrice e Nanotectherapist.
            Approccio multidisciplinare per un equilibrio occlusale, neuromuscolare e posturale.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4">
            
            <a
              href="#edizioni"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-foreground text-petrolio-dark font-body font-semibold rounded-md hover:bg-gold-light transition-all duration-300 hover:scale-105 text-base">
              
              Scopri le Prossime Edizioni
            </a>
            <a
              href="#chi-sono"
              className="inline-flex items-center justify-center px-8 py-4 border border-primary-foreground/30 text-primary-foreground font-body font-medium rounded-md hover:bg-primary-foreground/10 transition-all duration-300 text-base">
              
              Chi Sono
            </a>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[3]" />
    </section>);

};

export default HeroSection;