
# Add Hover Preview to All Product Sections

## Problem Summary

The hover preview (`CenteredHoverPreview`) is currently only implemented on:
- Main product grid in `/marketplace` (via `ProductHoverCard`)
- Store page product cards (via `StoreProductHoverCard`)

It is **missing** from:
1. `/dashboard/marketplace` product cards in `AIAccountsSection`
2. Discovery sections: Hot Right Now, Top Rated, New Arrivals (used in both `/marketplace` and `/dashboard/marketplace`)

## Solution Overview

Wrap all product cards with the existing `ProductHoverCard` component to provide consistent hover preview behavior across the platform.

## Files to Modify

### 1. HotProductsSection.tsx
- Wrap each product `Card` with `ProductHoverCard`
- Pass the same hover content design used elsewhere

### 2. TopRatedSection.tsx
- Wrap each product `Card` with `ProductHoverCard`
- Convert product data to the format expected by `ProductHoverCard`

### 3. NewArrivalsSection.tsx
- Wrap each product `Card` with `ProductHoverCard`
- Handle both AI and seller product types

### 4. AIAccountsSection.tsx (dashboard/marketplace)
- Wrap the product cards (lines 1377-1471 for AI accounts, lines 1473+ for seller products) with `ProductHoverCard`
- This is the main product grid in the dashboard marketplace

## Technical Approach

For discovery sections (Hot, Top Rated, New Arrivals):

```typescript
// Before:
<Card onClick={() => onProductClick(product)}>
  {/* card content */}
</Card>

// After:
<ProductHoverCard
  product={{
    id: product.id,
    name: product.name,
    price: product.price,
    iconUrl: product.icon_url,
    sellerName: product.seller_name || null,
    storeSlug: product.store_slug || null,
    isVerified: false,
    soldCount: product.sold_count,
    type: product.type,
  }}
  onBuy={() => {/* handle buy */}}
  onChat={() => {/* handle chat */}}
  isAuthenticated={!!user}
>
  <Card className="...">
    {/* existing card content */}
  </Card>
</ProductHoverCard>
```

## New Prop Requirements

The discovery sections currently only receive `onProductClick`. They will need additional props:
- `onBuy?: (product) => void` - For the Buy button in hover preview
- `onChat?: (product) => void` - For the Chat button in hover preview
- `isAuthenticated?: boolean` - To show correct button states

## Changes Summary

| File | Change |
|------|--------|
| `HotProductsSection.tsx` | Add `ProductHoverCard` wrapper, add new props |
| `TopRatedSection.tsx` | Add `ProductHoverCard` wrapper, add new props |
| `NewArrivalsSection.tsx` | Add `ProductHoverCard` wrapper, add new props |
| `AIAccountsSection.tsx` | Wrap product cards with `ProductHoverCard` |
| `Marketplace.tsx` | Pass `onBuy`, `onChat`, `isAuthenticated` to discovery sections |

## Result

- Hovering any product card (in any section, on any page) will show the centered hover preview
- Same design language across all product sections
- Mobile users will navigate directly on tap (hover is disabled on mobile)
