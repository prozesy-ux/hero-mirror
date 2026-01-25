import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
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

        <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>
        <p className="mb-8 text-gray-400">Last updated: January 25, 2026</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">1. Introduction</h2>
            <p>
              Welcome to Uptoza ("we," "our," or "us"). We are committed to protecting your
              privacy and personal information. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our platform at
              uptozas.com.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">2. Information We Collect</h2>
            <p className="mb-4">We collect information you provide directly to us, including:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Account information (name, email address, password)</li>
              <li>Profile information (avatar, preferences)</li>
              <li>Payment information (processed securely through our payment providers)</li>
              <li>Communications you send to us</li>
              <li>Transaction history and purchase records</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Protect against fraudulent or illegal activity</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">4. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to
              third parties without your consent, except as described in this policy. We may
              share information with service providers who assist us in operating our
              platform, conducting our business, or serving our users.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction. However, no method of transmission over the Internet is 100%
              secure.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">6. Third-Party Services</h2>
            <p>
              We use third-party services including Google for authentication. When you
              choose to sign in with Google, you are subject to Google's Privacy Policy. We
              only receive basic profile information (name, email, profile picture) that you
              authorize.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">7. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">8. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our
              platform and hold certain information. Cookies are files with small amounts of
              data that may include an anonymous unique identifier.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the "Last
              updated" date.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
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

export default Privacy;
