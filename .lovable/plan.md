

# Marketplace Full View - Black & White Design Redesign

## Overview

Complete redesign of the `/marketplace` full view section using a clean **black and white** color scheme. Remove all colored elements (green price badges, pink buttons) and replace with elegant monochrome styling.

## Current Issues

| Element | Current Style | Problem |
|---------|---------------|---------|
| Price badge | Green `bg-emerald-500` | User wants black/white |
| Add to cart button | Pink `bg-pink-400` | User wants black base |
| Verified badge | Pink `text-pink-500` | Needs black/white |
| Info icon | Blue `text-blue-500` | Needs black/gray |
| Rating stars | Yellow | Can keep subtle but optional |
| Overall borders | `border-black/10` | Needs more visible styling |

## New Black & White Design System

### Color Palette

| Element | New Style |
|---------|-----------|
| Page background | `#F4F4F0` (cream) - keep |
| Cards/Boxes | `#FFFFFF` with `border border-black/20` |
| Primary CTA (Add to cart) | `bg-black text-white` |
| Secondary buttons | `border-2 border-black bg-white text-black` |
| Price display | `bg-black text-white` or plain `text-black font-black text-3xl` |
| Section borders | `border border-black/20` - more visible |
| Icons | `text-black` or `text-black/60` |
| Verified badge | Black border pill |

### Design Elements to Update

#### 1. Price Badge - Black Style
**Current:**
```tsx
<div className="bg-emerald-500 text-white ...">
  ${product.price}
</div>
```

**New Black/White:**
```tsx
<div className="inline-flex items-center px-4 py-2 bg-black text-white text-xl font-bold rounded">
  ${product.price}
</div>
```

#### 2. Add to Cart Button - Black
**Current:**
```tsx
<Button className="bg-pink-400 hover:bg-pink-500 text-black ...">
```

**New Black/White:**
```tsx
<Button className="bg-black hover:bg-black/90 text-white font-semibold rounded-lg">
```

#### 3. Chat Button - Outlined Black
**Current:**
```tsx
<Button variant="outline" className="border-black/20 text-black ...">
```

**New Black/White:**
```tsx
<Button className="bg-white border-2 border-black text-black hover:bg-black hover:text-white">
```

#### 4. Verified Badge - Black
**Current:**
```tsx
<BadgeCheck className="text-pink-500" />
```

**New Black/White:**
```tsx
<BadgeCheck className="text-black" />
```
or
```tsx
<span className="px-2 py-0.5 border border-black rounded-full text-xs">Verified</span>
```

#### 5. All Card Borders - More Visible
**Current:**
```tsx
<div className="border border-black/10">
```

**New Black/White:**
```tsx
<div className="border border-black/20 rounded-2xl">
```

#### 6. Rating Stars - Keep Yellow or Black
Stars can remain yellow (subtle accent) or change to black fill with gray unfilled.

#### 7. Info Icon - Black/Gray
**Current:**
```tsx
<Info className="text-blue-500" />
```

**New Black/White:**
```tsx
<Info className="text-black/60" />
```

#### 8. Wishlist Heart - Black
**Current:**
```tsx
<Heart className={isWishlisted ? 'fill-pink-500 text-pink-500' : ''} />
```

**New Black/White:**
```tsx
<Heart className={isWishlisted ? 'fill-black text-black' : 'text-black/60'} />
```

#### 9. Verified Purchase Badge
**Current:**
```tsx
<span className="text-emerald-600 bg-emerald-50">Verified</span>
```

**New Black/White:**
```tsx
<span className="text-black bg-black/5 border border-black/20">Verified</span>
```

## Visual Reference (Black/White Design)

```text
┌──────────────────────────────────────────────────────────────────┐
│ [LOGO]  │ [Search products...] │ [Log in] │ [Start selling]      │
│         │ (rounded-full)       │ outlined │ bg-black             │
├──────────────────────────────────────────────────────────────────┤
│ All │ Drawing │ 3D │ Design │ Music │ ...  (text links)         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │   IMAGE CAROUSEL - border border-black/20 rounded-2xl     │  │
│  │   [○ ● ○] dots - bg-black / bg-black/30                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────┐   │
│  │ Product Title (text-3xl bold)   │  │ ┌─────────────────┐ │   │
│  │                                 │  │ │ $400            │ │   │
│  │ [$400] - bg-black text-white    │  │ │ (bg-black/white)│ │   │
│  │                                 │  │ └─────────────────┘ │   │
│  │ [avatar] Seller Name            │  │                     │   │
│  │ [Verified] - border-black       │  │ [Add to cart]       │   │
│  │ ★★★★★ 11 ratings               │  │ (bg-black/white)    │   │
│  │                                 │  │                     │   │
│  │ ┌───────────────────────────┐   │  │ [Chat with Seller]  │   │
│  │ │ Description box           │   │  │ (border-2 border-   │   │
│  │ │ border border-black/20   │   │  │  black, outlined)   │   │
│  │ └───────────────────────────┘   │  │                     │   │
│  │                                 │  │ (i) 181 sales       │   │
│  │ Tags: [tag1] [tag2]            │  │                     │   │
│  │ (bg-black/5 rounded-full)      │  │ ─────────────────   │   │
│  │                                 │  │ Features list...    │   │
│  │ ┌───────────────────────────┐   │  │                     │   │
│  │ │ RATINGS & REVIEWS        │   │  │ [♡ Add to wishlist] │   │
│  │ │ border border-black/20   │   │  │ [Share icons]       │   │
│  │ │ 5 stars ████████ 91%     │   │  │ (text-black/60)     │   │
│  │ │ ...                       │   │  └─────────────────────┘   │
│  │ └───────────────────────────┘   │                            │
│  └─────────────────────────────────┘                            │
└──────────────────────────────────────────────────────────────────┘
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/marketplace/MarketplaceProductFullView.tsx` | Complete restyling to black/white |

## Detailed Changes

### 1. Loading State
- Change from `text-black/50` to proper skeleton or black spinner

### 2. Image Carousel Box
- `border border-black/20 rounded-2xl` (more visible)
- Navigation arrows: `bg-white border border-black/20` on hover
- Dot indicators: `bg-black` active, `bg-black/30` inactive

### 3. Left Column - Product Info
- Title: `text-3xl font-bold text-black` (keep)
- Price: Change from green to `bg-black text-white px-4 py-2 rounded font-bold`
- Seller avatar: Keep gradient fallback OR change to `bg-black/10`
- Verified badge: `text-black` icon OR black border pill
- Description box: `border border-black/20 rounded-2xl`
- Tags: `bg-black/5 text-black/70 rounded-full`

### 4. Right Column - Purchase Box
- Container: `border border-black/20 rounded-2xl` (more visible)
- Price badge: `bg-black text-white` instead of green
- Add to cart: `bg-black hover:bg-black/90 text-white` instead of pink
- Chat button: `border-2 border-black bg-white text-black hover:bg-black hover:text-white`
- Sales count: `text-black/60` with gray info icon
- Wishlist heart: `text-black/60`, filled state `fill-black text-black`
- Share icons: `text-black/40 hover:text-black`

### 5. Ratings & Reviews Section
- Container: `border border-black/20 rounded-2xl`
- Stars: Can keep yellow OR change to black stars
- Rating bars: Keep yellow OR `bg-black` fill
- Review cards: `border-t border-black/10`
- Verified badge: `text-black bg-black/5 border border-black/20`

## Summary

Transform the full view from a colorful (green/pink) design to a clean, elegant **black and white** aesthetic:

1. **Price badge**: Green to Black
2. **CTA button**: Pink to Black  
3. **All borders**: More visible `border-black/20`
4. **Icons**: Blue/pink to Black/gray
5. **Verified badges**: Emerald to Black border
6. **Overall**: Professional monochrome look

