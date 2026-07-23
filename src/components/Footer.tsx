import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-petrolio-dark border-t border-primary-foreground/10 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-display text-sm text-primary-foreground/60">
          © 2026 Dott.ssa Annarita Lamanna. Tutti i diritti riservati.
        </p>
        <div className="flex flex-wrap gap-6 justify-center">
          <Link to="/area-riservata?tab=documenti" className="font-body text-xs text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors">
            Informativa Privacy & GDPR
          </Link>
          <Link to="/area-riservata?tab=documenti" className="font-body text-xs text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors">
            Regolamento AI MILA
          </Link>
          <Link to="/area-riservata?tab=documenti" className="font-body text-xs text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors">
            Contratto di Consulenza
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
