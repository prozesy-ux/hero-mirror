import { Suspense, Component, ReactNode } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SEOHead from "@/components/seo/SEOHead";
import { lazyWithRetry } from "@/lib/lazy-with-retry";

// Lazy load below-fold components with automatic retry for flaky networks
const AsSeenIn = lazyWithRetry(() => import("@/components/AsSeenIn"));
const AboutSection = lazyWithRetry(() => import("@/components/AboutSection"));
const CompleteBundleCard = lazyWithRetry(() => import("@/components/CompleteBundleCard"));
const ChatGPTPromptsSection = lazyWithRetry(() => import("@/components/ChatGPTPromptsSection"));
const AddonsSection = lazyWithRetry(() => import("@/components/AddonsSection"));
const FreeProductsSection = lazyWithRetry(() => import("@/components/FreeProductsSection"));
const PromptsSection = lazyWithRetry(() => import("@/components/PromptsSection"));
const BundleSection = lazyWithRetry(() => import("@/components/BundleSection"));
const TestimonialsSection = lazyWithRetry(() => import("@/components/TestimonialsSection"));

// Minimal loading placeholder for lazy sections
const SectionPlaceholder = () => (
  <div className="min-h-[200px] bg-background" />
);

/**
 * Per-section error boundary — if a single section fails to load,
 * it renders nothing instead of crashing the entire page.
 */
class SectionErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn('[SectionErrorBoundary] Section failed to load:', error?.message);
  }
  render() {
    if (this.state.hasError) return <div className="min-h-0" />;
    return this.props.children;
  }
}

/** Wraps a lazy section with both error boundary and suspense */
const SafeSection = ({ children }: { children: ReactNode }) => (
  <SectionErrorBoundary>
    <Suspense fallback={<SectionPlaceholder />}>
      {children}
    </Suspense>
  </SectionErrorBoundary>
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
        <HeroSection />
        <SafeSection><AsSeenIn /></SafeSection>
        <SafeSection><AboutSection /></SafeSection>
        <SafeSection><CompleteBundleCard /></SafeSection>
        <SafeSection><ChatGPTPromptsSection /></SafeSection>
        <SafeSection><AddonsSection /></SafeSection>
        <SafeSection><FreeProductsSection /></SafeSection>
        <SafeSection><PromptsSection /></SafeSection>
        <SafeSection><BundleSection /></SafeSection>
        <SafeSection><TestimonialsSection /></SafeSection>
      </main>
      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto max-w-screen-2xl px-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Uptoza Inc. All rights reserved.</p>
          <nav className="flex items-center gap-6">
            <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Index;
