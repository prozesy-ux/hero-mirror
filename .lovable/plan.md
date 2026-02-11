

# Help Center & Documentation Page (help.uptoza.com / /help)

## Overview

Create a comprehensive, searchable documentation center accessible at `/help` with 100+ articles organized by role (Seller, Buyer, Admin) and category. The page will feature a clean, professional design with sidebar navigation, search, and categorized articles -- all rendered from a static data structure (no database needed).

---

## Architecture

A single new page (`/help`) with a docs data file containing all 100+ articles. The page uses sidebar navigation, category grouping, search, and responsive layout.

```text
/help                     --> Docs landing (categories overview)
/help?article=slug        --> Specific article view
/help?category=slug       --> Category filtered view
/help?q=search-term       --> Search results
```

---

## Files to Create

### 1. `src/data/help-docs.ts` -- All 100+ Articles Data

Static array of articles with:
- `id`, `slug`, `title`, `category`, `subcategory`, `role` (seller/buyer/admin/general)
- `content` (markdown-like HTML string)
- `tags` (for search)
- `order` (display order)

### 2. `src/pages/Help.tsx` -- Main Help Page

Full help center with:
- **Header**: Uptoza logo, search bar, role filter tabs (All / Seller / Buyer)
- **Sidebar**: Collapsible category tree navigation
- **Content area**: Article renderer or category landing cards
- **Mobile**: Responsive with drawer sidebar

### 3. `src/components/help/HelpSidebar.tsx` -- Category Navigation
### 4. `src/components/help/HelpArticle.tsx` -- Article Renderer
### 5. `src/components/help/HelpSearch.tsx` -- Search Component
### 6. `src/components/help/HelpCategoryCard.tsx` -- Category Overview Card

---

## Article Categories & Full List (100+ Articles)

### Category 1: Getting Started (8 articles)
1. What is Uptoza?
2. How to create an account
3. Signing in with Google
4. Navigating the marketplace
5. Understanding user roles (Buyer, Seller, Admin)
6. How to reset your password
7. Browser compatibility and requirements
8. Mobile app vs web experience

### Category 2: Seller Account Setup (10 articles)
9. How to become a seller
10. Setting up your store name and description
11. Uploading your store logo
12. Store verification process
13. Seller levels and badges explained
14. Two-factor authentication for sellers
15. Seller dashboard overview
16. Understanding your seller profile
17. Store URL and sharing your store link
18. Google OAuth for seller accounts

### Category 3: Product Types (14 articles)
19. Overview of all product types
20. Digital Products -- files, assets, downloads
21. E-books -- publishing and selling
22. Templates -- design templates and presets
23. Courses -- creating lessons and curriculum
24. Software -- distributing apps and tools
25. Graphics -- selling visual assets
26. Audio -- music, sound effects, podcasts
27. Video -- video content and tutorials
28. Membership -- subscription access products
29. Services -- freelance and consulting gigs
30. Commissions -- custom work orders
31. Calls -- booking and scheduling sessions
32. Coffee / Tips -- accepting donations
33. Bundles -- combining multiple products

### Category 4: Creating Products (12 articles)
34. Step-by-step product creation guide
35. Writing effective product titles and descriptions
36. Setting prices and compare-at prices
37. Uploading product images (multi-image)
38. Adding product files and content
39. Using the Rich Text Editor
40. Setting up product categories
41. Product visibility and publishing
42. Card appearance customization
43. Product tags and SEO metadata
44. Product variants and options
45. Editing an existing product

### Category 5: Auto-Delivery System (10 articles)
46. What is Auto-Delivery?
47. Auto-Delivery vs Manual Delivery explained
48. Setting up Account delivery (email:password)
49. Adding accounts individually
50. Bulk importing accounts
51. Setting up License Key delivery
52. Bulk importing license keys
53. Setting up Download delivery (unique files)
54. Writing usage guides for buyers
55. Managing delivery inventory and stock

### Category 6: Course Builder (6 articles)
56. Creating your first course
57. Adding lessons with video and text
58. Lesson ordering and free previews
59. Attaching downloadable resources to lessons
60. Course progress tracking for buyers
61. Updating course content after publishing

### Category 7: Sales & Orders (8 articles)
62. Understanding your orders dashboard
63. Order statuses explained
64. Processing manual deliveries
65. Auto-delivered orders badge
66. Viewing order details and buyer info
67. Handling refunds and disputes
68. Exporting orders data
69. Order notifications and alerts

### Category 8: Customers (5 articles)
70. Viewing your customer list
71. Customer segments and analytics
72. Customer lifetime value
73. Top spenders and repeat buyers
74. Exporting customer data (CSV)

### Category 9: Analytics & Insights (8 articles)
75. Sales analytics overview
76. Revenue charts and trends
77. Product-level analytics
78. Performance metrics explained
79. Traffic and conversion rates
80. Comparing time periods
81. Reports and data export
82. Understanding your seller level progress

### Category 10: Wallet & Payouts (8 articles)
83. How the seller wallet works
84. Available balance vs pending balance
85. Requesting a withdrawal
86. Withdrawal methods (Bank, UPI, PayPal, Crypto)
87. OTP verification for withdrawals
88. Withdrawal processing times
89. Commission rates and fees
90. Transaction history

### Category 11: Marketing & Promotions (7 articles)
91. Creating discount codes
92. Setting up coupons
93. Flash sales -- how they work
94. Flash sale countdown timers
95. Marketing tools overview
96. Share your store modal
97. SEO tips for your products

### Category 12: Store & Storefront (6 articles)
98. How your public store page works
99. Store sidebar and category filters
100. Product detail modal on store
101. Store layout on mobile
102. Customizing your store appearance
103. Sharing your store URL

### Category 13: Buyer Guide (10 articles)
104. Browsing the marketplace
105. Searching and filtering products
106. Quick view and product details
107. Making a purchase
108. Guest checkout
109. Accessing your buyer dashboard
110. Viewing your purchased library
111. Downloading files after purchase
112. Viewing delivered accounts and license keys
113. Course viewer -- watching purchased courses

### Category 14: Buyer Wallet & Payments (5 articles)
114. How the buyer wallet works
115. Adding funds to your wallet
116. Payment methods (Razorpay, Stripe)
117. Viewing purchase history
118. Requesting a refund

### Category 15: Chat & Communication (4 articles)
119. Seller-buyer chat system
120. Starting a conversation with a seller
121. Chat notifications
122. Support chat with Uptoza

### Category 16: Settings & Account (6 articles)
123. Updating your profile
124. Push notification preferences
125. Currency selector and conversion
126. Privacy and security settings
127. Deleting your account
128. Terms of Service and Privacy Policy

### Category 17: Troubleshooting (6 articles)
129. Product not appearing in store
130. Payment failed -- what to do
131. Cannot access purchased product
132. File download issues
133. Auto-delivery not working
134. Account login problems

**Total: 134 articles**

---

## Design System

- **Background**: `bg-white` clean white page
- **Sidebar**: `bg-gray-50 border-r border-black/10` with collapsible categories
- **Header**: Black top bar with Uptoza logo and search
- **Article cards**: `bg-white border border-black/10 rounded-xl` with hover effects
- **Typography**: Inter font, consistent with seller dashboard
- **Active nav**: `text-black font-semibold` with left border accent
- **Responsive**: Sidebar becomes sheet/drawer on mobile
- **Search**: Real-time filtering across title, content, and tags

---

## Route Integration

Add `/help` and `/help/*` routes to `App.tsx` as a lazy-loaded page, accessible without authentication (public docs).

---

## Technical Details

### Data Structure (`help-docs.ts`):
```tsx
export interface HelpArticle {
  id: number;
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  subcategory?: string;
  role: 'seller' | 'buyer' | 'admin' | 'general';
  content: string; // HTML content
  tags: string[];
  order: number;
}

export const HELP_CATEGORIES = [
  { slug: 'getting-started', name: 'Getting Started', icon: 'Rocket', order: 1 },
  // ... 17 categories
];

export const HELP_ARTICLES: HelpArticle[] = [
  // 134 articles with full content
];
```

### Page Component (`Help.tsx`):
- URL query params for navigation (`?article=`, `?category=`, `?q=`)
- `useMemo` for filtered articles based on search/category/role
- Breadcrumb navigation within articles
- "Was this helpful?" feedback at bottom of each article
- Table of contents for long articles
- Related articles section

### Search:
- Client-side fuzzy search across title + tags + content
- Debounced input (300ms)
- Highlighted matching terms in results
- Category grouping in search results

### Files Modified:
1. **`src/App.tsx`** -- Add `/help` route
2. **New: `src/pages/Help.tsx`** -- Main page
3. **New: `src/data/help-docs.ts`** -- All article data
4. **New: `src/components/help/HelpSidebar.tsx`** -- Sidebar nav
5. **New: `src/components/help/HelpArticle.tsx`** -- Article renderer
6. **New: `src/components/help/HelpSearch.tsx`** -- Search bar
7. **New: `src/components/help/HelpCategoryCard.tsx`** -- Category cards

### No Database Needed:
All documentation is static content in the codebase. This keeps it fast, always available, and easy to update.

