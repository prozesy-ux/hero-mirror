

# Phase 2: Wire Card Customization into Product Editor + Replace Cards Everywhere

## What We're Doing
Connecting all the card customization components created in Phase 1 to the actual product editor and all public-facing surfaces (Store, Marketplace, Buyer Library). After this, sellers will see their card customizations reflected live everywhere.

---

## Changes

### 1. NewProduct.tsx -- Add "Card Appearance" Section
- Import `CardCustomizer` and `CardSettings` types
- Add state for `cardOverrides` (type `Partial<CardSettings>`)
- Load existing overrides from `product_metadata.card_overrides` when editing
- Add a collapsible "Card Appearance" section after the Pricing Options in Step 2
- Save overrides into `product_metadata.card_overrides` in `buildProductData()`

### 2. Store.tsx -- Replace StoreProductCard with ProductCardRenderer
- Import `ProductCardRenderer` and `CardSettings`
- Extract card settings from `seller` profile data (`card_style`, `card_button_text`, etc.) into a `CardSettings` object
- Update the `SellerProfile` interface to include the card_* fields
- In the product grid, replace `StoreProductCard` with `ProductCardRenderer`, passing the seller's card settings and each product's data (mapped to `CardProduct` format)
- Keep `StoreProductCardCompact` for mobile as-is (or also replace if product data fits)
- Update the `StoreProductHoverCard` children to use `ProductCardRenderer`

### 3. Marketplace.tsx -- Replace GumroadProductCard with ProductCardRenderer
- Import `ProductCardRenderer`
- In the product grid (line ~687), replace `GumroadProductCard` with `ProductCardRenderer`
- Map the existing `Product` interface fields to `CardProduct` format
- Since marketplace products come from multiple sellers, pass empty/default card settings (each product can carry its own overrides via `product_metadata`)

### 4. BuyerLibrary.tsx -- Use ProductCardRenderer for library items
- Import `ProductCardRenderer`
- In the library grid, replace the current custom card with `ProductCardRenderer` for purchased items
- Map `ContentAccess.product` to `CardProduct` format
- Keep the action buttons (Download, Continue, Access) as overlays on top of the card

### 5. BFF Edge Function Update (bff-store-public)
- Update the store BFF to include `card_*` fields in the seller profile response so the Store page has access to customization data

---

## Data Mapping

Store.tsx `SellerProduct` to `CardProduct`:
- Direct mapping: `id`, `name`, `description`, `price`, `icon_url`, `category_id`, `tags`, `sold_count`, `chat_allowed`, `seller_id`
- Add `product_type` field (needs to be fetched -- update query to include it)

Marketplace.tsx `Product` to `CardProduct`:
- `iconUrl` maps to `icon_url`
- `sellerName` passed separately
- `soldCount` maps to `sold_count`

---

## Technical Details

### Card Settings Extraction Helper
A utility function to extract `CardSettings` from a seller profile:
```text
function extractCardSettings(seller): Partial<CardSettings> {
  return {
    style: seller.card_style || 'classic',
    buttonText: seller.card_button_text || 'Buy',
    buttonColor: seller.card_button_color || '#10b981',
    buttonTextColor: seller.card_button_text_color || '#ffffff',
    accentColor: seller.card_accent_color || '#000000',
    borderRadius: seller.card_border_radius || 'rounded',
    showRating: seller.card_show_rating ?? true,
    showSellerName: seller.card_show_seller_name ?? true,
    showBadge: seller.card_show_badge ?? true,
  }
}
```

### Product Data Mapping
For Store.tsx, the existing `SellerProduct` interface needs `product_type` and `product_metadata` added. The BFF or direct query already returns all columns from `seller_products`, so these fields should already be available.

### Files Modified
1. `src/pages/NewProduct.tsx` -- Add card overrides section
2. `src/pages/Store.tsx` -- Replace cards with ProductCardRenderer
3. `src/pages/Marketplace.tsx` -- Replace cards with ProductCardRenderer  
4. `src/components/dashboard/BuyerLibrary.tsx` -- Replace cards with ProductCardRenderer
5. `supabase/functions/bff-store-public/index.ts` -- Include card_* fields in response

