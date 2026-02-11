

# Update Seller Dashboard Products Section with Card Customization

## Problem
The Seller Dashboard's product section (`SellerProducts.tsx`) still uses hardcoded HTML cards instead of the new `ProductCardRenderer`. Sellers cannot see how their card customizations (style, button text, colors) will look in their own dashboard.

## Changes

### File: `src/components/seller/SellerProducts.tsx`

**1. Import new components and types**
- Import `ProductCardRenderer` from `@/components/marketplace/ProductCardRenderer`
- Import `CardSettings` and `CardProduct` from `@/components/marketplace/card-types`
- Import `useSellerContext` card settings (already available via `profile`)

**2. Extract seller card settings from profile**
- Create a helper inside the component that reads `profile.card_style`, `profile.card_button_text`, `profile.card_button_color`, etc. and builds a `Partial<CardSettings>` object
- This mirrors the `extractCardSettings()` pattern already used in `Store.tsx`

**3. Replace product grid cards (lines 452-601)**
- Replace the hardcoded card HTML with `ProductCardRenderer`
- Map each product from the seller context to the `CardProduct` interface
- Pass the seller's card settings as `storeCardSettings`
- Keep the existing click handler (`setSelectedProduct`) and selection ring styling
- Wrap `ProductCardRenderer` in a container div that preserves the selection border and status badge overlay

**4. Replace the preview panel (lines 650-694)**
- In the "Selected Product Preview" section on the right sidebar, also render the product using `ProductCardRenderer`
- This gives sellers a larger preview of how their customized card looks
- Keep the Edit and Copy buttons below the card preview

**5. Product-to-CardProduct mapping**
- Map fields: `id`, `name`, `description`, `price`, `icon_url`, `category_id`, `tags`, `sold_count`, `chat_allowed`, `seller_id`
- Include `product_type` and `product_metadata` from the product data (already available from the BFF response)

### Result
After this change, sellers will see their actual customized card designs (style presets, button colors, text) directly in their product management grid and preview panel, matching exactly what buyers see on the store and marketplace.

