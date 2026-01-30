
# Fix Store & Product URLs in Marketplace Section

## Problem

When clicking on products in the marketplace section (Hot Products, New Arrivals, Top Rated), the URLs are either broken or navigating to the wrong format:

1. **Quick View "View" button** navigates to `/dashboard/ai-accounts/product/{uuid}` instead of the SEO-friendly `/store/{store-slug}/product/{slug}`
2. **Product sections don't fetch the `slug` field** from the database, so even if we try to use SEO URLs, we don't have the clean slug available
3. **BFF edge function** may not be returning the `slug` field in product responses

The expected format is:
```
/store/prozesy/product/netflix-cheap-monthly-account
```

But currently it's going to:
```
/dashboard/ai-accounts/product/f3b87674-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Solution Overview

1. Update all marketplace product queries to include the `slug` field
2. Update navigation logic to use the SEO-friendly URL format with `generateProductUrlWithFallback()`
3. Update BFF edge function to include `slug` in responses

## Technical Changes

### 1. Update HotProductsSection.tsx

Add `slug` to the product interface and fetch queries:

```typescript
interface HotProduct {
  id: string;
  name: string;
  price: number;
  icon_url: string | null;
  slug: string | null;        // ADD THIS
  sold_count: number;
  // ... rest of fields
}

// In fetch query - add slug
.select('id, name, price, icon_url, slug, sold_count, seller_profiles(store_name, store_slug)')
```

### 2. Update NewArrivalsSection.tsx

Same pattern - add `slug` to interface and queries.

### 3. Update TopRatedSection.tsx

Same pattern - add `slug` to interface and queries.

### 4. Update AIAccountsSection.tsx - Quick View Modal

Change the "View" button navigation from:
```typescript
navigate(`/dashboard/ai-accounts/product/${quickViewProduct.data.id}`);
```

To:
```typescript
import { generateProductUrlWithFallback } from '@/lib/url-utils';

// For seller products
if (quickViewProduct.type === 'seller') {
  const product = quickViewProduct.data as SellerProduct;
  const storeSlug = product.seller_profiles?.store_slug;
  if (storeSlug) {
    navigate(generateProductUrlWithFallback(
      storeSlug,
      product.slug,
      product.name,
      product.id
    ));
    return;
  }
}
// Fallback to internal route for AI accounts or products without store_slug
navigate(`/dashboard/ai-accounts/product/${quickViewProduct.data.id}`);
```

### 5. Update AIAccountsSection.tsx - Seller Details Modal

Add a "View Full" button that navigates to the proper SEO URL:

```typescript
// Add onViewFull handler
const handleViewFullSellerProduct = (product: SellerProduct) => {
  if (product.seller_profiles?.store_slug) {
    navigate(generateProductUrlWithFallback(
      product.seller_profiles.store_slug,
      (product as any).slug,
      product.name,
      product.id
    ));
  } else {
    navigate(`/dashboard/ai-accounts/product/${product.id}`);
  }
};
```

### 6. Update SellerProduct Interface in AIAccountsSection

Add `slug` to the SellerProduct interface:

```typescript
interface SellerProduct {
  id: string;
  name: string;
  slug?: string | null;      // ADD THIS
  description: string | null;
  // ... rest of fields
}
```

### 7. Update fetchSellerProducts Query

Add `slug` to the select:

```typescript
const { data, error } = await supabase
  .from('seller_products')
  .select(`
    id, name, slug, description, price, icon_url, ...
  `)
```

### 8. Update BFF Marketplace Home Edge Function

Ensure `slug` is included in all product queries:

```typescript
// In bff-marketplace-home/index.ts
const { data: products } = await supabase
  .from('seller_products')
  .select('id, name, slug, price, icon_url, sold_count, seller_profiles(store_name, store_slug)')
```

### 9. Update useMarketplaceData Hook

Ensure the ProductSummary interface includes `slug`:

```typescript
export interface ProductSummary {
  id: string;
  name: string;
  slug: string | null;       // ADD THIS
  price: number;
  // ... rest of fields
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/marketplace/HotProductsSection.tsx` | Add `slug` to interface and queries |
| `src/components/marketplace/NewArrivalsSection.tsx` | Add `slug` to interface and queries |
| `src/components/marketplace/TopRatedSection.tsx` | Add `slug` to interface and queries |
| `src/components/dashboard/AIAccountsSection.tsx` | Fix Quick View navigation, add `slug` to SellerProduct interface, update fetchSellerProducts |
| `src/hooks/useMarketplaceData.ts` | Add `slug` to ProductSummary interface |
| `supabase/functions/bff-marketplace-home/index.ts` | Include `slug` in product queries |

## Expected Result

After these changes:

| Action | Before | After |
|--------|--------|-------|
| Click product in Hot Products | Opens modal only | Opens modal, "View Full" goes to `/store/prozesy/product/netflix-cheap` |
| Click "View" in Quick View modal | `/dashboard/ai-accounts/product/{uuid}` | `/store/prozesy/product/netflix-cheap` |
| Share product from marketplace | Broken or internal URL | Clean SEO URL like `/store/prozesy/product/netflix-cheap` |

## Backward Compatibility

- Products without `slug` will fallback to legacy format (`name-slug-uuid-prefix`)
- AI accounts (Uptoza products) will continue using the internal dashboard route since they don't have a store
