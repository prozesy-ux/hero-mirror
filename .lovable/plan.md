

# Refactor /Marketplace to Match Gumroad Design Exactly

## Current State vs Gumroad Reference

Based on the screenshot from Gumroad's Discover page, there are significant design differences that need to be addressed:

### Header Differences

| Element | Current | Gumroad Reference |
|---------|---------|-------------------|
| Logo | Text "Uptoza" (text-xl font-bold) | Bold custom wordmark font (larger, ~26px) |
| Search bar | Rounded-lg with bg-white, border-2 | Rounded-full pill shape, subtle gray border |
| Search height | py-2.5 (~40px) | Taller input (~48px) |
| Login button | Plain text link | Outlined rounded button |
| Start selling | bg-black rounded-lg | bg-black rounded-full pill |
| Background | #F4F4F0 cream | Pure white header on cream page |

### Category Pills Row

| Element | Current | Gumroad Reference |
|---------|---------|-------------------|
| Active pill | bg-black text-white | Outlined black border pill (not filled) |
| Inactive pills | White with border | Plain text without border |
| Pill style | rounded-full solid | rounded-full with thin border |

### Featured Carousel (Big Difference)

| Element | Current | Gumroad Reference |
|---------|---------|-------------------|
| Card layout | Standard product cards | Large horizontal cards with image LEFT, content RIGHT |
| Card style | White rounded-xl small | Wide banner-style with image:content ratio ~40:60 |
| Rating display | Small inline | Pill badge with star icon and count |
| Price display | "Starting at $X" small | Bold "$X+ a month" or "$X" in bottom-left corner |

### Filter Sidebar

| Element | Current | Gumroad Reference |
|---------|---------|-------------------|
| Section headers | UPPERCASE bold, black border-b | Normal case, with chevron arrows |
| Accordion icons | ChevronDown only | Chevron that rotates when collapsed |
| Filter sections | Categories, Tags, Price, Rating | Filters, Tags, Contains, Price, Rating |
| Style | Heavy black borders | Light, minimal borders |

### Product Grid Cards

| Element | Current | Gumroad Reference |
|---------|---------|-------------------|
| Card border | border-2 border-black/5 | Very subtle or no visible border |
| Image aspect | 16:10 | Square-ish ~4:3 or 1:1 |
| Seller row | Below image with avatar | No seller row visible on grid cards |
| Rating | Stars with number | Not shown on grid cards |
| Price | "Starting at $X" | Just product name, no price on grid initially |
| Hover | shadow-lg, -translate-y-1 | Subtle hover state |

### Sort Tabs

| Element | Current | Gumroad Reference |
|---------|---------|-------------------|
| Style | Pill buttons with icons | Simple text links, active has outline |
| Position | Right of "Curated for you" | Right side, cleaner layout |
| Labels | Curated, Trending, Best Sellers, Hot & New | Trending, Best Sellers, Hot & New |

## Implementation Plan

### 1. Update GumroadHeader.tsx

**Changes:**
- Pure white background instead of cream (#FFFFFF)
- Logo: Bolder, larger font (text-2xl tracking-tight)
- Search bar: Rounded-full pill shape, taller (h-12), lighter border
- Login: Outlined rounded-full button style
- Start selling: Rounded-full pill button

```text
┌──────────────────────────────────────────────────────────────────┐
│ gumroad  │ [🔍 Search products...                   ] │ Log in │ Start selling │
└──────────────────────────────────────────────────────────────────┘
```

### 2. Update Category Pills in Marketplace.tsx

**Changes:**
- Active category: Outlined black border, NOT filled
- Inactive: Plain text without background/border
- Simpler styling to match reference

### 3. Create New FeaturedProductBanner.tsx

Gumroad's featured section uses large horizontal banner cards, not standard product cards. Each featured item shows:
- Large image on LEFT (~40% width)
- Content on RIGHT with title, description, seller avatar + name, price badge, rating badge

**New component layout:**
```text
┌──────────────────────────────────────────────────────────────────┐
│ [      IMAGE       ] │  Title of Product                        │
│ [                  ] │  Description text here...                │
│ [                  ] │  [Avatar] Seller Name                    │
│ [                  ] │  [$10+ a month]        [★ 4.9 (17.5K)]   │
└──────────────────────────────────────────────────────────────────┘
```

### 4. Update GumroadFilterSidebar.tsx

**Changes:**
- Remove heavy black borders
- Use lighter section dividers
- Change section headers to normal case (not UPPERCASE)
- Add "Filters" as first expandable section header
- Use cleaner chevron rotation on expand/collapse
- Adjust spacing to be more minimal

### 5. Update GumroadProductCard.tsx

**Changes:**
- Remove visible border (or make ultra-subtle)
- Remove seller avatar row
- Remove rating/review count
- Remove "sold" count
- Keep: Image, Title, Price only
- More minimal hover state
- Image aspect closer to square

### 6. Update Sort Tabs in Marketplace.tsx

**Changes:**
- Remove icons from sort buttons
- Use simple text links with outline for active state
- Remove "Curated" option (not in Gumroad)
- Just: Trending | Best Sellers | Hot & New

### 7. Typography & Spacing

**Font updates:**
- Use system font stack or add Mabry Pro-like font
- Bolder headings (font-bold or font-black)
- Larger section titles

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/marketplace/GumroadHeader.tsx` | White bg, pill search, outlined buttons |
| `src/pages/Marketplace.tsx` | Category pills, sort tabs, section layout |
| `src/components/marketplace/GumroadProductCard.tsx` | Minimal card, no seller/rating |
| `src/components/marketplace/GumroadFilterSidebar.tsx` | Lighter style, normal case headers |
| `src/components/marketplace/FeaturedCarousel.tsx` | Update to use banner-style cards |

## New Component

| File | Description |
|------|-------------|
| `src/components/marketplace/FeaturedBannerCard.tsx` | Large horizontal card for featured products |

## Visual Summary

### Before (Current)
- Cream header with small logo
- Standard product cards everywhere
- Heavy black filter borders
- Complex product cards with ratings

### After (Gumroad Style)
- White header bar, pill-shaped search
- Large horizontal banner cards for featured
- Minimal filter sidebar
- Simple product cards (image + title)
- Outlined category pills for active state

## Color Reference (Gumroad)
- Page background: `#F4F4F0` (cream) - Already correct
- Header: `#FFFFFF` (white)
- Cards: `#FFFFFF` (white)
- Primary text: `#000000` (black)
- Secondary text: `#6B6B6B` (gray)
- Borders: `rgba(0,0,0,0.1)` (very light)
- Active pill: Black outline on white
- Price badge: White with subtle border

