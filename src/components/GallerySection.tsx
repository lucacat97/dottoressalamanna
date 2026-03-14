import corsoAula from "@/assets/corso-aula.jpg";
import locationHotel from "@/assets/location-hotel.jpg";
import lamannaLezione from "@/assets/lamanna-lezione.jpg";
import lamannaEsercizi from "@/assets/lamanna-esercizi.jpg";
import lamannaSpiegazione from "@/assets/lamanna-spiegazione.jpg";
import corsoPlatea from "@/assets/corso-platea.jpg";
import meetintao24 from "@/assets/meetintao-24.jpg";
import meetintao25 from "@/assets/meetintao-25.jpg";
import meetintao26 from "@/assets/meetintao-26.jpg";
import meetintao109 from "@/assets/meetintao-109.jpg";
import AnimatedSection from "./AnimatedSection";

const images = [
  { src: corsoAula, alt: "Aula del corso con partecipanti", span: "md:col-span-2" },
  { src: meetintao25, alt: "Dott.ssa Lamanna - Meet in TAO", span: "" },
  { src: lamannaLezione, alt: "Dott.ssa Lamanna durante una lezione", span: "" },
  { src: meetintao109, alt: "Dott.ssa Lamanna in conversazione", span: "md:col-span-2" },
  { src: lamannaEsercizi, alt: "Dimostrazione di esercizi correttivi", span: "" },
  { src: meetintao26, alt: "Dott.ssa Lamanna all'evento TAO", span: "" },
  { src: lamannaSpiegazione, alt: "Spiegazione delle fibre trigeminali", span: "" },
  { src: meetintao24, alt: "Dott.ssa Lamanna - evento professionale", span: "" },
  { src: locationHotel, alt: "Location elegante dei corsi", span: "" },
  { src: corsoPlatea, alt: "Partecipanti al corso", span: "md:col-span-2" },
];

const GallerySection = () => {
  return (
    <section id="galleria" className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <p className="font-body text-sm uppercase tracking-[0.2em] text-gold mb-4">
              Galleria
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              I Nostri Eventi
            </h2>
            <p className="font-body text-muted-foreground max-w-xl mx-auto">
              Momenti dai corsi e dagli eventi formativi della Dott.ssa Lamanna.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <AnimatedSection key={i} delay={i * 0.05}>
              <div className={`${img.span} aspect-[4/3] overflow-hidden rounded-lg group`}>
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
