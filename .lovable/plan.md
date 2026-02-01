

# Fix Hover Card to Always Center on Screen

## Overview

Update the hover card positioning so it always appears centered on screen regardless of where the product card is located. Currently, there's a conflict between Radix's relative positioning props (`side`, `align`) and the CSS fixed centering.

## Current Issue

The hover card has both:
1. Radix positioning: `side="bottom" align="center"` (relative to trigger)
2. CSS centering: `fixed-center` class with `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`

These conflict, causing inconsistent positioning.

## Solution

Remove the Radix relative positioning and rely purely on CSS fixed centering:

```text
Before (conflicting):
┌─────────┐
│ Product │
│  Card   │
└────┬────┘
     │ side="bottom" (tries to position below)
     ▼
     + fixed-center (tries to center on screen)
     = Inconsistent result

After (clean centering):
┌─────────────────────────────────────────┐
│              Screen Center              │
│         ┌──────────────────┐            │
│         │   Hover Card     │            │
│         │   Always Here    │            │
│         └──────────────────┘            │
│                                         │
│  ┌─────────┐                            │
│  │ Product │ (any position on page)     │
│  └─────────┘                            │
└─────────────────────────────────────────┘
```

## Technical Changes

### 1. Update hover-card.tsx

Improve the fixed-center handling to completely override Radix positioning:

```typescript
// When fixed-center is used, ignore side/align props
className={cn(
  "z-50 w-64 rounded-md border bg-popover p-4 ...",
  className?.includes('fixed-center') && 
    "!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !transform",
  className,
)}
```

### 2. Update ProductHoverCard.tsx

Remove conflicting `side` and `align` props when using fixed centering:

```typescript
<HoverCardContent 
  sideOffset={0}  // Remove side/align, only use sideOffset=0
  className="w-[700px] p-0 border border-black/10 shadow-2xl bg-white z-50 fixed-center"
>
```

### 3. Update StoreProductHoverCard.tsx

Apply the same fix for store product hover cards.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/hover-card.tsx` | Use `!important` modifiers for fixed-center override |
| `src/components/marketplace/ProductHoverCard.tsx` | Remove side/align props |
| `src/components/store/StoreProductHoverCard.tsx` | Remove side/align props |

## Summary

- Remove `side` and `align` props from HoverCardContent when using fixed centering
- Add `!important` CSS modifiers to ensure fixed positioning always wins
- Result: Hover card always appears in the exact center of the screen regardless of product location

