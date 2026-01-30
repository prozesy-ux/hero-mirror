

# Marketplace Full View Update - Gumroad Style Design

## Overview

Update the `/marketplace` section to:
1. Use the **Uptoza logo** instead of "gumroad" text
2. Keep all product viewing **within the marketplace** (no redirect to `/store` pages)
3. Create a **Gumroad-style full view page** with image gallery, seller info, reviews, and purchase options
4. Match the exact layout from the Gumroad reference screenshot

## Reference Design Analysis (Gumroad Product Page)

Based on the screenshot from `hftalgo.gumroad.com/l/minbot`:

```text
+------------------------------------------------------------------+
| HEADER: gumroad logo | [Search products...] | Log in | Start selling |
+------------------------------------------------------------------+
| CATEGORIES: All | Drawing | 3D | Design | Music | ...              |
+------------------------------------------------------------------+
|                                                                    |
| [ IMAGE CAROUSEL with dots indicator ]                             |
|                                                                    |
+------------------------------------------------------------------+
| Product Title                              |  [Add to cart]       |
|                                            |  (ⓘ) 181 sales       |
| [$400] https://schema... | HFT Algo        |  ----------------    |
|        [Seller Avatar] [Seller Name]       |  Features box:       |
|        ★★★★★ 11 ratings                    |  - Size: 45.5 KB     |
|                                            |  [Add to wishlist]   |
| DESCRIPTION TEXT...                        |  [Share icons]       |
| - bullet points                            |  No refunds allowed  |
| - links                                    |                      |
|                                            |                      |
+------------------------------------------------------------------+
| RATINGS SECTION                                                    |
| 11 ratings | 4.9 average                                          |
| 5 stars ████████████████████ 91%                                  |
| 4 stars ██ 9%                                                      |
| 3 stars 0%                                                         |
| 2 stars 0%                                                         |
| 1 star  0%                                                         |
+------------------------------------------------------------------+
| REVIEWS                                                            |
| [Avatar] Jameson Rikel                                            |
| ★★★★★ "Works amazing with the provided..."                        |
+------------------------------------------------------------------+
```

## Technical Implementation

### 1. Update GumroadHeader.tsx - Use Uptoza Logo

**Current:**
```tsx
<span className="text-[22px] font-black text-black tracking-tight lowercase">
  gumroad
</span>
```

**Change to:**
```tsx
<img 
  src="/src/assets/uptoza-logo.png" 
  alt="Uptoza" 
  className="h-8 w-auto"
/>
```

### 2. Create New MarketplaceProductFullView Component

A new component that displays full product details in Gumroad style within the marketplace:

**Layout Structure:**
- Full-width image carousel at top with dot indicators
- Two-column layout below:
  - LEFT (60%): Product info, seller badge, rating summary, full description
  - RIGHT (40%): Price box with "Add to cart" button, sales count, features, wishlist, share buttons

**Features:**
- Image gallery with carousel navigation
- Seller avatar and name with verification badge
- Star rating summary with review count
- Full product description with markdown/HTML support
- Product features/specifications box
- "Add to cart" primary CTA button
- Sales count indicator
- Wishlist functionality
- Share buttons (X/Twitter, Facebook)
- Reviews section with rating breakdown

### 3. Update Marketplace.tsx Flow

**Current behavior:**
- Quick View modal → "View Full" button → navigates to `/store/{storeSlug}/product/{productId}`

**New behavior:**
- Quick View modal → "View Full" button → shows inline full view OR modal within marketplace
- All product viewing stays on `/marketplace`
- No redirects to seller store pages

**Implementation approach - In-page full view:**
```tsx
const [fullViewProduct, setFullViewProduct] = useState<Product | null>(null);

// When showing full view
if (fullViewProduct) {
  return <MarketplaceProductFullView 
    product={fullViewProduct} 
    onBack={() => setFullViewProduct(null)}
    onBuy={handleBuy}
    onChat={handleChat}
  />;
}
```

### 4. New Component: MarketplaceProductFullView.tsx

**Structure:**
```text
┌──────────────────────────────────────────────────────────────────┐
│ [← Back to Marketplace]  [Search...]                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │              IMAGE CAROUSEL (full width)                   │  │
│  │              [○ ○ ●]  dot indicators                       │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐   │
│  │ PRODUCT TITLE               │  │ [$XX]                   │   │
│  │                             │  │ [Add to cart - pink]    │   │
│  │ [Avatar] Seller Name        │  │                         │   │
│  │ ★★★★★ (XX ratings)          │  │ (ⓘ) XXX sales           │   │
│  │                             │  │ ─────────────────────   │   │
│  │ DESCRIPTION...              │  │ Includes:               │   │
│  │ • Feature 1                 │  │ - Item 1                │   │
│  │ • Feature 2                 │  │ - Item 2                │   │
│  │ • Links                     │  │                         │   │
│  │                             │  │ Size: XX KB             │   │
│  │                             │  │                         │   │
│  │                             │  │ [Add to wishlist ▼]     │   │
│  │                             │  │ [Share icons]           │   │
│  └─────────────────────────────┘  └─────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ RATINGS & REVIEWS                                          │  │
│  │ XX ratings | X.X average                                   │  │
│  │ 5 stars ████████████ XX%                                   │  │
│  │ 4 stars ██ XX%                                             │  │
│  │ 3 stars  X%                                                │  │
│  │                                                            │  │
│  │ [Review Card 1]                                            │  │
│  │ [Review Card 2]                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 5. Data Fetching for Full View

When opening full view, fetch complete product data:
- Product details from `ai_accounts` or `seller_products`
- Seller profile from `seller_profiles`
- Reviews from `product_reviews`
- Images array for gallery

## Files to Create/Modify

| File | Changes |
|------|---------|
| `src/components/marketplace/GumroadHeader.tsx` | Replace "gumroad" text with Uptoza logo image |
| `src/components/marketplace/MarketplaceProductFullView.tsx` | **NEW** - Gumroad-style full product view |
| `src/pages/Marketplace.tsx` | Add fullViewProduct state, show full view inline instead of redirect |
| `src/components/marketplace/GumroadQuickViewModal.tsx` | Update "View Full" to set fullViewProduct instead of navigate |

## Design Details

### Color Palette (Matching Current Gumroad Style)
- Background: `#F4F4F0` (cream) - page background
- Cards/Boxes: `#FFFFFF` (white) with subtle borders
- Primary CTA: `#FF90E8` (pink) - "Add to cart" button
- Text: `#000000` (black), `#6B6B6B` (secondary gray)
- Ratings: Yellow stars `#FACC15`
- Success/Sales: `#10B981` (emerald)

### Typography
- Product title: `text-2xl font-bold` or larger
- Price: `text-3xl font-bold` with green background badge
- Description: `text-base` with `whitespace-pre-line` for line breaks
- Reviews: `text-sm`

### Image Carousel
- Full-width with rounded corners
- Dot indicators centered below
- Swipe support for mobile
- Thumbnails below on desktop

### Right Sidebar Box
- Sticky on scroll
- White background with subtle border
- Contains: Price, Add to cart, sales count, features, wishlist, share

## Guest Checkout Flow (Unchanged)

The existing guest checkout flow remains:
1. Guest clicks "Add to cart" / "Buy"
2. GuestCheckoutModal opens for email collection
3. Redirects to Stripe checkout

## Summary of Changes

1. **Logo**: Swap "gumroad" text → Uptoza logo image
2. **Full View**: Create in-marketplace full view instead of redirecting to `/store`
3. **Design**: Match Gumroad's product page layout exactly
4. **Reviews**: Integrate existing `ProductReviews` component
5. **Gallery**: Use existing `ImageGallery` component with Gumroad styling

