

# Move Products Under Discount Section in Seller Sidebar

## Overview

Reorganize the Seller Dashboard sidebar navigation by removing "Products" from the main navigation and adding it as a sub-item under the collapsible "Discount" section.

---

## Current Structure

```text
Home
Products        ← REMOVE FROM HERE
Sales
Customers
Analytics
Payouts
▼ Discount
  ├─ Coupons
  ├─ Flash Sales
  └─ Inventory
Insights
Reports
Performance
Chat
```

---

## New Structure

```text
Home
Sales
Customers
Analytics
Payouts
▼ Discount
  ├─ Products   ← ADD HERE (first item)
  ├─ Coupons
  ├─ Flash Sales
  └─ Inventory
Insights
Reports
Performance
Chat
```

---

## Changes to SellerSidebar.tsx

### 1. Update Main Nav Items (Line 40-47)

Remove "Products" from `navItems`:

**Before:**
```tsx
const navItems = [
  { to: '/seller', icon: GumroadHomeIcon, label: 'Home', exact: true },
  { to: '/seller/products', icon: GumroadProductsIcon, label: 'Products' },
  { to: '/seller/orders', icon: GumroadSalesIcon, label: 'Sales' },
  ...
];
```

**After:**
```tsx
const navItems = [
  { to: '/seller', icon: GumroadHomeIcon, label: 'Home', exact: true },
  { to: '/seller/orders', icon: GumroadSalesIcon, label: 'Sales' },
  ...
];
```

---

### 2. Update Discount Sub-menu Items (Line 49-54)

Add "Products" as the first item in `discountItems`:

**Before:**
```tsx
const discountItems = [
  { to: '/seller/coupons', icon: GumroadCouponsIcon, label: 'Coupons' },
  { to: '/seller/flash-sales', icon: GumroadFlashSaleIcon, label: 'Flash Sales' },
  { to: '/seller/inventory', icon: GumroadInventoryIcon, label: 'Inventory' },
];
```

**After:**
```tsx
const discountItems = [
  { to: '/seller/products', icon: GumroadProductsIcon, label: 'Products' },
  { to: '/seller/coupons', icon: GumroadCouponsIcon, label: 'Coupons' },
  { to: '/seller/flash-sales', icon: GumroadFlashSaleIcon, label: 'Flash Sales' },
  { to: '/seller/inventory', icon: GumroadInventoryIcon, label: 'Inventory' },
];
```

---

## File to Update

| File | Change |
|------|--------|
| `src/components/seller/SellerSidebar.tsx` | Move Products from main nav to Discount sub-menu |

---

## Result

The sidebar will now show "Products" inside the collapsible "Discount" section instead of as a standalone top-level navigation item. This groups product management with discount-related features (coupons, flash sales, inventory) for a more organized seller workflow.

