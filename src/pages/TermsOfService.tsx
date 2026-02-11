import Header from "@/components/Header";
import SEOHead from "@/components/seo/SEOHead";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Terms of Service | Uptoza"
        description="Read the Terms of Service for Uptoza Inc. Understand your rights and responsibilities when using our digital commerce platform."
        canonicalUrl="https://uptoza.com/terms"
        noIndex={false}
      />
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: February 10, 2026</p>

        <div className="mt-8 space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="mt-2">By accessing or using <a href="https://uptoza.com" className="text-primary underline">uptoza.com</a> (the "Platform"), operated by Uptoza Inc ("Uptoza," "we," "us," or "our"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Account Registration</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You must be at least 13 years old to create an account.</li>
              <li>One person may not maintain more than one account without prior approval.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Marketplace Rules</h2>
            <h3 className="mt-3 text-lg font-medium text-foreground">For Buyers</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>All purchases are for personal or authorized business use only.</li>
              <li>Redistribution, resale, or sharing of purchased digital products is prohibited unless explicitly permitted by the seller.</li>
              <li>You agree to use purchased products in compliance with applicable laws.</li>
            </ul>
            <h3 className="mt-3 text-lg font-medium text-foreground">For Sellers</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>You must have the legal right to sell the products you list on the Platform.</li>
              <li>Product descriptions must be accurate and not misleading.</li>
              <li>You are responsible for delivering products to buyers promptly after purchase.</li>
              <li>You agree to Uptoza's commission and fee structure as displayed in your seller dashboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Intellectual Property</h2>
            <p className="mt-2">All content on the Platform, including logos, text, graphics, and software, is the property of Uptoza Inc or its content suppliers and is protected by intellectual property laws. Sellers retain ownership of their products but grant Uptoza a license to display and distribute them through the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Payments and Refunds</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>All payments are processed through our third-party payment providers (Stripe, Razorpay).</li>
              <li>Prices are displayed in the currency selected on the Platform.</li>
              <li>Due to the digital nature of products, refunds are handled on a case-by-case basis.</li>
              <li>Refund requests must be submitted within 7 days of purchase.</li>
              <li>Uptoza reserves the right to deny refund requests for products that have been downloaded or accessed.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Prohibited Activities</h2>
            <p className="mt-2">You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Use the Platform for any illegal or unauthorized purpose</li>
              <li>Upload malicious software, viruses, or harmful content</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Engage in fraud, impersonation, or deceptive practices</li>
              <li>Scrape, crawl, or harvest data from the Platform without permission</li>
              <li>Interfere with or disrupt the Platform's infrastructure</li>
              <li>Harass, abuse, or harm other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
            <p className="mt-2">To the fullest extent permitted by law, Uptoza Inc shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Platform. Our total liability shall not exceed the amount you paid to Uptoza in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Termination</h2>
            <p className="mt-2">We may suspend or terminate your account at our sole discretion, without notice, for conduct that we determine violates these Terms or is harmful to other users, us, or third parties. You may also delete your account at any time through your account settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Disclaimers</h2>
            <p className="mt-2">The Platform is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the Platform will be uninterrupted, secure, or error-free. We are not responsible for the quality or accuracy of products sold by third-party sellers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Governing Law</h2>
            <p className="mt-2">These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Uptoza Inc is incorporated, without regard to its conflict of law provisions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Changes to These Terms</h2>
            <p className="mt-2">We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on this page. Your continued use of the Platform after changes constitutes acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Contact Us</h2>
            <p className="mt-2">If you have any questions about these Terms, please contact us:</p>
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

export default TermsOfService;
