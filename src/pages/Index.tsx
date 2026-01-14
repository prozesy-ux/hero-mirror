import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AsSeenIn from "@/components/AsSeenIn";
import StatsSection from "@/components/StatsSection";
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
        <PromptsSection />
        <BundleSection />
        <PricingSection />
      </main>
    </div>
  );
};

export default Index;
