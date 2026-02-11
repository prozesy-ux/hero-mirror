

# Fix: Marketplace Cards Not Updating with Card Customization

## Root Cause
The marketplace BFF endpoint (`bff-marketplace-home`) and frontend data pipeline are missing the fields needed for the card system to work:

1. **BFF doesn't fetch** `product_type`, `product_metadata`, or seller card settings (`card_style`, `card_button_color`, etc.)
2. **`ProductSummary` interface** in `useMarketplaceData.ts` lacks `product_type`, `product_metadata`, and seller card fields
3. **`Product` interface** in `Marketplace.tsx` lacks these same fields
4. **`ProductCardRenderer` call** (line 700) hardcodes `product_type: null`, so every product renders as the generic `DigitalProductCard` with default styling

## Changes

### 1. Backend: `supabase/functions/bff-marketplace-home/index.ts`
- Add `product_type, product_metadata` to the `seller_products` SELECT query
- Add seller card settings (`card_style, card_button_text, card_button_color, card_button_text_color, card_accent_color, card_border_radius, card_show_rating, card_show_seller_name, card_show_badge`) to the `seller_profiles` join
- Include these fields in the product mapping output so they reach the frontend

### 2. Data Hook: `src/hooks/useMarketplaceData.ts`
- Add to `ProductSummary` interface: `productType`, `productMetadata`, `sellerAvatar`, `sellerId`, and `sellerCardSettings` (an object with the card customization fields)

### 3. Frontend: `src/pages/Marketplace.tsx`
- Add matching fields to the `Product` interface: `productType`, `productMetadata`, `sellerId`, `sellerCardSettings`
- Update the `ProductCardRenderer` call to pass:
  - `product_type` from `product.productType` (instead of `null`)
  - `product_metadata` from `product.productMetadata`
  - `seller_id` from `product.sellerId`
  - `storeCardSettings` from `product.sellerCardSettings`

### 4. Discovery sections: `HotProductsSection.tsx` and `TopRatedSection.tsx`
- If these sections render their own cards, update them to pass the new fields through as well

## Technical Details

BFF seller_products query changes from:
```
id, name, slug, price, icon_url, ..., seller_profiles!inner(id, store_name, store_slug, is_verified)
```
to:
```
id, name, slug, price, icon_url, product_type, product_metadata, ...,
seller_profiles!inner(id, store_name, store_slug, is_verified, store_logo_url,
  card_style, card_button_text, card_button_color, card_button_text_color,
  card_accent_color, card_border_radius, card_show_rating, card_show_seller_name, card_show_badge)
```

Product mapping adds:
```
productType: p.product_type || null,
productMetadata: p.product_metadata || null,
sellerId: (p.seller_profiles)?.id || '',
sellerAvatar: (p.seller_profiles)?.store_logo_url || null,
sellerCardSettings: {
  style: (p.seller_profiles)?.card_style || 'classic',
  buttonText: (p.seller_profiles)?.card_button_text || 'Buy',
  ...etc
}
```

For AI accounts (which don't have seller customization), default card settings are used automatically.
