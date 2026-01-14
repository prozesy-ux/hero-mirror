import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AsSeenIn from "@/components/AsSeenIn";
import StatsSection from "@/components/StatsSection";
import CompleteBundleCard from "@/components/CompleteBundleCard";
import ChatGPTPromptsSection from "@/components/ChatGPTPromptsSection";
import MidjourneyPromptsSection from "@/components/MidjourneyPromptsSection";
import AddonsSection from "@/components/AddonsSection";
import FreeProductsSection from "@/components/FreeProductsSection";
import PromptsSection from "@/components/PromptsSection";
import BundleSection from "@/components/BundleSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AsSeenIn />
        <StatsSection />
        <CompleteBundleCard />
        <ChatGPTPromptsSection />
        <MidjourneyPromptsSection />
        <AddonsSection />
        <FreeProductsSection />
        <PromptsSection />
        <BundleSection />
        <TestimonialsSection />
        <PricingSection />
      </main>
    </div>
  );
};

export default Index;
