

# Dashboard Marketplace Redesign - Black/White Premium Design (Updated)

## Overview

Redesign the `/dashboard/marketplace` product display to match the public `/marketplace` design with:
1. Black/white base product card borders (no colored borders)
2. Left sidebar keeps: Price Range, Rating, Trending Now, AND Categories
3. Left sidebar removes: "Popular Tags" section only
4. Product view modal/page matching `/marketplace` full view design exactly

## Current State Analysis

| Element | Current State | Target State |
|---------|--------------|--------------|
| Product Card Border | Colored borders (emerald-200 for sellers, no border for AI) | Black/white border (`border-black/10`) |
| Seller Badge | `bg-emerald-500` (green) | `bg-black` (black) |
| Price Badge | `bg-emerald-100 text-emerald-700` | `bg-black text-white` |
| Left Sidebar | Price + Rating + Trending + Categories + Tags | Price + Rating + Trending + Categories (remove Tags only) |
| Product View | Already consistent | Verify matches /marketplace design |

## What Will Be Done

### 1. Product Card Redesign (AIAccountsSection.tsx)

**AI Account Cards (lines 1384-1475):**

Current:
```tsx
className="group bg-white rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer"
```

New:
```tsx
className="group w-full text-left bg-white rounded-xl overflow-hidden border border-black/10 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-black/20 hover:-translate-y-0.5 cursor-pointer"
```

**Seller Product Cards (lines 1486-1558):**

Current:
```tsx
className="group bg-white rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-md hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1"
```

New:
```tsx
className="group w-full text-left bg-white rounded-xl overflow-hidden border border-black/10 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-black/20 hover:-translate-y-0.5 cursor-pointer"
```

**Update Seller Badge:**

Current:
```tsx
<div className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
```

New:
```tsx
<div className="absolute top-3 left-3 px-2.5 py-1 bg-black text-white rounded-full text-xs font-medium flex items-center gap-1">
```

**Update Price Badges:**

Current:
```tsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-100 text-emerald-700">
```

New:
```tsx
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-sm font-semibold bg-black text-white">
```

### 2. Left Sidebar Update (MarketplaceSidebar.tsx)

**Remove only "Popular Tags" section (lines 228-248):**

```tsx
// REMOVE THIS SECTION
{allTags.length > 0 && (
  <div className="flex-shrink-0">
    <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wide mb-3">Popular Tags</h3>
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag) => (
        // ... tag buttons
      ))}
    </div>
  </div>
)}
```

**KEEP these sections:**
- Price Range filter (lines 129-139)
- Rating filter (lines 141-150)
- Trending Now section (lines 152-193)
- Categories section (lines 195-226)

### 3. Product View Consistency Check

`ProductFullViewPage.tsx` already uses the correct design:
- 70/30 horizontal split (line 406-476)
- Black price badge: `bg-black text-white text-xl font-bold rounded` (line 488)
- h-[350px] lg:h-[450px] image container (line 412)
- Trust badges section

No changes needed for product view.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/AIAccountsSection.tsx` | Update product card borders, seller badges, and price badges to black/white design |
| `src/components/dashboard/MarketplaceSidebar.tsx` | Remove "Popular Tags" section only, keep Categories |

## Visual Comparison

### Product Cards Before:
```text
┌─────────────────────────────────┐
│ [Image]                         │
│ ┌───────────────────────────────┤  ← Emerald/colored border
│ │ Seller Badge (emerald green)  │
│ │ Product Name                  │
│ │ $Price (emerald badge)        │
│ │ [Chat] [View] [Buy]           │
└─────────────────────────────────┘
```

### Product Cards After:
```text
┌─────────────────────────────────┐
│ [Image]                         │
├─────────────────────────────────┤  ← Black/10 border
│ Seller Badge (black)            │
│ Product Name                    │
│ $Price (black badge)            │
│ [Chat] [View] [Buy]             │
└─────────────────────────────────┘
```

### Sidebar Before:
```text
┌─────────────────┐
│ Price Range     │ KEEP
│ Rating          │ KEEP
│ Trending Now    │ KEEP
│ Categories      │ KEEP
│ Popular Tags    │ REMOVE
└─────────────────┘
```

### Sidebar After:
```text
┌─────────────────┐
│ Price Range     │
│ Rating          │
│ Trending Now    │
│ Categories      │
└─────────────────┘
```

## Technical Implementation Summary

### AIAccountsSection.tsx Changes:

1. **AI Account Cards** - Add black border:
   - Line 1384: Add `border border-black/10 shadow-sm hover:shadow-lg hover:border-black/20`

2. **Seller Product Cards** - Replace emerald with black:
   - Line 1486: Change from `border-2 border-emerald-200` to `border border-black/10`
   - Line 1494: Change seller badge from `bg-emerald-500` to `bg-black`
   - Line 1511: Change price badge from `bg-emerald-100 text-emerald-700` to `bg-black text-white`
   - Line 1534: Change chat button from `bg-emerald-100 hover:bg-emerald-200 text-emerald-700` to `bg-black/5 hover:bg-black/10 text-black`

3. **AI Account Price Badge** - Update to black:
   - Line 1428: Change from `bg-emerald-100 text-emerald-700` to `bg-black text-white`

### MarketplaceSidebar.tsx Changes:

1. Remove lines 228-248 (Popular Tags section)
2. Keep all other sections intact

## Summary

- **Product cards**: Unified black/white border design (`border-black/10`), black badges
- **Sidebar**: Categories KEPT, only Popular Tags removed
- **Product view**: Already consistent with /marketplace (no changes needed)
- **Result**: Premium, high-contrast marketplace matching public storefront

