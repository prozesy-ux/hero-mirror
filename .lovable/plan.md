
# Unify Product Full View Design Across All Views

## Overview

Align the product full view design across three locations to match the recently updated `/marketplace` full view design:

1. **`/store/:storeSlug` (Store.tsx)** - Uses `ProductDetailModal` (bottom sheet/dialog)
2. **`/dashboard/marketplace` (AIAccountsSection.tsx)** - Uses inline modals
3. **`/dashboard/marketplace/product/:productId` (ProductFullViewPage.tsx)** - Uses separate page component

All will adopt the **70/30 horizontal split layout** with:
- Left (70%): Medium-height image gallery with `object-contain`
- Right (30%): Sticky purchase box with price, buttons, and actions
- Below: Combined title/description/seller info section + Reviews

## Current State vs Target State

| Component | Current Layout | Target Layout |
|-----------|---------------|---------------|
| ProductDetailModal (Store) | Drawer/Dialog, vertical stack | Same design as marketplace full view |
| ProductFullViewPage (Dashboard) | Two-column with sidebar | 70/30 split, unified info box |
| AIAccountsSection modals | Basic dialog modals | Link to ProductFullViewPage instead |

## Visual Layout Target

```text
Both /store and /dashboard/marketplace/product views will have:

┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER (Store header or Dashboard topbar)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────┐  ┌───────────────────────┐  │
│  │                                        │  │  PURCHASE BOX (30%)   │  │
│  │          IMAGE GALLERY                 │  │                       │  │
│  │            (70%)                       │  │  $Price (black badge) │  │
│  │                                        │  │                       │  │
│  │     h-[350px] / h-[450px]              │  │  [Add to cart]        │  │
│  │     object-contain                     │  │  [Chat with Seller]   │  │
│  │                                        │  │                       │  │
│  │                                        │  │  Sales count          │  │
│  │                                        │  │  Features             │  │
│  │                                        │  │  Wishlist             │  │
│  │                                        │  │  Share icons          │  │
│  └────────────────────────────────────────┘  └───────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  UNIFIED INFO BOX                                                 │   │
│  │  Title / Seller / Rating                                          │   │
│  │  ────────────────────────────────────────                        │   │
│  │  Description text                                                 │   │
│  │  [Tags]                                                           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  REVIEWS (with always-visible Write Review button)                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### File 1: `src/components/dashboard/ProductFullViewPage.tsx`

**Current State**: Uses a two-column layout with sidebar categories on left and product details on right

**Changes**:
1. Remove the left sidebar with categories (not needed on product detail page)
2. Implement 70/30 horizontal split layout matching `MarketplaceProductFullView`
3. Replace `ImageGallery` with fixed-height container (h-[350px] mobile, h-[450px] desktop)
4. Add sticky purchase box on right (30%) with:
   - Black price badge
   - "Add to cart" button (black)
   - "Chat with Seller" button (outlined)
   - Sales count, features, wishlist, share icons
5. Merge Title/Seller/Description into single unified container below split
6. Add always-visible "Write a Review" button with toast prompt for guests
7. Apply monochrome styling: `bg-white`, `border-black/20`, `text-black`

### File 2: `src/pages/ProductFullView.tsx` (Store product full view)

**Current State**: Uses a two-column 50/50 grid layout with emerald/violet theme

**Changes**:
1. Convert to 70/30 horizontal split layout
2. Replace `ImageGallery` component usage with fixed-height container
3. Create sticky purchase box on right (30%) matching marketplace design
4. Merge product info sections into single unified container
5. Apply monochrome/enterprise styling to match marketplace
6. Add rating breakdown and review controls with always-visible "Write a Review" button

### File 3: `src/components/store/ProductDetailModal.tsx`

**Current State**: Uses Drawer (mobile) and Dialog (desktop) with vertical layout

**Changes**:
1. For desktop Dialog: Convert to 70/30 horizontal layout inside the modal
2. Keep mobile Drawer as vertical stack (bottom sheet works better vertically)
3. Update styling to match marketplace enterprise aesthetic
4. Add "Write a Review" button (visible to all, prompts sign-in for guests)

### File 4: `src/components/dashboard/AIAccountsSection.tsx`

**Current State**: Has its own modals for viewing product details

**Changes**:
1. Update quick view modal to navigate to `/dashboard/marketplace/product/:productId` for full view
2. Remove inline product detail modals, use ProductFullViewPage instead
3. Keep quick view for preview, full view for detailed page

## Styling Specifications

| Element | Style |
|---------|-------|
| Background | `bg-white` or `bg-[#F4F4F0]` (Gumroad cream) |
| Borders | `border-black/20` |
| Text Primary | `text-black` |
| Text Secondary | `text-black/70`, `text-black/50` |
| Price Badge | `bg-black text-white` |
| Primary Button | `bg-black hover:bg-black/90 text-white` |
| Outline Button | `border-2 border-black hover:bg-black hover:text-white` |
| Image Container | `h-[350px] lg:h-[450px] object-contain bg-gray-50` |
| Cards/Containers | `rounded-2xl p-6` |

## Review Section Updates (All Views)

All product full views will include:
1. Rating breakdown with clickable filter bars
2. Sort dropdown (Most Recent / Most Helpful)
3. **Always visible** "Write a Review" button:
   - Authenticated: Toggle review form
   - Guest: `toast.info('Please sign in to write a review')`
4. Review list with:
   - Buyer avatar, name, verified badge
   - Star rating
   - Review content
   - Helpful button
   - Seller response (if any)

## Technical Summary

| File | Changes |
|------|---------|
| `ProductFullViewPage.tsx` | Full redesign to 70/30 split, unified info box, reviews with public Write Review |
| `ProductFullView.tsx` (Store) | Full redesign to 70/30 split, monochrome styling, reviews section |
| `ProductDetailModal.tsx` | Desktop: 70/30 layout in dialog; Mobile: vertical drawer |
| `AIAccountsSection.tsx` | Quick view opens modal, "View Full" navigates to ProductFullViewPage |

## Mobile Responsiveness

On mobile (`< lg` breakpoint):
- Layout stacks vertically: Image (full width) -> Purchase box -> Info -> Reviews
- Image height: `h-[350px]` with `object-contain`
- Bottom sheet drawer retained for `ProductDetailModal`
- Touch-friendly buttons with proper spacing
