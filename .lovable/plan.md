

## SEO-Friendly Product URL System

### Overview

Implement a robust URL system that creates human-readable product URLs from product names, while maintaining backward compatibility with existing UUID-based links.

### Current State

| Table | Slug Column | Status |
|-------|-------------|--------|
| ai_accounts | Yes | Working in Test, slugs populated |
| seller_products | No | Column does NOT exist in database |

### URL Format

**Target URL Structure:**
- Store products: `/store/{store-slug}/product/{product-name-slug}`
- Example: `/store/digital-shop/product/netflix-premium-account`

**Fallback behavior:**
- If slug exists in DB: Use database slug
- If slug not in DB: Generate client-side slug from name + append ID suffix for uniqueness
- Legacy UUID links: Auto-redirect to SEO URL

### Technical Implementation

#### 1. Enhanced Slug Utilities (`src/lib/slug-utils.ts`)

**New functions to add:**
- `generateClientSlug(name, id)`: Creates URL-safe slug with optional ID suffix for uniqueness
- `extractIdFromSlug(slug)`: Extracts UUID from end of slug if present
- `buildProductUrl(product, storeSlug)`: Centralized URL builder

```
Example transformations:
"Netflix Premium Account" + ID → "netflix-premium-account"
"ChatGPT 🔥 Pro Access!!" → "chatgpt-pro-access"
"😀😀😀" (no letters) → "product-{first-8-chars-of-id}"
```

#### 2. Product Full View Page Updates (`src/pages/ProductFullView.tsx`)

**Lookup Strategy (in order):**
1. Try exact ID match (if param looks like UUID)
2. Try slug match from database (if `slug` column exists)
3. Try client-generated slug match (normalize name and compare)

**Smart lookup logic:**
- Parse `productSlug` parameter
- If UUID format: Direct ID lookup
- If slug format: Try name-based matching with fuzzy comparison

#### 3. Store Page Product Links (`src/pages/Store.tsx`)

**URL generation for product cards:**
- Generate client-side slug from `product.name`
- Append first 8 chars of product ID for guaranteed uniqueness
- Format: `/store/{storeSlug}/product/{name-slug}-{id-prefix}`

Example: `/store/my-shop/product/netflix-premium-de12bf98`

#### 4. Related Components to Update

| Component | Change |
|-----------|--------|
| `StoreProductCard.tsx` | Use new URL builder for links |
| `StoreProductCardCompact.tsx` | Use new URL builder for links |
| `ProductDetailModal.tsx` | Add "Open Full Page" link with SEO URL |
| `BuyerWishlist.tsx` | Use new URL builder for wishlist items |
| `AIAccountsSection.tsx` | AI accounts use their DB slugs directly |

#### 5. Router Configuration (`src/App.tsx`)

Current route: `/store/:storeSlug/product/:productSlug`

No changes needed - the `:productSlug` param already accepts any string format.

### Lookup Flow Diagram

```text
User navigates to: /store/my-shop/product/netflix-premium-de12bf98
                            ↓
                   Parse productSlug parameter
                            ↓
              ┌─────────────┴─────────────┐
              │ Is it a full UUID?         │
              │ (matches UUID regex)       │
              └─────────────┬─────────────┘
                  ↓ No              ↓ Yes
         ┌───────┴───────┐    Direct ID lookup
         │ Extract ID    │    in seller_products
         │ from slug end │          ↓
         │ (last 8 chars)│    Return product
         └───────┬───────┘
                 ↓
         Try: id ILIKE '{extracted}%'
                 ↓
         Return matching product
```

### Backward Compatibility

Old links like `/store/my-shop/product/de12bf98-feec-4abe-bf21-dd1d0c0a1b8a` will continue to work because:
1. The UUID format is detected
2. Direct ID lookup is performed
3. No redirect needed - both formats work

### Future Database Migration

When `seller_products.slug` column is eventually added:
1. The same lookup logic will work
2. Can prioritize DB slug over client-generated slug
3. No code changes needed - already handles both cases

### Files to Modify

1. **`src/lib/slug-utils.ts`** - Add new utility functions
2. **`src/pages/ProductFullView.tsx`** - Implement smart lookup
3. **`src/pages/Store.tsx`** - Update product card links to use SEO URLs
4. **`src/components/store/StoreProductCard.tsx`** - Accept slug prop and use in links
5. **`src/components/store/StoreProductCardCompact.tsx`** - Same as above
6. **`src/components/dashboard/BuyerWishlist.tsx`** - Use new URL builder

### Benefits

- **SEO**: Clean, keyword-rich URLs improve search ranking
- **User Experience**: Readable URLs users can share and remember
- **No Database Dependency**: Works without `seller_products.slug` column
- **Backward Compatible**: Existing UUID links continue to work
- **Future-Proof**: Ready for when DB slug column is added

