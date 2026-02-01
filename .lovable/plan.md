

# Update Banner Image & Move to Very Top

## Overview

Replace the current banner with the new 4-panel panda comic strip illustration and move it to display FIRST, before the stats row and search bar - making it the very first element users see.

## Current Layout Order

1. Stats Row (Products, Live, Revenue)
2. Header (Search + New Product button)
3. Banner Image ← Currently here
4. Product Cards Grid

## New Layout Order

1. **Banner Image** ← Move to TOP (first element)
2. Stats Row (Products, Live, Revenue)
3. Header (Search + New Product button)
4. Product Cards Grid

## Implementation

### Step 1: Copy New Image to Assets

```
user-uploads://image-38.png → src/assets/gumroad-banner.png
```

### Step 2: Move Banner to Top Position

**File:** `src/components/seller/SellerProducts.tsx`

Move the banner block from lines 328-335 to be the FIRST element inside the main container (right after line 290).

**New Layout Structure:**

```tsx
return (
  <div className="p-6 lg:p-8 bg-white min-h-screen">
    {/* Gumroad-style Banner - FIRST at very top */}
    <div className="mb-8 border-2 border-dashed border-black/10 rounded-lg overflow-hidden bg-white p-4">
      <img 
        src={gumroadBanner} 
        alt="Start creating and selling" 
        className="w-full h-auto object-contain rounded-lg"
      />
    </div>

    {/* Stats Row - B&W */}
    <div className="grid grid-cols-3 gap-4 mb-8">
      ...stats cards...
    </div>

    {/* Header - Search + New Product */}
    <div className="flex items-center justify-between gap-4 mb-8">
      ...search and button...
    </div>

    {/* Products Grid */}
    ...product cards...
  </div>
);
```

## Result

| Element | Before | After |
|---------|--------|-------|
| Image | Old panda illustration | New 4-panel comic strip |
| Position | After search/header | Very top (first element) |
| Layout | Stats → Search → Banner → Grid | Banner → Stats → Search → Grid |

- New colorful panda comic strip (research → sales → motivation → happiness)
- Banner appears FIRST before everything else
- Stats, search, and products follow below
- Clean, Gumroad-style dashed border container

