
## Fix Product Full View Navigation in Dashboard Marketplace

### Problem
When clicking products in the "Hot Right Now", "Top Rated", and "New Arrivals" sections on the buyer dashboard marketplace, they open a modal instead of navigating to the full view page at `/dashboard/marketplace/product/:slug`. This is inconsistent with how other product views work (e.g., from the cart or QuickView's "Full View" button).

### Root Cause
In `AIAccountsSection.tsx` (lines 1244-1276), the `onProductClick` handlers for all three sections call `setSelectedSellerProduct` + `setShowSellerDetailsModal(true)` (modal) instead of using `navigate()` to go to the full view page.

### Fix
**File: `src/components/dashboard/AIAccountsSection.tsx`**

Replace the `onProductClick` handlers for all three sections to navigate to the dashboard product full view:

**HotProductsSection** (line 1244):
```tsx
onProductClick={product => {
  const slug = product.slug || product.id;
  navigate(`/dashboard/marketplace/product/${slug}`);
}}
```

**TopRatedSection** (line 1253):
```tsx
onProductClick={product => {
  const slug = product.slug || product.id;
  navigate(`/dashboard/marketplace/product/${slug}`);
}}
```

**NewArrivalsSection** (line 1262):
```tsx
onProductClick={product => {
  const slug = product.slug || product.id;
  navigate(`/dashboard/marketplace/product/${slug}`);
}}
```

This matches the existing pattern used in the QuickView modal's "Full View" button (line 1987-1988).

### Summary
- 1 file modified: `src/components/dashboard/AIAccountsSection.tsx`
- 3 click handlers updated from modal-open to navigate
- Uses the same `/dashboard/marketplace/product/:slug` pattern already in use elsewhere
