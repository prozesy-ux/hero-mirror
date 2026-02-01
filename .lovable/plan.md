

# Dashboard Marketplace Redesign - Complete Black/White Premium Design

## Overview

Redesign the `/dashboard/marketplace` to match the public `/marketplace` premium design with:
1. Black/white base product card borders (no colored borders)
2. Left sidebar with modern Gumroad-style design - reordered sections
3. Remove "Browse by Category" section under search bar
4. Remove "Popular Tags" section from sidebar
5. Product view matching `/marketplace` full view design

## Current State vs Target State

| Element | Current State | Target State |
|---------|--------------|--------------|
| Product Card Border | Emerald-200 for sellers, no border for AI | `border-black/10` unified |
| Seller Badge | `bg-emerald-500` (green) | `bg-black` (black) |
| Price Badge | `bg-emerald-100 text-emerald-700` | `bg-black text-white` |
| Left Sidebar Design | Simple gray/plain | Modern white card with `border-black/10` |
| Sidebar Order | Price > Rating > Trending > Categories > Tags | Trending > Categories > Price > Rating (Tags removed) |
| CategoryBrowser | Shows under search bar | REMOVED entirely |
| Popular Tags | In sidebar | REMOVED entirely |

## What Will Be Done

### 1. Product Card Redesign (AIAccountsSection.tsx)

**AI Account Cards:**
```tsx
// Before
className="group bg-white rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer"

// After - Add black border
className="group w-full text-left bg-white rounded-xl overflow-hidden border border-black/10 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-black/20 hover:-translate-y-0.5 cursor-pointer"
```

**Seller Product Cards:**
```tsx
// Before
className="group bg-white rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-md hover:shadow-xl hover:border-emerald-300"

// After
className="group w-full text-left bg-white rounded-xl overflow-hidden border border-black/10 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-black/20 hover:-translate-y-0.5 cursor-pointer"
```

**Seller Badge:**
```tsx
// Before
<div className="... bg-emerald-500 text-white ...">

// After
<div className="... bg-black text-white ...">
```

**Price Badges:**
```tsx
// Before
<span className="... bg-emerald-100 text-emerald-700 ...">

// After
<span className="... bg-black text-white ...">
```

**Chat Button (Seller):**
```tsx
// Before
className="... bg-emerald-100 hover:bg-emerald-200 text-emerald-700 ..."

// After
className="... bg-black/5 hover:bg-black/10 text-black ..."
```

### 2. Remove CategoryBrowser Section (AIAccountsSection.tsx)

Remove the "Browse by Category" section that appears under the search bar (lines 1304-1308):

```tsx
// REMOVE THIS:
<CategoryBrowser
  onCategoryClick={(categoryId) => setCategoryFilter(categoryId)}
  selectedCategory={categoryFilter}
/>
```

Also remove the import at line 25:
```tsx
// REMOVE:
import { CategoryBrowser } from '@/components/marketplace/CategoryBrowser';
```

### 3. Left Sidebar Redesign (MarketplaceSidebar.tsx)

**New Modern Design with reordered sections:**

The sidebar will get:
- White background with `border-black/10` rounded border
- Collapsible sections with chevron icons
- Section order: Trending > Categories > Price > Rating
- Remove "Popular Tags" section entirely

**New Sidebar Structure:**
```text
┌──────────────────────────────┐
│  ┌────────────────────────┐  │  ← White card with border-black/10
│  │ 🔥 TRENDING NOW        │  │  ← First section
│  │    [Auto-scroll items] │  │
│  ├────────────────────────┤  │
│  │ 📂 CATEGORIES          │  │  ← Second section
│  │    All Products        │  │
│  │    Software            │  │
│  │    Courses             │  │
│  │    ...                 │  │
│  ├────────────────────────┤  │
│  │ 💰 PRICE               │  │  ← Third section
│  │    $ [Min] – [Max]     │  │
│  │    [Apply Button]      │  │
│  ├────────────────────────┤  │
│  │ ⭐ RATING              │  │  ← Fourth section
│  │    ★★★★★ & up        │  │
│  │    ★★★★☆ & up        │  │
│  │    ★★★☆☆ & up        │  │
│  └────────────────────────┘  │
│                              │
│  ✗ Popular Tags REMOVED     │
└──────────────────────────────┘
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/AIAccountsSection.tsx` | Update product card styles to black/white, remove CategoryBrowser import and usage |
| `src/components/dashboard/MarketplaceSidebar.tsx` | Redesign with modern card style, reorder sections (Trending > Categories > Price > Rating), remove Popular Tags |

## Visual Comparison

### Before Sidebar:
```text
Plain style, order:
1. Price Range
2. Rating  
3. Trending Now
4. Categories
5. Popular Tags ← Remove
```

### After Sidebar:
```text
Modern white card with border-black/10:
1. Trending Now ← First
2. Categories
3. Price Range
4. Rating
(Tags removed)
```

### Before Product Cards:
```text
┌─────────────────────────────────┐
│ [Image]                         │
│ ┌───────────────────────────────┤  ← Emerald-200 border
│ │ 🟢 Seller Badge (emerald)     │
│ │ Product Name                  │
│ │ 🟢 $Price (emerald badge)     │
│ │ [Chat-emerald] [View] [Buy]   │
└─────────────────────────────────┘
```

### After Product Cards:
```text
┌─────────────────────────────────┐
│ [Image]                         │
├─────────────────────────────────┤  ← Black/10 border
│ ⬛ Seller Badge (black)         │
│ Product Name                    │
│ ⬛ $Price (black badge)         │
│ [Chat-black] [View] [Buy]       │
└─────────────────────────────────┘
```

## Technical Implementation Details

### AIAccountsSection.tsx Changes

1. **Remove CategoryBrowser import** (line 25)
2. **Remove CategoryBrowser component** (lines 1304-1308)
3. **AI Account Cards** (around line 1384):
   - Add `border border-black/10 shadow-sm hover:shadow-lg hover:border-black/20`
4. **AI Account Price Badge** (around line 1428):
   - Change from `bg-emerald-100 text-emerald-700` to `bg-black text-white`
5. **Seller Product Cards** (around line 1486):
   - Change from `border-2 border-emerald-200` to `border border-black/10`
6. **Seller Badge** (around line 1494):
   - Change from `bg-emerald-500` to `bg-black`
7. **Seller Price Badge** (around line 1511):
   - Change from `bg-emerald-100 text-emerald-700` to `bg-black text-white`
8. **Seller Chat Button** (around line 1534):
   - Change from `bg-emerald-100 hover:bg-emerald-200 text-emerald-700` to `bg-black/5 hover:bg-black/10 text-black`

### MarketplaceSidebar.tsx Changes

1. **Redesign wrapper** (line 259):
   - Add `border border-black/10 rounded-xl p-4 bg-white` like GumroadFilterSidebar
2. **Reorder sections**:
   - Move Trending Now to first position
   - Categories second
   - Price Range third
   - Rating fourth
3. **Add collapsible behavior** with chevron icons (import Collapsible from radix-ui)
4. **Remove Popular Tags section** (delete lines 228-248)
5. **Remove `allTags` useMemo** (lines 100-106) since no longer needed

## Summary

- **Product cards**: Unified black/white border design with black badges
- **CategoryBrowser**: REMOVED from under search bar
- **Sidebar design**: Modern white card with `border-black/10`
- **Sidebar order**: Trending > Categories > Price > Rating
- **Popular Tags**: REMOVED from sidebar
- **Result**: Premium, high-contrast marketplace matching public `/marketplace` design

