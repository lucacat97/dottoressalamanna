import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { label: "Chi Sono", href: "#chi-sono" },
    { label: "Corsi", href: "#corsi" },
    { label: "Galleria", href: "#galleria" },
    { label: "Contatti", href: "#contatti" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" className="font-display text-xl font-semibold text-foreground">
          Dott.ssa <span className="text-petrolio">Lamanna</span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-body text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Button
            variant="default"
            size="sm"
            className="bg-primary hover:bg-accent text-primary-foreground font-body"
            onClick={() => navigate("/login")}
          >
            Area Riservata
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-foreground"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 pb-6 space-y-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Button
            variant="default"
            size="sm"
            className="w-full bg-primary hover:bg-accent text-primary-foreground font-body"
            onClick={() => { setIsOpen(false); navigate("/login"); }}
          >
            Area Riservata
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
