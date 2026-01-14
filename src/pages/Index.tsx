import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AsSeenIn from "@/components/AsSeenIn";
import CompleteBundleCard from "@/components/CompleteBundleCard";
import ChatGPTPromptsSection from "@/components/ChatGPTPromptsSection";
import MidjourneyPromptsSection from "@/components/MidjourneyPromptsSection";
import AddonsSection from "@/components/AddonsSection";
import FreeProductsSection from "@/components/FreeProductsSection";
import PromptsSection from "@/components/PromptsSection";
import BundleSection from "@/components/BundleSection";
import TestimonialsSection from "@/components/TestimonialsSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AsSeenIn />
        <CompleteBundleCard />
        <ChatGPTPromptsSection />
        <MidjourneyPromptsSection />
        <AddonsSection />
        <FreeProductsSection />
        <PromptsSection />
        <BundleSection />
        <TestimonialsSection />
      </main>
    </div>
  );
};

export default Index;
