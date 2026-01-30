

# Clean SEO-Friendly Product URLs - Remove UUID Suffix

## Current Issue

Your product URLs look like this:
- `/store/prozesy/product/netflix-cheap-monthly-account-f3b87674`
- `/store/prozesy/product/cheap-amazon-prime-account-10-3-months-2375cd90`

The `f3b87674` at the end is the first 8 characters of the product UUID. You want clean URLs like Amazon:
- `/store/prozesy/product/netflix-cheap-monthly-account`
- `/store/prozesy/product/cheap-amazon-prime-account-10-3-months`

## Why The UUID Suffix Exists

The UUID suffix was added to guarantee uniqueness - if a seller has two products with similar names, the suffix prevents URL conflicts. However, since URLs are scoped to a store (`/store/prozesy/...`), we can use a unique slug per seller instead.

## Solution: Database-Stored Unique Slugs

### Overview

1. Add a `slug` column to the `seller_products` table
2. Auto-generate unique slugs when products are created/updated
3. Update URL generation to use the clean slug (no UUID)
4. Update product lookup to find by slug within a store

### Changes

#### 1. Database Migration

Add `slug` column to `seller_products` table with uniqueness per seller:

```sql
-- Add slug column
ALTER TABLE seller_products ADD COLUMN slug text;

-- Create unique index per seller
CREATE UNIQUE INDEX seller_products_seller_slug_unique 
ON seller_products(seller_id, slug) 
WHERE slug IS NOT NULL;

-- Backfill existing products with slugs
UPDATE seller_products 
SET slug = LOWER(TRIM(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(name, '[^\w\s-]', '', 'g'),
      '[\s_-]+', '-', 'g'
    ),
    '^-+|-+$', '', 'g'
  )
));

-- Handle duplicates by appending numbers
-- (Will be done via a function/trigger for new products)
```

#### 2. Database Trigger for Auto-Slug Generation

Create a function that generates unique slugs automatically:

```sql
CREATE OR REPLACE FUNCTION generate_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug from name
  base_slug := LOWER(TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(NEW.name, '[^\w\s-]', '', 'g'),
        '[\s_-]+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  ));
  
  -- Limit length
  base_slug := LEFT(base_slug, 50);
  final_slug := base_slug;
  
  -- Check for uniqueness within seller, append number if needed
  WHILE EXISTS (
    SELECT 1 FROM seller_products 
    WHERE seller_id = NEW.seller_id 
    AND slug = final_slug 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_product_slug
BEFORE INSERT OR UPDATE OF name ON seller_products
FOR EACH ROW EXECUTE FUNCTION generate_product_slug();
```

#### 3. Update URL Utilities (`src/lib/url-utils.ts`)

Simplify URL generation to use clean slugs:

```typescript
// NEW: Use pre-stored slug from database
export function generateProductUrl(
  storeSlug: string, 
  productSlug: string  // Now expects the clean slug, not product name
): string {
  return `/store/${storeSlug}/product/${productSlug}`;
}

// Keep backward compatibility for client-side slug generation
export function generateProductSlug(productName: string): string {
  return productName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// Legacy support: still extract ID if present
export function extractIdFromSlug(urlSlug: string): string | null {
  const match = urlSlug.match(/-([a-f0-9]{8})$/i);
  return match ? match[1] : null;
}
```

#### 4. Update Product Lookup (`src/pages/ProductFullView.tsx`)

Change the lookup strategy:

```typescript
// New lookup priority:
// 1. Exact slug match (new SEO URLs)
// 2. ID prefix match (legacy URLs with -xxxxxxxx)
// 3. Full UUID match (very old URLs)

const fetchData = async () => {
  // First get seller
  const { data: sellerData } = await supabase
    .from('seller_profiles')
    .select('*')
    .eq('store_slug', storeSlug)
    .single();

  // 1. Try exact slug match (new clean URLs)
  let { data: productData } = await supabase
    .from('seller_products')
    .select('*')
    .eq('seller_id', sellerData.id)
    .eq('slug', productId)  // productId is now the slug
    .maybeSingle();

  // 2. Try ID prefix match (legacy URLs with -xxxxxxxx)
  if (!productData) {
    const idPrefix = extractIdFromSlug(productId);
    if (idPrefix) {
      const { data } = await supabase
        .from('seller_products')
        .select('*')
        .eq('seller_id', sellerData.id)
        .ilike('id', `${idPrefix}%`)
        .maybeSingle();
      
      if (data) {
        // Redirect legacy URL to new clean URL
        navigate(`/store/${storeSlug}/product/${data.slug}`, { replace: true });
        productData = data;
      }
    }
  }

  // 3. Full UUID match
  if (!productData && isFullUUID(productId)) {
    // ... existing logic with redirect
  }
};
```

#### 5. Update Components Using Product URLs

Update all places that generate product URLs to use the stored slug:

- `src/pages/Store.tsx` - Product detail modal "View Full" link
- `src/pages/ProductFullView.tsx` - Related products links  
- `src/components/dashboard/BuyerWishlist.tsx` - Wishlist links
- `src/components/store/ProductDetailModal.tsx` - Share URLs
- `supabase/functions/bff-store-public/index.ts` - Include slug in response

#### 6. Update BFF Edge Function

Include slug in the products response:

```typescript
// bff-store-public/index.ts
const [productsResult, ...] = await Promise.all([
  supabase
    .from('seller_products')
    .select('id, name, slug, description, price, icon_url, ...')
    .eq('seller_id', seller.id)
    ...
]);
```

## Result

| Before | After |
|--------|-------|
| `/store/prozesy/product/netflix-cheap-monthly-account-f3b87674` | `/store/prozesy/product/netflix-cheap-monthly-account` |
| `/store/prozesy/product/cheap-amazon-prime-account-10-3-months-2375cd90` | `/store/prozesy/product/cheap-amazon-prime-account-10-3-months` |

## Backward Compatibility

- Old URLs with UUID suffix (`-f3b87674`) will automatically redirect to the new clean URL
- Full UUID URLs will also redirect
- No broken links for existing shared URLs

## Files to Modify

| File | Changes |
|------|---------|
| Database | Add `slug` column to `seller_products`, create trigger |
| `src/lib/url-utils.ts` | Update URL generation functions |
| `src/pages/ProductFullView.tsx` | Update lookup strategy |
| `src/pages/Store.tsx` | Use slug instead of generating URL |
| `src/components/dashboard/BuyerWishlist.tsx` | Use product slug |
| `supabase/functions/bff-store-public/index.ts` | Include slug in response |

