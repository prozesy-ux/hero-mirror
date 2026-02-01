

# Marketplace Sections Unified Design System

## Overview

Redesign all marketplace sections (Featured, Trending, New Arrivals, Top Rated) with a consistent enterprise-grade design that matches the clean header aesthetic. Remove emojis, standardize layouts, and use premium icon styling.

## Current Issues

| Section | Current Design | Problem |
|---------|---------------|---------|
| Featured | Black gradient + Sparkles | Different from other sections |
| Hot Products | Orange gradient + 🔥 emoji | Inconsistent color, uses emoji |
| New Arrivals | White + green + 🆕 emoji | Uses emoji, green accent |
| Top Rated | White + yellow + ⭐ emoji | Uses emoji, yellow accent |

## New Unified Design

All sections will follow this pattern:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  ● Section Title                               [View All →]              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │          │  │          │  │          │  │          │  │          │  │
│  │  Product │  │  Product │  │  Product │  │  Product │  │  Product │  │
│  │   Card   │  │   Card   │  │   Card   │  │   Card   │  │   Card   │  │
│  │          │  │          │  │          │  │          │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Design Specifications

### Container Style (All Sections)
- Background: `bg-white`
- Border: `border border-black/10 rounded-2xl`
- Padding: `p-6`
- Consistent shadow on hover for cards

### Header Style (All Sections)
- Icon + Title left-aligned
- "View All" button right-aligned
- No colored badges or emoji tags
- Clean monochrome aesthetic

### Section Variants

| Section | Icon | Icon Style |
|---------|------|------------|
| Featured | `Gem` | Black filled |
| Trending | `TrendingUp` | Black stroke |
| New Arrivals | `Zap` | Black stroke |
| Top Rated | `Award` | Black stroke |

### Product Cards (Unified)
- White background
- `border border-black/10`
- `aspect-[4/3]` image ratio
- No emoji badges - use clean text badges
- Consistent price/seller styling

## Files to Modify

| File | Changes |
|------|---------|
| `FeaturedCarousel.tsx` | White container, Gem icon, remove black gradient |
| `HotProductsSection.tsx` | TrendingUp icon, remove orange, remove 🔥 emoji |
| `NewArrivalsSection.tsx` | Zap icon, remove green, remove 🆕 emoji |
| `TopRatedSection.tsx` | Award icon, remove yellow, remove ⭐ emoji |

## Detailed Changes

### 1. FeaturedCarousel.tsx

**Before:**
```typescript
<div className="bg-gradient-to-br from-black via-gray-900 to-black rounded-2xl p-6">
  <Sparkles className="w-5 h-5 text-yellow-400" />
```

**After:**
```typescript
<div className="bg-white border border-black/10 rounded-2xl p-6">
  <Gem className="w-5 h-5 text-black" />
```

- Remove black gradient
- Use `Gem` icon for premium feel
- Keep 4-column grid layout
- Product cards stay white

### 2. HotProductsSection.tsx

**Before:**
```typescript
<div className="border border-orange-200 rounded-xl p-4 bg-gradient-to-br from-orange-50 via-amber-50 to-white">
  <Flame className="h-5 w-5 text-orange-500" />
  <Badge>🔥 Hot</Badge>
```

**After:**
```typescript
<div className="bg-white border border-black/10 rounded-2xl p-6">
  <TrendingUp className="h-5 w-5 text-black" />
  <Badge className="bg-black text-white">Trending</Badge>
```

- Remove orange gradient
- Use `TrendingUp` icon
- Replace emoji badge with text badge
- Match container styling

### 3. NewArrivalsSection.tsx

**Before:**
```typescript
<div className="border border-black/10 rounded-xl p-4 bg-white">
  <Sparkles className="h-4 w-4 text-green-500" />
  <Badge>🆕 New</Badge>
```

**After:**
```typescript
<div className="bg-white border border-black/10 rounded-2xl p-6">
  <Zap className="h-5 w-5 text-black" />
  <Badge className="bg-black text-white">New</Badge>
```

- Increase padding from p-4 to p-6
- Use `Zap` icon (enterprise feel)
- Replace emoji badge with text badge

### 4. TopRatedSection.tsx

**Before:**
```typescript
<div className="border border-black/10 rounded-xl p-4 bg-white">
  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
  <Badge>⭐ 4.5</Badge>
```

**After:**
```typescript
<div className="bg-white border border-black/10 rounded-2xl p-6">
  <Award className="h-5 w-5 text-black" />
  <Badge className="bg-black text-white">★ 4.5+</Badge>
```

- Use `Award` icon for premium feel
- Replace emoji with star character (★)
- Clean black badge styling

## Icon Selection Rationale

| Icon | Meaning | Why Enterprise |
|------|---------|----------------|
| `Gem` | Featured/Premium | Suggests exclusive, curated content |
| `TrendingUp` | Trending/Hot | Business-grade growth indicator |
| `Zap` | New/Fresh | Energy, speed - commonly used in SaaS |
| `Award` | Top Rated | Achievement, quality assurance |

## Badge Styling (Unified)

All section badges use clean monochrome:
```typescript
className="bg-black text-white text-xs px-2 py-0.5 rounded-full font-medium"
```

Product card badges:
```typescript
className="absolute top-2 right-2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full"
```

## Summary

- Unify all section containers to white + black border
- Replace colored/emoji icons with premium Lucide icons (Gem, TrendingUp, Zap, Award)
- Remove all emoji badges (🔥 🆕 ⭐) - use clean text badges
- Consistent padding (p-6) and border radius (rounded-2xl)
- Match the clean, enterprise header aesthetic throughout

