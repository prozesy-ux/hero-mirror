
# SEO-Friendly Product URLs Implementation

## Overview

Replace random UUID-based product URLs with clean, SEO-friendly slugs based on product names.

**Current URLs:**
```
/store/prozesy/product/a1b2c3d4-e5f6-7890-abcd-ef1234567890
/dashboard/ai-accounts/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**New SEO URLs:**
```
/store/prozesy/product/premium-chatgpt-account
/dashboard/ai-accounts/premium-chatgpt-account
```

---

## Implementation Summary

### Database Changes
- Add `slug` column to `seller_products` table
- Add `slug` column to `ai_accounts` table
- Create unique indexes for slug uniqueness per seller/globally
- Auto-generate slugs for existing products

### Code Changes
- Add slug generation utility function
- Update product creation/editing to auto-generate slugs
- Update routing to use slugs instead of IDs
- Update all product links throughout the app
- Update BFF functions to query by slug

---

## Phase 1: Database Schema

**Migration: Add slug columns and generate for existing data**

```sql
-- Add slug column to seller_products
ALTER TABLE seller_products
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add slug column to ai_accounts
ALTER TABLE ai_accounts
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create slug generation function
CREATE OR REPLACE FUNCTION generate_product_slug(product_name TEXT, seller_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  -- Generate base slug from name
  base_slug := LOWER(TRIM(product_name));
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  -- Limit length to 80 characters
  base_slug := LEFT(base_slug, 80);
  
  final_slug := base_slug;
  
  -- Check for uniqueness (per seller for seller_products)
  LOOP
    IF seller_id IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM seller_products 
        WHERE slug = final_slug AND seller_products.seller_id = generate_product_slug.seller_id
      ) INTO slug_exists;
    ELSE
      SELECT EXISTS(
        SELECT 1 FROM ai_accounts WHERE slug = final_slug
      ) INTO slug_exists;
    END IF;
    
    EXIT WHEN NOT slug_exists;
    
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing seller products
UPDATE seller_products 
SET slug = generate_product_slug(name, seller_id)
WHERE slug IS NULL;

-- Generate slugs for existing AI accounts
UPDATE ai_accounts 
SET slug = generate_product_slug(name, NULL)
WHERE slug IS NULL;

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_products_seller_slug 
ON seller_products(seller_id, slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_accounts_slug 
ON ai_accounts(slug);

-- Make slug NOT NULL after populating
ALTER TABLE seller_products ALTER COLUMN slug SET NOT NULL;
ALTER TABLE ai_accounts ALTER COLUMN slug SET NOT NULL;

-- Create trigger for auto-generating slugs on insert
CREATE OR REPLACE FUNCTION auto_generate_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    IF TG_TABLE_NAME = 'seller_products' THEN
      NEW.slug := generate_product_slug(NEW.name, NEW.seller_id);
    ELSE
      NEW.slug := generate_product_slug(NEW.name, NULL);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_seller_products_auto_slug
BEFORE INSERT ON seller_products
FOR EACH ROW EXECUTE FUNCTION auto_generate_product_slug();

CREATE TRIGGER tr_ai_accounts_auto_slug
BEFORE INSERT ON ai_accounts
FOR EACH ROW EXECUTE FUNCTION auto_generate_product_slug();
```

---

## Phase 2: Utility Function

**File: `src/lib/slug-utils.ts`** (New)

```typescript
/**
 * Generate SEO-friendly slug from product name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')          // Replace spaces with dashes
    .replace(/-+/g, '-')           // Remove duplicate dashes
    .replace(/^-|-$/g, '')         // Trim dashes from ends
    .substring(0, 80);             // Limit length
}

/**
 * Generate unique slug by appending counter if needed
 */
export function generateUniqueSlug(
  name: string, 
  existingSlugs: string[]
): string {
  let slug = generateSlug(name);
  let counter = 0;
  let finalSlug = slug;
  
  while (existingSlugs.includes(finalSlug)) {
    counter++;
    finalSlug = `${slug}-${counter}`;
  }
  
  return finalSlug;
}
```

---

## Phase 3: Update Routing

**File: `src/App.tsx`**

```typescript
// Update routes to use slug instead of productId
<Route path="/store/:storeSlug/product/:productSlug" element={...} />
<Route path="/dashboard/ai-accounts/:accountSlug" element={...} />
```

---

## Phase 4: Update Page Components

### `src/pages/ProductFullView.tsx`

```typescript
// Change from productId to productSlug
const { storeSlug, productSlug } = useParams<{ storeSlug: string; productSlug: string }>();

// Update query to find by slug
const { data: productData } = await supabase
  .from('seller_products')
  .select('*')
  .eq('slug', productSlug)
  .eq('seller_id', sellerData.id)
  .single();
```

### `src/components/dashboard/AccountDetailPage.tsx`

```typescript
// Change from accountId to accountSlug
const { accountSlug } = useParams<{ accountSlug: string }>();

// Update query
const { data, error } = await supabase
  .from('ai_accounts')
  .select('*')
  .eq('slug', accountSlug)
  .maybeSingle();
```

---

## Phase 5: Update All Product Links

| File | Change |
|------|--------|
| `src/pages/Store.tsx` | Update all `/store/${slug}/product/${product.id}` to use `product.slug` |
| `src/components/store/StoreProductCard.tsx` | Update link generation |
| `src/components/dashboard/AIAccountsSection.tsx` | Update AI account links |
| `src/components/dashboard/BuyerWishlist.tsx` | Update wishlist product links |
| `src/components/seller/SellerProducts.tsx` | Update product link copying |
| `src/components/marketplace/GigCard.tsx` | Update product card links |
| Related product links in ProductFullView | Use slug for related products |

---

## Phase 6: Update BFF Functions

**File: `supabase/functions/bff-store-public/index.ts`**

```typescript
// Add slug to product select
.select('id, slug, name, description, price, icon_url, ...')
```

---

## Phase 7: Update Seller Product Creation

**File: `src/components/seller/SellerProducts.tsx`**

```typescript
// Slug auto-generates via database trigger, but optionally show it
const productData = {
  seller_id: profile.id,
  name: formData.name.trim(),
  // slug will be auto-generated by database trigger
  ...
};
```

---

## URL Structure Examples

| Product Name | Generated Slug | Full URL |
|-------------|----------------|----------|
| Premium ChatGPT Account | `premium-chatgpt-account` | `/store/prozesy/product/premium-chatgpt-account` |
| Midjourney Pro v5.2 | `midjourney-pro-v52` | `/store/prozesy/product/midjourney-pro-v52` |
| 🚀 Ultimate AI Bundle! | `ultimate-ai-bundle` | `/store/prozesy/product/ultimate-ai-bundle` |
| Same Product Name (duplicate) | `same-product-name-1` | Counter appended for uniqueness |

---

## SEO Benefits

1. **Readable URLs** - Users can understand product from URL
2. **Keyword-rich** - Product name keywords in URL
3. **Shareable** - Clean links for social sharing
4. **Memorable** - Easier to remember than UUIDs
5. **Better indexing** - Search engines prefer semantic URLs

---

## Files to Modify

| File | Action |
|------|--------|
| New Migration | Create slug columns, functions, triggers |
| `src/lib/slug-utils.ts` | Create slug generation utilities |
| `src/App.tsx` | Update route patterns |
| `src/pages/ProductFullView.tsx` | Query by slug, update params |
| `src/pages/Store.tsx` | Update product links |
| `src/components/dashboard/AccountDetailPage.tsx` | Query by slug |
| `src/components/dashboard/AIAccountsSection.tsx` | Update links |
| `src/components/seller/SellerProducts.tsx` | Update link copying |
| `src/components/dashboard/BuyerWishlist.tsx` | Update links |
| `supabase/functions/bff-store-public/index.ts` | Include slug in response |

---

## Backward Compatibility

For existing shared links with UUIDs, we can add a redirect in ProductFullView:
- If `productSlug` looks like a UUID, query by ID and redirect to slug URL
- This ensures old links still work during transition

```typescript
// In ProductFullView
const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (isUUID.test(productSlug)) {
  // Query by ID, then redirect to slug URL
  const product = await fetchByID(productSlug);
  if (product?.slug) {
    navigate(`/store/${storeSlug}/product/${product.slug}`, { replace: true });
  }
}
```
