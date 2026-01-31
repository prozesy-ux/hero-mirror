

# Unify Product Quick View Modal Design

## Overview

The user wants the **same quick view modal design** (shown in the reference image from `/store`) to be used consistently when hovering/clicking on any product across:

1. **`/store`** - Already has the correct design via `ProductDetailModal`
2. **`/marketplace`** - Currently uses `GumroadQuickViewModal` (different 50/50 layout, pink buttons)  
3. **`/dashboard/marketplace`** - Has various inline modals

All views should show **identical layout, height, fonts, and design**.

## Target Design (From Reference Image)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                                                        [X Close]         │
├────────────────────────────────────────┬────────────────────────────────┤
│                                        │  ┌─────────┐                   │
│                                        │  │   $10   │ (black badge)     │
│         PRODUCT IMAGE                  │  └─────────┘                   │
│           (65% width)                  │                                │
│         h-[350px] desktop              │  [🛒 Buy Now]    (black btn)   │
│         object-contain                 │                                │
│                                        │  [View Full Details] (outline) │
│                                        │                                │
│   ◄  [dots]  ►                        │  ○ 0 sales                     │
│                                        │                                │
│   [thumb] [thumb] [thumb]              │  [Secure] [Instant] [24/7]     │
│                                        │                                │
│                                        │  ♡ Add to wishlist             │
│                                        │                                │
│                                        │  Share: [Twitter] [FB] [Link]  │
├────────────────────────────────────────┴────────────────────────────────┤
│  Product Title – $10 (3 Months)                                         │
│  [Avatar] Prozesy  ✓ Verified                                           │
│                                                                          │
│  Description text here...                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### File 1: `src/components/marketplace/GumroadQuickViewModal.tsx`

**Current State**: Uses 50/50 layout with pink buttons, minimal content

**Changes**: Replace entire component with the same design as `ProductDetailModal`:
- Change to 65/35 horizontal split layout
- Add h-[350px] image container with object-contain
- Add image gallery navigation (prev/next arrows, dots, thumbnails)
- Add black price badge at top-right section
- Replace pink button with black "Buy Now" button
- Add "View Full Details" outlined button
- Add sales count with icon
- Add feature badges (Secure, Instant, 24/7)
- Add wishlist button with heart icon
- Add share section (Twitter, Facebook, Copy link)
- Below split: Product title, seller info with verified badge, description
- Match all fonts, spacing, and styling from `ProductDetailModal`

### File 2: `src/pages/Marketplace.tsx`

**Changes**: Update props passed to `GumroadQuickViewModal`:
- Add `walletBalance`, `isLoggedIn` props
- Add `onWishlist` handler
- Ensure all product data is passed (images, tags, sold_count, etc.)

### File 3: `src/components/dashboard/AIAccountsSection.tsx`

**Changes**: Replace inline product modals with the unified `ProductDetailModal` design:
- Import and use the same `ProductDetailModal` component or replicate its design
- Ensure consistent 65/35 layout when viewing product details
- Match all styling: black buttons, feature badges, share section

## Styling Specifications

| Element | Style |
|---------|-------|
| Modal Container | `max-w-4xl rounded-2xl p-4` |
| Image Container | `lg:w-[65%] h-[350px] border border-black/10 rounded-xl` |
| Image | `object-contain bg-gray-50` |
| Purchase Box | `lg:w-[35%] p-4 border border-black/20 rounded-xl` |
| Price Badge | `px-4 py-2 bg-black text-white text-xl font-bold rounded` |
| Buy Button | `w-full h-11 bg-black hover:bg-black/90 text-white font-semibold rounded-lg` |
| View Full Button | `w-full h-10 border border-black/20 text-black/70 hover:bg-black/5 rounded-lg` |
| Feature Badges | `px-2 py-1 bg-black/5 rounded text-[10px] text-black/70` |
| Wishlist | `text-xs text-black/60 hover:text-black` |
| Share Icons | `p-1.5 text-black/40 hover:text-black` |
| Title | `text-xl font-bold text-black` |
| Seller Name | `font-medium text-black text-sm` |
| Verified Badge | `px-2 py-0.5 border border-black rounded-full text-xs` |
| Description | `text-sm text-black/70 leading-relaxed` |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/marketplace/GumroadQuickViewModal.tsx` | Complete redesign to match ProductDetailModal |
| `src/pages/Marketplace.tsx` | Update props for enhanced modal |
| `src/components/dashboard/AIAccountsSection.tsx` | Use same modal design for product details |

## Mobile Behavior

On mobile (< lg breakpoint):
- Use vertical stack layout (same as ProductDetailModal's Drawer)
- Image at top (h-[280px])
- Content below with seller info, title, price, tags
- Fixed action buttons at bottom with safe-area-bottom padding

## Technical Summary

The key change is replacing `GumroadQuickViewModal` with the exact same component structure as `ProductDetailModal`, ensuring:

1. **Same 65/35 split layout** with image on left, purchase box on right
2. **Same image height** (h-[350px] desktop, h-[280px] mobile)  
3. **Same buttons** (black "Buy Now", outlined "View Full Details")
4. **Same features section** (Secure, Instant, 24/7 badges)
5. **Same wishlist and share** functionality
6. **Same seller info** display with verified badge
7. **Same fonts and spacing** throughout

