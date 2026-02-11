import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SEOHead from "@/components/seo/SEOHead";

// Lazy load below-fold components for faster First Contentful Paint
const AsSeenIn = lazy(() => import("@/components/AsSeenIn"));
const CompleteBundleCard = lazy(() => import("@/components/CompleteBundleCard"));
const ChatGPTPromptsSection = lazy(() => import("@/components/ChatGPTPromptsSection"));
const AddonsSection = lazy(() => import("@/components/AddonsSection"));
const FreeProductsSection = lazy(() => import("@/components/FreeProductsSection"));
const PromptsSection = lazy(() => import("@/components/PromptsSection"));
const BundleSection = lazy(() => import("@/components/BundleSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));

// Minimal loading placeholder for lazy sections
const SectionPlaceholder = () => (
  <div className="min-h-[200px] bg-background" />
);

// JSON-LD Organization schema for home page
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Uptoza",
  "url": "https://uptoza.com",
  "logo": "https://uptoza.com/favicon.png",
  "description": "Uptoza powers global digital commerce. A unified platform for digital products, premium services, and AI-driven solutions. Trusted by creators and businesses worldwide.",
  "sameAs": [
    "https://twitter.com/Uptoza"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "availableLanguage": ["English"]
  }
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Uptoza | The Digital Commerce Platform"
        description="Uptoza powers global digital commerce. A unified platform for digital products, premium services, and AI-driven solutions. Trusted by creators and businesses worldwide."
        canonicalUrl="https://uptoza.com/"
        ogImage="https://uptoza.com/og-image.png"
        type="website"
        jsonLd={organizationSchema}
      />
      <Header />
      <main>
        {/* Above the fold - loaded immediately */}
        <HeroSection />
        
        {/* Below the fold - lazy loaded */}
        <Suspense fallback={<SectionPlaceholder />}>
          <AsSeenIn />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <CompleteBundleCard />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <ChatGPTPromptsSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <AddonsSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <FreeProductsSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <PromptsSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <BundleSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <TestimonialsSection />
        </Suspense>
      </main>
    </div>
  );
};

export default Index;
