

# Increase HoverCard Size and Center Position

## Overview

Increase the HoverCard preview to match the QuickView modal dimensions and position it centered on screen rather than relative to the product card.

## Current vs New Dimensions

| Element | Current HoverCard | New HoverCard (= QuickView) |
|---------|-------------------|------------------------------|
| Container width | `w-[500px]` | `w-[700px]` |
| Image height | `h-[220px]` | `h-[350px]` |
| Layout split | 60/40 | 65/35 |
| Position | `side="right"` (relative) | Centered on screen |

## Visual Comparison

**Current (small, positioned to side):**
```text
┌─────────┐
│ Product │──────► ┌──────────────────┐
│  Card   │        │ Small HoverCard  │
└─────────┘        │  w-[500px]       │
                   │  h-[220px] img   │
                   └──────────────────┘
```

**New (larger, centered like modal):**
```text
                   ┌────────────────────────────────────┐
                   │         Centered HoverCard         │
                   │           w-[700px]                │
┌─────────┐        │                                    │
│ Product │        │  ┌────────────┐  ┌────────────┐   │
│  Card   │        │  │   Image    │  │  Purchase  │   │
└─────────┘        │  │  h-[350px] │  │    Box     │   │
                   │  │    65%     │  │    35%     │   │
                   │  └────────────┘  └────────────┘   │
                   │                                    │
                   └────────────────────────────────────┘
```

## Technical Implementation

### 1. ProductHoverCard.tsx

**Update HoverCardContent styling:**

```typescript
<HoverCardContent 
  side="bottom"
  align="center"
  sideOffset={16}
  className="w-[700px] p-0 border border-black/10 shadow-2xl bg-white z-50 fixed-center"
>
```

**Update internal dimensions:**
- Change container padding: `p-3` to `p-4`
- Change image height: `h-[220px]` to `h-[350px]`
- Change layout split: `w-[60%]` to `w-[65%]` and `w-[40%]` to `w-[35%]`
- Increase thumbnail size: `w-10 h-10` to `w-14 h-14`
- Increase icon sizes and typography to match QuickView

### 2. StoreProductHoverCard.tsx

Apply identical changes:
- Width: `w-[500px]` to `w-[700px]`
- Image: `h-[220px]` to `h-[350px]`
- Layout: 60/40 to 65/35 split
- Position: Center with `side="bottom" align="center"`

### 3. Update hover-card.tsx (UI component)

Add centering capability with custom positioning:

```typescript
// Add option for centered positioning
className={cn(
  "z-50 w-64 rounded-md border bg-popover p-4 ...",
  // When centered, use fixed positioning
  className?.includes('fixed-center') && 
    "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
  className,
)}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/marketplace/ProductHoverCard.tsx` | Increase width to 700px, image to 350px, center position, 65/35 split |
| `src/components/store/StoreProductHoverCard.tsx` | Same changes as above |
| `src/components/ui/hover-card.tsx` | Add centered positioning support |

## Summary

- Increase HoverCard width from 500px to 700px
- Increase image container from 220px to 350px height
- Change layout split from 60/40 to 65/35
- Center the HoverCard on screen instead of positioning relative to card
- Match QuickView modal design exactly

