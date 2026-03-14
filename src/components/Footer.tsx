const Footer = () => {
  return (
    <footer className="bg-petrolio-dark border-t border-primary-foreground/10 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-display text-sm text-primary-foreground/60">
          © 2026 Dott.ssa Annarita Lamanna. Tutti i diritti riservati.
        </p>
        <div className="flex gap-6">
          <a href="#" className="font-body text-xs text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="font-body text-xs text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors">
            Cookie Policy
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
