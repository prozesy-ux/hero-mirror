

# Replace Hover Preview with Click Modal (Unified Mini View)

## Overview

Replace the hover-based preview with a click-triggered modal across all views (Store, Marketplace, Dashboard). When user clicks the "View" button, they'll see a compact mini view modal using the **same design as ProductHoverPreview** - making it easier with one click instead of requiring precise hover positioning.

## Current vs Target Behavior

| Current | Target |
|---------|--------|
| Hover over card to see preview | Click "View" button to open mini modal |
| Requires precise mouse positioning | Simple, deliberate click action |
| HoverCard component wraps cards | Dialog/Modal uses ProductHoverPreview design |
| Different experiences hover vs click | Same design in click modal |

## Visual Design

```text
CLICK "VIEW" BUTTON -> OPENS MINI VIEW MODAL

+------------------------------------------+
|              MINI VIEW MODAL              |
|  ┌──────────────────┬───────────────────┐ |
|  │                  │   SELLER INFO     │ |
|  │     PRODUCT      │   Avatar + Name   │ |
|  │      IMAGE       │                   │ |
|  │    (square)      │   PRODUCT TITLE   │ |
|  │                  │   $Price Badge    │ |
|  │                  │   Rating + Sold   │ |
|  │                  │   Description     │ |
|  │                  │                   │ |
|  │                  │   [Buy Now] btn   │ |
|  │                  │   [Chat][Full]    │ |
|  └──────────────────┴───────────────────┘ |
+------------------------------------------+

Same 50/50 split layout as current ProductHoverPreview
Width: 380px (same as hover preview)
```

## Implementation Strategy

### Phase 1: Create MiniViewModal Component

Create a new reusable modal that wraps ProductHoverPreview in a Dialog:

**New File**: `src/components/marketplace/MiniViewModal.tsx`

```tsx
// Uses Dialog component with ProductHoverPreview inside
// Same exact design as hover - just in a centered modal
interface MiniViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy: () => void;
  onChat: () => void;
  onViewFull: () => void;
  isAuthenticated: boolean;
}
```

### Phase 2: Update StoreProductCard.tsx

**Remove HoverCard wrapper, keep View button functionality**

Changes:
1. Remove `HoverCard`, `HoverCardTrigger`, `HoverCardContent` imports
2. Remove `ProductHoverPreview` import (will use MiniViewModal in parent)
3. Remove mobile detection for hover
4. Keep the card simple - just calls `onView()` when View button clicked

```tsx
// BEFORE: Wrapped in HoverCard with hover preview
<HoverCard>
  <HoverCardTrigger>
    <CardContent />
  </HoverCardTrigger>
  <HoverCardContent>
    <ProductHoverPreview ... />
  </HoverCardContent>
</HoverCard>

// AFTER: Simple card, View button triggers parent's modal
<div className="group bg-white rounded-2xl ...">
  {/* Card content */}
  <button onClick={onView}>View</button>
</div>
```

### Phase 3: Update GumroadProductCard.tsx (Marketplace)

**Same changes as StoreProductCard**

1. Remove HoverCard wrapper
2. Keep card content
3. View/click triggers parent's modal

### Phase 4: Update Store.tsx

**Replace ProductDetailModal with MiniViewModal for View action**

Current flow:
- Click View -> Opens `ProductDetailModal` (full detailed view with 70/30 split)

New flow:
- Click View -> Opens `MiniViewModal` (compact 50/50 mini preview)
- Click "Full View" in MiniViewModal -> Opens `ProductDetailModal` OR navigates to product page

```tsx
// Add state for mini view
const [miniViewProduct, setMiniViewProduct] = useState<SellerProduct | null>(null);

// In render
<StoreProductCard
  onView={() => setMiniViewProduct(product)}  // Opens mini view
  ...
/>

// Mini View Modal
<MiniViewModal
  product={miniViewProduct}
  isOpen={!!miniViewProduct}
  onClose={() => setMiniViewProduct(null)}
  onBuy={() => handlePurchase(miniViewProduct)}
  onChat={() => handleChat(miniViewProduct)}
  onViewFull={() => {
    setMiniViewProduct(null);
    setSelectedProduct(miniViewProduct); // Opens full detail modal
  }}
  isAuthenticated={!!user}
/>

// Keep ProductDetailModal for "Full View" action
<ProductDetailModal ... />
```

### Phase 5: Update Marketplace.tsx

**Same pattern - add MiniViewModal**

1. Add state for miniViewProduct
2. Pass `onView` to cards that sets miniViewProduct
3. Add MiniViewModal component
4. MiniViewModal's "Full View" button navigates to product page

### Phase 6: Update AIAccountsSection.tsx (Dashboard Marketplace)

**Same pattern for dashboard**

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/marketplace/MiniViewModal.tsx` | **NEW** - Modal wrapper for ProductHoverPreview |
| `src/components/store/StoreProductCard.tsx` | Remove HoverCard, simplify to basic card |
| `src/components/marketplace/GumroadProductCard.tsx` | Remove HoverCard, simplify to basic card |
| `src/pages/Store.tsx` | Add MiniViewModal, update View flow |
| `src/pages/Marketplace.tsx` | Add MiniViewModal, update View flow |
| `src/components/dashboard/AIAccountsSection.tsx` | Add MiniViewModal if using product cards |

## MiniViewModal Design Specs

| Element | Value |
|---------|-------|
| Modal Width | `max-w-[420px]` (slightly larger than hover for padding) |
| Content | Reuses `ProductHoverPreview` component exactly |
| Background | Centered modal with backdrop overlay |
| Animation | Fade + scale in (standard dialog animation) |
| Close | X button top-right, click outside closes |

## Unified Experience Across All Views

```text
STORE PAGE (/store/:slug)
   Card -> Click "View" -> MiniViewModal
   MiniViewModal "Full View" -> ProductDetailModal or product page

MARKETPLACE (/marketplace)
   Card -> Click card -> MiniViewModal
   MiniViewModal "Full View" -> Navigate to /marketplace/product/:id

DASHBOARD MARKETPLACE (/dashboard/marketplace)
   Card -> Click card -> MiniViewModal
   MiniViewModal "Full View" -> Navigate to /dashboard/marketplace/product/:id
```

## Benefits

1. **Easier interaction** - Click is more deliberate than hover
2. **Mobile friendly** - Works identically on touch devices
3. **Consistent design** - Same 50/50 mini view everywhere
4. **Faster** - One less step (no hover wait time)
5. **Accessible** - Better for keyboard/screen reader users

## Technical Notes

- Keep `ProductHoverPreview` component unchanged - it's the design source
- `MiniViewModal` is just a Dialog wrapper around `ProductHoverPreview`
- Remove `useIsMobile` checks from cards (no longer needed for hover detection)
- Modal positioning: centered (default Dialog behavior)

