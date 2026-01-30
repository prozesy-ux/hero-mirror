
# Public Marketplace Section - Gumroad Style

## Overview

Create a new public `/marketplace` route that displays all seller products in a Gumroad-inspired design, accessible to anyone without requiring login. This page will offer all the discovery, search, and checkout features currently available in the authenticated AI Accounts section, but optimized for guest users with a refined Gumroad aesthetic.

## Reference Design Analysis (Gumroad Discover)

Based on the screenshot:

```text
+------------------------------------------------------------------+
| HEADER: Logo | [Search products...] | Log in | Start selling     |
+------------------------------------------------------------------+
| CATEGORIES: All | Drawing | 3D | Design | Music | Education | ...  |
+------------------------------------------------------------------+
|                                                                    |
| Featured products (Carousel)                                       |
| [Card 1] [Card 2] [Card 3] [Card 4]                    1/8  < >  |
+------------------------------------------------------------------+
|                                                                    |
| "Curated for you"             Trending | Best Sellers | Hot & New |
+------------------------------------------------------------------+
| SIDEBAR           |  PRODUCT GRID                                  |
| - Filters         |  [Card] [Card] [Card] [Card]                  |
| - Tags            |  [Card] [Card] [Card] [Card]                  |
| - Contains        |  [Card] [Card] [Card] [Card]                  |
| - Price           |                                                |
| - Rating          |                                                |
+------------------------------------------------------------------+
```

**Key Gumroad Design Elements:**
- Warm cream/beige background (#F4F4F0)
- Bold black text, minimal icons
- Product cards: Large image, seller avatar row, title, star rating, "Starting at $X"
- Category pills in horizontal scroll
- Collapsible filter sidebar with Tags, Contains, Price, Rating
- Featured carousel at top

## Technical Approach

### 1. New Page: `src/pages/Marketplace.tsx`

A standalone public page (no login required) that:
- Uses the existing `bff-marketplace-home` edge function for data
- Implements Gumroad's cream/beige color scheme
- Features a horizontal category scroller
- Includes featured products carousel
- Provides full filtering sidebar (tags, price, rating)
- Shows product grid with Gumroad-style cards

### 2. Guest Checkout Flow

For purchases without login:
1. Guest clicks "Buy" on a product
2. System shows a checkout modal requesting:
   - Email address (for delivery)
   - Optional: Name
3. Creates a guest order record with the provided email
4. Redirects to wallet top-up page with "guest checkout" mode
5. After payment, delivers product via email

**Guest Checkout Database Changes:**
- Add `guest_email` column to `seller_orders` table
- Create guest-specific order flow in the `purchase_seller_product` function

### 3. New Components

| Component | Purpose |
|-----------|---------|
| `src/pages/Marketplace.tsx` | Main public marketplace page |
| `src/components/marketplace/GumroadHeader.tsx` | Gumroad-style minimal header |
| `src/components/marketplace/GumroadProductCard.tsx` | Product card matching Gumroad design |
| `src/components/marketplace/FeaturedCarousel.tsx` | Horizontal featured products carousel |
| `src/components/marketplace/GumroadFilterSidebar.tsx` | Collapsible filter sidebar |
| `src/components/marketplace/GuestCheckoutModal.tsx` | Email collection for guest purchases |

### 4. Routing Changes

Update `src/App.tsx` to add:
```typescript
<Route path="/marketplace" element={
  <Suspense fallback={<AppShell />}>
    <Marketplace />
  </Suspense>
} />
```

No authentication required - fully public access.

## UI/UX Details

### Color Palette (Gumroad Style)
- **Background**: `#F4F4F0` (warm cream)
- **Cards**: Pure white with subtle shadow
- **Primary CTA**: `#FF90E8` (pink) for guest checkout
- **Secondary**: Black for text, dark gray for borders
- **Accent**: Category pills with rounded-full style

### Header Design
```text
[Uptoza Logo]  [Search products _______ ] [🔍]  [Sign in] [Start selling]
```
- Fixed at top, minimal height (56px)
- Search bar prominent in center
- Sign in as text link, not required

### Product Card Design (Gumroad Style)
```text
+---------------------------+
| [Product Image 16:10]    |
+---------------------------+
| [Avatar] Seller Name Level|
+---------------------------+
| Product Title (2 lines)   |
| ★ 4.9 (1.2k)              |
+---------------------------+
| Starting at    $49        |
+---------------------------+
```

### Featured Carousel
- Horizontal scroll with peek (shows partial next card)
- Auto-advancement every 5 seconds
- Dots or 1/8 pagination indicator
- Arrow navigation on desktop

### Filter Sidebar
- Collapsible accordion sections
- Tags: Expandable list with "Show more"
- Contains: File type filters (PDF, ZIP, etc.)
- Price: Min/Max input fields with $ prefix
- Rating: Star-based filter (4+, 3+, 2+)

## Guest Checkout Implementation

### Step 1: Email Collection Modal
When guest clicks Buy:
```text
+-------------------------------------+
| 🛒 Complete Your Purchase          |
+-------------------------------------+
| [Product Name] - $XX                |
|                                     |
| Enter your email to receive:        |
| [email@example.com____________]     |
|                                     |
| [Continue to Payment]               |
| [Sign in for faster checkout]       |
+-------------------------------------+
```

### Step 2: Payment Options
- Stripe Checkout (redirect to Stripe, no wallet needed)
- Or: Create guest wallet with email, top up via existing flow

### Step 3: Order Confirmation
- Send order confirmation email
- Show "Check your email for delivery" message
- Seller receives notification with buyer email

### Database Changes Required
```sql
-- Add guest email support to seller_orders
ALTER TABLE seller_orders ADD COLUMN guest_email TEXT DEFAULT NULL;

-- Create index for guest order lookups
CREATE INDEX idx_seller_orders_guest_email ON seller_orders(guest_email) WHERE guest_email IS NOT NULL;
```

## Files to Create/Modify

### New Files
| File | Description |
|------|-------------|
| `src/pages/Marketplace.tsx` | Main marketplace page with Gumroad design |
| `src/components/marketplace/GumroadHeader.tsx` | Minimal public header |
| `src/components/marketplace/GumroadProductCard.tsx` | Product card component |
| `src/components/marketplace/FeaturedCarousel.tsx` | Featured products carousel |
| `src/components/marketplace/GumroadFilterSidebar.tsx` | Collapsible filter sidebar |
| `src/components/marketplace/GuestCheckoutModal.tsx` | Guest email checkout modal |

### Modified Files
| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/marketplace` route |
| `src/components/Header.tsx` | Add "Marketplace" nav link |

### Database Migration
- Add `guest_email` column to `seller_orders`

## Feature Parity with AI Accounts Section

All features from the authenticated marketplace will be available:

| Feature | Implementation |
|---------|----------------|
| Search | Full-text with voice & image search |
| Categories | Horizontal scroller + sidebar filter |
| Hot Products | Same BFF endpoint, carousel display |
| Top Rated | Same ranking algorithm |
| New Arrivals | Last 7 days filter |
| Price Filter | Min/Max input in sidebar |
| Rating Filter | Star-based selection |
| Tag Filter | Tag chips with toggle |
| Product Modal | Quick view with Chat/View/Buy actions |
| Chat with Seller | Redirects to sign-in (guest can't chat) |
| Purchase | Guest checkout with email |
| Wishlist | Sign in required (show prompt) |

## Implementation Summary

1. **Create `src/pages/Marketplace.tsx`** - Main Gumroad-style marketplace
2. **Create Gumroad UI components** - Header, cards, carousel, sidebar
3. **Implement guest checkout modal** - Email collection before purchase
4. **Add database column** - `guest_email` on `seller_orders`
5. **Update routing** - Add `/marketplace` public route
6. **Add navigation** - Link from main header

## Expected Result

After implementation:
- `/marketplace` is publicly accessible without login
- Gumroad-inspired warm cream design with bold typography
- Full product discovery (search, filters, categories)
- Guest checkout allows email-based purchases
- Existing users can sign in for wallet-based checkout
- Sellers receive orders with buyer email for delivery
