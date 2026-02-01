

# Full-Width Panda Image Banner

## Overview

Simplify the panda banner to show ONLY the image at full width - removing all text, buttons, and container styling for a clean, impactful visual.

## Current vs New Design

**Current:**
```text
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────┐   "We've never met an idea..."           │
│  │   Panda      │   Your products don't need to be...       │
│  │   Image      │                                           │
│  │   (40%)      │   [New product] button                    │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

**New (full-width image only):**
```text
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                    [Full Width Panda Image]                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Changes

**File:** `src/components/seller/SellerProducts.tsx`

**Lines 335-361** - Replace current banner:

| Remove | Keep |
|--------|------|
| White background box | Image only |
| Border and shadow | Rounded corners on image |
| Heading text | - |
| Description text | - |
| Pink "New product" button | - |
| Padding (p-6) | Bottom margin (mb-6) |

**New Code:**
```typescript
{/* Panda Banner - Full Width Image */}
<div className="mb-6">
  <img 
    src={productsIllustration} 
    alt="Product Sales Guide" 
    className="w-full h-auto rounded-2xl"
  />
</div>
```

## Summary

- Remove all text and button from banner
- Remove white container box, border, shadow
- Image displays full-width with rounded corners
- Clean spacing with bottom margin only


