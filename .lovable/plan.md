

# SEO-Friendly Product URLs Implementation

## Current State Analysis

### Current URL Format
```
/store/prozesy/product/2375cd90-0f14-4701-bc30-0815e21a7706
```
Uses raw UUID which is:
- Not SEO-friendly
- Hard to remember/share
- Poor user experience

### Target URL Format
```
/store/prozesy/product/netflix-premium-account
```
Uses slugified product name which is:
- SEO optimized
- Readable and shareable
- Professional appearance

### Files Currently Using Product URLs
| File | Usage |
|------|-------|
| `src/App.tsx` | Route definition `:productId` |
| `src/pages/ProductFullView.tsx` | Product page + related product links |
| `src/pages/Store.tsx` | Navigate to full view |
| `src/components/dashboard/BuyerWishlist.tsx` | Wishlist product links |
| `src/components/seller/SellerProducts.tsx` | Copy product link function |
| `src/components/dashboard/AIAccountsSection.tsx` | Dashboard product navigation |

---

## Implementation Strategy

### Hybrid URL System (Best Practice)
Use a **hybrid approach** that combines product name slug with a unique identifier suffix to:
1. Ensure URLs are always unique (no duplicates)
2. Support existing products without database migration
3. Enable SEO-friendly URLs immediately
4. Handle products with same names from different sellers

**Format:** `/store/{store-slug}/product/{product-slug}-{id-prefix}`

Example:
```
/store/prozesy/product/netflix-premium-account-2375cd90
```

---

## Technical Implementation

### 1. Create URL Utility Functions (`src/lib/url-utils.ts`)

```typescript
// Generate SEO-friendly slug from product name
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove special chars
    .replace(/[\s_-]+/g, '-')     // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '')      // Trim hyphens from ends
    .slice(0, 60);                // Limit length
}

// Generate product URL with name + ID prefix for uniqueness
export function generateProductUrl(
  storeSlug: string, 
  productName: string, 
  productId: string
): string {
  const nameSlug = slugify(productName);
  const idPrefix = productId.slice(0, 8); // First 8 chars of UUID
  return `/store/${storeSlug}/product/${nameSlug}-${idPrefix}`;
}

// Extract ID prefix from URL slug for lookup
export function extractIdFromSlug(urlSlug: string): string | null {
  // Match last segment after final hyphen (8 char hex)
  const match = urlSlug.match(/-([a-f0-9]{8})$/i);
  return match ? match[1] : null;
}

// Generate full URL for sharing
export function getProductShareUrl(
  storeSlug: string, 
  productName: string, 
  productId: string
): string {
  const path = generateProductUrl(storeSlug, productName, productId);
  return `${window.location.origin}${path}`;
}
```

### 2. Update ProductFullView.tsx - Smart Lookup

The product page needs a **tiered lookup strategy**:

```typescript
// Parse the slug to find the product
const lookupProduct = async () => {
  // 1. Try exact UUID match (legacy URLs)
  if (/^[a-f0-9-]{36}$/i.test(productId)) {
    return await supabase
      .from('seller_products')
      .select('*')
      .eq('id', productId)
      .single();
  }
  
  // 2. Extract ID prefix from SEO slug
  const idPrefix = extractIdFromSlug(productId);
  if (idPrefix) {
    const { data } = await supabase
      .from('seller_products')
      .select('*')
      .eq('seller_id', seller.id)
      .ilike('id', `${idPrefix}%`)
      .single();
    return data;
  }
  
  // 3. Fallback: Try matching by name slug
  const nameSlug = productId.replace(/-[a-f0-9]{8}$/i, '');
  // Match products whose slugified name matches
  return null; // Not found
};
```

### 3. Update All Product Link Generators

**Files to update:**

| File | Change |
|------|--------|
| `src/pages/Store.tsx` | Use `generateProductUrl()` for navigate |
| `src/pages/ProductFullView.tsx` | Related products use new URL format |
| `src/components/dashboard/BuyerWishlist.tsx` | Use `generateProductUrl()` |
| `src/components/seller/SellerProducts.tsx` | Use `getProductShareUrl()` |
| `src/components/store/ProductDetailModal.tsx` | Pass URL helper for "Full View" |

### 4. Legacy URL Support (Redirect)

In `ProductFullView.tsx`, if a legacy UUID-only URL is detected:
```typescript
// Redirect legacy URLs to SEO-friendly format
if (/^[a-f0-9-]{36}$/i.test(productId) && product) {
  const seoUrl = generateProductUrl(storeSlug, product.name, product.id);
  navigate(seoUrl, { replace: true });
  return;
}
```

---

## Database Considerations

**No migration needed!** The hybrid approach uses:
- Product ID prefix (already exists)
- Product name (already exists)
- Client-side slug generation

Optional future enhancement: Add `slug` column to `seller_products` table for pre-computed slugs (similar to `ai_accounts` which already has a `slug` column).

---

## URL Uniqueness Guarantee

The 8-character UUID prefix provides:
- 16^8 = 4.3 billion unique combinations
- Within a single store, collision is virtually impossible
- Combined with store slug, globally unique

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/lib/url-utils.ts` | Slug generation utilities |
| Modify | `src/pages/ProductFullView.tsx` | Smart product lookup + redirect |
| Modify | `src/pages/Store.tsx` | Use SEO URLs for navigation |
| Modify | `src/components/dashboard/BuyerWishlist.tsx` | Use SEO URLs in links |
| Modify | `src/components/seller/SellerProducts.tsx` | Use SEO URLs for copy |
| Modify | `src/components/marketplace/HotProductsSection.tsx` | Use SEO URLs if needed |
| Modify | `src/components/marketplace/NewArrivalsSection.tsx` | Use SEO URLs if needed |

---

## Example URL Transformations

| Current (UUID) | New (SEO-Friendly) |
|----------------|---------------------|
| `/store/prozesy/product/2375cd90-0f14-4701-bc30-0815e21a7706` | `/store/prozesy/product/netflix-premium-2375cd90` |
| `/store/techshop/product/abc12345-1234-5678-9abc-def012345678` | `/store/techshop/product/chatgpt-plus-account-abc12345` |

---

## Testing Checklist

After implementation, verify:
1. New SEO URLs work for all products
2. Legacy UUID URLs redirect to SEO format
3. Related products use SEO URLs
4. Copy link function generates SEO URLs
5. Wishlist links use SEO URLs
6. No duplicate URLs created
7. Products with special characters in names handled correctly
8. Shared links work correctly

---

## Summary

This implementation provides:
- Immediate SEO-friendly URLs without database changes
- Backward compatibility with existing UUID links
- Automatic redirect to canonical SEO URLs
- No duplicate URL issues (ID prefix ensures uniqueness)
- Professional, shareable URLs

