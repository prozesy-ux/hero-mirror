import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AsSeenIn from "@/components/AsSeenIn";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AsSeenIn />
      </main>
    </div>
  );
};

export default Index;
