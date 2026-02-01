
# Replace QuickView Modal with HoverCard Preview

## Overview

Transform the current click-to-open QuickView modal into a hover-triggered preview card that maintains the exact same design, layout, and dimensions. Clicking will now navigate to the full product view page instead of opening a modal.

## Current vs New Behavior

| Action | Current | New |
|--------|---------|-----|
| Hover on card | Nothing | Shows HoverCard with QuickView design |
| Click on card | Opens QuickView modal | Navigates to full view page |
| Mobile tap | Opens QuickView modal | Navigates to full view page |

## Design Preservation

The HoverCard content will use the **exact same design** as the current QuickView:

**Desktop HoverCard:**
```text
┌────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────┐  ┌──────────────────────────┐ │
│  │                            │  │  [$12] (black badge)     │ │
│  │    Product Image           │  │                          │ │
│  │    h-[320px]               │  │  Balance: $50.00         │ │
│  │    65% width               │  │                          │ │
│  │    + gallery nav           │  │  [Buy Now] (black btn)   │ │
│  │    + thumbnails            │  │  [Chat] (outline btn)    │ │
│  │                            │  │                          │ │
│  └────────────────────────────┘  │  ─────────────────────── │ │
│                                  │  542 sales               │ │
│  Product Title                   │                          │ │
│  Seller Avatar + Name + Verified │  [Secure][Instant][24/7] │ │
│  ★★★★☆ (12 reviews)             │        35% width         │ │
│  Description text...             └──────────────────────────┘ │
│  [tag1] [tag2] [tag3]                                         │
└────────────────────────────────────────────────────────────────┘
```

**Dimensions:**
- Desktop HoverCard: `max-w-[700px]` width, ~450px content height
- 65/35 split layout (same as QuickView modal)
- Image container: `h-[320px]` (slightly reduced from modal's 350px)

## Mobile Strategy

Since hover doesn't work on touch devices, the mobile experience will be:

**Option: Direct navigation on tap**
- Tapping product card navigates directly to full view page
- No intermediate modal or hover - faster, cleaner UX
- Aligns with native mobile app patterns

## Technical Implementation

### 1. Create New ProductHoverCard Component

**File:** `src/components/marketplace/ProductHoverCard.tsx`

A reusable HoverCard component that wraps product cards with the QuickView-style preview content:

```typescript
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

interface ProductHoverCardProps {
  product: Product;
  children: React.ReactNode;  // The product card trigger
  onBuy: () => void;
  onChat: () => void;
  isAuthenticated: boolean;
  walletBalance?: number;
}
```

**Content Structure:**
- Reuse the exact `DesktopContent` layout from `GumroadQuickViewModal`
- Same image gallery with navigation
- Same seller info, price badge, trust badges
- Same button styling (black Buy Now, outline Chat)

### 2. Update GumroadProductCard

**File:** `src/components/marketplace/GumroadProductCard.tsx`

Wrap the existing card with HoverCard:
- `HoverCardTrigger` wraps the product card
- `onClick` now navigates to full view instead of opening modal
- Pass hover handlers for preview content

### 3. Update StoreProductCard

**File:** `src/components/store/StoreProductCard.tsx`

Apply same pattern:
- Desktop: HoverCard wrapper with preview
- Click navigates to full product page
- Mobile: Direct navigation (no hover)

### 4. Update StoreProductCardCompact

**File:** `src/components/store/StoreProductCardCompact.tsx`

Mobile-only card:
- Remove modal trigger
- Click navigates directly to full view

### 5. Update Marketplace.tsx

**File:** `src/pages/Marketplace.tsx`

- Remove `GumroadQuickViewModal` usage
- Update `handleProductClick` to navigate to full view URL
- Pass necessary props to product cards for hover preview

### 6. Update Store.tsx

**File:** `src/pages/Store.tsx`

- Remove `ProductDetailModal` for click actions
- Update card click handlers to navigate to full product view
- Keep modal only for flash sale quick purchases if needed

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/marketplace/ProductHoverCard.tsx` | CREATE | New hover preview component with QuickView design |
| `src/components/marketplace/GumroadProductCard.tsx` | MODIFY | Wrap with HoverCard, change onClick to navigate |
| `src/components/store/StoreProductCard.tsx` | MODIFY | Wrap with HoverCard, change onClick to navigate |
| `src/components/store/StoreProductCardCompact.tsx` | MODIFY | Change onView to navigate directly |
| `src/pages/Marketplace.tsx` | MODIFY | Remove QuickViewModal, update handlers |
| `src/pages/Store.tsx` | MODIFY | Update click behavior, simplify modal usage |

## HoverCard Configuration

```typescript
<HoverCard openDelay={300} closeDelay={100}>
  <HoverCardTrigger asChild>
    {/* Product card button */}
  </HoverCardTrigger>
  <HoverCardContent 
    side="right" 
    align="start"
    sideOffset={8}
    className="w-[700px] p-0 border border-black/10 shadow-xl"
  >
    {/* QuickView-style content */}
  </HoverCardContent>
</HoverCard>
```

## Summary

- Create `ProductHoverCard` component with exact QuickView design
- Wrap marketplace and store product cards with hover preview
- Change click behavior from modal to full page navigation
- Mobile: Direct tap-to-navigate (no hover/modal)
- Preserve all existing styling, layout, and functionality

