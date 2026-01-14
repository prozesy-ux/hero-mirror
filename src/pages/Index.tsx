import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AsSeenIn from "@/components/AsSeenIn";
import StatsSection from "@/components/StatsSection";
import AIToolsGrid from "@/components/AIToolsGrid";
import PromptsSection from "@/components/PromptsSection";
import BundleSection from "@/components/BundleSection";
import PricingSection from "@/components/PricingSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AsSeenIn />
        <StatsSection />
        <AIToolsGrid />
        <PromptsSection />
        <BundleSection />
        <PricingSection />
      </main>
    </div>
  );
};

export default Index;
