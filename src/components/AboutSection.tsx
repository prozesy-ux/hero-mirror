import { Shield, ShoppingBag, Zap } from "lucide-react";

const AboutSection = () => {
  return (
    <section className="border-b border-border bg-background py-16 md:py-24">
      <div className="mx-auto max-w-screen-xl px-4">
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          About Uptoza
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Uptoza Inc powers global digital commerce — a unified platform where creators and businesses sell digital products, premium services, and AI-driven solutions to customers worldwide.
        </p>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {/* What we do */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Digital Marketplace</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Browse, purchase, and instantly access digital products, AI tool subscriptions, online courses, and professional services from verified sellers.
            </p>
          </div>

          {/* How it works */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Instant Delivery</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              After purchase, access your products immediately through your personal dashboard — download files, stream courses, or activate premium accounts.
            </p>
          </div>

          {/* Why Google Sign-In */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Secure Sign-In</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We offer Google Sign-In for fast, secure authentication. We only access your name and email to create your account and personalize your experience.{" "}
              <a href="/privacy" className="underline hover:text-foreground">
                Read our Privacy Policy
              </a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
