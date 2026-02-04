

# Remove Duplicate Header Items & Add Billing to Buyer Sidebar

## Overview

Clean up navigation by removing duplicate items from both dashboard headers and adding a Billing section to the Buyer Dashboard sidebar.

## Current Duplication Analysis

### Seller Dashboard
| Location | Items |
|----------|-------|
| Top Bar (Header) | Dashboard, Products, Orders, Messages, Analytics |
| Sidebar | Home, Products, Sales, Customers, Analytics, Payouts, Discount, Insights, Reports, Performance, Chat, Settings, Help |
| **Duplicates** | Products, Orders/Sales, Analytics, Messages/Chat |

### Buyer Dashboard
| Location | Items |
|----------|-------|
| Top Bar (Header) | Prompts, Marketplace, Billing, Chat |
| Sidebar | Home, Marketplace, My Orders, Wishlist, Prompts, Analytics, Wallet, Notifications, Support, Settings |
| **Duplicates** | Prompts, Marketplace, Chat/Support |
| **Missing from Sidebar** | Billing |

---

## Changes

### File 1: `src/components/seller/SellerTopBar.tsx`

**Remove navigation tabs from header** (Lines 58-64, 199-229)

Keep only:
- Search bar
- Share Store button
- Wallet balance
- Notifications dropdown
- Profile dropdown

Remove the `navItems` array and the navigation tabs section completely from the header.

### File 2: `src/components/dashboard/DashboardTopBar.tsx`

**Remove navigation tabs from header** (Lines 218-269)

Keep only:
- Search bar
- Currency selector
- Become a Seller button
- Wallet balance
- Notifications dropdown
- Profile dropdown

Remove the navigation links for Prompts, Marketplace, Billing, and Chat from the header.

### File 3: `src/components/dashboard/DashboardSidebar.tsx`

**Add Billing to sidebar navigation** (Lines 20-28)

Add Billing item to `navItems` array:

```text
Current navItems:
- Home
- Marketplace
- My Orders
- Wishlist
- Prompts
- Analytics
- Wallet

Updated navItems:
- Home
- Marketplace
- My Orders
- Wishlist
- Prompts
- Analytics
- Billing (NEW - add after Analytics)
- Wallet
```

---

## Visual Result

### Seller Dashboard (After)

```text
+------------------------------------------------------------------+
| [Search...]                    | Share | Wallet | Bell | Profile |
+------------------------------------------------------------------+
|                                                                  |
| SIDEBAR:                       | MAIN CONTENT                    |
| Home                          |                                  |
| Products                      |                                  |
| Sales                         |                                  |
| Customers                     |                                  |
| Analytics                     |                                  |
| Payouts                       |                                  |
| Discount >                    |                                  |
| Insights                      |                                  |
| ...                           |                                  |
+------------------------------------------------------------------+
```

### Buyer Dashboard (After)

```text
+------------------------------------------------------------------+
| [Search...]            | Currency | Seller | Wallet | Bell | User |
+------------------------------------------------------------------+
|                                                                  |
| SIDEBAR:                       | MAIN CONTENT                    |
| Home                          |                                  |
| Marketplace                   |                                  |
| My Orders                     |                                  |
| Wishlist                      |                                  |
| Prompts                       |                                  |
| Analytics                     |                                  |
| Billing (NEW)                 |                                  |
| Wallet                        |                                  |
| ---                           |                                  |
| Notifications                 |                                  |
| Support                       |                                  |
| Settings                      |                                  |
+------------------------------------------------------------------+
```

---

## Files to Update

| File | Changes |
|------|---------|
| `src/components/seller/SellerTopBar.tsx` | Remove `navItems` array and navigation tabs section |
| `src/components/dashboard/DashboardTopBar.tsx` | Remove navigation tabs section (Prompts, Marketplace, Billing, Chat links) |
| `src/components/dashboard/DashboardSidebar.tsx` | Add Billing item to `navItems` array |

---

## Technical Details

### SellerTopBar.tsx Changes

1. Remove lines 51-64 (NavItem interface and navItems array)
2. Remove lines 199-229 (Navigation Tabs section in JSX)
3. Remove unused imports: `GumroadHomeIcon`, `GumroadProductsIcon`, `GumroadSalesIcon`, `GumroadAnalyticsIcon` from SellerGumroadIcons
4. Remove `GumroadHelpIcon` import from GumroadIcons

### DashboardTopBar.tsx Changes

1. Remove lines 218-269 (Navigation Tabs section including Prompts, Marketplace, Billing, Chat links)
2. Remove unused imports: `GumroadProductsIcon`, `GumroadDiscoverIcon`, `GumroadPayoutsIcon`, `GumroadHelpIcon`

### DashboardSidebar.tsx Changes

1. Add `GumroadPayoutsIcon` usage for Billing (or create a dedicated billing icon)
2. Update `navItems` array to include Billing:

```typescript
const navItems = [
  { to: '/dashboard/home', icon: GumroadHomeIcon, label: 'Home' },
  { to: '/dashboard/marketplace', icon: GumroadDiscoverIcon, label: 'Marketplace' },
  { to: '/dashboard/orders', icon: GumroadCheckoutIcon, label: 'My Orders' },
  { to: '/dashboard/wishlist', icon: GumroadLibraryIcon, label: 'Wishlist' },
  { to: '/dashboard/prompts', icon: GumroadProductsIcon, label: 'Prompts' },
  { to: '/dashboard/analytics', icon: GumroadAnalyticsIcon, label: 'Analytics' },
  { to: '/dashboard/billing', icon: GumroadPayoutsIcon, label: 'Billing' }, // NEW
  { to: '/dashboard/wallet', icon: GumroadPayoutsIcon, label: 'Wallet' },
];
```

