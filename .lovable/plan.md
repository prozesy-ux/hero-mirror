
# Fix SEO-Friendly Product URLs - Complete Implementation

## Problem Summary

The SEO-friendly product URLs were **planned but never implemented**. The `ProductFullView.tsx` page attempts to match the URL parameter as an exact UUID, which fails when:
1. An SEO-friendly slug is used (e.g., `netflix-premium-2375cd90`)
2. Legacy UUID links should still work but redirect to SEO format

Currently, **all products fail to load** when using name-based URLs because the lookup logic doesn't handle the hybrid format.

---

## Implementation Plan

### 1. Create URL Utility Functions

**New File:** `src/lib/url-utils.ts`

```typescript
// Generate SEO-friendly slug from product name
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove special chars
    .replace(/[\s_-]+/g, '-')     // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '')      // Trim hyphens from ends
    .slice(0, 50);                // Limit length
}

// Generate product URL path
export function generateProductUrl(
  storeSlug: string, 
  productName: string, 
  productId: string
): string {
  const nameSlug = slugify(productName);
  const idPrefix = productId.slice(0, 8);
  return `/store/${storeSlug}/product/${nameSlug}-${idPrefix}`;
}

// Generate full shareable URL
export function getProductShareUrl(
  storeSlug: string, 
  productName: string, 
  productId: string
): string {
  return `${window.location.origin}${generateProductUrl(storeSlug, productName, productId)}`;
}

// Extract ID prefix from SEO slug
export function extractIdFromSlug(urlSlug: string): string | null {
  const match = urlSlug.match(/-([a-f0-9]{8})$/i);
  return match ? match[1] : null;
}

// Check if param is a full UUID
export function isFullUUID(str: string): boolean {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(str);
}

// Normalize name for comparison
export function normalizeProductName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}
```

---

### 2. Update ProductFullView.tsx - Smart Lookup with Redirect

**File:** `src/pages/ProductFullView.tsx`

**Changes:**
- Import new URL utilities
- Implement tiered product lookup:
  1. **Full UUID match** (legacy links) → Load product, then redirect to SEO URL
  2. **ID prefix match** (SEO links) → Load product using `ILIKE '{prefix}%'`
  3. **Fallback name match** → Match by normalized product name within store

```typescript
// New lookup logic in fetchData():
const lookupProduct = async () => {
  // 1. Try exact UUID match (legacy URLs)
  if (isFullUUID(productId)) {
    const { data } = await supabase
      .from('seller_products')
      .select('*')
      .eq('id', productId)
      .eq('seller_id', sellerData.id)
      .single();
    
    if (data) {
      // Redirect legacy URL to SEO-friendly format
      const seoUrl = generateProductUrl(storeSlug, data.name, data.id);
      navigate(seoUrl, { replace: true });
      return data;
    }
  }
  
  // 2. Try ID prefix match (SEO URLs)
  const idPrefix = extractIdFromSlug(productId);
  if (idPrefix) {
    const { data } = await supabase
      .from('seller_products')
      .select('*')
      .eq('seller_id', sellerData.id)
      .ilike('id', `${idPrefix}%`)
      .maybeSingle();
    
    if (data) return data;
  }
  
  // 3. Fallback: Try matching by normalized name
  const nameFromSlug = productId.replace(/-[a-f0-9]{8}$/i, '').replace(/-/g, ' ');
  const { data: products } = await supabase
    .from('seller_products')
    .select('*')
    .eq('seller_id', sellerData.id)
    .eq('is_available', true);
  
  return products?.find(p => 
    normalizeProductName(p.name) === normalizeProductName(nameFromSlug)
  ) || null;
};
```

---

### 3. Update All Product Link Generators

**Files to update:**

| File | Line | Change |
|------|------|--------|
| `src/pages/Store.tsx` | ~1116 | Use `generateProductUrl()` for navigate |
| `src/pages/ProductFullView.tsx` | ~424 | Related products use SEO URLs |
| `src/components/seller/SellerProducts.tsx` | ~225 | Copy link uses `getProductShareUrl()` |
| `src/components/dashboard/BuyerWishlist.tsx` | ~183 | Wishlist links use SEO URLs |

**Example change in Store.tsx:**
```typescript
// Before
navigate(`/store/${storeSlug}/product/${selectedProduct.id}`);

// After  
import { generateProductUrl } from '@/lib/url-utils';
navigate(generateProductUrl(storeSlug, selectedProduct.name, selectedProduct.id));
```

---

### 4. Update Marketplace Sections (HotProducts, TopRated, NewArrivals)

These sections pass product data to click handlers - need to ensure store slug is available for proper URL generation.

**Files:** 
- `src/components/marketplace/HotProductsSection.tsx`
- `src/components/marketplace/TopRatedSection.tsx`
- `src/components/marketplace/NewArrivalsSection.tsx`

**Change:** 
- Include `storeSlug` in product data passed to `onProductClick`
- Or handle navigation internally with SEO URLs

---

## URL Format Examples

| Current (Broken) | New (SEO-Friendly) |
|------------------|---------------------|
| `/store/prozesy/product/2375cd90-0f14-4701-bc30-0815e21a7706` | `/store/prozesy/product/netflix-premium-2375cd90` |
| Legacy UUID still works | Auto-redirects to SEO format |

---

## Uniqueness Guarantee

- 8-character UUID prefix = 16^8 = 4.3 billion combinations
- Combined with store slug = globally unique
- No database changes required

---

## Files Summary

| Action | File |
|--------|------|
| **Create** | `src/lib/url-utils.ts` |
| **Major Update** | `src/pages/ProductFullView.tsx` (tiered lookup + redirect) |
| **Update** | `src/pages/Store.tsx` (SEO URLs for navigation) |
| **Update** | `src/components/seller/SellerProducts.tsx` (copy link function) |
| **Update** | `src/components/dashboard/BuyerWishlist.tsx` (wishlist links) |
| **Update** | `src/components/marketplace/HotProductsSection.tsx` |
| **Update** | `src/components/marketplace/TopRatedSection.tsx` |
| **Update** | `src/components/marketplace/NewArrivalsSection.tsx` |

---

## Testing Checklist

After implementation:
1. New SEO URLs load products correctly
2. Legacy UUID URLs redirect to SEO format
3. Related products use SEO URLs
4. Copy link generates SEO URL
5. Wishlist links use SEO URLs
6. Marketplace sections navigate correctly
7. Products with special characters work
8. No duplicate URL collisions
