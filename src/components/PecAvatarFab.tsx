import { useState } from "react";
import { Mail } from "lucide-react";
import ConsultationRequestModal from "./ConsultationRequestModal";
import avatar from "@/assets/dottoressa-lamanna-avatar.png.asset.json";

const DIRECT_EMAIL = "dott.lamanna.a@gmail.com";

const PecAvatarFab = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Scrivi alla Dott.ssa Lamanna"
        className="fixed bottom-24 right-6 sm:bottom-6 sm:right-28 z-50 group flex items-center gap-3 animate-in fade-in"
      >
        <span className="hidden sm:flex flex-col items-end pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="font-display text-xs font-semibold text-foreground bg-card border border-border rounded-full px-3 py-1 shadow-md">
            Scrivi alla Dott.ssa
          </span>
        </span>
        <span className="relative inline-flex">
          <span className="absolute inset-0 rounded-full bg-gold/30 blur-md group-hover:bg-gold/50 transition-all" />
          <span className="relative w-16 h-16 rounded-full overflow-hidden ring-4 ring-gold bg-card shadow-elevated hover:scale-105 transition-transform">
            <img
              src={avatar.url}
              alt="Dott.ssa Annarita Lamanna"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </span>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-petrolio text-primary-foreground flex items-center justify-center shadow-md ring-2 ring-background">
            <Mail size={12} />
          </span>
        </span>
      </button>

      <ConsultationRequestModal
        open={open}
        onClose={() => setOpen(false)}
        recipientEmail={DIRECT_EMAIL}
        variant="direct"
        eyebrow="Contatto diretto"
        title="Scrivi alla Dott.ssa Lamanna"
        description="La tua richiesta arriverà direttamente alla Dott.ssa Annarita Lamanna. Puoi allegare immagini, radiografie o PDF utili al caso."
        allowAttachments
      />
    </>
  );
};

export default PecAvatarFab;
