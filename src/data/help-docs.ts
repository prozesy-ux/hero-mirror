export interface HelpArticle {
  id: number;
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  role: 'seller' | 'buyer' | 'admin' | 'general';
  content: string;
  tags: string[];
  order: number;
}

export interface HelpCategory {
  slug: string;
  name: string;
  icon: string;
  order: number;
  description: string;
  role: 'seller' | 'buyer' | 'admin' | 'general';
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { slug: 'getting-started', name: 'Getting Started', icon: 'Rocket', order: 1, description: 'Learn the basics of Uptoza and get set up quickly.', role: 'general' },
  { slug: 'seller-account-setup', name: 'Seller Account Setup', icon: 'UserPlus', order: 2, description: 'Set up and configure your seller account.', role: 'seller' },
  { slug: 'product-types', name: 'Product Types', icon: 'Package', order: 3, description: 'Understand the different product types you can sell.', role: 'seller' },
  { slug: 'creating-products', name: 'Creating Products', icon: 'PlusCircle', order: 4, description: 'Step-by-step guides to creating and managing products.', role: 'seller' },
  { slug: 'auto-delivery', name: 'Auto-Delivery System', icon: 'Zap', order: 5, description: 'Set up automated delivery for your digital products.', role: 'seller' },
  { slug: 'course-builder', name: 'Course Builder', icon: 'GraduationCap', order: 6, description: 'Create and manage online courses with lessons.', role: 'seller' },
  { slug: 'sales-orders', name: 'Sales & Orders', icon: 'ShoppingCart', order: 7, description: 'Manage orders, deliveries, and order statuses.', role: 'seller' },
  { slug: 'customers', name: 'Customers', icon: 'Users', order: 8, description: 'View and manage your customer base.', role: 'seller' },
  { slug: 'analytics', name: 'Analytics & Insights', icon: 'BarChart3', order: 9, description: 'Track sales, revenue, and performance metrics.', role: 'seller' },
  { slug: 'wallet-payouts', name: 'Wallet & Payouts', icon: 'Wallet', order: 10, description: 'Manage your earnings and withdraw funds.', role: 'seller' },
  { slug: 'marketing', name: 'Marketing & Promotions', icon: 'Megaphone', order: 11, description: 'Create discount codes, coupons, and flash sales.', role: 'seller' },
  { slug: 'store-storefront', name: 'Store & Storefront', icon: 'Store', order: 12, description: 'Customize and manage your public store page.', role: 'seller' },
  { slug: 'buyer-guide', name: 'Buyer Guide', icon: 'ShoppingBag', order: 13, description: 'Learn how to browse, purchase, and access products.', role: 'buyer' },
  { slug: 'buyer-wallet', name: 'Buyer Wallet & Payments', icon: 'CreditCard', order: 14, description: 'Manage your wallet, payments, and refunds.', role: 'buyer' },
  { slug: 'chat-communication', name: 'Chat & Communication', icon: 'MessageCircle', order: 15, description: 'Chat with sellers and get support.', role: 'general' },
  { slug: 'settings-account', name: 'Settings & Account', icon: 'Settings', order: 16, description: 'Manage your profile, notifications, and preferences.', role: 'general' },
  { slug: 'troubleshooting', name: 'Troubleshooting', icon: 'LifeBuoy', order: 17, description: 'Solutions to common issues and problems.', role: 'general' },
];

export const HELP_ARTICLES: HelpArticle[] = [
  // Category 1: Getting Started
  {
    id: 1, slug: 'what-is-uptoza', title: 'What is Uptoza?', category: 'Getting Started', categorySlug: 'getting-started', role: 'general', order: 1,
    tags: ['introduction', 'overview', 'platform', 'about'],
    content: `<h2>What is Uptoza?</h2>
<p>Uptoza is an all-in-one digital marketplace platform where creators, entrepreneurs, and businesses can sell digital products directly to buyers worldwide. Whether you're selling e-books, courses, software, templates, graphics, or any other digital product — Uptoza provides the tools to list, sell, and deliver your products seamlessly.</p>
<h3>Key Features</h3>
<ul>
<li><strong>Multi-product support</strong> — Sell 14+ types of digital products including courses, memberships, services, and more</li>
<li><strong>Auto-delivery</strong> — Automatically deliver accounts, license keys, and download files to buyers</li>
<li><strong>Built-in wallet</strong> — Manage earnings and withdraw to bank, UPI, PayPal, or crypto</li>
<li><strong>Seller analytics</strong> — Track revenue, views, conversions, and customer insights</li>
<li><strong>Marketplace discovery</strong> — Get discovered by thousands of buyers browsing the marketplace</li>
<li><strong>Custom storefronts</strong> — Each seller gets a personalized public store page</li>
</ul>
<h3>Who is Uptoza for?</h3>
<p>Uptoza is designed for digital creators of all sizes — from solo entrepreneurs selling their first e-book to established businesses with hundreds of products. If you create digital content, Uptoza is your platform.</p>`
  },
  {
    id: 2, slug: 'how-to-create-account', title: 'How to create an account', category: 'Getting Started', categorySlug: 'getting-started', role: 'general', order: 2,
    tags: ['signup', 'register', 'account', 'create'],
    content: `<h2>How to Create an Account</h2>
<p>Creating an Uptoza account is quick and free. Follow these steps:</p>
<ol>
<li>Visit <strong>uptoza.com</strong> and click <strong>"Sign Up"</strong> in the top navigation</li>
<li>Enter your <strong>full name</strong>, <strong>email address</strong>, and choose a <strong>password</strong></li>
<li>Check your email for a <strong>verification link</strong> and click it to verify your account</li>
<li>Once verified, sign in and you're ready to go!</li>
</ol>
<h3>Account Types</h3>
<p>Every Uptoza account starts as a <strong>buyer account</strong>. You can upgrade to a seller account at any time from your dashboard by clicking "Become a Seller."</p>
<h3>Tips</h3>
<ul>
<li>Use a valid email — it's required for order notifications and account recovery</li>
<li>Choose a strong password with at least 8 characters</li>
<li>You can also sign up using Google OAuth for faster access</li>
</ul>`
  },
  {
    id: 3, slug: 'signing-in-with-google', title: 'Signing in with Google', category: 'Getting Started', categorySlug: 'getting-started', role: 'general', order: 3,
    tags: ['google', 'oauth', 'social login', 'signin'],
    content: `<h2>Signing in with Google</h2>
<p>Uptoza supports <strong>Google OAuth</strong> for quick, passwordless sign-in. Here's how it works:</p>
<ol>
<li>On the sign-in page, click the <strong>"Continue with Google"</strong> button</li>
<li>Select your Google account from the popup</li>
<li>Grant the necessary permissions</li>
<li>You'll be automatically signed in and redirected to your dashboard</li>
</ol>
<h3>First-time Google Sign-in</h3>
<p>If you're signing in with Google for the first time, Uptoza will automatically create an account using your Google email and profile name. No separate registration is needed.</p>
<h3>Linking Google to Existing Account</h3>
<p>If you already have an Uptoza account with the same email as your Google account, they will be automatically linked.</p>`
  },
  {
    id: 4, slug: 'navigating-marketplace', title: 'Navigating the marketplace', category: 'Getting Started', categorySlug: 'getting-started', role: 'general', order: 4,
    tags: ['marketplace', 'browse', 'navigation', 'explore'],
    content: `<h2>Navigating the Marketplace</h2>
<p>The Uptoza marketplace is where buyers discover and purchase digital products from sellers worldwide.</p>
<h3>Marketplace Layout</h3>
<ul>
<li><strong>Search bar</strong> — Search by product name, category, or keyword</li>
<li><strong>Category filters</strong> — Browse by product type (e-books, courses, software, etc.)</li>
<li><strong>Featured products</strong> — Highlighted products chosen by the platform</li>
<li><strong>Hot products</strong> — Trending items based on recent sales</li>
<li><strong>New arrivals</strong> — Latest products added to the marketplace</li>
<li><strong>Top rated</strong> — Highest-rated products by verified buyers</li>
</ul>
<h3>Product Cards</h3>
<p>Each product card shows the product image, title, price, seller name, and rating. Hover over a card for a quick preview, or click to view full details.</p>
<h3>Filtering & Sorting</h3>
<p>Use the sidebar filters to narrow results by price range, rating, product type, and more. Sort by relevance, newest, price low-to-high, or price high-to-low.</p>`
  },
  {
    id: 5, slug: 'understanding-user-roles', title: 'Understanding user roles (Buyer, Seller, Admin)', category: 'Getting Started', categorySlug: 'getting-started', role: 'general', order: 5,
    tags: ['roles', 'buyer', 'seller', 'admin', 'permissions'],
    content: `<h2>Understanding User Roles</h2>
<p>Uptoza has three main user roles, each with different permissions and dashboards:</p>
<h3>Buyer</h3>
<ul>
<li>Browse and purchase products from the marketplace</li>
<li>Access purchased products in their library</li>
<li>Manage wallet, wishlist, and order history</li>
<li>Chat with sellers</li>
<li>Leave reviews on purchased products</li>
</ul>
<h3>Seller</h3>
<ul>
<li>Everything a buyer can do, plus:</li>
<li>Create and manage products across 14+ types</li>
<li>Set up auto-delivery systems</li>
<li>View analytics and customer insights</li>
<li>Manage orders and process deliveries</li>
<li>Withdraw earnings to various payment methods</li>
<li>Customize their public store page</li>
</ul>
<h3>Admin</h3>
<ul>
<li>Full platform management capabilities</li>
<li>User management and moderation</li>
<li>Product approval and content moderation</li>
<li>Platform settings and configuration</li>
<li>Analytics and reporting across all users</li>
</ul>`
  },
  {
    id: 6, slug: 'reset-password', title: 'How to reset your password', category: 'Getting Started', categorySlug: 'getting-started', role: 'general', order: 6,
    tags: ['password', 'reset', 'forgot', 'recovery'],
    content: `<h2>How to Reset Your Password</h2>
<p>If you've forgotten your password, follow these steps to reset it:</p>
<ol>
<li>Go to the <strong>Sign In</strong> page</li>
<li>Click <strong>"Forgot Password?"</strong> below the password field</li>
<li>Enter the <strong>email address</strong> associated with your account</li>
<li>Check your email for a <strong>password reset link</strong></li>
<li>Click the link and enter your <strong>new password</strong></li>
<li>Sign in with your new password</li>
</ol>
<h3>Important Notes</h3>
<ul>
<li>The reset link expires after <strong>1 hour</strong> — request a new one if it expires</li>
<li>Check your spam/junk folder if you don't see the email</li>
<li>If you signed up with Google, you don't have a password — use "Continue with Google" instead</li>
</ul>`
  },
  {
    id: 7, slug: 'browser-compatibility', title: 'Browser compatibility and requirements', category: 'Getting Started', categorySlug: 'getting-started', role: 'general', order: 7,
    tags: ['browser', 'compatibility', 'requirements', 'system'],
    content: `<h2>Browser Compatibility & Requirements</h2>
<p>Uptoza works best on modern web browsers. Here are the supported browsers:</p>
<h3>Supported Browsers</h3>
<ul>
<li><strong>Google Chrome</strong> (latest 2 versions) — Recommended</li>
<li><strong>Mozilla Firefox</strong> (latest 2 versions)</li>
<li><strong>Safari</strong> (latest 2 versions)</li>
<li><strong>Microsoft Edge</strong> (latest 2 versions)</li>
</ul>
<h3>Requirements</h3>
<ul>
<li>JavaScript must be enabled</li>
<li>Cookies must be enabled for authentication</li>
<li>Stable internet connection</li>
<li>Minimum screen width: 320px (mobile-friendly)</li>
</ul>
<h3>Not Supported</h3>
<ul>
<li>Internet Explorer (any version)</li>
<li>Browsers older than 2 versions behind current release</li>
</ul>`
  },
  {
    id: 8, slug: 'mobile-vs-web', title: 'Mobile app vs web experience', category: 'Getting Started', categorySlug: 'getting-started', role: 'general', order: 8,
    tags: ['mobile', 'web', 'app', 'responsive', 'pwa'],
    content: `<h2>Mobile App vs Web Experience</h2>
<p>Uptoza is a <strong>Progressive Web App (PWA)</strong>, meaning you get a native app-like experience directly from your browser — no app store download required.</p>
<h3>Mobile Web Features</h3>
<ul>
<li>Fully responsive design optimized for all screen sizes</li>
<li>Mobile-optimized navigation with bottom navigation bar</li>
<li>Push notifications (when enabled)</li>
<li>Fast loading with offline caching</li>
<li>Add to home screen for quick access</li>
</ul>
<h3>How to Add to Home Screen</h3>
<ol>
<li><strong>Android (Chrome)</strong>: Tap the menu (⋮) → "Add to Home Screen"</li>
<li><strong>iPhone (Safari)</strong>: Tap the share button (↑) → "Add to Home Screen"</li>
</ol>
<p>This creates an app icon on your phone that opens Uptoza in a full-screen, app-like experience.</p>`
  },

  // Category 2: Seller Account Setup
  {
    id: 9, slug: 'how-to-become-seller', title: 'How to become a seller', category: 'Seller Account Setup', categorySlug: 'seller-account-setup', role: 'seller', order: 1,
    tags: ['seller', 'become', 'register', 'start selling'],
    content: `<h2>How to Become a Seller</h2>
<p>Any Uptoza user can become a seller. Here's how:</p>
<ol>
<li>Sign in to your Uptoza account</li>
<li>Go to your <strong>Dashboard</strong></li>
<li>Click <strong>"Become a Seller"</strong> or navigate to the seller registration</li>
<li>Fill in your <strong>store name</strong> and <strong>description</strong></li>
<li>Accept the <strong>Seller Terms of Service</strong></li>
<li>Submit your application</li>
</ol>
<h3>What Happens Next?</h3>
<p>Once approved, you'll gain access to the <strong>Seller Dashboard</strong> where you can create products, manage orders, view analytics, and more. Most applications are processed within 24 hours.</p>
<h3>Requirements</h3>
<ul>
<li>A verified Uptoza account with confirmed email</li>
<li>Valid store name (unique across the platform)</li>
<li>Agreement to seller terms and commission structure</li>
</ul>`
  },
  {
    id: 10, slug: 'store-name-description', title: 'Setting up your store name and description', category: 'Seller Account Setup', categorySlug: 'seller-account-setup', role: 'seller', order: 2,
    tags: ['store', 'name', 'description', 'setup', 'branding'],
    content: `<h2>Setting Up Your Store Name & Description</h2>
<p>Your store name and description are the first things buyers see. Make them count!</p>
<h3>Store Name</h3>
<ul>
<li>Must be <strong>unique</strong> across the platform</li>
<li>Keep it short, memorable, and relevant to your niche</li>
<li>Avoid special characters and excessive punctuation</li>
<li>Your store URL will be based on your store name (e.g., uptoza.com/store/your-store-name)</li>
</ul>
<h3>Store Description</h3>
<ul>
<li>Describe what you sell and who your products are for</li>
<li>Keep it under 500 characters for best display</li>
<li>Include relevant keywords for discoverability</li>
<li>Highlight your unique selling points</li>
</ul>
<h3>How to Edit</h3>
<p>Go to <strong>Seller Dashboard → Settings</strong> to update your store name and description at any time.</p>`
  },
  {
    id: 11, slug: 'upload-store-logo', title: 'Uploading your store logo', category: 'Seller Account Setup', categorySlug: 'seller-account-setup', role: 'seller', order: 3,
    tags: ['logo', 'upload', 'store', 'image', 'branding'],
    content: `<h2>Uploading Your Store Logo</h2>
<p>A professional logo helps build trust with buyers and makes your store memorable.</p>
<h3>How to Upload</h3>
<ol>
<li>Go to <strong>Seller Dashboard → Settings</strong></li>
<li>Click on the <strong>logo placeholder</strong> or "Upload Logo" button</li>
<li>Select an image file from your device</li>
<li>Crop and adjust as needed</li>
<li>Save your changes</li>
</ol>
<h3>Logo Requirements</h3>
<ul>
<li><strong>Format</strong>: PNG, JPG, or WEBP</li>
<li><strong>Recommended size</strong>: 400x400 pixels (square)</li>
<li><strong>Maximum file size</strong>: 2MB</li>
<li>Use a transparent background (PNG) for best results</li>
</ul>`
  },
  {
    id: 12, slug: 'store-verification', title: 'Store verification process', category: 'Seller Account Setup', categorySlug: 'seller-account-setup', role: 'seller', order: 4,
    tags: ['verification', 'verified', 'badge', 'trust'],
    content: `<h2>Store Verification Process</h2>
<p>Verified sellers get a <strong>verification badge</strong> that increases buyer trust and improves product visibility.</p>
<h3>How to Get Verified</h3>
<ul>
<li>Maintain a good selling history with positive reviews</li>
<li>Complete your store profile (logo, description, payment methods)</li>
<li>Have at least 5 published products</li>
<li>Maintain a minimum seller rating</li>
<li>Respond to customer inquiries promptly</li>
</ul>
<h3>Benefits of Verification</h3>
<ul>
<li>Verified badge on your store and products</li>
<li>Higher visibility in marketplace search results</li>
<li>Increased buyer confidence</li>
<li>Access to premium seller features</li>
</ul>`
  },
  {
    id: 13, slug: 'seller-levels-badges', title: 'Seller levels and badges explained', category: 'Seller Account Setup', categorySlug: 'seller-account-setup', role: 'seller', order: 5,
    tags: ['levels', 'badges', 'rank', 'progression', 'tier'],
    content: `<h2>Seller Levels & Badges</h2>
<p>Uptoza has a seller leveling system that rewards consistent performance:</p>
<h3>Level Tiers</h3>
<ul>
<li><strong>New Seller</strong> — Just started, building reputation</li>
<li><strong>Rising Seller</strong> — 10+ sales, positive reviews</li>
<li><strong>Established Seller</strong> — 50+ sales, high rating</li>
<li><strong>Top Seller</strong> — 200+ sales, excellent track record</li>
<li><strong>Elite Seller</strong> — 500+ sales, premium status</li>
</ul>
<h3>How Levels Are Calculated</h3>
<p>Your seller level is based on total sales, average rating, response time, order completion rate, and account age. The system updates automatically as you meet new thresholds.</p>
<h3>Level Benefits</h3>
<ul>
<li>Higher levels get better marketplace placement</li>
<li>Reduced commission rates at higher tiers</li>
<li>Priority customer support</li>
<li>Exclusive seller features</li>
</ul>`
  },
  {
    id: 14, slug: 'seller-2fa', title: 'Two-factor authentication for sellers', category: 'Seller Account Setup', categorySlug: 'seller-account-setup', role: 'seller', order: 6,
    tags: ['2fa', 'security', 'authentication', 'two-factor'],
    content: `<h2>Two-Factor Authentication for Sellers</h2>
<p>Protect your seller account with an extra layer of security using two-factor authentication (2FA).</p>
<h3>Why Use 2FA?</h3>
<ul>
<li>Prevents unauthorized access even if your password is compromised</li>
<li>Protects your earnings and customer data</li>
<li>Required for certain withdrawal operations</li>
</ul>
<h3>OTP Verification</h3>
<p>Uptoza uses <strong>email-based OTP (One-Time Password)</strong> for sensitive actions like withdrawals. When you initiate a withdrawal, a 6-digit OTP is sent to your registered email that must be entered to confirm the transaction.</p>`
  },
  {
    id: 15, slug: 'seller-dashboard-overview', title: 'Seller dashboard overview', category: 'Seller Account Setup', categorySlug: 'seller-account-setup', role: 'seller', order: 7,
    tags: ['dashboard', 'overview', 'seller', 'navigation'],
    content: `<h2>Seller Dashboard Overview</h2>
<p>The Seller Dashboard is your command center for managing everything about your selling business on Uptoza.</p>
<h3>Dashboard Sections</h3>
<ul>
<li><strong>Home</strong> — Overview of recent sales, revenue, and key metrics</li>
<li><strong>Products</strong> — Create, edit, and manage your product listings</li>
<li><strong>Orders</strong> — View and process incoming orders</li>
<li><strong>Customers</strong> — See your customer base and analytics</li>
<li><strong>Analytics</strong> — Detailed sales charts and performance data</li>
<li><strong>Wallet</strong> — View earnings and request withdrawals</li>
<li><strong>Marketing</strong> — Create discount codes and promotions</li>
<li><strong>Chat</strong> — Communicate with buyers</li>
<li><strong>Settings</strong> — Store configuration and profile settings</li>
</ul>
<h3>Quick Stats</h3>
<p>At the top of your dashboard, you'll see real-time stats including today's sales, total revenue, pending orders, and wallet balance.</p>`
  },
  {
    id: 16, slug: 'seller-profile', title: 'Understanding your seller profile', category: 'Seller Account Setup', categorySlug: 'seller-account-setup', role: 'seller', order: 8,
    tags: ['profile', 'seller', 'public', 'information'],
    content: `<h2>Understanding Your Seller Profile</h2>
<p>Your seller profile is visible to buyers and includes key information about your store.</p>
<h3>Profile Elements</h3>
<ul>
<li><strong>Store name</strong> — Your brand identity on the platform</li>
<li><strong>Store logo</strong> — Visual representation of your brand</li>
<li><strong>Description</strong> — What you sell and who you serve</li>
<li><strong>Seller level badge</strong> — Your current seller tier</li>
<li><strong>Rating</strong> — Average rating from buyer reviews</li>
<li><strong>Total sales</strong> — Number of completed transactions</li>
<li><strong>Member since</strong> — When you joined the platform</li>
</ul>
<h3>Editing Your Profile</h3>
<p>Update your profile from <strong>Seller Dashboard → Settings</strong>. Changes are reflected immediately on your public store page.</p>`
  },
  {
    id: 17, slug: 'store-url-sharing', title: 'Store URL and sharing your store link', category: 'Seller Account Setup', categorySlug: 'seller-account-setup', role: 'seller', order: 9,
    tags: ['url', 'link', 'share', 'store', 'social'],
    content: `<h2>Store URL & Sharing</h2>
<p>Every seller gets a unique public store URL that buyers can visit directly.</p>
<h3>Your Store URL</h3>
<p>Your store URL follows the format: <code>uptoza.com/store/your-store-name</code></p>
<p>The slug is automatically generated from your store name. For example, if your store is "Digital Creations," your URL would be <code>uptoza.com/store/digital-creations</code>.</p>
<h3>Sharing Your Store</h3>
<ul>
<li>Use the <strong>"Share Store"</strong> button in your seller dashboard to get shareable links</li>
<li>Share on social media platforms (Twitter, Facebook, Instagram, LinkedIn)</li>
<li>Copy the direct link to share via email or messaging</li>
<li>Generate QR codes for offline sharing</li>
</ul>`
  },
  {
    id: 18, slug: 'google-oauth-sellers', title: 'Google OAuth for seller accounts', category: 'Seller Account Setup', categorySlug: 'seller-account-setup', role: 'seller', order: 10,
    tags: ['google', 'oauth', 'seller', 'login', 'authentication'],
    content: `<h2>Google OAuth for Seller Accounts</h2>
<p>Sellers can use Google OAuth for quick, secure authentication.</p>
<h3>How It Works</h3>
<p>If you signed up with Google, your seller account is automatically linked to your Google identity. You can sign in with one click without remembering a password.</p>
<h3>Security Benefits</h3>
<ul>
<li>Google handles password security and 2FA</li>
<li>No password to remember or manage</li>
<li>Automatic session management</li>
<li>Quick sign-in across devices</li>
</ul>
<h3>Important Note</h3>
<p>If you created your account with email/password, you can still link Google OAuth by signing in with the same email address used for your Google account.</p>`
  },

  // Category 3: Product Types
  {
    id: 19, slug: 'product-types-overview', title: 'Overview of all product types', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 1,
    tags: ['product types', 'overview', 'categories', 'digital products'],
    content: `<h2>Overview of All Product Types</h2>
<p>Uptoza supports <strong>14 different product types</strong>, each designed for specific digital goods and services:</p>
<ol>
<li><strong>Digital Products</strong> — Files, assets, and downloadable content</li>
<li><strong>E-books</strong> — PDF books, guides, and publications</li>
<li><strong>Templates</strong> — Design templates, presets, and themes</li>
<li><strong>Courses</strong> — Multi-lesson educational content with video</li>
<li><strong>Software</strong> — Apps, tools, plugins, and scripts</li>
<li><strong>Graphics</strong> — Visual assets, illustrations, and design elements</li>
<li><strong>Audio</strong> — Music, sound effects, and podcasts</li>
<li><strong>Video</strong> — Video content, tutorials, and stock footage</li>
<li><strong>Membership</strong> — Subscription-based access to exclusive content</li>
<li><strong>Services</strong> — Freelance work, consulting, and custom projects</li>
<li><strong>Commissions</strong> — Custom work orders on request</li>
<li><strong>Calls</strong> — Scheduled video/audio call sessions</li>
<li><strong>Coffee / Tips</strong> — Accept donations and support from fans</li>
<li><strong>Bundles</strong> — Combine multiple products into one package</li>
</ol>
<p>Each product type has a unique card layout in the marketplace designed to showcase its content effectively.</p>`
  },
  {
    id: 20, slug: 'digital-products', title: 'Digital Products — files, assets, downloads', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 2,
    tags: ['digital', 'files', 'downloads', 'assets'],
    content: `<h2>Digital Products</h2>
<p>Digital Products are the most versatile product type — perfect for selling any downloadable file or digital asset.</p>
<h3>What You Can Sell</h3>
<ul>
<li>PDFs, documents, and spreadsheets</li>
<li>Design files (PSD, AI, Figma)</li>
<li>Code snippets and scripts</li>
<li>Presets and configurations</li>
<li>Any downloadable digital file</li>
</ul>
<h3>Delivery Options</h3>
<ul>
<li><strong>Direct download</strong> — Buyer downloads files after purchase</li>
<li><strong>Auto-delivery</strong> — Automatically deliver unique files or accounts</li>
<li><strong>Manual delivery</strong> — You manually send the product to the buyer</li>
</ul>
<h3>Best Practices</h3>
<ul>
<li>Include clear product descriptions and preview images</li>
<li>Specify file formats and sizes</li>
<li>Provide usage instructions or guides</li>
</ul>`
  },
  {
    id: 21, slug: 'ebooks', title: 'E-books — publishing and selling', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 3,
    tags: ['ebook', 'book', 'pdf', 'publish', 'reading'],
    content: `<h2>E-books — Publishing & Selling</h2>
<p>E-books are one of the most popular digital products. Uptoza provides dedicated features for selling e-books effectively.</p>
<h3>Supported Formats</h3>
<ul><li>PDF (most common)</li><li>EPUB</li><li>MOBI</li></ul>
<h3>Setting Up Your E-book</h3>
<ol>
<li>Create a new product and select <strong>"E-book"</strong> as the type</li>
<li>Upload your cover image (recommended: 1400x2100px)</li>
<li>Upload the e-book file</li>
<li>Write a compelling description with chapter overview</li>
<li>Set your price and publish</li>
</ol>
<h3>E-book Card Design</h3>
<p>E-book products get a special card layout in the marketplace that showcases the cover image prominently, similar to a bookshelf display.</p>`
  },
  {
    id: 22, slug: 'templates', title: 'Templates — design templates and presets', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 4,
    tags: ['templates', 'design', 'presets', 'themes', 'notion'],
    content: `<h2>Templates — Design Templates & Presets</h2>
<p>Sell design templates, Notion templates, website themes, presentation decks, and more.</p>
<h3>Popular Template Types</h3>
<ul>
<li>Notion templates and databases</li>
<li>Canva design templates</li>
<li>Website themes and landing pages</li>
<li>Presentation templates</li>
<li>Social media templates</li>
<li>Resume and CV templates</li>
</ul>
<h3>Tips for Selling Templates</h3>
<ul>
<li>Include <strong>preview images</strong> showing the template in use</li>
<li>Provide <strong>setup instructions</strong> for buyers</li>
<li>List <strong>compatible platforms</strong> (e.g., "Works with Notion, Canva")</li>
<li>Offer a <strong>free preview version</strong> to attract buyers</li>
</ul>`
  },
  {
    id: 23, slug: 'courses', title: 'Courses — creating lessons and curriculum', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 5,
    tags: ['courses', 'lessons', 'education', 'curriculum', 'teaching'],
    content: `<h2>Courses — Creating Lessons & Curriculum</h2>
<p>Uptoza's Course Builder lets you create full online courses with video lessons, text content, and downloadable resources.</p>
<h3>Course Structure</h3>
<ul>
<li><strong>Course</strong> — The main product with title, description, and pricing</li>
<li><strong>Lessons</strong> — Individual units within the course, ordered sequentially</li>
<li>Each lesson can include video, text content (rich text editor), and file attachments</li>
</ul>
<h3>Key Features</h3>
<ul>
<li>Drag-and-drop lesson ordering</li>
<li>Video hosting with streaming support</li>
<li>Rich text content with formatting</li>
<li>Free preview lessons to attract enrollments</li>
<li>Progress tracking for enrolled buyers</li>
<li>Downloadable lesson attachments</li>
</ul>
<p>See the <strong>Course Builder</strong> category for detailed guides on creating courses.</p>`
  },
  {
    id: 24, slug: 'software', title: 'Software — distributing apps and tools', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 6,
    tags: ['software', 'apps', 'tools', 'plugins', 'scripts'],
    content: `<h2>Software — Distributing Apps & Tools</h2>
<p>Sell software products including desktop apps, browser extensions, plugins, scripts, and developer tools.</p>
<h3>Delivery Methods</h3>
<ul>
<li><strong>Direct download</strong> — Upload the software file for instant download</li>
<li><strong>License key delivery</strong> — Auto-deliver unique license keys</li>
<li><strong>Account delivery</strong> — Provide login credentials for SaaS products</li>
</ul>
<h3>Best Practices</h3>
<ul>
<li>Clearly list system requirements and compatibility</li>
<li>Include installation instructions</li>
<li>Specify version number and changelog</li>
<li>Provide support contact or documentation link</li>
<li>Use the software card layout for professional presentation</li>
</ul>`
  },
  {
    id: 25, slug: 'graphics', title: 'Graphics — selling visual assets', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 7,
    tags: ['graphics', 'visual', 'design', 'illustrations', 'icons'],
    content: `<h2>Graphics — Selling Visual Assets</h2>
<p>Sell illustrations, icons, UI kits, mockups, textures, and other visual design assets.</p>
<h3>What Sells Well</h3>
<ul><li>Icon packs and UI kits</li><li>Illustrations and vector art</li><li>Mockup templates</li><li>Social media graphics packs</li><li>Textures and patterns</li><li>Logo templates</li></ul>
<h3>Image Requirements</h3>
<ul><li>Use high-quality preview images</li><li>Show multiple views/examples of the graphics</li><li>Include format information (SVG, PNG, AI, etc.)</li><li>Specify resolution and dimensions</li></ul>`
  },
  {
    id: 26, slug: 'audio-products', title: 'Audio — music, sound effects, podcasts', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 8,
    tags: ['audio', 'music', 'sound effects', 'podcast', 'beats'],
    content: `<h2>Audio Products</h2>
<p>Sell music tracks, sound effects, beats, podcasts, audiobooks, and other audio content.</p>
<h3>Audio Card Features</h3>
<p>Audio products get a special card layout with an inline audio player, allowing buyers to preview tracks directly from the marketplace without opening the full product page.</p>
<h3>Supported Formats</h3>
<ul><li>MP3, WAV, FLAC, AAC, OGG</li></ul>
<h3>Tips</h3>
<ul><li>Provide a short preview clip (30-60 seconds)</li><li>Include licensing information</li><li>Specify BPM, key, and genre for music</li><li>Bundle related tracks for better value</li></ul>`
  },
  {
    id: 27, slug: 'video-products', title: 'Video — video content and tutorials', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 9,
    tags: ['video', 'tutorials', 'footage', 'content'],
    content: `<h2>Video Products</h2>
<p>Sell video tutorials, stock footage, motion graphics, and other video content.</p>
<h3>Video Card Features</h3>
<p>Video products display with a play button overlay and duration badge, signaling to buyers that this is video content.</p>
<h3>Delivery Options</h3>
<ul>
<li><strong>Streaming</strong> — Buyers watch directly on the platform</li>
<li><strong>Download</strong> — Buyers download the video file</li>
<li><strong>External link</strong> — Link to hosted video content</li>
</ul>
<h3>Best Practices</h3>
<ul><li>Include a preview/trailer</li><li>Specify video resolution and length</li><li>Use professional thumbnails</li></ul>`
  },
  {
    id: 28, slug: 'membership', title: 'Membership — subscription access products', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 10,
    tags: ['membership', 'subscription', 'recurring', 'access'],
    content: `<h2>Membership Products</h2>
<p>Create subscription-based products where buyers pay for ongoing access to exclusive content, communities, or resources.</p>
<h3>How Memberships Work</h3>
<ul>
<li>Set a recurring price (monthly, quarterly, or annual)</li>
<li>Members get access to your exclusive content</li>
<li>Manage member access from your dashboard</li>
</ul>
<h3>Membership Card</h3>
<p>Membership products display with a "Members" badge and show the number of active members, building social proof.</p>
<h3>Use Cases</h3>
<ul><li>Exclusive content libraries</li><li>Premium resource access</li><li>Private communities</li><li>Ongoing mentorship programs</li></ul>`
  },
  {
    id: 29, slug: 'services', title: 'Services — freelance and consulting gigs', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 11,
    tags: ['services', 'freelance', 'consulting', 'gig'],
    content: `<h2>Services — Freelance & Consulting</h2>
<p>Offer your professional services as products — from web development to design consulting to coaching.</p>
<h3>Service Features</h3>
<ul>
<li>Define service packages with different tiers</li>
<li>Set delivery timelines</li>
<li>Manage service requests through the orders system</li>
<li>Communicate with clients via built-in chat</li>
</ul>
<h3>Service Card</h3>
<p>Service products display with a "Service" badge and show estimated delivery time, helping buyers make informed decisions.</p>`
  },
  {
    id: 30, slug: 'commissions', title: 'Commissions — custom work orders', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 12,
    tags: ['commissions', 'custom', 'work', 'orders', 'request'],
    content: `<h2>Commissions — Custom Work Orders</h2>
<p>Accept custom work requests from buyers who want personalized products or services.</p>
<h3>How Commissions Work</h3>
<ol>
<li>Create a commission listing with your offerings and pricing</li>
<li>Buyers purchase a commission slot</li>
<li>Discuss requirements through the chat system</li>
<li>Complete and deliver the custom work</li>
<li>Mark the order as fulfilled</li>
</ol>
<h3>Examples</h3>
<ul><li>Custom artwork or illustrations</li><li>Personalized music or audio</li><li>Custom software development</li><li>Bespoke design work</li></ul>`
  },
  {
    id: 31, slug: 'calls', title: 'Calls — booking and scheduling sessions', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 13,
    tags: ['calls', 'booking', 'scheduling', 'session', 'meeting'],
    content: `<h2>Calls — Booking & Scheduling</h2>
<p>Offer paid call sessions — perfect for coaching, consulting, mentoring, or tutoring.</p>
<h3>Setting Up Calls</h3>
<ul>
<li>Set available time slots using the <strong>Availability Editor</strong></li>
<li>Define session duration (30 min, 60 min, etc.)</li>
<li>Set your per-session price</li>
<li>Include a description of what the call covers</li>
</ul>
<h3>Call Card</h3>
<p>Call products display with a calendar icon and "Book Now" CTA, making it clear this is a bookable session.</p>
<h3>After Booking</h3>
<p>When a buyer books a call, both parties receive a notification. You can manage all booked calls from your orders dashboard.</p>`
  },
  {
    id: 32, slug: 'coffee-tips', title: 'Coffee / Tips — accepting donations', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 14,
    tags: ['coffee', 'tips', 'donations', 'support', 'buy me a coffee'],
    content: `<h2>Coffee / Tips — Accepting Donations</h2>
<p>Let your fans and supporters send you tips or "buy you a coffee" — a simple way to monetize your following.</p>
<h3>How It Works</h3>
<ul>
<li>Create a "Coffee" product with a suggested tip amount</li>
<li>Buyers can choose to send the suggested amount or a custom tip</li>
<li>Funds go directly to your seller wallet</li>
</ul>
<h3>Coffee Card</h3>
<p>Coffee products have a unique warm-themed card with a coffee cup icon and a "Support" button.</p>
<h3>Best Uses</h3>
<ul><li>Content creators accepting fan support</li><li>Open-source developers receiving donations</li><li>Artists and musicians accepting tips</li></ul>`
  },
  {
    id: 33, slug: 'bundles', title: 'Bundles — combining multiple products', category: 'Product Types', categorySlug: 'product-types', role: 'seller', order: 15,
    tags: ['bundles', 'package', 'combo', 'deal', 'multiple'],
    content: `<h2>Bundles — Combining Multiple Products</h2>
<p>Create product bundles that combine multiple products at a discounted price.</p>
<h3>Creating a Bundle</h3>
<ol>
<li>Create a new product and select <strong>"Bundle"</strong> type</li>
<li>Use the <strong>Bundle Product Selector</strong> to add existing products</li>
<li>Set a bundle price (usually discounted from individual prices)</li>
<li>Add a description highlighting the value</li>
</ol>
<h3>Bundle Benefits</h3>
<ul>
<li>Increase average order value</li>
<li>Move more products with attractive packages</li>
<li>Offer better value to buyers</li>
<li>Cross-sell related products</li>
</ul>
<h3>Bundle Card</h3>
<p>Bundle products show the number of included items and the total savings compared to buying individually.</p>`
  },

  // Category 4: Creating Products
  {
    id: 34, slug: 'product-creation-guide', title: 'Step-by-step product creation guide', category: 'Creating Products', categorySlug: 'creating-products', role: 'seller', order: 1,
    tags: ['create', 'product', 'guide', 'step-by-step', 'new'],
    content: `<h2>Step-by-Step Product Creation Guide</h2>
<p>Follow this guide to create your first product on Uptoza:</p>
<ol>
<li><strong>Navigate</strong> to Seller Dashboard → Products → "New Product"</li>
<li><strong>Select product type</strong> — Choose from 14 available types</li>
<li><strong>Fill in basic info</strong> — Title, description, category</li>
<li><strong>Set pricing</strong> — Price, compare-at price (optional)</li>
<li><strong>Upload images</strong> — Product thumbnail and gallery images</li>
<li><strong>Add content/files</strong> — Upload deliverable files or configure delivery</li>
<li><strong>Configure delivery</strong> — Choose auto-delivery, manual, or download</li>
<li><strong>Set visibility</strong> — Published, draft, or scheduled</li>
<li><strong>Review and publish</strong> — Check everything and go live</li>
</ol>
<h3>Tips for Success</h3>
<ul>
<li>Write clear, benefit-focused descriptions</li>
<li>Use high-quality images that showcase your product</li>
<li>Set competitive pricing by researching similar products</li>
<li>Add relevant tags for better discoverability</li>
</ul>`
  },
  {
    id: 35, slug: 'effective-titles-descriptions', title: 'Writing effective product titles and descriptions', category: 'Creating Products', categorySlug: 'creating-products', role: 'seller', order: 2,
    tags: ['title', 'description', 'copywriting', 'seo', 'marketing'],
    content: `<h2>Writing Effective Product Titles & Descriptions</h2>
<h3>Product Titles</h3>
<ul>
<li>Keep titles under <strong>60 characters</strong> for best display</li>
<li>Include the main keyword (e.g., "Notion Budget Template")</li>
<li>Be specific about what the product is</li>
<li>Avoid clickbait or misleading titles</li>
</ul>
<h3>Product Descriptions</h3>
<ul>
<li>Start with a <strong>compelling hook</strong> — what problem does it solve?</li>
<li>List <strong>key features</strong> and what's included</li>
<li>Mention <strong>who it's for</strong> (target audience)</li>
<li>Include <strong>technical details</strong> (format, size, compatibility)</li>
<li>Use bullet points for easy scanning</li>
<li>End with a <strong>call-to-action</strong></li>
</ul>
<h3>SEO Tips</h3>
<p>Use relevant keywords naturally in your title and description. These help your product appear in marketplace search results and external search engines.</p>`
  },
  {
    id: 36, slug: 'setting-prices', title: 'Setting prices and compare-at prices', category: 'Creating Products', categorySlug: 'creating-products', role: 'seller', order: 3,
    tags: ['pricing', 'price', 'compare', 'discount', 'strategy'],
    content: `<h2>Setting Prices & Compare-at Prices</h2>
<h3>Product Price</h3>
<p>This is the actual selling price buyers will pay. Prices are set in USD and automatically converted to the buyer's local currency.</p>
<h3>Compare-at Price</h3>
<p>The compare-at price (also called "original price") shows a crossed-out higher price next to your selling price, creating a sense of value and urgency.</p>
<p>Example: <s>$49.99</s> <strong>$29.99</strong> — This shows the buyer they're getting a 40% discount.</p>
<h3>Pricing Tips</h3>
<ul>
<li>Research competitor pricing on similar products</li>
<li>Consider your production time and effort</li>
<li>Use psychological pricing (e.g., $9.99 instead of $10)</li>
<li>Start with a lower price to build reviews, then increase</li>
<li>Use compare-at prices strategically to highlight value</li>
</ul>`
  },
  {
    id: 37, slug: 'upload-product-images', title: 'Uploading product images (multi-image)', category: 'Creating Products', categorySlug: 'creating-products', role: 'seller', order: 4,
    tags: ['images', 'upload', 'gallery', 'photos', 'multi-image'],
    content: `<h2>Uploading Product Images</h2>
<p>High-quality images significantly impact sales. Uptoza supports multiple images per product.</p>
<h3>How to Upload</h3>
<ol>
<li>In the product editor, scroll to the <strong>Images</strong> section</li>
<li>Click <strong>"Upload Images"</strong> or drag and drop files</li>
<li>Upload up to <strong>10 images</strong> per product</li>
<li>The first image becomes the <strong>thumbnail</strong> (shown in marketplace)</li>
<li>Reorder images by dragging them</li>
</ol>
<h3>Image Guidelines</h3>
<ul>
<li><strong>Format</strong>: PNG, JPG, WEBP</li>
<li><strong>Recommended size</strong>: 1200x800px minimum</li>
<li><strong>Max file size</strong>: 5MB per image</li>
<li>Use consistent aspect ratios across images</li>
<li>Show the product from different angles/views</li>
</ul>`
  },
  {
    id: 38, slug: 'adding-product-files', title: 'Adding product files and content', category: 'Creating Products', categorySlug: 'creating-products', role: 'seller', order: 5,
    tags: ['files', 'content', 'upload', 'deliverable', 'download'],
    content: `<h2>Adding Product Files & Content</h2>
<p>The content section is where you upload the actual deliverable files buyers will receive.</p>
<h3>Content Types</h3>
<ul>
<li><strong>Files</strong> — Uploadable files (PDF, ZIP, images, etc.)</li>
<li><strong>Text content</strong> — Rich text content viewable online</li>
<li><strong>External links</strong> — Links to external resources</li>
<li><strong>Stream URLs</strong> — Video/audio streaming links</li>
</ul>
<h3>Using the File Content Uploader</h3>
<ol>
<li>Navigate to the <strong>Content</strong> tab in product editor</li>
<li>Click <strong>"Add Content"</strong></li>
<li>Select the content type</li>
<li>Upload files or enter content</li>
<li>Add a title and description for each content item</li>
<li>Set display order by dragging</li>
</ol>
<h3>Preview Content</h3>
<p>Mark specific content items as <strong>"Preview"</strong> to let non-buyers see them — great for free samples.</p>`
  },
  {
    id: 39, slug: 'rich-text-editor', title: 'Using the Rich Text Editor', category: 'Creating Products', categorySlug: 'creating-products', role: 'seller', order: 6,
    tags: ['editor', 'rich text', 'formatting', 'html', 'wysiwyg'],
    content: `<h2>Using the Rich Text Editor</h2>
<p>Uptoza's Rich Text Editor lets you create beautifully formatted product descriptions, lesson content, and more.</p>
<h3>Available Formatting</h3>
<ul>
<li><strong>Text styles</strong> — Bold, italic, underline, strikethrough</li>
<li><strong>Headings</strong> — H1 through H6</li>
<li><strong>Lists</strong> — Bullet and numbered lists</li>
<li><strong>Links</strong> — Clickable hyperlinks</li>
<li><strong>Images</strong> — Inline images within content</li>
<li><strong>Code blocks</strong> — Formatted code snippets</li>
<li><strong>Quotes</strong> — Block quotes for emphasis</li>
</ul>
<h3>Tips</h3>
<ul>
<li>Use headings to structure long content</li>
<li>Keep paragraphs short for readability</li>
<li>Use bullet points for feature lists</li>
<li>Bold important information to draw attention</li>
</ul>`
  },
  {
    id: 40, slug: 'product-categories', title: 'Setting up product categories', category: 'Creating Products', categorySlug: 'creating-products', role: 'seller', order: 7,
    tags: ['categories', 'organize', 'classification', 'taxonomy'],
    content: `<h2>Setting Up Product Categories</h2>
<p>Categories help buyers find your products and keep your store organized.</p>
<h3>How Categories Work</h3>
<ul>
<li>Each product can be assigned to one <strong>primary category</strong></li>
<li>Categories are platform-wide (set by admins)</li>
<li>Subcategories provide more specific classification</li>
<li>Products appear in category browsing pages in the marketplace</li>
</ul>
<h3>Choosing the Right Category</h3>
<ul>
<li>Select the most relevant category for your product</li>
<li>If unsure, choose the broader parent category</li>
<li>Don't miscategorize products — it hurts discoverability</li>
</ul>`
  },
  {
    id: 41, slug: 'product-visibility', title: 'Product visibility and publishing', category: 'Creating Products', categorySlug: 'creating-products', role: 'seller', order: 8,
    tags: ['visibility', 'publish', 'draft', 'live', 'status'],
    content: `<h2>Product Visibility & Publishing</h2>
<p>Control when and how your products appear in the marketplace.</p>
<h3>Visibility States</h3>
<ul>
<li><strong>Draft</strong> — Product is saved but not visible to buyers. Use this while you're still working on it.</li>
<li><strong>Published</strong> — Product is live and visible in the marketplace and your store.</li>
<li><strong>Unlisted</strong> — Product is accessible via direct link but doesn't appear in marketplace search.</li>
</ul>
<h3>Publishing Your Product</h3>
<ol>
<li>Complete all required fields (title, description, price, images)</li>
<li>Review the product preview</li>
<li>Toggle the visibility to <strong>"Published"</strong></li>
<li>Your product will appear in the marketplace within minutes</li>
</ol>
<h3>Admin Approval</h3>
<p>Some products may require admin approval before appearing in the marketplace. You'll be notified when your product is approved.</p>`
  },
  {
    id: 42, slug: 'card-customization', title: 'Card appearance customization', category: 'Creating Products', categorySlug: 'creating-products', role: 'seller', order: 9,
    tags: ['card', 'customization', 'appearance', 'design', 'layout'],
    content: `<h2>Card Appearance Customization</h2>
<p>Customize how your product card appears in the marketplace and your store using the Card Customizer.</p>
<h3>Customizable Elements</h3>
<ul>
<li><strong>Card background color</strong> — Set a custom background color for your card</li>
<li><strong>Text color</strong> — Ensure text is readable against your background</li>
<li><strong>Border style</strong> — Add custom borders or rounded corners</li>
<li><strong>Badge</strong> — Add labels like "Best Seller" or "New"</li>
</ul>
<h3>How to Customize</h3>
<ol>
<li>In the product editor, go to the <strong>"Card Design"</strong> tab</li>
<li>Use the Card Customizer to preview changes in real-time</li>
<li>Save when you're satisfied with the look</li>
</ol>
<p>Each product type has its own default card design optimized for that content type. Your customizations layer on top of these defaults.</p>`
  },
  {
    id: 43, slug: 'product-tags-seo', title: 'Product tags and SEO metadata', category: 'Creating Products', categorySlug: 'creating-products', role: 'seller', order: 10,
    tags: ['tags', 'seo', 'metadata', 'keywords', 'search'],
    content: `<h2>Product Tags & SEO Metadata</h2>
<p>Tags and SEO metadata help your products get discovered in both marketplace search and external search engines.</p>
<h3>Product Tags</h3>
<ul>
<li>Add up to <strong>10 tags</strong> per product</li>
<li>Use relevant, specific keywords</li>
<li>Include variations buyers might search for</li>
<li>Example: For a Notion template, use tags like "notion", "template", "productivity", "planner"</li>
</ul>
<h3>SEO Best Practices</h3>
<ul>
<li>Write descriptive titles with main keywords</li>
<li>Use natural language in descriptions</li>
<li>Fill in all available fields (description, tags, category)</li>
<li>Products with complete information rank higher</li>
</ul>`
  },
  {
    id: 44, slug: 'product-variants', title: 'Product variants and options', category: 'Creating Products', categorySlug: 'creating-products', role: 'seller', order: 11,
    tags: ['variants', 'options', 'variations', 'tiers', 'packages'],
    content: `<h2>Product Variants & Options</h2>
<p>Offer different versions or tiers of your product to cater to different buyer needs.</p>
<h3>Use Cases</h3>
<ul>
<li><strong>License tiers</strong> — Personal vs Commercial license</li>
<li><strong>Package sizes</strong> — Basic, Pro, Enterprise</li>
<li><strong>Format options</strong> — PDF only vs PDF + EPUB</li>
<li><strong>Duration</strong> — 1-month vs 1-year access</li>
</ul>
<h3>How to Set Up</h3>
<p>When creating your product, use the pricing section to define different tiers. Each variant can have its own price and description. Alternatively, create separate products for each variant and bundle them together.</p>`
  },
  {
    id: 45, slug: 'editing-product', title: 'Editing an existing product', category: 'Creating Products', categorySlug: 'creating-products', role: 'seller', order: 12,
    tags: ['edit', 'update', 'modify', 'change', 'product'],
    content: `<h2>Editing an Existing Product</h2>
<p>You can update any aspect of your published products at any time.</p>
<h3>How to Edit</h3>
<ol>
<li>Go to <strong>Seller Dashboard → Products</strong></li>
<li>Find the product you want to edit</li>
<li>Click the <strong>edit icon</strong> or the product card</li>
<li>Make your changes</li>
<li>Click <strong>"Save"</strong> to update</li>
</ol>
<h3>What You Can Edit</h3>
<ul>
<li>Title, description, and pricing</li>
<li>Images and gallery</li>
<li>Product files and content</li>
<li>Delivery settings and inventory</li>
<li>Visibility and status</li>
<li>Tags and categories</li>
</ul>
<h3>Important Notes</h3>
<ul>
<li>Changes to published products take effect immediately</li>
<li>Existing buyers retain access to previously purchased content</li>
<li>Price changes don't affect existing orders</li>
</ul>`
  },

  // Category 5: Auto-Delivery System
  {
    id: 46, slug: 'what-is-auto-delivery', title: 'What is Auto-Delivery?', category: 'Auto-Delivery System', categorySlug: 'auto-delivery', role: 'seller', order: 1,
    tags: ['auto-delivery', 'automatic', 'instant', 'delivery'],
    content: `<h2>What is Auto-Delivery?</h2>
<p>Auto-Delivery is Uptoza's automated product delivery system that instantly provides buyers with their purchased content — no manual intervention needed.</p>
<h3>How It Works</h3>
<ol>
<li>You pre-load delivery items (accounts, license keys, or files) into a delivery pool</li>
<li>When a buyer completes a purchase, the system automatically assigns and delivers the next available item</li>
<li>The buyer receives their product instantly after payment</li>
<li>The delivered item is marked as assigned and removed from available stock</li>
</ol>
<h3>Benefits</h3>
<ul>
<li><strong>Instant delivery</strong> — Buyers get their product immediately</li>
<li><strong>24/7 operation</strong> — Sales happen even while you sleep</li>
<li><strong>No manual work</strong> — System handles everything automatically</li>
<li><strong>Inventory tracking</strong> — Know exactly how much stock remains</li>
</ul>`
  },
  {
    id: 47, slug: 'auto-vs-manual-delivery', title: 'Auto-Delivery vs Manual Delivery explained', category: 'Auto-Delivery System', categorySlug: 'auto-delivery', role: 'seller', order: 2,
    tags: ['auto-delivery', 'manual', 'comparison', 'delivery method'],
    content: `<h2>Auto-Delivery vs Manual Delivery</h2>
<h3>Auto-Delivery</h3>
<ul>
<li>Products are delivered <strong>instantly</strong> after payment</li>
<li>You pre-load items into a delivery pool</li>
<li>System automatically assigns items to buyers</li>
<li>Best for: accounts, license keys, digital files with multiple copies</li>
<li>Orders show an <strong>"Auto-Delivered"</strong> badge</li>
</ul>
<h3>Manual Delivery</h3>
<ul>
<li>You manually process and deliver each order</li>
<li>Buyer waits for you to fulfill the order</li>
<li>Best for: custom work, services, unique products</li>
<li>Orders show <strong>"Pending Delivery"</strong> until you process them</li>
</ul>
<h3>Which Should You Choose?</h3>
<p>Use Auto-Delivery whenever possible — it provides a better buyer experience and lets you scale without additional work. Use Manual Delivery only when each order requires unique, custom fulfillment.</p>`
  },
  {
    id: 48, slug: 'account-delivery-setup', title: 'Setting up Account delivery (email:password)', category: 'Auto-Delivery System', categorySlug: 'auto-delivery', role: 'seller', order: 3,
    tags: ['account', 'credentials', 'email', 'password', 'login'],
    content: `<h2>Setting Up Account Delivery</h2>
<p>Account delivery automatically provides buyers with login credentials (email and password) for your product.</p>
<h3>How to Set Up</h3>
<ol>
<li>In the product editor, set delivery type to <strong>"Auto-Delivery"</strong></li>
<li>Select <strong>"Account"</strong> as the delivery item type</li>
<li>Go to <strong>Delivery & Inventory</strong> section</li>
<li>Add accounts with email and password fields</li>
<li>Save and enable the product</li>
</ol>
<h3>Account Format</h3>
<p>Each account entry includes:</p>
<ul>
<li><strong>Email/Username</strong> — The login identifier</li>
<li><strong>Password</strong> — The login password</li>
<li><strong>Label</strong> (optional) — Additional info like "Premium Plan"</li>
</ul>
<h3>Security</h3>
<p>Account credentials are stored securely and only revealed to the buyer after purchase. Buyers can view their delivered accounts in their dashboard.</p>`
  },
  {
    id: 49, slug: 'adding-accounts-individually', title: 'Adding accounts individually', category: 'Auto-Delivery System', categorySlug: 'auto-delivery', role: 'seller', order: 4,
    tags: ['accounts', 'add', 'individual', 'one-by-one'],
    content: `<h2>Adding Accounts Individually</h2>
<p>Add accounts one at a time through the Delivery & Inventory manager.</p>
<h3>Steps</h3>
<ol>
<li>Open the product's <strong>Delivery & Inventory</strong> section</li>
<li>Click <strong>"Add Account"</strong></li>
<li>Enter the <strong>email/username</strong></li>
<li>Enter the <strong>password</strong></li>
<li>Optionally add a <strong>label</strong> (e.g., "Standard Plan")</li>
<li>Click <strong>"Save"</strong></li>
</ol>
<h3>Managing Accounts</h3>
<ul>
<li>View all accounts in the inventory list</li>
<li>See which accounts are <strong>available</strong> vs <strong>assigned</strong></li>
<li>Delete unassigned accounts if needed</li>
<li>Add more accounts at any time to replenish stock</li>
</ul>`
  },
  {
    id: 50, slug: 'bulk-import-accounts', title: 'Bulk importing accounts', category: 'Auto-Delivery System', categorySlug: 'auto-delivery', role: 'seller', order: 5,
    tags: ['bulk', 'import', 'accounts', 'csv', 'batch'],
    content: `<h2>Bulk Importing Accounts</h2>
<p>Save time by importing multiple accounts at once.</p>
<h3>Import Format</h3>
<p>Enter accounts in the bulk import text area, one per line, using this format:</p>
<pre>email1@example.com:password1
email2@example.com:password2
email3@example.com:password3</pre>
<h3>How to Bulk Import</h3>
<ol>
<li>Go to <strong>Delivery & Inventory</strong> for your product</li>
<li>Click <strong>"Bulk Import"</strong></li>
<li>Paste your accounts in the text area (one per line)</li>
<li>Click <strong>"Import"</strong></li>
<li>Review the import summary (success count, duplicates, errors)</li>
</ol>
<h3>Tips</h3>
<ul>
<li>Use the format <code>email:password</code> separated by a colon</li>
<li>Remove any empty lines before importing</li>
<li>The system detects and skips duplicate entries</li>
<li>You can import hundreds of accounts at once</li>
</ul>`
  },
  {
    id: 51, slug: 'license-key-delivery', title: 'Setting up License Key delivery', category: 'Auto-Delivery System', categorySlug: 'auto-delivery', role: 'seller', order: 6,
    tags: ['license', 'key', 'serial', 'activation', 'code'],
    content: `<h2>Setting Up License Key Delivery</h2>
<p>Automatically deliver unique license keys, serial numbers, or activation codes to buyers.</p>
<h3>How to Set Up</h3>
<ol>
<li>Set delivery type to <strong>"Auto-Delivery"</strong></li>
<li>Select <strong>"License Key"</strong> as the delivery item type</li>
<li>Add your license keys individually or bulk import them</li>
<li>Each key is delivered once and marked as assigned</li>
</ol>
<h3>Key Format</h3>
<p>License keys can be any text string. Examples:</p>
<ul>
<li><code>XXXX-XXXX-XXXX-XXXX</code></li>
<li><code>ABC123-DEF456-GHI789</code></li>
<li>Any alphanumeric string</li>
</ul>
<h3>After Delivery</h3>
<p>Buyers can view their delivered license keys in the <strong>Buyer Dashboard → Library</strong> section.</p>`
  },
  {
    id: 52, slug: 'bulk-import-license-keys', title: 'Bulk importing license keys', category: 'Auto-Delivery System', categorySlug: 'auto-delivery', role: 'seller', order: 7,
    tags: ['bulk', 'import', 'license', 'keys', 'batch'],
    content: `<h2>Bulk Importing License Keys</h2>
<p>Import multiple license keys at once for efficient inventory management.</p>
<h3>How to Import</h3>
<ol>
<li>Go to <strong>Delivery & Inventory</strong></li>
<li>Click <strong>"Bulk Import"</strong></li>
<li>Paste your keys, one per line</li>
<li>Click <strong>"Import"</strong></li>
</ol>
<h3>Format</h3>
<pre>KEY-001-ABC-DEF
KEY-002-GHI-JKL
KEY-003-MNO-PQR</pre>
<p>Each line is treated as one unique license key. Empty lines are automatically skipped.</p>`
  },
  {
    id: 53, slug: 'download-delivery', title: 'Setting up Download delivery (unique files)', category: 'Auto-Delivery System', categorySlug: 'auto-delivery', role: 'seller', order: 8,
    tags: ['download', 'files', 'delivery', 'unique', 'direct'],
    content: `<h2>Setting Up Download Delivery</h2>
<p>Provide direct file downloads to buyers after purchase. Unlike account/key delivery, download delivery gives the same files to all buyers.</p>
<h3>How to Set Up</h3>
<ol>
<li>In the product editor, go to the <strong>Content</strong> section</li>
<li>Upload your deliverable files</li>
<li>Set appropriate titles and descriptions for each file</li>
<li>Buyers can download files from their library after purchase</li>
</ol>
<h3>Supported File Types</h3>
<p>Any file type is supported — PDF, ZIP, images, videos, documents, code archives, and more.</p>
<h3>Download Limits</h3>
<p>You can optionally set maximum download limits per buyer to prevent abuse.</p>`
  },
  {
    id: 54, slug: 'usage-guides', title: 'Writing usage guides for buyers', category: 'Auto-Delivery System', categorySlug: 'auto-delivery', role: 'seller', order: 9,
    tags: ['guide', 'instructions', 'how-to', 'documentation'],
    content: `<h2>Writing Usage Guides for Buyers</h2>
<p>A good usage guide reduces support requests and improves buyer satisfaction.</p>
<h3>What to Include</h3>
<ul>
<li><strong>Getting started</strong> — First steps after receiving the product</li>
<li><strong>Installation/setup</strong> — How to install or set up the product</li>
<li><strong>Key features</strong> — Overview of main features and how to use them</li>
<li><strong>Troubleshooting</strong> — Common issues and solutions</li>
<li><strong>Support contact</strong> — How to reach you for help</li>
</ul>
<h3>Where to Add Guides</h3>
<ul>
<li>Include in the product description</li>
<li>Add as a separate content item (text or PDF)</li>
<li>Link to external documentation</li>
</ul>`
  },
  {
    id: 55, slug: 'delivery-inventory-management', title: 'Managing delivery inventory and stock', category: 'Auto-Delivery System', categorySlug: 'auto-delivery', role: 'seller', order: 10,
    tags: ['inventory', 'stock', 'manage', 'delivery pool'],
    content: `<h2>Managing Delivery Inventory & Stock</h2>
<p>Keep track of your auto-delivery inventory to ensure you never run out of stock.</p>
<h3>Inventory Dashboard</h3>
<ul>
<li>View total items in your delivery pool</li>
<li>See <strong>available</strong> items (ready to deliver)</li>
<li>See <strong>assigned</strong> items (already delivered to buyers)</li>
<li>Monitor stock levels with visual indicators</li>
</ul>
<h3>Low Stock Alerts</h3>
<p>When your delivery pool runs low, you'll see warnings in your dashboard. Add more items before you run out to avoid missed sales.</p>
<h3>Best Practices</h3>
<ul>
<li>Maintain a buffer of at least 10 items above your expected daily sales</li>
<li>Set up a schedule to replenish inventory regularly</li>
<li>Monitor the assignment history to spot any issues</li>
</ul>`
  },

  // Category 6: Course Builder
  {
    id: 56, slug: 'creating-first-course', title: 'Creating your first course', category: 'Course Builder', categorySlug: 'course-builder', role: 'seller', order: 1,
    tags: ['course', 'create', 'first', 'tutorial', 'education'],
    content: `<h2>Creating Your First Course</h2>
<p>Build an online course with multiple lessons, videos, and downloadable resources.</p>
<h3>Step-by-Step</h3>
<ol>
<li>Go to <strong>Seller Dashboard → Products → New Product</strong></li>
<li>Select <strong>"Course"</strong> as the product type</li>
<li>Fill in the course title, description, and pricing</li>
<li>Upload a course thumbnail image</li>
<li>Navigate to the <strong>Lessons</strong> tab</li>
<li>Add your first lesson using the <strong>Lesson Builder</strong></li>
<li>Continue adding lessons to build your curriculum</li>
<li>Set lesson order and mark any free preview lessons</li>
<li>Publish when ready</li>
</ol>
<h3>Course Structure Tips</h3>
<ul>
<li>Start with an introduction lesson</li>
<li>Break content into digestible 10-20 minute lessons</li>
<li>Offer 1-2 free preview lessons to attract enrollments</li>
<li>End with a summary or next-steps lesson</li>
</ul>`
  },
  {
    id: 57, slug: 'adding-lessons', title: 'Adding lessons with video and text', category: 'Course Builder', categorySlug: 'course-builder', role: 'seller', order: 2,
    tags: ['lessons', 'video', 'text', 'content', 'add'],
    content: `<h2>Adding Lessons with Video & Text</h2>
<p>Each lesson can include a combination of video content, rich text, and downloadable attachments.</p>
<h3>Lesson Components</h3>
<ul>
<li><strong>Title</strong> — Clear, descriptive lesson title</li>
<li><strong>Description</strong> — Brief overview of what the lesson covers</li>
<li><strong>Video</strong> — Upload or link to a video (URL or file upload)</li>
<li><strong>Text content</strong> — Rich text content using the editor</li>
<li><strong>Attachments</strong> — Downloadable files (worksheets, code, resources)</li>
</ul>
<h3>Video Options</h3>
<ul>
<li>Paste a video URL (YouTube, Vimeo, or direct link)</li>
<li>Upload a video file directly</li>
<li>Set the video duration for the lesson card display</li>
</ul>`
  },
  {
    id: 58, slug: 'lesson-ordering-previews', title: 'Lesson ordering and free previews', category: 'Course Builder', categorySlug: 'course-builder', role: 'seller', order: 3,
    tags: ['order', 'preview', 'free', 'arrange', 'sequence'],
    content: `<h2>Lesson Ordering & Free Previews</h2>
<h3>Ordering Lessons</h3>
<ul>
<li>Lessons are displayed in the order you set</li>
<li>Use the <strong>display order</strong> field to arrange lessons</li>
<li>Drag and drop to reorder lessons easily</li>
<li>New lessons are added at the end by default</li>
</ul>
<h3>Free Preview Lessons</h3>
<p>Mark specific lessons as <strong>"Free Preview"</strong> to let non-buyers watch them. This is a powerful conversion tool.</p>
<ul>
<li>Toggle the <strong>"Free Preview"</strong> switch on any lesson</li>
<li>Preview lessons are accessible without purchase</li>
<li>Recommended: Make your introduction lesson a free preview</li>
<li>Limit free previews to 1-3 lessons to maintain value</li>
</ul>`
  },
  {
    id: 59, slug: 'lesson-attachments', title: 'Attaching downloadable resources to lessons', category: 'Course Builder', categorySlug: 'course-builder', role: 'seller', order: 4,
    tags: ['attachments', 'resources', 'download', 'files', 'materials'],
    content: `<h2>Attaching Downloadable Resources</h2>
<p>Enhance your course lessons with downloadable materials that complement the video/text content.</p>
<h3>Types of Attachments</h3>
<ul>
<li>Worksheets and exercises (PDF)</li>
<li>Code files and starter projects (ZIP)</li>
<li>Cheat sheets and reference guides</li>
<li>Templates and tools</li>
<li>Supplementary reading materials</li>
</ul>
<h3>How to Add Attachments</h3>
<ol>
<li>Edit the lesson in the Lesson Builder</li>
<li>Scroll to the <strong>Attachments</strong> section</li>
<li>Upload files or provide download links</li>
<li>Add a descriptive name for each attachment</li>
</ol>
<p>Buyers can download attachments from the course viewer alongside the lesson content.</p>`
  },
  {
    id: 60, slug: 'course-progress-tracking', title: 'Course progress tracking for buyers', category: 'Course Builder', categorySlug: 'course-builder', role: 'seller', order: 5,
    tags: ['progress', 'tracking', 'completion', 'learning'],
    content: `<h2>Course Progress Tracking</h2>
<p>Uptoza automatically tracks each buyer's progress through your course.</p>
<h3>How It Works</h3>
<ul>
<li>Progress is tracked per lesson — each lesson shows completion status</li>
<li>Video lessons track playback position so buyers can resume where they left off</li>
<li>An overall course progress percentage is shown</li>
<li>Completed lessons are marked with a checkmark</li>
</ul>
<h3>For Sellers</h3>
<p>You can view aggregate course progress data in your analytics to understand how far buyers get through your course content. This helps identify drop-off points and improve your content.</p>`
  },
  {
    id: 61, slug: 'updating-course-content', title: 'Updating course content after publishing', category: 'Course Builder', categorySlug: 'course-builder', role: 'seller', order: 6,
    tags: ['update', 'edit', 'modify', 'course', 'content'],
    content: `<h2>Updating Course Content After Publishing</h2>
<p>You can update, add, or remove lessons from a published course at any time.</p>
<h3>What You Can Update</h3>
<ul>
<li>Edit existing lesson content (video, text, attachments)</li>
<li>Add new lessons to expand the course</li>
<li>Reorder lessons</li>
<li>Update the course description and pricing</li>
<li>Remove outdated lessons</li>
</ul>
<h3>Impact on Existing Buyers</h3>
<ul>
<li>Existing buyers automatically get access to new lessons</li>
<li>Their progress on existing lessons is preserved</li>
<li>Removed lessons will no longer be accessible</li>
<li>It's good practice to notify buyers about major updates</li>
</ul>`
  },

  // Category 7: Sales & Orders
  {
    id: 62, slug: 'orders-dashboard', title: 'Understanding your orders dashboard', category: 'Sales & Orders', categorySlug: 'sales-orders', role: 'seller', order: 1,
    tags: ['orders', 'dashboard', 'management', 'overview'],
    content: `<h2>Understanding Your Orders Dashboard</h2>
<p>The Orders dashboard shows all purchases of your products, organized by status and date.</p>
<h3>Dashboard Elements</h3>
<ul>
<li><strong>Order list</strong> — All orders with buyer info, product, amount, and status</li>
<li><strong>Filters</strong> — Filter by status (pending, delivered, completed)</li>
<li><strong>Search</strong> — Find orders by buyer email or order ID</li>
<li><strong>Quick stats</strong> — Total orders, revenue, and pending deliveries</li>
</ul>
<h3>Order Information</h3>
<p>Each order shows: order ID, buyer name/email, product purchased, amount paid, order date, delivery status, and payment status.</p>`
  },
  {
    id: 63, slug: 'order-statuses', title: 'Order statuses explained', category: 'Sales & Orders', categorySlug: 'sales-orders', role: 'seller', order: 2,
    tags: ['status', 'order', 'pending', 'delivered', 'completed'],
    content: `<h2>Order Statuses Explained</h2>
<ul>
<li><strong>Pending</strong> — Payment received, awaiting delivery (manual delivery products)</li>
<li><strong>Auto-Delivered</strong> — Product was automatically delivered to the buyer</li>
<li><strong>Delivered</strong> — You manually delivered the product</li>
<li><strong>Completed</strong> — Order fully processed and closed</li>
<li><strong>Refunded</strong> — Payment was returned to the buyer</li>
<li><strong>Disputed</strong> — Buyer has raised a dispute about this order</li>
</ul>
<h3>Status Flow</h3>
<p>For auto-delivery: Payment → Auto-Delivered → Completed</p>
<p>For manual delivery: Payment → Pending → Delivered → Completed</p>`
  },
  {
    id: 64, slug: 'processing-manual-deliveries', title: 'Processing manual deliveries', category: 'Sales & Orders', categorySlug: 'sales-orders', role: 'seller', order: 3,
    tags: ['manual', 'delivery', 'process', 'fulfill'],
    content: `<h2>Processing Manual Deliveries</h2>
<p>For products without auto-delivery, you need to manually process each order.</p>
<h3>Steps</h3>
<ol>
<li>Go to <strong>Seller Dashboard → Orders</strong></li>
<li>Look for orders with <strong>"Pending"</strong> status</li>
<li>Click on the order to view details</li>
<li>Deliver the product to the buyer (via chat, email, or by uploading delivery content)</li>
<li>Mark the order as <strong>"Delivered"</strong></li>
</ol>
<h3>Tips</h3>
<ul>
<li>Process pending orders as quickly as possible</li>
<li>Communicate with buyers through the chat if you need more information</li>
<li>Response time affects your seller rating and level</li>
</ul>`
  },
  {
    id: 65, slug: 'auto-delivered-badge', title: 'Auto-delivered orders badge', category: 'Sales & Orders', categorySlug: 'sales-orders', role: 'seller', order: 4,
    tags: ['auto-delivered', 'badge', 'instant', 'automatic'],
    content: `<h2>Auto-Delivered Orders Badge</h2>
<p>Orders that were fulfilled automatically through the auto-delivery system display a special <strong>"Auto-Delivered"</strong> badge.</p>
<h3>What It Means</h3>
<ul>
<li>The buyer received their product instantly after payment</li>
<li>No manual action was required from you</li>
<li>The delivered item (account, key, or file) is logged in the order details</li>
</ul>
<h3>Viewing Delivered Items</h3>
<p>Click on any auto-delivered order to see exactly which item from your delivery pool was assigned to the buyer.</p>`
  },
  {
    id: 66, slug: 'order-details', title: 'Viewing order details and buyer info', category: 'Sales & Orders', categorySlug: 'sales-orders', role: 'seller', order: 5,
    tags: ['details', 'buyer', 'info', 'order', 'view'],
    content: `<h2>Viewing Order Details & Buyer Info</h2>
<p>Each order has a detail page with comprehensive information.</p>
<h3>Order Details Include</h3>
<ul>
<li><strong>Order ID</strong> — Unique identifier</li>
<li><strong>Buyer info</strong> — Name, email, and profile</li>
<li><strong>Product</strong> — What was purchased</li>
<li><strong>Amount</strong> — Price paid (in original currency)</li>
<li><strong>Payment method</strong> — How the buyer paid</li>
<li><strong>Order date</strong> — When the purchase was made</li>
<li><strong>Delivery status</strong> — Current delivery state</li>
<li><strong>Delivered content</strong> — What was delivered (for auto-delivery)</li>
</ul>`
  },
  {
    id: 67, slug: 'refunds-disputes', title: 'Handling refunds and disputes', category: 'Sales & Orders', categorySlug: 'sales-orders', role: 'seller', order: 6,
    tags: ['refund', 'dispute', 'complaint', 'resolution'],
    content: `<h2>Handling Refunds & Disputes</h2>
<p>Occasionally, buyers may request refunds or raise disputes about their purchases.</p>
<h3>Refund Process</h3>
<ul>
<li>Buyers can request a refund through their dashboard</li>
<li>You'll be notified of the refund request</li>
<li>Review the request and communicate with the buyer</li>
<li>Admin will make the final decision on disputed refunds</li>
</ul>
<h3>Preventing Disputes</h3>
<ul>
<li>Write accurate, honest product descriptions</li>
<li>Respond to buyer inquiries quickly</li>
<li>Provide clear usage instructions</li>
<li>Offer support for any issues buyers encounter</li>
</ul>`
  },
  {
    id: 68, slug: 'exporting-orders', title: 'Exporting orders data', category: 'Sales & Orders', categorySlug: 'sales-orders', role: 'seller', order: 7,
    tags: ['export', 'csv', 'data', 'download', 'report'],
    content: `<h2>Exporting Orders Data</h2>
<p>Download your orders data as a CSV file for record-keeping, accounting, or analysis.</p>
<h3>How to Export</h3>
<ol>
<li>Go to <strong>Seller Dashboard → Orders</strong></li>
<li>Apply any filters you want (date range, status, etc.)</li>
<li>Click the <strong>"Export"</strong> button</li>
<li>The CSV file will download with all visible orders</li>
</ol>
<h3>Exported Data Includes</h3>
<ul><li>Order ID, date, buyer email, product name, amount, status, payment method</li></ul>`
  },
  {
    id: 69, slug: 'order-notifications', title: 'Order notifications and alerts', category: 'Sales & Orders', categorySlug: 'sales-orders', role: 'seller', order: 8,
    tags: ['notifications', 'alerts', 'email', 'push', 'orders'],
    content: `<h2>Order Notifications & Alerts</h2>
<p>Stay informed about new orders and important order events.</p>
<h3>Notification Channels</h3>
<ul>
<li><strong>In-app notifications</strong> — Bell icon in your dashboard</li>
<li><strong>Email notifications</strong> — Sent to your registered email</li>
<li><strong>Push notifications</strong> — Browser push notifications (if enabled)</li>
</ul>
<h3>Events That Trigger Notifications</h3>
<ul>
<li>New order received</li>
<li>Payment confirmed</li>
<li>Refund requested</li>
<li>Buyer message received</li>
<li>Order dispute raised</li>
</ul>
<h3>Managing Notifications</h3>
<p>Configure your notification preferences in <strong>Settings → Notifications</strong>. You can enable/disable notifications by type and channel.</p>`
  },

  // Category 8: Customers
  {
    id: 70, slug: 'customer-list', title: 'Viewing your customer list', category: 'Customers', categorySlug: 'customers', role: 'seller', order: 1,
    tags: ['customers', 'list', 'buyers', 'view'],
    content: `<h2>Viewing Your Customer List</h2>
<p>The Customers section shows all buyers who have purchased from your store.</p>
<h3>Customer Information</h3>
<ul>
<li><strong>Name/Email</strong> — Buyer identification</li>
<li><strong>Total spent</strong> — Lifetime purchase value</li>
<li><strong>Order count</strong> — Number of purchases</li>
<li><strong>Last purchase</strong> — Most recent order date</li>
<li><strong>Status</strong> — Active, inactive, or new customer</li>
</ul>
<h3>Sorting & Filtering</h3>
<p>Sort customers by total spent, order count, or recency. Use the search bar to find specific customers by name or email.</p>`
  },
  {
    id: 71, slug: 'customer-segments', title: 'Customer segments and analytics', category: 'Customers', categorySlug: 'customers', role: 'seller', order: 2,
    tags: ['segments', 'analytics', 'groups', 'cohorts'],
    content: `<h2>Customer Segments & Analytics</h2>
<p>Understanding your customer base helps you make better business decisions.</p>
<h3>Customer Segments</h3>
<ul>
<li><strong>New customers</strong> — First-time buyers</li>
<li><strong>Returning customers</strong> — Repeat buyers (2+ purchases)</li>
<li><strong>VIP customers</strong> — High-value buyers with significant spending</li>
<li><strong>At-risk customers</strong> — Haven't purchased in a long time</li>
</ul>
<h3>Analytics</h3>
<p>The customer analytics dashboard shows segment distribution, average order value, customer growth over time, and repeat purchase rate.</p>`
  },
  {
    id: 72, slug: 'customer-lifetime-value', title: 'Customer lifetime value', category: 'Customers', categorySlug: 'customers', role: 'seller', order: 3,
    tags: ['lifetime value', 'clv', 'ltv', 'revenue'],
    content: `<h2>Customer Lifetime Value</h2>
<p>Customer Lifetime Value (CLV) represents the total revenue a customer generates over their entire relationship with your store.</p>
<h3>How It's Calculated</h3>
<p>CLV = Total amount spent by the customer across all orders</p>
<h3>Why It Matters</h3>
<ul>
<li>Identifies your most valuable customers</li>
<li>Helps prioritize customer support efforts</li>
<li>Guides marketing and promotional strategies</li>
<li>Indicates product satisfaction and loyalty</li>
</ul>`
  },
  {
    id: 73, slug: 'top-spenders', title: 'Top spenders and repeat buyers', category: 'Customers', categorySlug: 'customers', role: 'seller', order: 4,
    tags: ['top spenders', 'repeat', 'loyal', 'vip'],
    content: `<h2>Top Spenders & Repeat Buyers</h2>
<p>Identify your best customers and reward their loyalty.</p>
<h3>Top Spenders</h3>
<p>The customer dashboard highlights your top spenders — customers who have spent the most in your store. This is sorted by total lifetime spend.</p>
<h3>Repeat Buyers</h3>
<p>Repeat buyers are customers who have made 2 or more purchases. A high repeat buyer rate indicates strong product quality and customer satisfaction.</p>
<h3>Actionable Insights</h3>
<ul>
<li>Send personalized offers to top spenders</li>
<li>Create loyalty rewards or exclusive products</li>
<li>Use repeat buyer data to inform new product development</li>
</ul>`
  },
  {
    id: 74, slug: 'export-customer-data', title: 'Exporting customer data (CSV)', category: 'Customers', categorySlug: 'customers', role: 'seller', order: 5,
    tags: ['export', 'csv', 'customer', 'data', 'download'],
    content: `<h2>Exporting Customer Data (CSV)</h2>
<p>Export your customer list for external analysis, email marketing, or record-keeping.</p>
<h3>How to Export</h3>
<ol>
<li>Go to <strong>Seller Dashboard → Customers</strong></li>
<li>Click the <strong>"Export CSV"</strong> button</li>
<li>The file downloads with all customer data</li>
</ol>
<h3>Exported Fields</h3>
<ul><li>Customer name, email, total spent, order count, first purchase date, last purchase date</li></ul>
<h3>Privacy Note</h3>
<p>Customer data should be handled in accordance with privacy laws. Only use exported data for legitimate business purposes.</p>`
  },

  // Category 9: Analytics & Insights
  {
    id: 75, slug: 'sales-analytics-overview', title: 'Sales analytics overview', category: 'Analytics & Insights', categorySlug: 'analytics', role: 'seller', order: 1,
    tags: ['analytics', 'sales', 'overview', 'dashboard'],
    content: `<h2>Sales Analytics Overview</h2>
<p>The Analytics section provides comprehensive insights into your selling performance.</p>
<h3>Key Metrics</h3>
<ul>
<li><strong>Total revenue</strong> — All-time earnings from sales</li>
<li><strong>Total orders</strong> — Number of completed transactions</li>
<li><strong>Average order value</strong> — Mean purchase amount</li>
<li><strong>Conversion rate</strong> — Percentage of views that result in sales</li>
<li><strong>Product views</strong> — How many times your products were viewed</li>
</ul>
<h3>Time Periods</h3>
<p>View analytics for different time periods: Today, Last 7 days, Last 30 days, Last 90 days, or custom date range.</p>`
  },
  {
    id: 76, slug: 'revenue-charts', title: 'Revenue charts and trends', category: 'Analytics & Insights', categorySlug: 'analytics', role: 'seller', order: 2,
    tags: ['revenue', 'charts', 'trends', 'graphs', 'income'],
    content: `<h2>Revenue Charts & Trends</h2>
<p>Visual charts help you understand your revenue patterns over time.</p>
<h3>Chart Types</h3>
<ul>
<li><strong>Revenue over time</strong> — Daily/weekly/monthly revenue trend line</li>
<li><strong>Orders over time</strong> — Transaction volume chart</li>
<li><strong>Revenue by product</strong> — Which products earn the most</li>
</ul>
<h3>Reading the Charts</h3>
<ul>
<li>Hover over data points to see exact values</li>
<li>Compare different time periods to identify growth</li>
<li>Look for patterns — which days or periods perform best?</li>
</ul>`
  },
  {
    id: 77, slug: 'product-analytics', title: 'Product-level analytics', category: 'Analytics & Insights', categorySlug: 'analytics', role: 'seller', order: 3,
    tags: ['product', 'analytics', 'performance', 'individual'],
    content: `<h2>Product-Level Analytics</h2>
<p>See how each individual product performs with detailed per-product metrics.</p>
<h3>Per-Product Metrics</h3>
<ul>
<li><strong>Views</strong> — How many times the product page was viewed</li>
<li><strong>Clicks</strong> — How many times the product card was clicked</li>
<li><strong>Purchases</strong> — Number of sales</li>
<li><strong>Revenue</strong> — Total earnings from this product</li>
<li><strong>Conversion rate</strong> — Views to purchases ratio</li>
</ul>
<h3>Using Product Analytics</h3>
<ul>
<li>Identify best-sellers to create similar products</li>
<li>Find underperforming products to optimize</li>
<li>Compare product performance to make data-driven decisions</li>
</ul>`
  },
  {
    id: 78, slug: 'performance-metrics', title: 'Performance metrics explained', category: 'Analytics & Insights', categorySlug: 'analytics', role: 'seller', order: 4,
    tags: ['metrics', 'performance', 'kpi', 'indicators'],
    content: `<h2>Performance Metrics Explained</h2>
<h3>Key Performance Indicators</h3>
<ul>
<li><strong>Gross Revenue</strong> — Total sales before commission deduction</li>
<li><strong>Net Revenue</strong> — Your earnings after platform commission</li>
<li><strong>Average Order Value (AOV)</strong> — Total revenue ÷ total orders</li>
<li><strong>Conversion Rate</strong> — (Purchases ÷ Product Views) × 100</li>
<li><strong>Customer Acquisition</strong> — New unique buyers per period</li>
<li><strong>Repeat Purchase Rate</strong> — Percentage of buyers who purchase again</li>
</ul>`
  },
  {
    id: 79, slug: 'traffic-conversion', title: 'Traffic and conversion rates', category: 'Analytics & Insights', categorySlug: 'analytics', role: 'seller', order: 5,
    tags: ['traffic', 'conversion', 'views', 'funnel'],
    content: `<h2>Traffic & Conversion Rates</h2>
<p>Understanding how visitors convert into buyers is crucial for optimization.</p>
<h3>The Sales Funnel</h3>
<ol>
<li><strong>Impressions</strong> — Product appears in marketplace/search</li>
<li><strong>Clicks</strong> — Buyer clicks on your product card</li>
<li><strong>Views</strong> — Buyer views the full product page</li>
<li><strong>Purchase</strong> — Buyer completes the purchase</li>
</ol>
<h3>Improving Conversions</h3>
<ul>
<li>Better thumbnails → More clicks</li>
<li>Better descriptions → More purchases</li>
<li>Competitive pricing → Higher conversion rate</li>
<li>Reviews and social proof → Increased trust</li>
</ul>`
  },
  {
    id: 80, slug: 'comparing-periods', title: 'Comparing time periods', category: 'Analytics & Insights', categorySlug: 'analytics', role: 'seller', order: 6,
    tags: ['compare', 'periods', 'time', 'growth', 'trends'],
    content: `<h2>Comparing Time Periods</h2>
<p>Compare your performance across different time periods to identify trends and growth.</p>
<h3>How to Compare</h3>
<ul>
<li>Select a primary time period (e.g., "Last 30 days")</li>
<li>The dashboard automatically shows comparison with the previous equivalent period</li>
<li>Green/red indicators show growth or decline</li>
</ul>
<h3>What to Look For</h3>
<ul>
<li>Revenue growth rate — Is your income increasing?</li>
<li>Order volume trends — Are you getting more sales?</li>
<li>Customer growth — Is your buyer base expanding?</li>
</ul>`
  },
  {
    id: 81, slug: 'reports-export', title: 'Reports and data export', category: 'Analytics & Insights', categorySlug: 'analytics', role: 'seller', order: 7,
    tags: ['reports', 'export', 'data', 'csv', 'analysis'],
    content: `<h2>Reports & Data Export</h2>
<p>Export your analytics data for external analysis or reporting.</p>
<h3>Available Exports</h3>
<ul>
<li><strong>Sales report</strong> — Revenue, orders, and products sold by date</li>
<li><strong>Customer report</strong> — Customer list with lifetime value</li>
<li><strong>Product report</strong> — Per-product performance metrics</li>
</ul>
<h3>Export Format</h3>
<p>All reports export as CSV files that can be opened in Excel, Google Sheets, or any spreadsheet application.</p>`
  },
  {
    id: 82, slug: 'seller-level-progress', title: 'Understanding your seller level progress', category: 'Analytics & Insights', categorySlug: 'analytics', role: 'seller', order: 8,
    tags: ['level', 'progress', 'badges', 'rank', 'tier'],
    content: `<h2>Understanding Your Seller Level Progress</h2>
<p>Track your progress toward the next seller level in the Performance section.</p>
<h3>Progress Indicators</h3>
<ul>
<li><strong>Current level</strong> — Your current seller tier</li>
<li><strong>Next level</strong> — What you're working toward</li>
<li><strong>Progress bar</strong> — Visual indicator of how close you are</li>
<li><strong>Requirements</strong> — Specific metrics needed to level up</li>
</ul>
<h3>Level-Up Requirements</h3>
<p>Each level requires meeting thresholds for total sales, average rating, response time, and order completion rate. Meeting all requirements automatically promotes you to the next level.</p>`
  },

  // Category 10: Wallet & Payouts
  {
    id: 83, slug: 'seller-wallet', title: 'How the seller wallet works', category: 'Wallet & Payouts', categorySlug: 'wallet-payouts', role: 'seller', order: 1,
    tags: ['wallet', 'earnings', 'balance', 'seller'],
    content: `<h2>How the Seller Wallet Works</h2>
<p>Your seller wallet is where your earnings from product sales accumulate. Think of it as your Uptoza bank account.</p>
<h3>How Earnings Flow</h3>
<ol>
<li>Buyer purchases your product</li>
<li>Payment is processed and confirmed</li>
<li>Your share (after platform commission) is added to your <strong>pending balance</strong></li>
<li>After the hold period, funds move to your <strong>available balance</strong></li>
<li>You can withdraw available funds to your preferred payment method</li>
</ol>
<h3>Wallet Dashboard</h3>
<p>View your available balance, pending balance, total withdrawn, and transaction history all in one place.</p>`
  },
  {
    id: 84, slug: 'balance-types', title: 'Available balance vs pending balance', category: 'Wallet & Payouts', categorySlug: 'wallet-payouts', role: 'seller', order: 2,
    tags: ['balance', 'available', 'pending', 'hold'],
    content: `<h2>Available vs Pending Balance</h2>
<h3>Available Balance</h3>
<p>Funds that have cleared the hold period and are ready to be withdrawn. You can request a withdrawal of any amount up to your available balance.</p>
<h3>Pending Balance</h3>
<p>Funds from recent sales that are still in the hold period. This hold period protects against fraudulent purchases and chargebacks. Pending funds automatically become available after the hold period ends.</p>
<h3>Hold Period</h3>
<p>The typical hold period is 7-14 days, depending on your seller level and history. Higher-level sellers may have shorter hold periods.</p>`
  },
  {
    id: 85, slug: 'requesting-withdrawal', title: 'Requesting a withdrawal', category: 'Wallet & Payouts', categorySlug: 'wallet-payouts', role: 'seller', order: 3,
    tags: ['withdrawal', 'payout', 'cash out', 'transfer'],
    content: `<h2>Requesting a Withdrawal</h2>
<p>Withdraw your available balance to your preferred payment method.</p>
<h3>Steps</h3>
<ol>
<li>Go to <strong>Seller Dashboard → Wallet</strong></li>
<li>Ensure you have funds in your <strong>available balance</strong></li>
<li>Click <strong>"Withdraw"</strong></li>
<li>Select your withdrawal method</li>
<li>Enter the withdrawal amount</li>
<li>Verify with <strong>OTP</strong> sent to your email</li>
<li>Submit the withdrawal request</li>
</ol>
<h3>Minimum Withdrawal</h3>
<p>The minimum withdrawal amount is set by the platform admin (typically $10 or equivalent).</p>`
  },
  {
    id: 86, slug: 'withdrawal-methods', title: 'Withdrawal methods (Bank, UPI, PayPal, Crypto)', category: 'Wallet & Payouts', categorySlug: 'wallet-payouts', role: 'seller', order: 4,
    tags: ['withdrawal', 'bank', 'upi', 'paypal', 'crypto', 'payment'],
    content: `<h2>Withdrawal Methods</h2>
<p>Uptoza supports multiple withdrawal methods:</p>
<h3>Available Methods</h3>
<ul>
<li><strong>Bank Transfer</strong> — Direct deposit to your bank account (requires account details)</li>
<li><strong>UPI</strong> — Instant transfer via UPI (India)</li>
<li><strong>PayPal</strong> — Transfer to your PayPal account</li>
<li><strong>Cryptocurrency</strong> — Withdraw to a crypto wallet address</li>
</ul>
<h3>Setting Up Payment Methods</h3>
<p>Add your payment method details in <strong>Seller Dashboard → Wallet → Payment Methods</strong> before requesting your first withdrawal. Details are securely stored and encrypted.</p>
<h3>Method Availability</h3>
<p>Available methods may vary by country. Check the withdrawal section for methods available in your region.</p>`
  },
  {
    id: 87, slug: 'withdrawal-otp', title: 'OTP verification for withdrawals', category: 'Wallet & Payouts', categorySlug: 'wallet-payouts', role: 'seller', order: 5,
    tags: ['otp', 'verification', 'security', 'withdrawal'],
    content: `<h2>OTP Verification for Withdrawals</h2>
<p>For security, every withdrawal request requires OTP verification.</p>
<h3>How It Works</h3>
<ol>
<li>You initiate a withdrawal request</li>
<li>A <strong>6-digit OTP</strong> is sent to your registered email</li>
<li>Enter the OTP within <strong>10 minutes</strong></li>
<li>If correct, the withdrawal is submitted for processing</li>
</ol>
<h3>OTP Issues</h3>
<ul>
<li><strong>Didn't receive?</strong> — Check spam folder, then request a new OTP</li>
<li><strong>Expired?</strong> — Request a new OTP (they expire after 10 minutes)</li>
<li><strong>Wrong code?</strong> — Double-check the code and try again</li>
</ul>`
  },
  {
    id: 88, slug: 'withdrawal-processing', title: 'Withdrawal processing times', category: 'Wallet & Payouts', categorySlug: 'wallet-payouts', role: 'seller', order: 6,
    tags: ['processing', 'time', 'withdrawal', 'payout', 'speed'],
    content: `<h2>Withdrawal Processing Times</h2>
<h3>Typical Processing Times</h3>
<ul>
<li><strong>Bank Transfer</strong> — 3-5 business days</li>
<li><strong>UPI</strong> — 1-24 hours</li>
<li><strong>PayPal</strong> — 1-3 business days</li>
<li><strong>Cryptocurrency</strong> — 1-24 hours (varies by network)</li>
</ul>
<h3>Withdrawal Statuses</h3>
<ul>
<li><strong>Pending</strong> — Withdrawal submitted, awaiting admin processing</li>
<li><strong>Processing</strong> — Admin has approved, transfer in progress</li>
<li><strong>Completed</strong> — Funds have been sent to your account</li>
<li><strong>Rejected</strong> — Withdrawal was rejected (check admin notes for reason)</li>
</ul>`
  },
  {
    id: 89, slug: 'commission-fees', title: 'Commission rates and fees', category: 'Wallet & Payouts', categorySlug: 'wallet-payouts', role: 'seller', order: 7,
    tags: ['commission', 'fees', 'percentage', 'platform fee'],
    content: `<h2>Commission Rates & Fees</h2>
<p>Uptoza charges a platform commission on each sale. Here's how it works:</p>
<h3>Commission Structure</h3>
<ul>
<li>The platform fee percentage is set by the admin</li>
<li>Commission is deducted automatically from each sale</li>
<li>Your wallet receives the net amount (sale price minus commission)</li>
</ul>
<h3>Example</h3>
<p>If a product sells for $100 with a 10% commission: You receive $90 in your wallet, $10 goes to the platform.</p>
<h3>Reduced Rates</h3>
<p>Higher-level sellers may qualify for reduced commission rates as a reward for their sales performance.</p>`
  },
  {
    id: 90, slug: 'transaction-history', title: 'Transaction history', category: 'Wallet & Payouts', categorySlug: 'wallet-payouts', role: 'seller', order: 8,
    tags: ['transactions', 'history', 'log', 'records'],
    content: `<h2>Transaction History</h2>
<p>View a complete log of all wallet transactions.</p>
<h3>Transaction Types</h3>
<ul>
<li><strong>Credit</strong> — Funds added from a sale</li>
<li><strong>Debit</strong> — Funds withdrawn to your payment method</li>
<li><strong>Refund deduction</strong> — Funds removed due to a refund</li>
<li><strong>Adjustment</strong> — Manual adjustment by admin</li>
</ul>
<h3>Transaction Details</h3>
<p>Each transaction shows: date, type, amount, related order (if applicable), and resulting balance.</p>`
  },

  // Category 11: Marketing & Promotions
  {
    id: 91, slug: 'discount-codes', title: 'Creating discount codes', category: 'Marketing & Promotions', categorySlug: 'marketing', role: 'seller', order: 1,
    tags: ['discount', 'codes', 'promo', 'coupon', 'promotion'],
    content: `<h2>Creating Discount Codes</h2>
<p>Create discount codes to attract more buyers and boost sales.</p>
<h3>How to Create</h3>
<ol>
<li>Go to <strong>Seller Dashboard → Marketing</strong></li>
<li>Click <strong>"Create Discount Code"</strong></li>
<li>Enter a <strong>code name</strong> (e.g., "SUMMER20")</li>
<li>Set the <strong>discount type</strong> — percentage or fixed amount</li>
<li>Set the <strong>discount value</strong></li>
<li>Configure optional limits (max uses, expiry date, minimum order)</li>
<li>Save and share the code</li>
</ol>
<h3>Code Settings</h3>
<ul>
<li><strong>Max uses</strong> — Limit how many times the code can be used</li>
<li><strong>Expiry date</strong> — Code becomes invalid after this date</li>
<li><strong>Minimum order</strong> — Minimum purchase amount to use the code</li>
<li><strong>Active/Inactive</strong> — Toggle code availability</li>
</ul>`
  },
  {
    id: 92, slug: 'coupons', title: 'Setting up coupons', category: 'Marketing & Promotions', categorySlug: 'marketing', role: 'seller', order: 2,
    tags: ['coupons', 'discount', 'promo', 'deals'],
    content: `<h2>Setting Up Coupons</h2>
<p>Coupons work similarly to discount codes but can be applied more broadly.</p>
<h3>Coupon Types</h3>
<ul>
<li><strong>Percentage off</strong> — e.g., 20% off any product</li>
<li><strong>Fixed amount off</strong> — e.g., $5 off any product</li>
</ul>
<h3>Distribution</h3>
<ul>
<li>Share coupon codes on social media</li>
<li>Include in email marketing campaigns</li>
<li>Display on your store page during promotions</li>
<li>Share via chat with loyal customers</li>
</ul>`
  },
  {
    id: 93, slug: 'flash-sales', title: 'Flash sales — how they work', category: 'Marketing & Promotions', categorySlug: 'marketing', role: 'seller', order: 3,
    tags: ['flash sale', 'limited time', 'promotion', 'urgency'],
    content: `<h2>Flash Sales — How They Work</h2>
<p>Flash sales create urgency by offering products at a discounted price for a limited time.</p>
<h3>Creating a Flash Sale</h3>
<ol>
<li>Go to <strong>Seller Dashboard → Flash Sales</strong></li>
<li>Select the product to put on flash sale</li>
<li>Set the <strong>sale price</strong> (must be less than current price)</li>
<li>Set <strong>start and end times</strong></li>
<li>Optionally set a <strong>max quantity</strong> limit</li>
<li>Activate the flash sale</li>
</ol>
<h3>Flash Sale Display</h3>
<ul>
<li>Products on flash sale show a special <strong>flash sale badge</strong></li>
<li>A <strong>countdown timer</strong> displays the remaining time</li>
<li>Original and sale prices are shown for comparison</li>
<li>Flash sale products appear in the marketplace's flash sale section</li>
</ul>`
  },
  {
    id: 94, slug: 'flash-sale-countdown', title: 'Flash sale countdown timers', category: 'Marketing & Promotions', categorySlug: 'marketing', role: 'seller', order: 4,
    tags: ['countdown', 'timer', 'flash sale', 'urgency'],
    content: `<h2>Flash Sale Countdown Timers</h2>
<p>Countdown timers create a sense of urgency that drives buyers to act quickly.</p>
<h3>How Timers Work</h3>
<ul>
<li>Timer automatically counts down from the sale start to end time</li>
<li>Displays days, hours, minutes, and seconds remaining</li>
<li>Updates in real-time on the product card and detail page</li>
<li>When the timer reaches zero, the flash sale ends automatically</li>
</ul>
<h3>Timer Locations</h3>
<ul>
<li>Product card in marketplace</li>
<li>Product detail page</li>
<li>Flash sale section on the marketplace homepage</li>
<li>Your store page</li>
</ul>`
  },
  {
    id: 95, slug: 'marketing-tools', title: 'Marketing tools overview', category: 'Marketing & Promotions', categorySlug: 'marketing', role: 'seller', order: 5,
    tags: ['marketing', 'tools', 'promotion', 'sales'],
    content: `<h2>Marketing Tools Overview</h2>
<p>Uptoza provides several built-in tools to help you promote your products:</p>
<h3>Available Tools</h3>
<ul>
<li><strong>Discount codes</strong> — Create promotional codes for price reductions</li>
<li><strong>Flash sales</strong> — Time-limited discounts with countdown timers</li>
<li><strong>Compare-at pricing</strong> — Show original vs sale price on products</li>
<li><strong>Store sharing</strong> — Share your store on social media</li>
<li><strong>Product SEO</strong> — Optimize product titles and descriptions for search</li>
</ul>`
  },
  {
    id: 96, slug: 'share-store-modal', title: 'Share your store modal', category: 'Marketing & Promotions', categorySlug: 'marketing', role: 'seller', order: 6,
    tags: ['share', 'store', 'social', 'link', 'promote'],
    content: `<h2>Share Your Store Modal</h2>
<p>The Share Store modal makes it easy to promote your store across social platforms.</p>
<h3>How to Use</h3>
<ol>
<li>Click the <strong>"Share Store"</strong> button in your seller dashboard</li>
<li>Choose a sharing option: Copy link, Twitter, Facebook, LinkedIn, or WhatsApp</li>
<li>A pre-formatted message with your store link is ready to share</li>
</ol>
<h3>Best Practices</h3>
<ul>
<li>Share your store link regularly on social media</li>
<li>Include it in your email signature</li>
<li>Add it to your social media bio</li>
<li>Share when you launch new products</li>
</ul>`
  },
  {
    id: 97, slug: 'seo-tips', title: 'SEO tips for your products', category: 'Marketing & Promotions', categorySlug: 'marketing', role: 'seller', order: 7,
    tags: ['seo', 'search', 'optimization', 'visibility', 'ranking'],
    content: `<h2>SEO Tips for Your Products</h2>
<p>Optimize your products to rank higher in marketplace search and external search engines.</p>
<h3>Title Optimization</h3>
<ul>
<li>Include main keyword in the title</li>
<li>Keep titles under 60 characters</li>
<li>Be descriptive and specific</li>
</ul>
<h3>Description Optimization</h3>
<ul>
<li>Write detailed, keyword-rich descriptions</li>
<li>Use headings and bullet points for structure</li>
<li>Include relevant terms naturally</li>
</ul>
<h3>Tags</h3>
<ul>
<li>Use all available tag slots</li>
<li>Include variations and synonyms</li>
<li>Think about what buyers would search for</li>
</ul>
<h3>Images</h3>
<ul>
<li>Use descriptive file names for uploaded images</li>
<li>Products with multiple images rank higher</li>
</ul>`
  },

  // Category 12: Store & Storefront
  {
    id: 98, slug: 'public-store-page', title: 'How your public store page works', category: 'Store & Storefront', categorySlug: 'store-storefront', role: 'seller', order: 1,
    tags: ['store', 'public', 'page', 'storefront'],
    content: `<h2>How Your Public Store Page Works</h2>
<p>Every seller gets a public store page that showcases their products to buyers.</p>
<h3>Store URL</h3>
<p>Your store is accessible at: <code>uptoza.com/store/your-store-slug</code></p>
<h3>Store Layout</h3>
<ul>
<li><strong>Header</strong> — Store logo, name, description, and stats</li>
<li><strong>Category sidebar</strong> — Browse products by category</li>
<li><strong>Product grid</strong> — All your published products displayed as cards</li>
<li><strong>Search</strong> — Search within your store</li>
</ul>
<h3>What Buyers See</h3>
<p>Buyers see your store name, logo, description, follower count, total products, and all published product listings. They can browse, filter, and purchase directly from your store page.</p>`
  },
  {
    id: 99, slug: 'store-sidebar-filters', title: 'Store sidebar and category filters', category: 'Store & Storefront', categorySlug: 'store-storefront', role: 'seller', order: 2,
    tags: ['sidebar', 'filters', 'categories', 'navigation'],
    content: `<h2>Store Sidebar & Category Filters</h2>
<p>Your store sidebar helps buyers navigate your products by category.</p>
<h3>How It Works</h3>
<ul>
<li>Categories are automatically generated from your products' assigned categories</li>
<li>Buyers can click a category to filter products</li>
<li>"All Products" shows everything</li>
<li>Product count is shown next to each category</li>
</ul>
<h3>Mobile View</h3>
<p>On mobile devices, the sidebar transforms into horizontal scrollable category chips at the top of the page.</p>`
  },
  {
    id: 100, slug: 'product-detail-modal', title: 'Product detail modal on store', category: 'Store & Storefront', categorySlug: 'store-storefront', role: 'seller', order: 3,
    tags: ['modal', 'detail', 'product', 'quick view'],
    content: `<h2>Product Detail Modal</h2>
<p>When buyers click on a product in your store, a detail modal appears showing comprehensive product information.</p>
<h3>Modal Contents</h3>
<ul>
<li>Product images gallery with zoom</li>
<li>Full product description</li>
<li>Price and compare-at price</li>
<li>Product type badge</li>
<li>Purchase/Buy Now button</li>
<li>Seller information</li>
<li>Product reviews and ratings</li>
</ul>
<p>Buyers can also navigate to the full product page for an even more detailed view.</p>`
  },
  {
    id: 101, slug: 'store-mobile-layout', title: 'Store layout on mobile', category: 'Store & Storefront', categorySlug: 'store-storefront', role: 'seller', order: 4,
    tags: ['mobile', 'responsive', 'layout', 'store'],
    content: `<h2>Store Layout on Mobile</h2>
<p>Your store is fully responsive and optimized for mobile viewing.</p>
<h3>Mobile Differences</h3>
<ul>
<li><strong>Header</strong> — Compact mobile header with essential info</li>
<li><strong>Categories</strong> — Horizontal scrollable chips instead of sidebar</li>
<li><strong>Product grid</strong> — 2-column grid on mobile (vs 3-4 columns on desktop)</li>
<li><strong>Navigation</strong> — Mobile-optimized navigation elements</li>
</ul>
<h3>Tips for Mobile Optimization</h3>
<ul>
<li>Use clear, readable product thumbnails</li>
<li>Keep product titles concise</li>
<li>Ensure your store logo looks good at small sizes</li>
</ul>`
  },
  {
    id: 102, slug: 'store-appearance', title: 'Customizing your store appearance', category: 'Store & Storefront', categorySlug: 'store-storefront', role: 'seller', order: 5,
    tags: ['customize', 'appearance', 'theme', 'design'],
    content: `<h2>Customizing Your Store Appearance</h2>
<p>Make your store stand out with customization options.</p>
<h3>What You Can Customize</h3>
<ul>
<li><strong>Store logo</strong> — Upload your brand logo</li>
<li><strong>Store description</strong> — Tell buyers what you offer</li>
<li><strong>Product card designs</strong> — Customize individual product card appearances</li>
<li><strong>Product ordering</strong> — Choose which products appear first</li>
</ul>
<h3>Branding Tips</h3>
<ul>
<li>Use consistent branding across your logo, descriptions, and product images</li>
<li>Write a compelling store description that communicates your value</li>
<li>Feature your best products prominently</li>
</ul>`
  },
  {
    id: 103, slug: 'sharing-store-url', title: 'Sharing your store URL', category: 'Store & Storefront', categorySlug: 'store-storefront', role: 'seller', order: 6,
    tags: ['share', 'url', 'link', 'promote', 'store'],
    content: `<h2>Sharing Your Store URL</h2>
<p>Promote your store by sharing your unique URL across all your channels.</p>
<h3>Where to Share</h3>
<ul>
<li><strong>Social media bios</strong> — Instagram, Twitter, LinkedIn, TikTok</li>
<li><strong>Email signatures</strong> — Professional email communication</li>
<li><strong>Blog posts</strong> — Link to relevant products</li>
<li><strong>YouTube descriptions</strong> — If you create video content</li>
<li><strong>Business cards</strong> — QR code linking to your store</li>
</ul>
<h3>Product Deep Links</h3>
<p>You can also share direct links to specific products: <code>uptoza.com/store/your-store/product/product-id</code></p>`
  },

  // Category 13: Buyer Guide
  {
    id: 104, slug: 'browsing-marketplace', title: 'Browsing the marketplace', category: 'Buyer Guide', categorySlug: 'buyer-guide', role: 'buyer', order: 1,
    tags: ['browse', 'marketplace', 'explore', 'discover'],
    content: `<h2>Browsing the Marketplace</h2>
<p>The Uptoza marketplace is your gateway to thousands of digital products.</p>
<h3>Discovery Features</h3>
<ul>
<li><strong>Featured carousel</strong> — Hand-picked products highlighted by the platform</li>
<li><strong>Hot products</strong> — Trending items based on recent sales</li>
<li><strong>New arrivals</strong> — Latest products added to the marketplace</li>
<li><strong>Top rated</strong> — Highest-rated products by buyers</li>
<li><strong>Flash sales</strong> — Limited-time deals with countdown timers</li>
</ul>
<h3>Category Browsing</h3>
<p>Use the category browser to explore products by type: digital products, e-books, courses, software, and more. Each category has its own browsing page with relevant filters.</p>`
  },
  {
    id: 105, slug: 'searching-filtering', title: 'Searching and filtering products', category: 'Buyer Guide', categorySlug: 'buyer-guide', role: 'buyer', order: 2,
    tags: ['search', 'filter', 'find', 'sort'],
    content: `<h2>Searching & Filtering Products</h2>
<h3>Search</h3>
<ul>
<li>Type keywords in the search bar at the top</li>
<li>Search suggestions appear as you type</li>
<li>Search across product titles, descriptions, and tags</li>
<li>Voice search is available (click the microphone icon)</li>
<li>Image search lets you find similar products by uploading an image</li>
</ul>
<h3>Filters</h3>
<ul>
<li><strong>Price range</strong> — Set minimum and maximum price</li>
<li><strong>Product type</strong> — Filter by specific product types</li>
<li><strong>Rating</strong> — Minimum star rating</li>
<li><strong>Sort by</strong> — Relevance, newest, price, rating</li>
</ul>`
  },
  {
    id: 106, slug: 'quick-view', title: 'Quick view and product details', category: 'Buyer Guide', categorySlug: 'buyer-guide', role: 'buyer', order: 3,
    tags: ['quick view', 'preview', 'details', 'product page'],
    content: `<h2>Quick View & Product Details</h2>
<h3>Quick View</h3>
<p>Hover over any product card to see a quick preview with key details like description summary, price, and rating. Click "Quick View" for a more detailed popup without leaving the page.</p>
<h3>Full Product Page</h3>
<p>Click on a product card to visit the full product page, which includes:</p>
<ul>
<li>Full image gallery with zoom</li>
<li>Complete product description</li>
<li>Seller information and rating</li>
<li>Customer reviews</li>
<li>Related products</li>
<li>Purchase options</li>
</ul>`
  },
  {
    id: 107, slug: 'making-purchase', title: 'Making a purchase', category: 'Buyer Guide', categorySlug: 'buyer-guide', role: 'buyer', order: 4,
    tags: ['purchase', 'buy', 'checkout', 'payment'],
    content: `<h2>Making a Purchase</h2>
<p>Buying a product on Uptoza is quick and secure.</p>
<h3>Steps</h3>
<ol>
<li>Find a product you want to buy</li>
<li>Click <strong>"Buy Now"</strong> or <strong>"Add to Cart"</strong></li>
<li>Choose your payment method</li>
<li>Complete the payment</li>
<li>Access your product in your <strong>Buyer Dashboard → Library</strong></li>
</ol>
<h3>Payment Methods</h3>
<ul>
<li><strong>Wallet balance</strong> — Pay using your Uptoza wallet</li>
<li><strong>Razorpay</strong> — Credit/debit cards, UPI, net banking (India)</li>
<li><strong>Stripe</strong> — International credit/debit cards</li>
</ul>`
  },
  {
    id: 108, slug: 'guest-checkout', title: 'Guest checkout', category: 'Buyer Guide', categorySlug: 'buyer-guide', role: 'buyer', order: 5,
    tags: ['guest', 'checkout', 'no account', 'purchase'],
    content: `<h2>Guest Checkout</h2>
<p>Buy products without creating an account using guest checkout.</p>
<h3>How It Works</h3>
<ol>
<li>Click "Buy Now" on any product</li>
<li>Select <strong>"Continue as Guest"</strong></li>
<li>Enter your <strong>email address</strong></li>
<li>Complete the payment</li>
<li>Receive product access via email</li>
</ol>
<h3>Limitations</h3>
<ul>
<li>No dashboard access — products delivered via email only</li>
<li>No order history tracking</li>
<li>No wallet functionality</li>
<li>Cannot leave reviews</li>
</ul>
<p>We recommend creating a free account for the best experience.</p>`
  },
  {
    id: 109, slug: 'buyer-dashboard', title: 'Accessing your buyer dashboard', category: 'Buyer Guide', categorySlug: 'buyer-guide', role: 'buyer', order: 6,
    tags: ['dashboard', 'buyer', 'access', 'home'],
    content: `<h2>Accessing Your Buyer Dashboard</h2>
<p>Your buyer dashboard is your personal hub for managing purchases, downloads, and account settings.</p>
<h3>Dashboard Sections</h3>
<ul>
<li><strong>Home</strong> — Overview of recent activity and quick stats</li>
<li><strong>Library</strong> — All your purchased products and downloads</li>
<li><strong>Orders</strong> — Complete purchase history</li>
<li><strong>Wallet</strong> — Balance, top-up, and transaction history</li>
<li><strong>Wishlist</strong> — Products you've saved for later</li>
<li><strong>Notifications</strong> — Alerts and updates</li>
<li><strong>Profile</strong> — Account settings and preferences</li>
</ul>`
  },
  {
    id: 110, slug: 'purchased-library', title: 'Viewing your purchased library', category: 'Buyer Guide', categorySlug: 'buyer-guide', role: 'buyer', order: 7,
    tags: ['library', 'purchased', 'products', 'collection'],
    content: `<h2>Viewing Your Purchased Library</h2>
<p>All your purchased products are organized in your Library section.</p>
<h3>Library Features</h3>
<ul>
<li>View all products you've purchased</li>
<li>Filter by product type (e-books, courses, software, etc.)</li>
<li>Search your library by product name</li>
<li>Access download links and delivered content</li>
<li>View course progress for enrolled courses</li>
</ul>
<h3>Accessing Content</h3>
<p>Click on any product in your library to access its content — download files, view delivered accounts/keys, or continue watching a course.</p>`
  },
  {
    id: 111, slug: 'downloading-files', title: 'Downloading files after purchase', category: 'Buyer Guide', categorySlug: 'buyer-guide', role: 'buyer', order: 8,
    tags: ['download', 'files', 'access', 'content'],
    content: `<h2>Downloading Files After Purchase</h2>
<p>After purchasing a digital product, access your files from the buyer dashboard.</p>
<h3>How to Download</h3>
<ol>
<li>Go to <strong>Dashboard → Library</strong></li>
<li>Find the purchased product</li>
<li>Click to open the product content</li>
<li>Click the <strong>download button</strong> next to each file</li>
</ol>
<h3>Download Limits</h3>
<p>Some products may have download limits set by the seller. Check the product details for any restrictions. If you've reached the limit, contact the seller for assistance.</p>`
  },
  {
    id: 112, slug: 'delivered-accounts-keys', title: 'Viewing delivered accounts and license keys', category: 'Buyer Guide', categorySlug: 'buyer-guide', role: 'buyer', order: 9,
    tags: ['accounts', 'license keys', 'delivered', 'credentials'],
    content: `<h2>Viewing Delivered Accounts & License Keys</h2>
<p>For auto-delivered products, view your credentials or keys in your dashboard.</p>
<h3>How to View</h3>
<ol>
<li>Go to <strong>Dashboard → Library</strong></li>
<li>Find the auto-delivered product</li>
<li>Click <strong>"View Delivered Items"</strong></li>
<li>Your account credentials or license key will be displayed</li>
</ol>
<h3>Security</h3>
<ul>
<li>Credentials are hidden by default — click "Reveal" to show them</li>
<li>Copy credentials with one click</li>
<li>Keep your credentials private and secure</li>
<li>Change passwords on delivered accounts immediately for security</li>
</ul>`
  },
  {
    id: 113, slug: 'course-viewer', title: 'Course viewer — watching purchased courses', category: 'Buyer Guide', categorySlug: 'buyer-guide', role: 'buyer', order: 10,
    tags: ['course', 'viewer', 'watch', 'learn', 'lessons'],
    content: `<h2>Course Viewer</h2>
<p>Watch your purchased courses using the built-in course viewer.</p>
<h3>Course Viewer Features</h3>
<ul>
<li><strong>Lesson list</strong> — All course lessons in order with completion checkmarks</li>
<li><strong>Video player</strong> — Watch lesson videos with playback controls</li>
<li><strong>Text content</strong> — Read accompanying lesson text</li>
<li><strong>Attachments</strong> — Download lesson resources</li>
<li><strong>Progress tracking</strong> — Automatic progress saving</li>
<li><strong>Resume playback</strong> — Videos remember where you left off</li>
</ul>
<h3>Navigation</h3>
<p>Click on any lesson in the sidebar to jump to it. Your progress is automatically saved as you watch.</p>`
  },

  // Category 14: Buyer Wallet & Payments
  {
    id: 114, slug: 'buyer-wallet', title: 'How the buyer wallet works', category: 'Buyer Wallet & Payments', categorySlug: 'buyer-wallet', role: 'buyer', order: 1,
    tags: ['wallet', 'buyer', 'balance', 'funds'],
    content: `<h2>How the Buyer Wallet Works</h2>
<p>Your buyer wallet is a convenient way to store funds and make quick purchases on Uptoza.</p>
<h3>Key Features</h3>
<ul>
<li><strong>Top up</strong> — Add funds using various payment methods</li>
<li><strong>Quick payments</strong> — Pay for products with one click using wallet balance</li>
<li><strong>Transaction history</strong> — Track all credits and debits</li>
<li><strong>Withdrawals</strong> — Withdraw unused funds back to your payment method</li>
</ul>
<h3>Benefits</h3>
<ul>
<li>Faster checkout — no need to enter payment details each time</li>
<li>Budget control — add specific amounts and spend within limits</li>
<li>Unified payment method across all purchases</li>
</ul>`
  },
  {
    id: 115, slug: 'adding-funds', title: 'Adding funds to your wallet', category: 'Buyer Wallet & Payments', categorySlug: 'buyer-wallet', role: 'buyer', order: 2,
    tags: ['top up', 'add funds', 'deposit', 'wallet'],
    content: `<h2>Adding Funds to Your Wallet</h2>
<h3>How to Top Up</h3>
<ol>
<li>Go to <strong>Dashboard → Wallet</strong></li>
<li>Click <strong>"Add Funds"</strong></li>
<li>Enter the amount you want to add</li>
<li>Select your payment method (Razorpay or Stripe)</li>
<li>Complete the payment</li>
<li>Funds are added to your wallet instantly</li>
</ol>
<h3>Payment Methods for Top-Up</h3>
<ul>
<li><strong>Razorpay</strong> — UPI, credit/debit cards, net banking (India)</li>
<li><strong>Stripe</strong> — International credit/debit cards</li>
</ul>`
  },
  {
    id: 116, slug: 'payment-methods-buyer', title: 'Payment methods (Razorpay, Stripe)', category: 'Buyer Wallet & Payments', categorySlug: 'buyer-wallet', role: 'buyer', order: 3,
    tags: ['payment', 'razorpay', 'stripe', 'cards', 'upi'],
    content: `<h2>Payment Methods</h2>
<p>Uptoza supports multiple payment methods for your convenience.</p>
<h3>Razorpay (India)</h3>
<ul>
<li>UPI (Google Pay, PhonePe, Paytm)</li>
<li>Credit and debit cards</li>
<li>Net banking</li>
<li>Wallets (Paytm, Mobikwik, etc.)</li>
</ul>
<h3>Stripe (International)</h3>
<ul>
<li>Visa, Mastercard, American Express</li>
<li>International credit and debit cards</li>
</ul>
<h3>Wallet</h3>
<ul>
<li>Pay using your pre-loaded Uptoza wallet balance</li>
<li>Fastest checkout option</li>
</ul>`
  },
  {
    id: 117, slug: 'purchase-history', title: 'Viewing purchase history', category: 'Buyer Wallet & Payments', categorySlug: 'buyer-wallet', role: 'buyer', order: 4,
    tags: ['history', 'purchases', 'orders', 'transactions'],
    content: `<h2>Viewing Purchase History</h2>
<p>Track all your purchases in the Orders section of your buyer dashboard.</p>
<h3>Order Information</h3>
<ul>
<li>Product name and image</li>
<li>Purchase date and time</li>
<li>Amount paid</li>
<li>Payment method used</li>
<li>Order status</li>
<li>Delivery status</li>
</ul>
<h3>Accessing Orders</h3>
<p>Go to <strong>Dashboard → Orders</strong> to see your complete purchase history. Click on any order to view full details.</p>`
  },
  {
    id: 118, slug: 'requesting-refund', title: 'Requesting a refund', category: 'Buyer Wallet & Payments', categorySlug: 'buyer-wallet', role: 'buyer', order: 5,
    tags: ['refund', 'return', 'complaint', 'money back'],
    content: `<h2>Requesting a Refund</h2>
<p>If you're unsatisfied with a purchase, you can request a refund.</p>
<h3>How to Request</h3>
<ol>
<li>Go to <strong>Dashboard → Orders</strong></li>
<li>Find the order you want to refund</li>
<li>Click <strong>"Request Refund"</strong></li>
<li>Select a reason for the refund</li>
<li>Add any additional details</li>
<li>Submit the request</li>
</ol>
<h3>Refund Policy</h3>
<ul>
<li>Refund requests are reviewed by the seller and/or admin</li>
<li>Digital products may have limited refund eligibility</li>
<li>Refunds are typically processed within 5-7 business days</li>
<li>Refunded amounts return to your original payment method or wallet</li>
</ul>`
  },

  // Category 15: Chat & Communication
  {
    id: 119, slug: 'chat-system', title: 'Seller-buyer chat system', category: 'Chat & Communication', categorySlug: 'chat-communication', role: 'general', order: 1,
    tags: ['chat', 'messaging', 'communication', 'support'],
    content: `<h2>Seller-Buyer Chat System</h2>
<p>Uptoza's built-in chat system enables direct communication between buyers and sellers.</p>
<h3>Features</h3>
<ul>
<li><strong>Real-time messaging</strong> — Instant message delivery</li>
<li><strong>File attachments</strong> — Share images, documents, and files</li>
<li><strong>Chat history</strong> — All conversations are saved</li>
<li><strong>Notifications</strong> — Get notified of new messages</li>
</ul>
<h3>When to Use Chat</h3>
<ul>
<li>Ask questions about a product before buying</li>
<li>Request support after a purchase</li>
<li>Discuss custom commission work</li>
<li>Report issues with delivered products</li>
</ul>`
  },
  {
    id: 120, slug: 'start-conversation', title: 'Starting a conversation with a seller', category: 'Chat & Communication', categorySlug: 'chat-communication', role: 'buyer', order: 2,
    tags: ['conversation', 'message', 'seller', 'contact'],
    content: `<h2>Starting a Conversation with a Seller</h2>
<h3>How to Start</h3>
<ol>
<li>Visit the seller's store page or a product page</li>
<li>Click the <strong>"Chat with Seller"</strong> button</li>
<li>Type your message and send</li>
<li>Wait for the seller to respond</li>
</ol>
<h3>Chat Access</h3>
<p>Some sellers may require admin approval before chat is enabled. If so, you'll need to submit a chat request that gets reviewed before you can message the seller.</p>
<h3>Tips</h3>
<ul>
<li>Be clear and specific in your messages</li>
<li>Include relevant details (order ID, product name)</li>
<li>Be patient — sellers may be in different time zones</li>
</ul>`
  },
  {
    id: 121, slug: 'chat-notifications', title: 'Chat notifications', category: 'Chat & Communication', categorySlug: 'chat-communication', role: 'general', order: 3,
    tags: ['notifications', 'chat', 'alerts', 'messages'],
    content: `<h2>Chat Notifications</h2>
<p>Stay informed about new messages with multi-channel notifications.</p>
<h3>Notification Channels</h3>
<ul>
<li><strong>In-app badge</strong> — Unread message count on the chat icon</li>
<li><strong>Browser notifications</strong> — Desktop push notifications</li>
<li><strong>Email</strong> — Email notification for new messages (if enabled)</li>
<li><strong>Sound</strong> — Audio alert for incoming messages</li>
</ul>
<h3>Managing Notifications</h3>
<p>Configure chat notification preferences in your account settings.</p>`
  },
  {
    id: 122, slug: 'support-chat', title: 'Support chat with Uptoza', category: 'Chat & Communication', categorySlug: 'chat-communication', role: 'general', order: 4,
    tags: ['support', 'help', 'uptoza', 'customer service'],
    content: `<h2>Support Chat with Uptoza</h2>
<p>Need help with the platform? Contact Uptoza support through the floating chat widget.</p>
<h3>How to Access Support</h3>
<ol>
<li>Look for the <strong>floating chat bubble</strong> in the bottom-right corner of any page</li>
<li>Click to open the support chat</li>
<li>Type your question or issue</li>
<li>A support team member will assist you</li>
</ol>
<h3>When to Contact Support</h3>
<ul>
<li>Account issues (login problems, verification)</li>
<li>Payment disputes or billing questions</li>
<li>Platform bugs or technical issues</li>
<li>Feature requests or feedback</li>
<li>Policy questions</li>
</ul>`
  },

  // Category 16: Settings & Account
  {
    id: 123, slug: 'updating-profile', title: 'Updating your profile', category: 'Settings & Account', categorySlug: 'settings-account', role: 'general', order: 1,
    tags: ['profile', 'update', 'edit', 'account', 'settings'],
    content: `<h2>Updating Your Profile</h2>
<p>Keep your profile information up to date for the best experience.</p>
<h3>How to Update</h3>
<ol>
<li>Go to <strong>Dashboard → Profile</strong></li>
<li>Update your information</li>
<li>Click <strong>"Save Changes"</strong></li>
</ol>
<h3>Editable Fields</h3>
<ul>
<li><strong>Full name</strong> — Your display name</li>
<li><strong>Email</strong> — Your account email (requires verification)</li>
<li><strong>Avatar</strong> — Your profile picture</li>
<li><strong>Bio</strong> — Short description about you</li>
<li><strong>Phone number</strong> — Optional contact number</li>
</ul>`
  },
  {
    id: 124, slug: 'push-notifications', title: 'Push notification preferences', category: 'Settings & Account', categorySlug: 'settings-account', role: 'general', order: 2,
    tags: ['push', 'notifications', 'preferences', 'alerts'],
    content: `<h2>Push Notification Preferences</h2>
<p>Control what notifications you receive and how you receive them.</p>
<h3>Notification Types</h3>
<ul>
<li><strong>Order notifications</strong> — New orders, delivery updates</li>
<li><strong>Chat messages</strong> — New messages from buyers/sellers</li>
<li><strong>Marketing</strong> — Promotional offers and platform updates</li>
<li><strong>Security</strong> — Login alerts, password changes</li>
</ul>
<h3>Enabling Push Notifications</h3>
<ol>
<li>When prompted, click <strong>"Allow"</strong> for browser notifications</li>
<li>Or go to <strong>Settings → Notifications</strong> to manage preferences</li>
<li>Toggle each notification type on or off</li>
</ol>`
  },
  {
    id: 125, slug: 'currency-selector', title: 'Currency selector and conversion', category: 'Settings & Account', categorySlug: 'settings-account', role: 'general', order: 3,
    tags: ['currency', 'conversion', 'exchange', 'localization'],
    content: `<h2>Currency Selector & Conversion</h2>
<p>View prices in your preferred currency using the built-in currency converter.</p>
<h3>How to Change Currency</h3>
<ol>
<li>Click the <strong>currency selector</strong> in the header/navigation</li>
<li>Choose your preferred currency from the dropdown</li>
<li>All prices across the platform update to your selected currency</li>
</ol>
<h3>Supported Currencies</h3>
<p>Uptoza supports multiple currencies including USD, INR, EUR, GBP, and more. Exchange rates are updated regularly.</p>
<h3>Important Note</h3>
<p>Currency display is for convenience. Actual payment processing may use the seller's base currency with real-time conversion at checkout.</p>`
  },
  {
    id: 126, slug: 'privacy-security', title: 'Privacy and security settings', category: 'Settings & Account', categorySlug: 'settings-account', role: 'general', order: 4,
    tags: ['privacy', 'security', 'settings', 'data'],
    content: `<h2>Privacy & Security Settings</h2>
<p>Manage your account security and privacy preferences.</p>
<h3>Security Settings</h3>
<ul>
<li><strong>Change password</strong> — Update your account password</li>
<li><strong>Login history</strong> — View recent login sessions</li>
<li><strong>Active sessions</strong> — See where you're logged in</li>
</ul>
<h3>Privacy Settings</h3>
<ul>
<li><strong>Profile visibility</strong> — Control what others can see</li>
<li><strong>Data export</strong> — Request a copy of your data</li>
<li><strong>Account deletion</strong> — Request permanent account removal</li>
</ul>`
  },
  {
    id: 127, slug: 'deleting-account', title: 'Deleting your account', category: 'Settings & Account', categorySlug: 'settings-account', role: 'general', order: 5,
    tags: ['delete', 'account', 'remove', 'close'],
    content: `<h2>Deleting Your Account</h2>
<p>If you wish to permanently delete your Uptoza account, follow these steps:</p>
<h3>How to Request Deletion</h3>
<ol>
<li>Go to <strong>Dashboard → Settings → Privacy</strong></li>
<li>Click <strong>"Delete Account"</strong></li>
<li>Provide a reason (optional)</li>
<li>Confirm your decision</li>
</ol>
<h3>What Happens</h3>
<ul>
<li>Your account is scheduled for deletion</li>
<li>There's a <strong>30-day grace period</strong> during which you can cancel</li>
<li>After 30 days, your account and all data are permanently removed</li>
<li>Any remaining wallet balance must be withdrawn first</li>
</ul>
<h3>Important</h3>
<ul>
<li>Seller accounts with pending orders cannot be deleted until orders are fulfilled</li>
<li>Purchase history may be retained for legal/compliance purposes</li>
</ul>`
  },
  {
    id: 128, slug: 'terms-privacy', title: 'Terms of Service and Privacy Policy', category: 'Settings & Account', categorySlug: 'settings-account', role: 'general', order: 6,
    tags: ['terms', 'privacy policy', 'legal', 'tos'],
    content: `<h2>Terms of Service & Privacy Policy</h2>
<p>Understand your rights and obligations on the Uptoza platform.</p>
<h3>Terms of Service</h3>
<p>The Terms of Service outline the rules and guidelines for using Uptoza, including account creation, buying and selling, prohibited content, intellectual property, and dispute resolution.</p>
<p>Read the full Terms of Service at <strong>uptoza.com/terms</strong></p>
<h3>Privacy Policy</h3>
<p>The Privacy Policy explains how we collect, use, and protect your personal information, including data collection practices, cookie usage, and your privacy rights.</p>
<p>Read the full Privacy Policy at <strong>uptoza.com/privacy</strong></p>`
  },

  // Category 17: Troubleshooting
  {
    id: 129, slug: 'product-not-appearing', title: 'Product not appearing in store', category: 'Troubleshooting', categorySlug: 'troubleshooting', role: 'general', order: 1,
    tags: ['product', 'not appearing', 'invisible', 'missing', 'store'],
    content: `<h2>Product Not Appearing in Store</h2>
<p>If your product isn't visible in the marketplace or your store, check these common causes:</p>
<h3>Checklist</h3>
<ul>
<li><strong>Visibility status</strong> — Is the product set to "Published"? Draft products are not visible.</li>
<li><strong>Admin approval</strong> — Some products require admin approval. Check if your product is pending review.</li>
<li><strong>Category assignment</strong> — Products without a category may not appear in category browsing.</li>
<li><strong>Required fields</strong> — Ensure all required fields (title, description, price, images) are filled in.</li>
<li><strong>Store status</strong> — Make sure your seller account is active and verified.</li>
</ul>
<h3>Still Not Working?</h3>
<p>Contact support via the chat widget for assistance.</p>`
  },
  {
    id: 130, slug: 'payment-failed', title: 'Payment failed — what to do', category: 'Troubleshooting', categorySlug: 'troubleshooting', role: 'general', order: 2,
    tags: ['payment', 'failed', 'error', 'declined', 'transaction'],
    content: `<h2>Payment Failed — What to Do</h2>
<p>Payment failures can happen for various reasons. Here's how to resolve them:</p>
<h3>Common Causes</h3>
<ul>
<li><strong>Insufficient funds</strong> — Check your bank/card balance</li>
<li><strong>Card expired</strong> — Update your payment card details</li>
<li><strong>Bank declined</strong> — Contact your bank to authorize the transaction</li>
<li><strong>Network issue</strong> — Check your internet connection and try again</li>
<li><strong>Payment gateway error</strong> — Try a different payment method</li>
</ul>
<h3>Steps to Resolve</h3>
<ol>
<li>Wait a few minutes and try again</li>
<li>Try a different payment method</li>
<li>Clear your browser cache and cookies</li>
<li>Try a different browser</li>
<li>Contact your bank if the issue persists</li>
<li>Contact Uptoza support if none of the above works</li>
</ol>`
  },
  {
    id: 131, slug: 'cannot-access-product', title: 'Cannot access purchased product', category: 'Troubleshooting', categorySlug: 'troubleshooting', role: 'general', order: 3,
    tags: ['access', 'purchased', 'product', 'missing', 'library'],
    content: `<h2>Cannot Access Purchased Product</h2>
<p>If you've purchased a product but can't access it, try these solutions:</p>
<h3>Troubleshooting Steps</h3>
<ol>
<li><strong>Check your library</strong> — Go to Dashboard → Library and look for the product</li>
<li><strong>Verify payment</strong> — Check Dashboard → Orders to confirm the order is completed</li>
<li><strong>Check email</strong> — For guest purchases, check your email for delivery</li>
<li><strong>Wait for delivery</strong> — Manual delivery products may take time for the seller to process</li>
<li><strong>Refresh the page</strong> — Sometimes a simple refresh resolves the issue</li>
<li><strong>Contact the seller</strong> — Use the chat to ask the seller about your order</li>
</ol>
<h3>Still Can't Access?</h3>
<p>Contact Uptoza support with your order ID for immediate assistance.</p>`
  },
  {
    id: 132, slug: 'download-issues', title: 'File download issues', category: 'Troubleshooting', categorySlug: 'troubleshooting', role: 'general', order: 4,
    tags: ['download', 'file', 'issue', 'error', 'broken'],
    content: `<h2>File Download Issues</h2>
<p>Having trouble downloading purchased files? Try these solutions:</p>
<h3>Common Fixes</h3>
<ul>
<li><strong>Slow internet</strong> — Large files need a stable connection. Try again on a better connection.</li>
<li><strong>Browser blocking</strong> — Check if your browser is blocking the download (look for blocked popup notification)</li>
<li><strong>Storage space</strong> — Ensure you have enough disk space for the download</li>
<li><strong>Try another browser</strong> — Some browser extensions can interfere with downloads</li>
<li><strong>Download limit reached</strong> — Some products have download limits. Contact the seller for assistance.</li>
</ul>
<h3>Corrupted File?</h3>
<p>If the downloaded file appears corrupted, try downloading again. If the problem persists, contact the seller.</p>`
  },
  {
    id: 133, slug: 'auto-delivery-issues', title: 'Auto-delivery not working', category: 'Troubleshooting', categorySlug: 'troubleshooting', role: 'general', order: 5,
    tags: ['auto-delivery', 'not working', 'issue', 'missing'],
    content: `<h2>Auto-Delivery Not Working</h2>
<p>If you purchased an auto-delivery product but didn't receive your item:</p>
<h3>For Buyers</h3>
<ol>
<li>Check <strong>Dashboard → Library</strong> for your delivered items</li>
<li>Look in the <strong>"Delivered Items"</strong> section of the product</li>
<li>Wait a few minutes — sometimes delivery takes a moment to process</li>
<li>Contact the seller through chat</li>
</ol>
<h3>For Sellers</h3>
<ul>
<li><strong>Check inventory</strong> — Ensure your delivery pool has available items</li>
<li><strong>Empty pool</strong> — If the pool is empty, auto-delivery cannot work. Add more items.</li>
<li><strong>Product configuration</strong> — Verify auto-delivery is properly configured on the product</li>
<li><strong>Check order status</strong> — Verify the payment was confirmed before delivery triggers</li>
</ul>`
  },
  {
    id: 134, slug: 'login-problems', title: 'Account login problems', category: 'Troubleshooting', categorySlug: 'troubleshooting', role: 'general', order: 6,
    tags: ['login', 'signin', 'password', 'access', 'locked'],
    content: `<h2>Account Login Problems</h2>
<p>Having trouble signing in? Try these solutions:</p>
<h3>Common Issues</h3>
<ul>
<li><strong>Wrong password</strong> — Double-check your password. Use "Forgot Password" to reset if needed.</li>
<li><strong>Wrong email</strong> — Make sure you're using the email you registered with.</li>
<li><strong>Google account</strong> — If you signed up with Google, use "Continue with Google" instead of email/password.</li>
<li><strong>Unverified email</strong> — Check your email for the verification link and click it.</li>
<li><strong>Browser cookies</strong> — Clear your browser cookies and try again.</li>
<li><strong>Account suspended</strong> — Contact support if you believe your account was suspended in error.</li>
</ul>
<h3>Still Can't Login?</h3>
<ol>
<li>Try the password reset flow</li>
<li>Try a different browser or device</li>
<li>Clear cookies and cache</li>
<li>Contact support via the help page</li>
</ol>`
  },
];
