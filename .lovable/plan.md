

# Marketplace Product Full View - Horizontal Split Design

## Overview

Redesign the marketplace product full view page to use a horizontal 70/30 split layout where the image gallery sits on the left (70%) and the price/purchase box sits on the right (30%), with medium-height images instead of full-height display.

## Current State vs Target State

| Element | Current Layout | Target Layout |
|---------|---------------|---------------|
| Image Position | Full width at top, 16:9 aspect ratio | Left side, 70% width |
| Purchase Box | Right column below image (40%) | Right side, 30% width, aligned with image |
| Layout Flow | Vertical (image → two columns) | Horizontal (image left + purchase right) |
| Image Height | Full 16:9 aspect ratio (tall) | Medium height, object-contain centered |
| Product Info | Left column 60% | Below the image/purchase split |

## Visual Layout Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER + CATEGORY PILLS                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────┐  ┌───────────────────────┐  │
│  │                                        │  │  PURCHASE BOX (30%)   │  │
│  │          IMAGE GALLERY                 │  │                       │  │
│  │            (70%)                       │  │  $Price (black badge) │  │
│  │                                        │  │                       │  │
│  │     ← prev     [●○○]     next →        │  │  [Add to cart]        │  │
│  │                                        │  │  [Chat with Seller]   │  │
│  │    Medium height, object-contain       │  │                       │  │
│  │                                        │  │  Sales count          │  │
│  │                                        │  │  Features             │  │
│  │                                        │  │  Wishlist             │  │
│  │                                        │  │  Share icons          │  │
│  └────────────────────────────────────────┘  └───────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  TITLE / PRICE / SELLER INFO (Title Box)                         │   │
│  │  Product Name                                                     │   │
│  │  Seller Avatar + Name + Verified Badge                           │   │
│  │  Rating Summary                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  DESCRIPTION (Full Width)                                         │   │
│  │  Description text + Tags                                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  RATINGS & REVIEWS (Full Width)                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### File to Modify
`src/components/marketplace/MarketplaceProductFullView.tsx`

### Key Changes

**1. Horizontal Split Container (70/30)**
```jsx
{/* 70/30 Image + Purchase Split */}
<div className="flex flex-col lg:flex-row gap-6 mb-6">
  {/* Image Gallery - 70% */}
  <div className="lg:w-[70%]">
    <div className="bg-white rounded-2xl overflow-hidden border border-black/20">
      {/* Medium height image - max-h-[500px] */}
      <div className="relative h-[400px] lg:h-[500px]">
        <img 
          src={...} 
          className="w-full h-full object-contain bg-gray-50"
        />
        {/* Navigation arrows */}
        {/* Dot indicators */}
      </div>
      {/* Thumbnail strip if multiple images */}
    </div>
  </div>

  {/* Purchase Box - 30% */}
  <div className="lg:w-[30%]">
    <div className="lg:sticky lg:top-20 bg-white rounded-2xl p-6 border border-black/20">
      {/* Price, buttons, features, share */}
    </div>
  </div>
</div>
```

**2. Remove AspectRatio for Controlled Height**

Current:
```jsx
<AspectRatio ratio={16 / 9}>
  <img ... />
</AspectRatio>
```

Updated:
```jsx
<div className="relative h-[400px] lg:h-[500px]">
  <img 
    className="w-full h-full object-contain bg-gray-50"
  />
</div>
```

**3. Move Product Info Section Below**

The title/seller/description sections become full-width containers below the 70/30 split:

```jsx
{/* Product Info - Full Width Below */}
<div className="space-y-6">
  {/* Title/Price/Seller Container */}
  <div className="bg-white rounded-2xl border border-black/20 p-6">
    <h1>Product Name</h1>
    {/* Seller info */}
    {/* Rating summary */}
  </div>

  {/* Description Container */}
  <div className="bg-white rounded-2xl border border-black/20 p-6">
    {/* Description + Tags */}
  </div>

  {/* Reviews Container */}
  <div className="bg-white rounded-2xl border border-black/20 p-6">
    {/* Reviews section */}
  </div>
</div>
```

**4. Mobile Responsive**

On mobile, the layout stacks vertically:
- Image gallery (full width)
- Purchase box (full width)
- Product info sections (full width)

### Complete Layout Structure

```jsx
<div className="mx-auto max-w-screen-xl px-4 lg:px-6 py-6">
  
  {/* TOP: 70/30 Split - Image + Purchase */}
  <div className="flex flex-col lg:flex-row gap-6 mb-6">
    
    {/* LEFT: Image Gallery (70%) */}
    <div className="lg:w-[70%]">
      <div className="bg-white rounded-2xl overflow-hidden border border-black/20">
        <div className="relative h-[350px] lg:h-[450px]">
          {/* Image with object-contain */}
          {/* Navigation arrows */}
          {/* Dot indicators */}
        </div>
        {/* Thumbnail strip */}
      </div>
    </div>

    {/* RIGHT: Purchase Box (30%) */}
    <div className="lg:w-[30%]">
      <div className="lg:sticky lg:top-20 bg-white rounded-2xl p-5 border border-black/20 h-fit">
        {/* Price badge */}
        {/* Add to cart button */}
        {/* Chat button */}
        {/* Sales count */}
        {/* Features */}
        {/* Wishlist */}
        {/* Share icons */}
      </div>
    </div>
  </div>

  {/* BELOW: Product Info Sections (Full Width) */}
  <div className="space-y-6">
    {/* Title/Seller/Rating Box */}
    <div className="bg-white rounded-2xl border border-black/20 p-6">
      ...
    </div>

    {/* Description Box */}
    <div className="bg-white rounded-2xl border border-black/20 p-6">
      ...
    </div>

    {/* Reviews Box */}
    <div className="bg-white rounded-2xl border border-black/20 p-6">
      ...
    </div>
  </div>
</div>
```

### Image Height Specifications

| Device | Image Container Height |
|--------|----------------------|
| Mobile | 350px |
| Desktop (lg+) | 450px |
| Max height | 500px (object-contain ensures image fits) |

### Technical Specifications

- Remove `AspectRatio` component wrapping the image
- Use fixed height with `object-contain` for proper sizing
- Image thumbnails remain below main image (if multiple images)
- Purchase box uses `sticky` positioning to stay visible while scrolling
- All monochrome styling (border-black/20) maintained
- Mobile layout stacks vertically with proper spacing

## Summary

This redesign creates a clean horizontal 70/30 split at the top with:
- **Left (70%)**: Medium-height image gallery with proper contain sizing
- **Right (30%)**: Sticky purchase box with price, buttons, and actions
- **Below**: Full-width product info sections (title, description, reviews)

The result matches enterprise patterns from Gumroad and similar platforms where the image and purchase action are side-by-side for quick scanning and conversion.

