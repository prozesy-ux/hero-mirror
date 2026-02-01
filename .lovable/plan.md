

# Dashboard Marketplace Product View Redesign Plan

## Overview

Redesign the dashboard marketplace product view (`ProductFullViewPage.tsx`) to match the store product view design (`ProductDetailModal.tsx`) with consistent styling, clear layout, and mobile-first design.

## Current State Analysis

### Store Product View (`ProductDetailModal.tsx`) - Reference Design
- **Desktop**: 65/35 horizontal split (image left, purchase box right)
- **Mobile**: Vertical drawer with bottom-sticky action buttons
- **Styling**: Clean black/white monochrome with trust badges
- **Key Features**: Image gallery with dots, seller info, rating stars, tags, trust badges (Secure, Instant, 24/7)

### Dashboard Product View (`ProductFullViewPage.tsx`) - Current Issues
- Has 70/30 split but inconsistent with store modal
- Missing drawer-style mobile experience
- Header differs (uses sticky back button instead of modal header)
- Trust badges and layout slightly different from store view
- Not using Drawer component for mobile

## Key Changes Required

### 1. Mobile Experience - Add Drawer Component
Convert mobile view to use bottom sheet drawer (like store modal):

```text
Current (Mobile):
+------------------+
| Back Button      |
+------------------+
| Image            |
| Content          |
| Actions          | ← Not sticky
+------------------+

After (Mobile):
+------------------+
| Image (280px)    |
| Seller Info      |
| Title + Price    |
| Tags + Desc      |
+------------------+
| Chat | Buy Now   | ← Sticky bottom
+------------------+
```

### 2. Desktop Layout - Match Store Modal
Align the 70/30 split with store's visual patterns:

- Same image container height (`h-[350px] lg:h-[450px]`)
- Same purchase box styling (black price badge, trust badges)
- Same navigation arrows and dot indicators

### 3. Mobile-Specific Components

Add matching mobile content structure:

| Component | Store Modal | Dashboard (After) |
|-----------|-------------|-------------------|
| Image height | 280px | 280px |
| Seller info box | Rounded bg-black/5 | Same |
| Price badge | Black with white text | Same |
| Action buttons | Sticky bottom 44px | Same |
| Trust badges | Secure, Instant, 24/7 | Same |

### 4. Navigation Changes

| Item | Current | After |
|------|---------|-------|
| Desktop back | Sticky header bar | Keep as-is (dashboard nav) |
| Mobile back | None (uses browser) | Add close/back in drawer handle |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/ProductFullViewPage.tsx` | Add mobile drawer, align styling with store modal |

## Detailed Implementation

### Step 1: Import Drawer Components
Add Drawer imports for mobile bottom sheet experience.

### Step 2: Add useIsMobile Hook
Detect mobile viewport to switch between layouts.

### Step 3: Create Mobile Content Component
Mirror the `MobileContent` component from `ProductDetailModal`:
- 280px image gallery with dots
- Seller info in rounded bg-black/5 box
- Black price badge
- Sticky action buttons at bottom

### Step 4: Update Desktop Layout
Ensure desktop view maintains 70/30 split with:
- Same image container heights
- Same purchase box border styling
- Same trust badge layout

### Step 5: Mobile-Specific Styling
Add responsive classes for:
- `safe-area-bottom` padding for iOS
- Touch-friendly 44px min button heights
- Horizontal scroll for image thumbnails

## Visual Comparison

### Mobile View (After Changes)

```text
+------------------------+
|  [Image 280px]         |
|  < > dots             |
+------------------------+
| [Avatar] Seller Name   |
|         100 orders     |
+------------------------+
| Product Title          |
| [$25.00] ★★★★★ (12)   |
+------------------------+
| [Tag1] [Tag2] [Tag3]   |
+------------------------+
| Description text...    |
| 50 sold | Balance: $30 |
+------------------------+
| [Chat] [Buy Now]       | ← Sticky
+------------------------+
```

### Desktop View (After Changes)

```text
+------------------------------------------+
| ← Back to Marketplace                    |
+------------------------------------------+
| +---------------------------+ +---------+|
| |                           | | $25.00  ||
| |     Image Gallery         | |         ||
| |       (70%)               | | [Buy]   ||
| |                           | | [Chat]  ||
| +---------------------------+ |         ||
| | thumb | thumb | thumb     | | Trust   ||
| +---------------------------+ | Badges  ||
|                               +---------+|
| +---------------------------------------+|
| | Title + Seller + Description          ||
| +---------------------------------------+|
| | Ratings & Reviews                      ||
| +---------------------------------------+|
+------------------------------------------+
```

## Technical Details

### Drawer Implementation
```typescript
// Use conditional rendering based on viewport
if (isMobile) {
  return (
    <div className="min-h-screen">
      {/* Mobile vertical stack with sticky actions */}
    </div>
  );
}

// Desktop continues with current 70/30 layout
```

### Sticky Action Bar (Mobile)
```css
.sticky bottom-0 bg-white pt-2 border-t border-black/10 safe-area-bottom
```

### Trust Badges (Consistent)
```typescript
<div className="flex flex-wrap gap-1.5">
  <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] text-black/70">
    <ShieldCheck size={10} />
    <span>Secure</span>
  </div>
  {/* Instant, 24/7 badges */}
</div>
```

## Expected Outcome

- Dashboard marketplace product view will match store product view design exactly
- Clean, mobile-first experience with bottom-sticky actions
- Consistent trust indicators and styling across platform
- Same 44px touch targets and safe area handling

