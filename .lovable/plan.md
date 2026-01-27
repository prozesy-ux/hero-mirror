
# Store Page Mobile Layout Fix

## Issues Identified

### 1. Search Bar & Filter Not in Same Row
The current layout has the filter button rendered separately from the search input, causing alignment issues.

### 2. Product Cards Not Filling Full Width
The `flex gap-6` layout used for desktop sidebar is causing large left-side spacing on mobile because:
- The sidebar still occupies space even when hidden on mobile
- The `gap-6` (24px) spacing is excessive for mobile
- The container padding `px-3` adds to the issue

### 3. Layout Structure Problem
```text
Current Layout (Mobile):
┌────────────────────────────────────────────┐
│  [px-3 padding]                            │
│    ┌──────────────────────────────────┐   │
│    │ flex gap-6                       │   │
│    │  ┌───────┐ ┌────────────────────┐│   │
│    │  │Sidebar│ │ Content (min-w-0)  ││   │
│    │  │(hidden│ │   [Search][Filter] ││   │ ← Gap still applies!
│    │  │on mob)│ │   [Grid cols-2]    ││   │
│    │  └───────┘ └────────────────────┘│   │
│    └──────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

---

## Solution

### Phase 1: Fix Main Container Layout for Mobile

**File: `src/pages/Store.tsx`**

Change the layout structure to:
- Remove the `gap-6` on mobile (keep for desktop)
- Ensure the main content area fills full width on mobile
- Move sidebar render logic to only desktop

```text
Fixed Layout (Mobile):
┌──────────────────────────────────┐
│ [px-3 padding - reduced to px-2] │
│ ┌──────────────────────────────┐ │
│ │ [Filter] [Search bar-----]   │ │  ← Single row
│ └──────────────────────────────┘ │
│ [Category chips horizontal]      │
│ ┌──────────────────────────────┐ │
│ │ [Card] [Card]                │ │  ← Full width grid
│ │ [Card] [Card]                │ │
│ │ [Card] [Card]                │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

### Phase 2: Single-Row Search & Filter Bar

Change the search/filter section structure:
- Put filter button BEFORE search input (consistent with other pages)
- Use `grid grid-cols-[auto_1fr]` for precise control
- Both elements in single row with minimal gap

### Phase 3: Full-Width Product Grid

**Files: `src/pages/Store.tsx` and `src/index.css`**

- Change container from `flex gap-6` to `lg:flex lg:gap-6`
- On mobile: no flex, full-width content
- Reduce horizontal padding from `px-3` to `px-2` on mobile
- Product grid uses `gap-2` (8px) on mobile for tighter spacing
- Cards expand to fill available width

### Phase 4: Compact Product Cards

**File: `src/components/store/StoreProductCardCompact.tsx`**

Ensure cards fill their grid cells:
- Use `w-full` on card container
- Remove any fixed widths
- Ensure image covers full card width

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Store.tsx` | Fix main layout container, search/filter row, padding |
| `src/components/store/StoreProductCardCompact.tsx` | Ensure full-width sizing |
| `src/index.css` | Update store grid CSS if needed |

---

## Technical Details

### Store.tsx Layout Changes

```typescript
// Current problematic structure (line 546-547):
<main className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-6">
  <div className="flex gap-6">  // ← This gap applies on mobile too!

// Fixed structure:
<main className="max-w-7xl mx-auto px-2 md:px-4 py-3 md:py-6">
  <div className="lg:flex lg:gap-6">  // ← Only flex on desktop
```

### Search & Filter Row Fix

```typescript
// Current (separate elements):
<div className="flex gap-2 mb-3 md:mb-6">
  <div className="lg:hidden flex-shrink-0">
    <StoreSidebar ... />  // Filter button inside
  </div>
  <div className="relative flex-1">
    <input ... />  // Search
  </div>
</div>

// Fixed (true single row):
<div className="grid grid-cols-[auto_1fr] gap-2 mb-3 md:mb-6 lg:block">
  <StoreSidebar ... />  // Filter button (mobile only)
  <div className="relative">
    <input ... />  // Search fills remaining width
  </div>
</div>
```

### Product Grid Fix

```typescript
// Current grid:
<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 lg:gap-5">

// This is correct, but the parent container limits it
// Fix by ensuring parent has no extra constraints on mobile
```

---

## Expected Result

After fix:
- Filter button + Search in single compact row
- 2-column product grid fills full mobile width
- No large empty space on left side
- Cards have minimal gap (8px) for space efficiency
- Smooth transition to desktop layout with sidebar
