import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import MilaSection from "@/components/MilaSection";
import CoursesSection from "@/components/CoursesSection";
import EditionsSection from "@/components/EditionsSection";
import GallerySection from "@/components/GallerySection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import ConsultationFab from "@/components/ConsultationFab";
import PecAvatarFab from "@/components/PecAvatarFab";
import WhatsAppFab from "@/components/WhatsAppFab";
import SubscribeSection from "@/components/SubscribeSection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <MilaSection />
      <AboutSection />
      <CoursesSection />
      <SubscribeSection />
      <EditionsSection />
      <GallerySection />
      <ContactSection />
      <Footer />
      <ConsultationFab />
      <PecAvatarFab />
      <WhatsAppFab />
    </div>
  );
};

export default Index;
