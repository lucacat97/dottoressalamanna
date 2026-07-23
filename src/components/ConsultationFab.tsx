import { useState } from "react";
import { MessageCircleHeart } from "lucide-react";
import ConsultationRequestModal from "./ConsultationRequestModal";

const ConsultationFab = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Richiedi una consulenza personalizzata"
        className="fixed bottom-6 right-6 z-50 group inline-flex items-center gap-2 pl-4 pr-5 py-3 bg-gold text-primary rounded-full shadow-elevated hover:bg-gold-light hover:scale-105 transition-all font-body font-semibold text-sm"
      >
        <MessageCircleHeart size={18} />
        <span className="hidden sm:inline">Richiedi Consulenza</span>
        <span className="sm:hidden">Consulenza</span>
      </button>
      <ConsultationRequestModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default ConsultationFab;
