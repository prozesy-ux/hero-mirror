

# Add Hot Right Now & Top Rated Sections to Marketplace

## Overview

Redesign the **Hot Right Now** and **Top Rated** sections to match the exact reference design shown in the image. These sections will be added to the `/marketplace` page with the specific styling, horizontal scrolling cards, and badge layouts as displayed.

## Reference Design Analysis

Based on the provided image:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 🔥 Hot Right Now  [Trending]                                     View All >     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  →     │
│ │ [Hot]   │ │ [Hot]   │ │ [Hot]   │ │ [Hot]   │ │ [Hot]   │ │ [Hot]   │         │
│ │  Image  │ │  Image  │ │  Image  │ │  Image  │ │  Image  │ │  Image  │         │
│ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤         │
│ │Title... │ │Title... │ │Title... │ │Title... │ │Title... │ │Title... │         │
│ │Seller   │ │Seller   │ │Seller   │ │Seller   │ │Seller   │ │Seller   │         │
│ │$2.50★1  │ │$18★1sol │ │$100★0   │ │$10★0sol │ │$100★0   │ │$5★0sold │         │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ ★ Top Rated  [4.5+ stars]                                        View All >     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  →     │
│ │ [4.5★]  │ │ [4.5★]  │ │ [4.5★]  │ │ [4.5★]  │ │ [4.5★]  │ │ [4.5★]  │         │
│ │  Image  │ │  Image  │ │  Image  │ │  Image  │ │  Image  │ │  Image  │         │
│ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤         │
│ │Title... │ │Title... │ │Title... │ │Title... │ │Title... │ │Title... │         │
│ │Seller   │ │Seller   │ │Seller   │ │Seller   │ │Seller   │ │Seller   │         │
│ │$100 0rev│ │$150 0rev│ │$100 0rev│ │$1000 0  │ │$100 0rev│ │$10 0rev │         │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Design Specifications

### Container Style (Both Sections)
- Background: `bg-white`
- Border: `border border-black/10 rounded-xl`
- Padding: `p-4`
- Cards: Horizontal scroll with `overflow-x-auto`

### Header Elements

**Hot Right Now:**
- Icon: `Flame` (Lucide) - `text-orange-500`
- Title: "Hot Right Now" - `font-bold text-black`
- Badge: "Trending" - `bg-orange-500 text-white rounded-full`
- Link: "View All >" - `text-blue-500 hover:text-blue-600`

**Top Rated:**
- Icon: `Star` (Lucide) - `text-yellow-500 fill-yellow-500`
- Title: "Top Rated" - `font-bold text-black`
- Badge: "4.5+ stars" - `bg-yellow-100 text-yellow-700 rounded-full`
- Link: "View All >" - `text-blue-500 hover:text-blue-600`

### Product Card Style (within sections)
- Container: `bg-white border border-black/10 rounded-lg`
- Width: `w-[120px]` flexible for horizontal scroll
- Image: Square aspect ratio with badge overlay
- Badge position: Top-right corner

**Hot Card Badge:**
```typescript
className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
// Content: Flame icon + "Hot"
```

**Top Rated Card Badge:**
```typescript
className="absolute top-1.5 left-1.5 bg-white/90 border border-black/10 text-black text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
// Content: Star icon + rating (e.g., "4.5")
```

### Price Styling
- Color: `text-emerald-500` (green as shown in image)
- Font: `font-bold text-sm`

### Footer Row
- Left: Price in green
- Right: Star icon + count ("X sold" or "X reviews")
- Star color: `text-orange-400` (matching the warm theme)

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/marketplace/HotProductsSection.tsx` | Complete redesign matching reference |
| `src/components/marketplace/TopRatedSection.tsx` | Complete redesign matching reference |
| `src/pages/Marketplace.tsx` | Add both sections after Featured carousel |

## Technical Implementation

### 1. HotProductsSection.tsx Updates

**Container:**
```typescript
<div className="border border-black/10 rounded-xl p-4 bg-white">
```

**Header:**
```typescript
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-2">
    <Flame className="h-5 w-5 text-orange-500" />
    <h3 className="text-base font-bold text-black">Hot Right Now</h3>
    <span className="text-xs px-2 py-0.5 bg-orange-500 text-white rounded-full font-medium">
      Trending
    </span>
  </div>
  <Button variant="link" className="text-blue-500 hover:text-blue-600 text-sm">
    View All <ChevronRight className="h-4 w-4" />
  </Button>
</div>
```

**Cards:**
- Wider cards: `w-[130px]`
- Square image with Hot badge (top-left)
- Price in emerald green
- Star + "X sold" in muted color

### 2. TopRatedSection.tsx Updates

**Container:**
```typescript
<div className="border border-black/10 rounded-xl p-4 bg-white">
```

**Header:**
```typescript
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-2">
    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
    <h3 className="text-base font-bold text-black">Top Rated</h3>
    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
      4.5+ stars
    </span>
  </div>
  <Button variant="link" className="text-blue-500 hover:text-blue-600 text-sm">
    View All <ChevronRight className="h-4 w-4" />
  </Button>
</div>
```

**Cards:**
- Rating badge on top-left of image (white bg with star + rating)
- Price in emerald green
- "X reviews" in muted color

### 3. Marketplace.tsx Integration

Add sections after Featured carousel:

```typescript
{/* Featured Carousel */}
{featuredProducts.length > 0 && !searchQuery && selectedCategory === 'all' && (
  <FeaturedCarousel ... />
)}

{/* Hot Right Now Section */}
{!searchQuery && selectedCategory === 'all' && (
  <HotProductsSection 
    onProductClick={handleProductClick}
    className="mt-6"
  />
)}

{/* Top Rated Section */}
{!searchQuery && selectedCategory === 'all' && (
  <TopRatedSection 
    onProductClick={handleProductClick}
    className="mt-6"
  />
)}
```

## Card Design Detail

Each horizontal scroll card follows this structure:

```text
┌───────────────┐
│ [Badge]       │  ← Top-left badge (Hot or Rating)
│               │
│    Image      │  ← Square aspect ratio
│               │
├───────────────┤
│ Product Ti... │  ← Truncated title
│ Seller Name   │  ← Muted seller name
│ $XX.XX  ★ X   │  ← Green price + Star + count
└───────────────┘
```

## Summary

- Redesign `HotProductsSection` with white container, orange theme, flame icon, "Trending" badge
- Redesign `TopRatedSection` with white container, yellow theme, star icon, "4.5+ stars" badge
- Use horizontal scrolling card layout matching the reference
- Green prices (`text-emerald-500`)
- Blue "View All" links
- Card badges: Orange "Hot" for trending, white star+rating for top rated
- Add both sections to Marketplace page after Featured carousel

