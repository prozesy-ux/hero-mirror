

# Product Card Customization System + 14 Category-Specific Card Layouts

## Overview
Build a comprehensive product card customization system that allows sellers to:
1. Set store-wide card defaults (colors, button text, layout style)
2. Override per-product card settings in the product editor
3. Render 14 distinct category-specific card layouts across marketplace, store, and buyer library

---

## Database Changes

### New columns on `seller_profiles` table
Store-wide card defaults:
- `card_style` (text, default 'classic') -- layout style preset
- `card_button_text` (text, default 'Buy') -- CTA button text
- `card_button_color` (text, default '#10b981') -- CTA button background color
- `card_button_text_color` (text, default '#ffffff') -- CTA button text color
- `card_accent_color` (text, default '#000000') -- accent/price color
- `card_border_radius` (text, default 'rounded') -- 'sharp', 'rounded', 'pill'
- `card_show_rating` (boolean, default true)
- `card_show_seller_name` (boolean, default true)
- `card_show_badge` (boolean, default true)

No new columns needed on `seller_products` -- we will store per-product overrides in the existing `product_metadata` JSON field under a `card_overrides` key.

---

## Card Style Presets (10 Styles)

Sellers choose from 10 visual presets applied to their cards:

| # | Style Name | Description |
|---|-----------|-------------|
| 1 | Classic | Clean white card, subtle border, standard layout |
| 2 | Minimal | No border, flat, ultra-clean typography |
| 3 | Bold | Thick border, large price, strong contrast |
| 4 | Gumroad | Pink accent, rounded, Gumroad-inspired |
| 5 | Neon | Gradient border glow on hover, dark card |
| 6 | Glassmorphism | Frosted glass background, blur effect |
| 7 | Neo-Brutalist | Hard shadow, thick black border, offset |
| 8 | Elegant | Serif fonts, muted tones, luxury feel |
| 9 | Playful | Rounded, pastel colors, bouncy hover |
| 10 | Professional | Corporate, structured, grid-aligned |

---

## 14 Category-Specific Card Layouts

Each product type gets a specialized layout that highlights its unique attributes:

| # | Product Type | Layout Features |
|---|-------------|----------------|
| 1 | digital_product | Standard card with download icon, file type badge |
| 2 | course | 16:9 image ratio, lesson count, progress bar indicator, "Start Learning" CTA |
| 3 | ebook | 3D tilted book cover (CSS perspective), page count, "Read Now" CTA |
| 4 | membership | Recurring price badge, member count, "Join" CTA |
| 5 | bundle | Stacked multi-product preview thumbnails, item count, "Get Bundle" CTA |
| 6 | software | Version badge, platform icons (Win/Mac/Web), "Download" CTA |
| 7 | template | Live preview thumbnail, format badge (Figma/Canva), "Use Template" CTA |
| 8 | graphics | Color palette strip from image, resolution badge, "Download" CTA |
| 9 | audio | Waveform visualization bar, duration display, "Listen" CTA |
| 10 | video | Play button overlay, duration badge, "Watch" CTA |
| 11 | service | Availability indicator (green dot), response time, "Book Now" CTA |
| 12 | commission | Deposit amount (50%), delivery timeline, "Request" CTA |
| 13 | call | Calendar icon, duration badge (30/60min), "Schedule" CTA |
| 14 | coffee | Tip jar animation, suggested amounts, "Support" CTA |

---

## Technical Implementation

### New Files to Create

1. **`src/components/marketplace/ProductCardRenderer.tsx`**
   - Master component that receives product data + seller card settings
   - Switches between 14 specialized layouts based on `product_type`
   - Applies the seller's chosen style preset (1 of 10)
   - Applies per-product overrides from `product_metadata.card_overrides`
   - Used everywhere: Marketplace, Store, Buyer Library, Search Results

2. **`src/components/marketplace/card-layouts/`** (directory with 14 files)
   - `DigitalProductCard.tsx`
   - `CourseCard.tsx`
   - `EbookCard.tsx`
   - `MembershipCard.tsx`
   - `BundleCard.tsx`
   - `SoftwareCard.tsx`
   - `TemplateCard.tsx`
   - `GraphicsCard.tsx`
   - `AudioCard.tsx`
   - `VideoCard.tsx`
   - `ServiceCard.tsx`
   - `CommissionCard.tsx`
   - `CallCard.tsx`
   - `CoffeeCard.tsx`

3. **`src/components/marketplace/card-styles.ts`**
   - Exports the 10 style preset configurations (CSS classes, colors, borders, shadows)
   - Each style returns a set of Tailwind classes for container, title, price, button, etc.

4. **`src/components/seller/CardCustomizer.tsx`**
   - Full card customization UI panel used in Seller Settings (store-wide) and Product Editor (per-product)
   - Live preview of the card as settings change
   - Style preset picker (visual grid of 10 options)
   - Button text input, color pickers, toggle switches
   - Per-product mode shows "Use store default" toggle for each field

### Files to Modify

1. **`src/components/seller/SellerSettings.tsx`**
   - Add "Card Design" menu item under the Store section
   - Opens a Sheet with `CardCustomizer` in store-wide mode
   - Saves to `seller_profiles` card columns

2. **`src/pages/NewProduct.tsx`**
   - Add "Card Appearance" section in Step 2 (Details)
   - Embeds `CardCustomizer` in per-product mode
   - Saves overrides to `product_metadata.card_overrides`

3. **`src/pages/Store.tsx`**
   - Replace `StoreProductCard` with `ProductCardRenderer`
   - Pass seller's card settings from the profile data

4. **`src/pages/Marketplace.tsx`** and marketplace components
   - Replace `GumroadProductCard` with `ProductCardRenderer`
   - Load seller card settings alongside product data

5. **`src/components/dashboard/BuyerLibrary.tsx`**
   - Replace existing product cards with `ProductCardRenderer`

6. **`src/components/marketplace/GumroadProductCard.tsx`**
   - Keep as fallback / default layout for backward compatibility

7. **`src/components/store/StoreProductCard.tsx`**
   - Keep as fallback, but primary rendering shifts to `ProductCardRenderer`

### Data Flow

```text
seller_profiles.card_* (store defaults)
        |
        v
product_metadata.card_overrides (per-product, optional)
        |
        v
    mergeCardSettings() utility function
        |
        v
    ProductCardRenderer
        |
        +-- picks layout by product_type (14 layouts)
        +-- applies merged style preset (10 styles)
        +-- renders with custom button text/colors
```

### Card Settings Interface

```text
CardSettings {
  style: 'classic' | 'minimal' | 'bold' | 'gumroad' | 'neon' | 'glass' | 'brutalist' | 'elegant' | 'playful' | 'professional'
  buttonText: string          // "Buy", "Get it", "Download", etc.
  buttonColor: string         // hex color
  buttonTextColor: string     // hex color
  accentColor: string         // hex color for price
  borderRadius: 'sharp' | 'rounded' | 'pill'
  showRating: boolean
  showSellerName: boolean
  showBadge: boolean
}
```

---

## Implementation Order

1. Database migration: Add card columns to `seller_profiles`
2. Create `card-styles.ts` with 10 style presets
3. Create 14 category-specific card layout components
4. Create `ProductCardRenderer` master component
5. Create `CardCustomizer` UI component
6. Wire into Seller Settings (store-wide)
7. Wire into Product Editor (per-product overrides)
8. Replace cards in Store page
9. Replace cards in Marketplace page
10. Replace cards in Buyer Library
11. Test all 14 layouts with all 10 styles across all surfaces

