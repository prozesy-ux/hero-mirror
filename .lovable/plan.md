

# Seller Dashboard Mobile Improvements

## Overview

This plan addresses 4 key changes to the seller dashboard:
1. Remove the mobile header bar on mobile
2. Add Wallet to mobile bottom navigation
3. Sync missing sections in mobile panel with desktop sidebar
4. Remove section titles and secondary text across all seller dashboard sections

---

## 1. Remove Mobile Header Bar

**File:** `src/pages/Seller.tsx`

The `SellerMobileHeader` component displays a fixed header on mobile with logo and wallet balance. This needs to be removed from the layout.

**Current (line 588):**
```tsx
{/* Mobile Header - Only visible on mobile */}
<SellerMobileHeader />
```

**After:**
Remove the `<SellerMobileHeader />` component from `SellerContent`.

Also update `SellerMainContent` to remove the mobile top padding since there's no header:

**Current (lines 553-556):**
```tsx
<main className={`
  min-h-screen bg-slate-50 transition-all duration-300
  pt-16 pb-20 lg:pb-0
  lg:pt-16 ${isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60'}
`}>
```

**After:**
```tsx
<main className={`
  min-h-screen bg-slate-50 transition-all duration-300
  pt-0 pb-20 lg:pb-0
  lg:pt-16 ${isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60'}
`}>
```

---

## 2. Add Wallet to Mobile Bottom Navigation

**File:** `src/components/seller/SellerMobileNavigation.tsx`

Currently the bottom nav has: Menu, Home, Products, Share, Orders, Alerts, Profile

We need to add Wallet between Products and Share (or replace one of the items to keep it compact).

**Current bottom nav items (line 113-117):**
```tsx
const navItems = [
  { to: '/seller', icon: LayoutDashboard, label: 'Home', exact: true },
  { to: '/seller/products', icon: Package, label: 'Products' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Orders', badge: pendingOrders },
];
```

**After:** Add Wallet to the nav items:
```tsx
const navItems = [
  { to: '/seller', icon: LayoutDashboard, label: 'Home', exact: true },
  { to: '/seller/products', icon: Package, label: 'Products' },
  { to: '/seller/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Orders', badge: pendingOrders },
];
```

Also add the Wallet import at line 5.

---

## 3. Sync Missing Sections in Mobile Panel

**File:** `src/components/seller/SellerMobileNavigation.tsx`

The mobile sidebar (Sheet) is missing 2 sections that exist in the desktop sidebar:
- Flash Sales (with "New" badge)
- Product Insights

**Current sidebarNavItems (lines 32-47):**
```tsx
const sidebarNavItems = [
  { to: '/seller', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/seller/products', icon: Package, label: 'Products' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/seller/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/seller/inventory', icon: Warehouse, label: 'Inventory' },
  { to: '/seller/customers', icon: Users, label: 'Customers' },
  { to: '/seller/marketing', icon: Tag, label: 'Marketing' },
  { to: '/seller/reports', icon: FileText, label: 'Reports' },
  { to: '/seller/performance', icon: Activity, label: 'Performance' },
  { to: '/seller/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/seller/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/seller/feature-requests', icon: Lightbulb, label: 'Features' },
  { to: '/seller/support', icon: HelpCircle, label: 'Support' },
  { to: '/seller/settings', icon: Settings, label: 'Settings' },
];
```

**After:** Add Flash Sales and Product Insights:
```tsx
const sidebarNavItems = [
  { to: '/seller', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/seller/products', icon: Package, label: 'Products' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/seller/flash-sales', icon: Zap, label: 'Flash Sales', badge: 'New' },
  { to: '/seller/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/seller/product-analytics', icon: TrendingUp, label: 'Product Insights' },
  { to: '/seller/inventory', icon: Warehouse, label: 'Inventory' },
  { to: '/seller/customers', icon: Users, label: 'Customers' },
  { to: '/seller/marketing', icon: Tag, label: 'Marketing' },
  { to: '/seller/reports', icon: FileText, label: 'Reports' },
  { to: '/seller/performance', icon: Activity, label: 'Performance' },
  { to: '/seller/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/seller/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/seller/feature-requests', icon: Lightbulb, label: 'Features' },
  { to: '/seller/support', icon: HelpCircle, label: 'Support' },
  { to: '/seller/settings', icon: Settings, label: 'Settings' },
];
```

Also add `Zap, TrendingUp` to imports and update the sidebar Link rendering to show badges.

---

## 4. Remove Section Titles and Secondary Text

Remove titles (h1/h2 headings) and secondary descriptive text from all seller dashboard sections.

| File | Elements to Remove |
|------|-------------------|
| `SellerDashboard.tsx` | Line 272: `<h1>Dashboard</h1>` header text, Line 450: "Sales Details" title and "Revenue over time" subtitle |
| `SellerProducts.tsx` | No main title to remove (only search bar header) |
| `SellerOrders.tsx` | Line 323: `<h1>Orders</h1>` and Line 324: `<p>X orders found</p>` |
| `SellerWallet.tsx` | Remove any wallet section titles if present |
| `SellerAnalytics.tsx` | Remove "Analytics" heading if present |
| `SellerInventory.tsx` | Remove section title |
| `SellerCustomers.tsx` | Remove section title |
| `SellerMarketing.tsx` | Remove section title |
| `SellerReports.tsx` | Remove section title |
| `SellerPerformance.tsx` | Remove section title |
| `SellerChat.tsx` | Remove section title |
| `SellerSupport.tsx` | Remove section title |
| `SellerFeatureRequests.tsx` | Remove section title |

---

## Files to Modify

1. **`src/pages/Seller.tsx`**
   - Remove `<SellerMobileHeader />` from SellerContent
   - Update `pt-16` to `pt-0` for mobile in SellerMainContent

2. **`src/components/seller/SellerMobileNavigation.tsx`**
   - Add Wallet to bottom nav items
   - Add Flash Sales and Product Insights to sidebar nav items
   - Add Zap, TrendingUp, Wallet imports
   - Add badge rendering for Flash Sales in sidebar

3. **`src/components/seller/SellerDashboard.tsx`**
   - Remove dashboard title "Dashboard" and level badge row
   - Remove chart subtitle "Revenue over time"

4. **`src/components/seller/SellerOrders.tsx`**
   - Remove "Orders" heading and "X orders found" text

5. **`src/components/seller/SellerAnalytics.tsx`**
   - Remove any section title

6. **`src/components/seller/SellerWallet.tsx`**
   - Remove any section title if present

7. **`src/components/seller/SellerInventory.tsx`**
   - Remove section title

8. **`src/components/seller/SellerCustomers.tsx`**
   - Remove section title

9. **`src/components/seller/SellerMarketing.tsx`**
   - Remove section title

10. **`src/components/seller/SellerReports.tsx`**
    - Remove section title

11. **`src/components/seller/SellerPerformance.tsx`**
    - Remove section title

12. **`src/components/seller/SellerChat.tsx`**
    - Remove section title

13. **`src/components/seller/SellerSupport.tsx`**
    - Remove section title if present

14. **`src/components/seller/SellerFeatureRequests.tsx`**
    - Remove section title

15. **`src/components/seller/SellerFlashSales.tsx`**
    - Remove section title

16. **`src/components/seller/SellerProductAnalytics.tsx`**
    - Remove section title

---

## Expected Outcome

After these changes:
- Mobile will have no top header bar (more screen space)
- Wallet will be easily accessible from mobile bottom navigation
- Mobile sidebar panel will have all 16 sections matching desktop (including Flash Sales with "New" badge and Product Insights)
- All seller dashboard sections will have a cleaner look without redundant titles (context is provided by sidebar/nav active state)

