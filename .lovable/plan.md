

# Hover-Based Mini View Implementation

## Overview

Transform product cards across all views (Marketplace, Dashboard Marketplace, and Store) to show a mini preview on hover instead of requiring a "View" button click. The hover preview will use the same clean design as the Store's `ProductDetailModal`.

## Current Behavior vs Target Behavior

| Current | Target |
|---------|--------|
| User clicks product card | Hover shows mini preview |
| "View" button opens modal | No "View" button needed |
| Different quick view designs | Same design across all 3 views |
| Click to see details | Hover to see details, click to buy/view full |

## Visual Design Target

```text
PRODUCT CARD HOVER BEHAVIOR
                                          
+------------+     HOVER     +----------------------------------------+
|   Image    |  --------->   |  MINI PREVIEW POPOVER                  |
|   $XX      |               |  ┌────────────────┬──────────────────┐ |
+------------+               |  │     IMAGE      │   SELLER INFO    │ |
                             |  │   (square)     │   Name + Badge   │ |
                             |  │                │                  │ |
                             |  │                │   PRODUCT TITLE  │ |
                             |  │                │   $Price         │ |
                             |  │                │   Rating + Sold  │ |
                             |  │                │                  │ |
                             |  │                │   [Buy Now] btn  │ |
                             |  │                │   [Chat] btn     │ |
                             |  └────────────────┴──────────────────┘ |
                             |                                        |
                             +----------------------------------------+
```

## Implementation Plan

### Phase 1: Create ProductHoverPreview Component

**New File**: `src/components/marketplace/ProductHoverPreview.tsx`

A reusable hover preview component matching the Store's modal design:

```tsx
interface ProductHoverPreviewProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    iconUrl: string | null;
    sellerName: string | null;
    sellerAvatar?: string | null;
    storeSlug: string | null;
    isVerified: boolean;
    soldCount?: number;
    tags?: string[] | null;
  };
  onBuy: () => void;
  onChat: () => void;
  onViewFull: () => void;
  isAuthenticated: boolean;
}
```

**Design matching Store modal**:
- 50/50 horizontal split (image left, content right)
- Black price badge
- Black "Buy Now" button
- Outlined "Chat" button
- Seller avatar with verified badge
- Rating stars + sold count
- Subtle animations on open

### Phase 2: Update GumroadProductCard.tsx

**File**: `src/components/marketplace/GumroadProductCard.tsx`

**Changes**:
1. Wrap card in `HoverCard` component from Radix UI
2. Card becomes the trigger
3. Hover shows the `ProductHoverPreview` popover
4. Click still opens quick view modal (for mobile fallback)

```tsx
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import ProductHoverPreview from './ProductHoverPreview';

// New props needed
interface GumroadProductCardProps {
  // ... existing props
  onBuy?: () => void;
  onChat?: () => void;
  onViewFull?: () => void;
  isAuthenticated?: boolean;
  // Product details for hover preview
  description?: string | null;
  sellerAvatar?: string | null;
  soldCount?: number;
  tags?: string[] | null;
}

const GumroadProductCard = ({ ... }) => {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button className="group w-full text-left ...">
          {/* Existing card content */}
        </button>
      </HoverCardTrigger>
      <HoverCardContent 
        side="right" 
        align="start" 
        className="w-[400px] p-0 border-black/10 shadow-xl"
      >
        <ProductHoverPreview 
          product={...}
          onBuy={onBuy}
          onChat={onChat}
          onViewFull={onViewFull}
          isAuthenticated={isAuthenticated}
        />
      </HoverCardContent>
    </HoverCard>
  );
};
```

### Phase 3: Update Marketplace.tsx

**File**: `src/pages/Marketplace.tsx`

**Changes**:
1. Pass additional props to `GumroadProductCard` (description, seller avatar, etc.)
2. Pass action handlers (onBuy, onChat, onViewFull)
3. Remove dependence on QuickViewModal for hover interactions (keep for mobile)

```tsx
<GumroadProductCard
  key={product.id}
  id={product.id}
  name={product.name}
  price={product.price}
  iconUrl={product.iconUrl}
  sellerName={product.sellerName}
  sellerAvatar={product.sellerAvatar}
  storeSlug={product.storeSlug}
  isVerified={product.isVerified}
  soldCount={product.soldCount}
  description={product.description}
  tags={product.tags}
  type={product.type}
  onClick={() => handleProductClick(product)}
  onBuy={() => handleBuy(product)}
  onChat={() => handleChat(product)}
  onViewFull={() => handleViewFull(product)}
  isAuthenticated={!!user}
/>
```

### Phase 4: Update StoreProductCard.tsx

**File**: `src/components/store/StoreProductCard.tsx`

**Changes**:
1. Wrap card in `HoverCard` component
2. Show same `ProductHoverPreview` on hover
3. Maintain existing button actions for mobile/click

```tsx
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import ProductHoverPreview from '@/components/marketplace/ProductHoverPreview';

// Add seller info props
interface StoreProductCardProps {
  // ... existing
  sellerAvatar?: string | null;
  storeSlug?: string | null;
  isVerified?: boolean;
  onViewFull?: () => void;
  isAuthenticated?: boolean;
}

const StoreProductCard = ({ ... }) => {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="group bg-white rounded-2xl ...">
          {/* Existing card content */}
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        side="right" 
        align="start" 
        className="w-[400px] p-0 border-black/10 shadow-xl"
      >
        <ProductHoverPreview ... />
      </HoverCardContent>
    </HoverCard>
  );
};
```

### Phase 5: Update Store.tsx

**File**: `src/pages/Store.tsx`

**Changes**:
1. Pass seller profile info to `StoreProductCard`
2. Pass action handlers for hover preview
3. Keep `ProductDetailModal` for when user clicks "View Full" from hover

### Phase 6: Update AIAccountsSection.tsx (Dashboard Marketplace)

**File**: `src/components/dashboard/AIAccountsSection.tsx`

**Changes**:
1. Use same `GumroadProductCard` with hover preview
2. Pass all required props for hover functionality
3. Navigate to full view page on "View Full" click

## ProductHoverPreview Design Specs

| Element | Style |
|---------|-------|
| Container | `w-[400px] bg-white rounded-xl overflow-hidden border border-black/10 shadow-xl` |
| Layout | Horizontal 50/50 split on desktop |
| Image | `aspect-square object-contain bg-gray-50` |
| Price Badge | `bg-black text-white px-3 py-1.5 rounded text-lg font-bold` |
| Buy Button | `bg-black hover:bg-black/90 text-white w-full h-10` |
| Chat Button | `border-2 border-black text-black hover:bg-black hover:text-white w-full h-9` |
| Seller Info | Avatar + name + verified badge in row |
| Title | `text-lg font-bold text-black line-clamp-2` |
| Description | `text-sm text-black/60 line-clamp-2` |
| Stats | `text-xs text-black/50` - sold count, rating |

## Unified Flow Across All Views

```text
1. MARKETPLACE (/marketplace)
   - GumroadProductCard with HoverCard
   - Hover -> ProductHoverPreview
   - Click "View Full" -> Navigate to /marketplace/product/:id

2. DASHBOARD MARKETPLACE (/dashboard/marketplace)  
   - Same GumroadProductCard with HoverCard
   - Hover -> ProductHoverPreview
   - Click "View Full" -> Navigate to /dashboard/marketplace/product/:id

3. STORE (/store/:slug)
   - StoreProductCard with HoverCard
   - Hover -> ProductHoverPreview (same design)
   - Click "View Full" -> Open ProductDetailModal or navigate to full view
```

## Mobile Handling

On mobile devices (touch screens):
- HoverCard doesn't work well with touch
- Keep click-to-open modal behavior
- Detect mobile and skip HoverCard wrapper
- Use existing quick view modal pattern

```tsx
const isMobile = useIsMobile();

if (isMobile) {
  return <button onClick={onClick}>...</button>;
}

return (
  <HoverCard>
    <HoverCardTrigger asChild>
      <button>...</button>
    </HoverCardTrigger>
    <HoverCardContent>
      <ProductHoverPreview />
    </HoverCardContent>
  </HoverCard>
);
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/marketplace/ProductHoverPreview.tsx` | NEW - Reusable hover preview component |
| `src/components/marketplace/GumroadProductCard.tsx` | Add HoverCard wrapper, new props |
| `src/pages/Marketplace.tsx` | Pass additional props to cards |
| `src/components/store/StoreProductCard.tsx` | Add HoverCard wrapper |
| `src/pages/Store.tsx` | Pass seller info to cards |
| `src/components/dashboard/AIAccountsSection.tsx` | Use updated GumroadProductCard |

## Summary

1. **New Component**: `ProductHoverPreview` - unified hover preview design
2. **HoverCard Integration**: Wrap product cards with Radix HoverCard
3. **Same Design**: All 3 views use identical hover preview
4. **Mobile Fallback**: Keep click-to-modal behavior on touch devices
5. **Design Match**: Preview matches Store's ProductDetailModal style

