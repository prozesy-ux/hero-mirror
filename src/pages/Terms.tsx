import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <h1 className="mb-8 text-4xl font-bold">Terms of Service</h1>
        <p className="mb-8 text-gray-400">Last updated: January 25, 2026</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Uptoza ("the Platform") at uptozas.com, you agree to be
              bound by these Terms of Service. If you do not agree to these terms, please do
              not use our services.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">2. Description of Service</h2>
            <p>
              Uptoza is a digital marketplace platform that provides access to AI prompts,
              digital products, and related services. We connect buyers with sellers and
              facilitate transactions between them.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">3. User Accounts</h2>
            <p className="mb-4">When creating an account, you agree to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update any changes to your information</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Not share your account with others</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">4. Purchases and Payments</h2>
            <p className="mb-4">All purchases are subject to the following conditions:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Prices are displayed in the applicable currency</li>
              <li>Payment must be made through our approved payment methods</li>
              <li>Digital products are delivered electronically after purchase</li>
              <li>Refund policies vary by product type and seller</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">5. User Conduct</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Upload malicious content or software</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the platform for fraudulent purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">6. Intellectual Property</h2>
            <p>
              All content on the Platform, including but not limited to text, graphics,
              logos, and software, is the property of Uptoza or its content suppliers and is
              protected by intellectual property laws. Purchased digital products are
              licensed, not sold, and are subject to their respective license terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">7. Seller Terms</h2>
            <p className="mb-4">If you are a seller on our platform, you additionally agree to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Only sell products you have the right to sell</li>
              <li>Provide accurate descriptions of your products</li>
              <li>Fulfill orders in a timely manner</li>
              <li>Comply with our seller guidelines and policies</li>
              <li>Pay applicable commission fees</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Uptoza shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, or any loss
              of profits or revenues, whether incurred directly or indirectly.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">9. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided "as is" and "as available" without warranties of any
              kind, either express or implied. We do not guarantee that the service will be
              uninterrupted, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for
              violations of these Terms of Service or for any other reason at our sole
              discretion. Upon termination, your right to use the Platform will immediately
              cease.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. We will
              notify users of any material changes by posting the updated terms on this page.
              Your continued use of the Platform after changes constitutes acceptance of the
              new terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">12. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:support@uptozas.com" className="text-purple-400 hover:text-purple-300">
                support@uptozas.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
