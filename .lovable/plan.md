

# Seller Dashboard Navigation Restructure

## Overview

Reorganize the Seller Dashboard sidebar to move "Insights" under the Discount section, add "Inventory" to the Discount dropdown, and make the dropdown closed by default (manual open only).

---

## Current Navigation Structure

```text
Main Section:
- Home
- Products
- Sales
- Customers
- Analytics
- Insights ← MOVE THIS
- Payouts

Discount (dropdown - auto opens):
  - Coupons
  - Flash Sales

After Discount:
- Inventory ← MOVE TO DROPDOWN
- Reports
- Performance
- Chat
```

---

## New Navigation Structure

```text
Main Section:
- Home
- Products
- Sales
- Customers
- Analytics
- Payouts

Discount (dropdown - closed by default, manual open):
  - Coupons
  - Flash Sales
  - Inventory ← MOVED HERE

After Discount:
- Insights ← MOVED HERE
- Reports
- Performance
- Chat
```

---

## Changes

### 1. Update `SellerSidebar.tsx`

| Change | Before | After |
|--------|--------|-------|
| Remove "Insights" from navItems | Line 46 | Remove |
| Remove "Inventory" from navItemsAfterDiscount | Line 57 | Remove |
| Add "Inventory" to discountItems | N/A | Add at end |
| Add "Insights" to navItemsAfterDiscount | N/A | Add at start |
| Dropdown default state | `useState(true)` | `useState(false)` |

**navItems (Updated):**
```tsx
const navItems = [
  { to: '/seller', icon: GumroadHomeIcon, label: 'Home', exact: true },
  { to: '/seller/products', icon: GumroadProductsIcon, label: 'Products' },
  { to: '/seller/orders', icon: GumroadSalesIcon, label: 'Sales' },
  { to: '/seller/customers', icon: GumroadCustomersIcon, label: 'Customers' },
  { to: '/seller/analytics', icon: GumroadAnalyticsIcon, label: 'Analytics' },
  { to: '/seller/wallet', icon: GumroadPayoutsIcon, label: 'Payouts' },
  // Insights REMOVED from here
];
```

**discountItems (Updated):**
```tsx
const discountItems = [
  { to: '/seller/coupons', icon: GumroadCouponsIcon, label: 'Coupons' },
  { to: '/seller/flash-sales', icon: GumroadFlashSaleIcon, label: 'Flash Sales' },
  { to: '/seller/inventory', icon: GumroadInventoryIcon, label: 'Inventory' }, // ADDED
];
```

**navItemsAfterDiscount (Updated):**
```tsx
const navItemsAfterDiscount = [
  { to: '/seller/product-analytics', icon: GumroadInsightsIcon, label: 'Insights' }, // ADDED
  { to: '/seller/reports', icon: GumroadReportsIcon, label: 'Reports' },
  { to: '/seller/performance', icon: GumroadPerformanceIcon, label: 'Performance' },
  { to: '/seller/chat', icon: GumroadChatIcon, label: 'Chat' },
];
```

**Dropdown State:**
```tsx
// Before
const [discountOpen, setDiscountOpen] = useState(true);

// After
const [discountOpen, setDiscountOpen] = useState(false);
```

---

### 2. Update `SellerMobileNavigation.tsx`

Sync the mobile sidebar navigation order with desktop:

```tsx
const sidebarNavItems = [
  { to: '/seller', icon: LayoutDashboard, label: 'Home', exact: true },
  { to: '/seller/products', icon: Package, label: 'Products' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Sales' },
  { to: '/seller/customers', icon: Users, label: 'Customers' },
  { to: '/seller/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/seller/wallet', icon: Wallet, label: 'Payouts' },
  // Discount section items
  { to: '/seller/coupons', icon: Tag, label: 'Coupons' },
  { to: '/seller/flash-sales', icon: Zap, label: 'Flash Sales' },
  { to: '/seller/inventory', icon: Warehouse, label: 'Inventory' }, // MOVED
  // After discount
  { to: '/seller/product-analytics', icon: TrendingUp, label: 'Insights' }, // MOVED
  { to: '/seller/reports', icon: FileText, label: 'Reports' },
  { to: '/seller/performance', icon: Activity, label: 'Performance' },
  { to: '/seller/chat', icon: MessageSquare, label: 'Chat' },
];
```

---

## Visual Comparison

**Before:**
```text
├── Home
├── Products
├── Sales
├── Customers
├── Analytics
├── Insights        ← Was here
├── Payouts
├── Discount ▼ (auto-open)
│   ├── Coupons
│   └── Flash Sales
├── Inventory       ← Was here
├── Reports
├── Performance
└── Chat
```

**After:**
```text
├── Home
├── Products
├── Sales
├── Customers
├── Analytics
├── Payouts
├── Discount ▶ (closed by default)
│   ├── Coupons
│   ├── Flash Sales
│   └── Inventory   ← Moved here
├── Insights        ← Moved here
├── Reports
├── Performance
└── Chat
```

---

## Files to Update

1. **`src/components/seller/SellerSidebar.tsx`** - Move items and change dropdown default state
2. **`src/components/seller/SellerMobileNavigation.tsx`** - Sync navigation order

