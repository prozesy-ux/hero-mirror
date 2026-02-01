
# Dashboard Marketplace Product View URL Routing Fix

## Problem

When clicking "View Full Details" in the dashboard marketplace Quick View Modal, the navigation:
- Currently redirects to external store page (`/store/{storeSlug}/product/{slug}`)
- Should stay within the dashboard at `/dashboard/marketplace/product/{slug}`

## Current Flow

```text
User in /dashboard/marketplace
    ↓
Clicks product card → Quick View Modal opens
    ↓
Clicks "View Full Details"
    ↓
❌ Navigates to /store/{storeSlug}/product/{slug}  ← WRONG (leaves dashboard)
```

## Target Flow

```text
User in /dashboard/marketplace
    ↓
Clicks product card → Quick View Modal opens
    ↓
Clicks "View Full Details"
    ↓
✓ Navigates to /dashboard/marketplace/product/{slug}  ← CORRECT (stays in dashboard)
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/AIAccountsSection.tsx` | Update `onViewFull` navigation to use dashboard route |
| `src/pages/Dashboard.tsx` | Update route param from `:productId` to `:productSlug` |
| `src/components/dashboard/ProductFullViewPage.tsx` | Add slug-based product lookup |

## Implementation Details

### 1. Update Navigation in AIAccountsSection.tsx

**Current code (lines 2064-2080):**
```typescript
onViewFull={() => {
  setShowQuickViewModal(false);
  if (quickViewProduct?.type === 'seller') {
    const product = quickViewProduct.data as SellerProduct;
    const storeSlug = product.seller_profiles?.store_slug;
    if (storeSlug) {
      navigate(generateProductUrlWithFallback(...));  // Goes to /store/...
      return;
    }
  }
  navigate(`/dashboard/ai-accounts/product/${quickViewProduct?.data.id}`);
}}
```

**New code:**
```typescript
onViewFull={() => {
  setShowQuickViewModal(false);
  if (quickViewProduct?.type === 'seller') {
    const product = quickViewProduct.data as SellerProduct;
    // Use slug if available, otherwise fallback to ID
    const slug = product.slug || product.id;
    navigate(`/dashboard/marketplace/product/${slug}`);
  } else if (quickViewProduct) {
    navigate(`/dashboard/marketplace/product/${quickViewProduct.data.id}`);
  }
}}
```

### 2. Update Dashboard Route

**Current:**
```typescript
<Route path="marketplace/product/:productId" element={<ProductFullViewPage />} />
```

**New:**
```typescript
<Route path="marketplace/product/:productSlug" element={<ProductFullViewPage />} />
```

### 3. Update ProductFullViewPage.tsx Lookup

Add slug-based lookup to support SEO-friendly URLs:

**Current lookup (lines 133-160):**
```typescript
const { productId } = useParams<{ productId: string }>();
// Queries by ID only
.eq('id', productId)
```

**New lookup strategy:**
```typescript
const { productSlug } = useParams<{ productSlug: string }>();

// Determine if param is UUID or slug
const isUUID = /^[a-f0-9-]{36}$/i.test(productSlug || '');

if (isUUID) {
  // Query by ID
  .eq('id', productSlug)
} else {
  // Query by slug first, then fallback to name matching
  .eq('slug', productSlug)
}
```

## URL Examples

| Action | Old URL | New URL |
|--------|---------|---------|
| View Netflix product | `/store/prozesy/product/netflix-premium` | `/dashboard/marketplace/product/netflix-premium` |
| View by ID (fallback) | `/dashboard/ai-accounts/product/abc123...` | `/dashboard/marketplace/product/abc123...` |

## Summary

- All product full views from dashboard stay within `/dashboard/marketplace/product/{slug}`
- Supports both UUID and slug-based lookups for backward compatibility
- Maintains dashboard header, sidebar, and context
- SEO-friendly URLs match the store pattern
