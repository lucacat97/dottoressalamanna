import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, ArrowLeft, Send, Tag, Target, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import RegistrationModal from "@/components/RegistrationModal";

interface CourseEdition {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  max_participants: number | null;
  status: string;
  type: string;
  cover_image_url: string | null;
  long_description: string | null;
  agenda: string | null;
  objectives: string | null;
  price: string | null;
}

interface CourseMedia {
  id: string;
  media_type: "image" | "video";
  url: string;
  caption: string | null;
  sort_order: number;
}

const toEmbed = (url: string) => {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
};

const CourseLandingPage = () => {
  const { id } = useParams<{ id: string }>();
  const [edition, setEdition] = useState<CourseEdition | null>(null);
  const [media, setMedia] = useState<CourseMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: ed }, { data: m }] = await Promise.all([
        supabase.from("course_editions").select("*").eq("id", id).maybeSingle(),
        supabase.from("course_media").select("*").eq("edition_id", id).order("sort_order"),
      ]);
      setEdition(ed as CourseEdition | null);
      setMedia((m || []) as CourseMedia[]);
      setLoading(false);
    };
    load();
  }, [id]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-body text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="font-display text-2xl text-foreground">Corso non trovato</p>
        <Link to="/#edizioni" className="text-petrolio underline font-body">Torna alle edizioni</Link>
      </div>
    );
  }

  const images = media.filter((m) => m.media_type === "image");
  const videos = media.filter((m) => m.media_type === "video");
  const isUpcoming = edition.status === "upcoming";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-br from-petrolio/10 via-background to-cream">
        {edition.cover_image_url && (
          <div className="absolute inset-0">
            <img
              src={edition.cover_image_url}
              alt={edition.title}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
          </div>
        )}
        <div className="relative max-w-5xl mx-auto px-6">
          <Link to="/#edizioni" className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-petrolio mb-8 transition-colors">
            <ArrowLeft size={14} /> Torna alle edizioni
          </Link>
          <AnimatedSection>
            <span className="inline-block font-body text-xs uppercase tracking-[0.2em] text-gold mb-4 font-semibold">
              {edition.type === "webinar" ? "Webinar" : "Corso Live"}
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              {edition.title}
            </h1>
            {edition.description && (
              <p className="font-body text-lg text-muted-foreground mb-8 max-w-3xl">
                {edition.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-6 text-sm text-foreground mb-8">
              <span className="flex items-center gap-2"><Calendar size={16} className="text-petrolio" />{formatDate(edition.date)}</span>
              {edition.location && <span className="flex items-center gap-2"><MapPin size={16} className="text-petrolio" />{edition.location}</span>}
              {edition.max_participants && <span className="flex items-center gap-2"><Users size={16} className="text-petrolio" />Max {edition.max_participants}</span>}
              {edition.price && <span className="flex items-center gap-2"><Tag size={16} className="text-petrolio" />{edition.price}</span>}
            </div>
            {isUpcoming ? (
              <Button onClick={() => setShowModal(true)} size="lg" className="bg-primary hover:bg-accent text-primary-foreground font-body font-semibold">
                <Send size={16} className="mr-2" />
                Iscriviti Ora
              </Button>
            ) : (
              <span className="inline-block font-body text-xs uppercase tracking-wider text-gold font-semibold bg-gold/10 px-4 py-2 rounded-full">
                Edizione completata
              </span>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* Long description */}
      {edition.long_description && (
        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-3xl mx-auto px-6">
            <AnimatedSection>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">Il corso</h2>
              <div className="font-body text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {edition.long_description}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Objectives */}
      {edition.objectives && (
        <section className="py-16 md:py-20 bg-cream">
          <div className="max-w-3xl mx-auto px-6">
            <AnimatedSection>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <Target size={24} className="text-petrolio" />
                Obiettivi formativi
              </h2>
              <div className="font-body text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {edition.objectives}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Agenda */}
      {edition.agenda && (
        <section className="py-16 md:py-20 bg-background">
          <div className="max-w-3xl mx-auto px-6">
            <AnimatedSection>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <ListChecks size={24} className="text-petrolio" />
                Programma
              </h2>
              <div className="font-body text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {edition.agenda}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Gallery */}
      {images.length > 0 && (
        <section className="py-16 md:py-20 bg-cream">
          <div className="max-w-6xl mx-auto px-6">
            <AnimatedSection>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">Galleria</h2>
            </AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <AnimatedSection key={img.id} delay={i * 0.05}>
                  <figure className="group overflow-hidden rounded-lg shadow-card hover:shadow-elevated transition-shadow">
                    <img
                      src={img.url}
                      alt={img.caption || "Foto corso"}
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {img.caption && (
                      <figcaption className="font-body text-xs text-muted-foreground p-2 bg-card">{img.caption}</figcaption>
                    )}
                  </figure>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <section className="py-16 md:py-20 bg-background">
          <div className="max-w-5xl mx-auto px-6">
            <AnimatedSection>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">Video</h2>
            </AnimatedSection>
            <div className="grid md:grid-cols-2 gap-6">
              {videos.map((v, i) => (
                <AnimatedSection key={v.id} delay={i * 0.1}>
                  <div className="space-y-2">
                    <div className="aspect-video rounded-lg overflow-hidden shadow-card bg-foreground">
                      {/^https?:\/\//.test(v.url) && (v.url.includes("youtube") || v.url.includes("youtu.be") || v.url.includes("vimeo")) ? (
                        <iframe
                          src={toEmbed(v.url)}
                          title={v.caption || "Video corso"}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video src={v.url} controls className="w-full h-full" />
                      )}
                    </div>
                    {v.caption && <p className="font-body text-sm text-muted-foreground">{v.caption}</p>}
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      {isUpcoming && (
        <section className="py-20 md:py-28 bg-petrolio text-primary-foreground">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <AnimatedSection>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Pronto a iscriverti?</h2>
              <p className="font-body text-base opacity-90 mb-8">
                Posti limitati per garantire un'esperienza formativa di qualità.
              </p>
              <Button onClick={() => setShowModal(true)} size="lg" className="bg-cream text-petrolio hover:bg-cream/90 font-body font-semibold">
                <Send size={16} className="mr-2" />
                Iscriviti a {edition.title}
              </Button>
            </AnimatedSection>
          </div>
        </section>
      )}

      <Footer />

      {showModal && (
        <RegistrationModal
          edition={{ id: edition.id, title: edition.title, date: edition.date }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default CourseLandingPage;
