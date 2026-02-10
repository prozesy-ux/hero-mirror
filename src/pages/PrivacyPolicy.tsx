import Header from "@/components/Header";
import SEOHead from "@/components/seo/SEOHead";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Privacy Policy | Uptoza"
        description="Learn how Uptoza Inc collects, uses, and protects your personal information. Read our full privacy policy."
        canonicalUrl="https://uptoza.com/privacy"
        noIndex={false}
      />
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: February 10, 2026</p>

        <div className="mt-8 space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p className="mt-2">Uptoza Inc ("Uptoza," "we," "us," or "our") operates the website <a href="https://uptoza.com" className="text-primary underline">uptoza.com</a>. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform or use our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
            <h3 className="mt-3 text-lg font-medium text-foreground">Personal Information</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Name and email address (during account registration)</li>
              <li>Profile information (username, avatar, country)</li>
              <li>Payment and billing information (processed by third-party payment providers)</li>
              <li>Communications you send to us (support messages, chat)</li>
            </ul>
            <h3 className="mt-3 text-lg font-medium text-foreground">Automatically Collected Information</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Device and browser information</li>
              <li>IP address and approximate location</li>
              <li>Usage data (pages visited, features used, timestamps)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>To create and manage your account</li>
              <li>To process transactions and deliver digital products</li>
              <li>To operate and improve our marketplace platform</li>
              <li>To communicate with you about orders, updates, and support</li>
              <li>To personalize your experience and provide recommendations</li>
              <li>To detect and prevent fraud or abuse</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Third-Party Services</h2>
            <p className="mt-2">We use the following third-party services that may collect or process your data:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Google OAuth</strong> — for secure sign-in authentication. Google may collect data as described in their <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Privacy Policy</a>.</li>
              <li><strong>Stripe</strong> — for payment processing. Stripe handles payment data according to their <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Privacy Policy</a>.</li>
              <li><strong>Razorpay</strong> — for payment processing in supported regions.</li>
              <li><strong>Analytics providers</strong> — to understand platform usage and improve our services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Data Storage and Security</h2>
            <p className="mt-2">We implement industry-standard security measures to protect your personal information, including encryption in transit and at rest, secure authentication, and access controls. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
            <p className="mt-2">Depending on your location, you may have the following rights:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Access</strong> — request a copy of your personal data</li>
              <li><strong>Correction</strong> — request correction of inaccurate data</li>
              <li><strong>Deletion</strong> — request deletion of your account and personal data</li>
              <li><strong>Portability</strong> — request your data in a portable format</li>
              <li><strong>Opt-out</strong> — unsubscribe from marketing communications at any time</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:support@uptoza.com" className="text-primary underline">support@uptoza.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Cookies</h2>
            <p className="mt-2">We use cookies and similar technologies to maintain your session, remember preferences, and analyze platform usage. You can control cookie settings through your browser. Disabling cookies may affect certain features of our platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Children's Privacy</h2>
            <p className="mt-2">Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us so we can delete it.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
            <p className="mt-2">We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page with an updated "Last updated" date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Contact Us</h2>
            <p className="mt-2">If you have any questions about this Privacy Policy, please contact us:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Email: <a href="mailto:support@uptoza.com" className="text-primary underline">support@uptoza.com</a></li>
              <li>Website: <a href="https://uptoza.com" className="text-primary underline">uptoza.com</a></li>
            </ul>
          </section>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Home</a>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
