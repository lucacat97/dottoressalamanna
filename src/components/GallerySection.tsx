import corsoAula from "@/assets/corso-aula.jpg";
import locationHotel from "@/assets/location-hotel.jpg";
import lamannaLezione from "@/assets/lamanna-lezione.jpg";
import lamannaEsercizi from "@/assets/lamanna-esercizi.jpg";
import lamannaSpiegazione from "@/assets/lamanna-spiegazione.jpg";
import corsoPlatea from "@/assets/corso-platea.jpg";

const images = [
  { src: corsoAula, alt: "Aula del corso con partecipanti", span: "md:col-span-2" },
  { src: locationHotel, alt: "Location elegante dei corsi", span: "" },
  { src: lamannaLezione, alt: "Dott.ssa Lamanna durante una lezione", span: "" },
  { src: lamannaEsercizi, alt: "Dimostrazione di esercizi correttivi", span: "" },
  { src: lamannaSpiegazione, alt: "Spiegazione delle fibre trigeminali", span: "" },
  { src: corsoPlatea, alt: "Partecipanti al corso", span: "md:col-span-2" },
];

const GallerySection = () => {
  return (
    <section id="galleria" className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <div
              key={i}
              className={`${img.span} aspect-[4/3] overflow-hidden rounded-lg group`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
