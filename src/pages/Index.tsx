import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AsSeenIn from "@/components/AsSeenIn";
import StatsSection from "@/components/StatsSection";
import AIToolsGrid from "@/components/AIToolsGrid";
import SocialMediaSection from "@/components/SocialMediaSection";
import AudienceNiches from "@/components/AudienceNiches";
import AIVideoSection from "@/components/AIVideoSection";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FinalCTA from "@/components/FinalCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AsSeenIn />
        <StatsSection />
        <AIToolsGrid />
        <SocialMediaSection />
        <AudienceNiches />
        <AIVideoSection />
        <PricingSection />
        <TestimonialsSection />
        <FinalCTA />
      </main>
    </div>
  );
};

export default Index;
