import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AsSeenIn from "@/components/AsSeenIn";
import StatsSection from "@/components/StatsSection";
import AIToolsGrid from "@/components/AIToolsGrid";
import SocialMediaSection from "@/components/SocialMediaSection";
import AudienceNiches from "@/components/AudienceNiches";
import PromptsSection from "@/components/PromptsSection";
import BundleSection from "@/components/BundleSection";
import PricingSection from "@/components/PricingSection";
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
        <PromptsSection />
        <BundleSection />
        <PricingSection />
        <FinalCTA />
      </main>
    </div>
  );
};

export default Index;
