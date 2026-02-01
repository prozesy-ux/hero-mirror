

# Apply Gumroad Neo-Brutalist Card Design to Seller Products

## Overview

Update the Seller Products page to match Gumroad's neo-brutalist design system with bold black borders, offset shadows, and interactive hover effects. Also remove extra spacing and clean up the banner styling.

## Reference Design Analysis

From the Gumroad code provided:
- **Border**: `border-2 border-black` (solid black, not translucent)
- **Shadow**: `box-shadow: 4px 4px 0px 0px rgba(0,0,0,1)` (neo-brutalism offset)
- **Hover**: `hover:shadow-none hover:translate-x-1 hover:translate-y-1` (moves into shadow)
- **Background**: Page uses `bg-[#FBF8F3]` (warm cream color)

## Implementation

### Step 1: Add Neo-Brutalism CSS Utility

**File:** `src/index.css`

Add the shadow utility class:
```css
.shadow-neobrutalism {
  box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
}
```

### Step 2: Update Banner (Remove Extra Styling)

**File:** `src/components/seller/SellerProducts.tsx`

Current (lines 291-298):
```tsx
<div className="mb-8 border-2 border-dashed border-black/10 rounded-lg overflow-hidden bg-white p-4">
  <img src={gumroadBanner} ... />
</div>
```

New:
```tsx
<div className="mb-4">
  <img 
    src={gumroadBanner} 
    alt="Start creating and selling" 
    className="w-full h-auto object-contain rounded-xl shadow-lg"
  />
</div>
```

### Step 3: Update Stats Cards (Neo-Brutalist Style)

Current (lines 301-314):
```tsx
<div className="bg-white border-2 border-black/10 rounded-lg p-5">
```

New:
```tsx
<div className="bg-white border-2 border-black rounded-lg p-5 shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
```

### Step 4: Update Product Cards (Neo-Brutalist Style)

Current (lines 348-351):
```tsx
<div className="bg-white border-2 border-black/10 rounded-lg overflow-hidden group hover:border-black/20 transition-colors">
```

New:
```tsx
<div className="bg-white border-2 border-black rounded-lg overflow-hidden group shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
```

### Step 5: Update Search Input

Current (line 325):
```tsx
className="pl-11 bg-white border-2 border-black/10 rounded-lg h-12 focus:border-black transition-colors"
```

New:
```tsx
className="pl-11 bg-white border-2 border-black rounded-lg h-12 shadow-neobrutalism focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all"
```

### Step 6: Update Page Background

Current (line 290):
```tsx
<div className="p-6 lg:p-8 bg-white min-h-screen">
```

New:
```tsx
<div className="p-6 lg:p-8 bg-[#FBF8F3] min-h-screen">
```

## Visual Changes Summary

| Element | Before | After |
|---------|--------|-------|
| Page Background | `bg-white` | `bg-[#FBF8F3]` (cream) |
| Banner | Dashed border, padding | Clean with subtle shadow |
| Card Border | `border-black/10` (light) | `border-black` (solid) |
| Card Shadow | None | `4px 4px 0px black` |
| Card Hover | Border darkens | Translates into shadow |
| Spacing | `mb-8` on banner | `mb-4` (reduced) |

## Result

- Neo-brutalist Gumroad aesthetic with bold black borders
- Interactive hover effects (cards shift when hovered)
- Warm cream background matching Gumroad's design
- Clean banner without unnecessary container styling
- Reduced spacing between sections

