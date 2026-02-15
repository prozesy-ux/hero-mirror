

## Fix Dashboard Marketplace: Keep Product Views Inside Dashboard

### Problem
When browsing the marketplace inside the buyer dashboard (`/dashboard/marketplace`), clicking products in the **Hot Products**, **Top Rated**, and **New Arrivals** sections navigates to the public guest marketplace URL (`/marketplace/slug`) instead of staying within the dashboard. This happens because:

1. The `ProductHoverCard` component (used by all three sections) has hardcoded navigation to `/marketplace/{slug}` in two places
2. On mobile, tapping any product card triggers this navigation directly
3. The "Full View" button inside the hover preview also navigates to the public marketplace

### Solution
Add a `basePath` prop to `ProductHoverCard` so the dashboard can tell it to navigate to `/dashboard/marketplace/product/{slug}` instead of `/marketplace/{slug}`.

### Changes

**File: `src/components/marketplace/ProductHoverCard.tsx`**
- Add optional `basePath` prop (default: `'/marketplace'`)
- Line 113: Change `navigate('/marketplace/${slug}')` to `navigate('${basePath}/${slug}')`
- Line 286: Same change for the "Full View" button

**File: `src/components/marketplace/HotProductsSection.tsx`**
- Add optional `basePath` prop, pass it down to `ProductHoverCard`

**File: `src/components/marketplace/TopRatedSection.tsx`**
- Add optional `basePath` prop, pass it down to `ProductHoverCard`

**File: `src/components/marketplace/NewArrivalsSection.tsx`**
- Add optional `basePath` prop, pass it down to `ProductHoverCard`

**File: `src/components/dashboard/AIAccountsSection.tsx`**
- Pass `basePath="/dashboard/marketplace/product"` to all three discovery sections (`HotProductsSection`, `TopRatedSection`, `NewArrivalsSection`)

### How It Works

| Context | basePath | Resulting URL |
|---------|----------|---------------|
| Public marketplace | `/marketplace` (default) | `/marketplace/netflix-premium` |
| Buyer dashboard | `/dashboard/marketplace/product` | `/dashboard/marketplace/product/netflix-premium` |

This is a 5-file change with minimal code -- just threading a single prop through the component tree. The existing `ProductFullViewPage` component already handles the `/dashboard/marketplace/product/:productSlug` route.
