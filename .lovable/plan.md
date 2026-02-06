
# Add Neo-Brutalist Hover Effects to All Seller Dashboard Cards

## Overview

Add the neo-brutalist hover effect (`hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`) to ALL cards across the Seller Dashboard sections. This will give every card interactive feedback when hovered, matching the style used in Getting Started cards and interactive buttons.

## Hover Effect Pattern

```css
hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer
```

This creates a 4px solid black shadow on hover that shifts to the bottom-right, creating a "lifted" paper effect.

---

## Files to Update

### 1. SellerDashboard.tsx

**Stats Row (Lines 295-324)** - StatCards already use `variant="gumroad"` which needs updating

**Quick Actions (Lines 328-388)** - Already have hover, but verify consistency

**Performance Metrics (Lines 391-451)**
- Completion Rate card (Line 393)
- Order Status card (Line 410)
- Monthly Comparison card (Line 437)

**Revenue Chart (Lines 453-505)**
- Main chart container

**Top Products & Recent Orders (Lines 507-589)**
- Top Products container
- Recent Orders container

### 2. SellerPerformance.tsx

**Key Metrics Grid (Lines 184-222)**
- Trust Score card (Line 186)
- Fulfillment Rate card (Line 196)
- Response Time card (Line 207)
- Delivery Time card (Line 217)

**Order Distribution (Line 225)**
**Performance Checklist (Line 255)**
**Stats Summary (Line 284)**

### 3. SellerMarketing.tsx

**Stats Cards (Lines 330-358)**
- Total Codes card
- Active Codes card
- Total Uses card

**Discount Codes Table container (Line 360)**

### 4. SellerProductAnalytics.tsx

**Overview Stats (Lines 129-166)**
- Total Views card
- Total Clicks card
- Total Purchases card
- Conversion Rate card

**Chart Container (Line 168)**
**Product Performance Table (Line 199)**

### 5. SellerProducts.tsx

**Stats Row (Lines 354-372)**
- Products card
- Live card
- Revenue card

**Sidebar Cards (Lines 609-700)**
- Comic Illustration card
- Quick Stats card
- Product Preview card

### 6. SellerInventory.tsx

**Stats Cards (Lines 140-200)**
- Total Products
- Total Units
- In Stock
- Low Stock
- Out of Stock

**Inventory Table container**

### 7. SellerSupport.tsx

**Chat Container card**

### 8. StatCard Component

Update the `gumroad` variant to include hover effect:

```tsx
gumroad: cn(
  "bg-white border rounded p-8",
  "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer"
)
```

---

## Standard Pattern for All Cards

**Before (plain card):**
```tsx
<div className="bg-white border rounded p-8">
```

**After (with hover):**
```tsx
<div className="bg-white border rounded p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer">
```

For non-clickable containers (charts, tables):
```tsx
<div className="bg-white border rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
```

---

## Summary of Changes

| File | Cards to Update | Type |
|------|-----------------|------|
| StatCard.tsx | Update gumroad variant | Component |
| SellerDashboard.tsx | ~10 cards | Add hover |
| SellerPerformance.tsx | ~7 cards | Add hover |
| SellerMarketing.tsx | ~4 cards | Add hover |
| SellerProductAnalytics.tsx | ~6 cards | Add hover |
| SellerProducts.tsx | ~6 cards | Add hover |
| SellerInventory.tsx | ~6 cards | Add hover |
| SellerSupport.tsx | ~1 card | Add hover |

**Total: ~40 elements to update**

This will create a consistent neo-brutalist interactive feel across the entire Seller Dashboard where every card responds to hover with the signature 4px black shadow effect.
