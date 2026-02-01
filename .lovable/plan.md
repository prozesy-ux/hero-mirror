
# Marketplace Design Enhancement

## Overview

Redesign the marketplace with a premium black-themed Featured section, an improved Hot/Trending section, enhanced product cards with store names and ratings, and a larger header logo for better branding visibility.

## What Will Be Done

### 1. Featured Products Section - Black Base Design (4 Products)

Transform the current Featured carousel into a premium black background section showing exactly 4 products:

```text
+------------------------------------------------------------------+
|  ████████████  FEATURED PRODUCTS (Black Background)  ████████████ |
|                                                                    |
|  +------------+  +------------+  +------------+  +------------+   |
|  |   Card 1   |  |   Card 2   |  |   Card 3   |  |   Card 4   |   |
|  |            |  |            |  |            |  |            |   |
|  +------------+  +------------+  +------------+  +------------+   |
|                                                                    |
+------------------------------------------------------------------+
```

**Design Specifications:**
- Black gradient background: `bg-gradient-to-br from-black via-gray-900 to-black`
- Rounded container with padding: `rounded-2xl p-6`
- White title text: "Featured Products" with a sparkle icon
- 4 products in a single row on desktop, 2x2 on tablet, 1 column on mobile
- Cards use white/light styling for contrast

### 2. Hot Trending Section - Styled Base Design

Update the HotProductsSection with an orange-accented gradient base:

```text
+------------------------------------------------------------------+
| 🔥 HOT TRENDING (Orange Gradient Background)                      |
|                                                                    |
|  +--------+  +--------+  +--------+  +--------+  [→ scroll]       |
|  | Card 1 |  | Card 2 |  | Card 3 |  | Card 4 |                   |
|  +--------+  +--------+  +--------+  +--------+                   |
|                                                                    |
+------------------------------------------------------------------+
```

**Design Specifications:**
- Orange gradient: `bg-gradient-to-br from-orange-50 via-amber-50 to-white`
- Border with orange tint: `border-orange-100`
- Keep flame icon and "Hot Right Now" label
- Show 4 products initially with horizontal scroll

### 3. Product Card Enhancements - GumroadProductCard

Upgrade the product cards with store name, larger size, and rating display:

```text
+------------------+
|   [Product Img]   |  <- Larger image area
|                   |
+-------------------+
| Product Title     |
| by StoreName      |  <- NEW: Store name row
|                   |
| $29  ★ 4.5 (125)  |  <- Price + Rating
+-------------------+
```

**Changes:**
- Increase card size (currently 5 columns → 4 columns on XL screens)
- Add store name below title: "by {sellerName}"
- Add rating display with star icon
- If no rating: Show "New" badge instead
- Grid: 4 products per row on desktop (currently 5)

### 4. Header Logo Size Increase

Increase the logo from `h-12` to `h-14` for better visibility:

```text
Current:  [Logo h-12] ──────── [Search Bar] ──────── [Buttons]
                                    
Proposed: [Logo h-14] ──────── [Search Bar] ──────── [Buttons]
```

**Changes in GumroadHeader.tsx:**
- Logo height: `h-12` → `h-14`
- Slight header height increase: `h-16` → `h-18`

## Files to be Modified

| File | Changes |
|------|---------|
| `src/components/marketplace/FeaturedCarousel.tsx` | Black background, 4-product grid layout |
| `src/components/marketplace/GumroadProductCard.tsx` | Add store name, rating display, larger size |
| `src/components/marketplace/GumroadHeader.tsx` | Increase logo size to h-14 |
| `src/components/marketplace/HotProductsSection.tsx` | Orange gradient background styling |
| `src/pages/Marketplace.tsx` | Change grid to 4 columns, pass rating data |

## Technical Details

### Featured Section Code Changes (FeaturedCarousel.tsx)

```tsx
// New wrapper with black background
<section className="py-8">
  <div className="bg-gradient-to-br from-black via-gray-900 to-black rounded-2xl p-6">
    <div className="flex items-center gap-2 mb-5">
      <Sparkles className="w-5 h-5 text-yellow-400" />
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
    
    {/* 4-column grid instead of carousel */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {products.slice(0, 4).map((product) => (
        <FeaturedBannerCard ... className="bg-white" />
      ))}
    </div>
  </div>
</section>
```

### Product Card Rating Logic (GumroadProductCard.tsx)

```tsx
// Rating display logic
{rating && rating > 0 ? (
  <div className="flex items-center gap-1">
    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
    <span className="text-sm font-medium">{rating.toFixed(1)}</span>
    {reviewCount && <span className="text-xs text-black/50">({reviewCount})</span>}
  </div>
) : (
  <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">New</span>
)}
```

### Grid Layout Change (Marketplace.tsx)

```tsx
// Change from 5 columns to 4 on XL screens
<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
```

## Visual Summary

- **Featured Section**: Premium black design with 4 featured products
- **Hot Trending**: Warm orange gradient, eye-catching section
- **Product Cards**: Larger, show store name + rating (or "New" badge)
- **Header Logo**: More prominent branding (h-14)
