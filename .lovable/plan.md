

# Rename Route: `/dashboard/ai-accounts` → `/dashboard/marketplace`

## Overview

This is a **safe route rename** that only affects frontend URL paths. There are **NO database table changes** needed - the database table is called `ai_accounts` (underscore) and that stays the same. The route path `/dashboard/ai-accounts` (hyphen) is just a URL string used for navigation.

## Impact Analysis

| Area | Status | Notes |
|------|--------|-------|
| Database tables | No change | `ai_accounts` table stays as-is |
| Database functions | No change | No references to `/dashboard/ai-accounts` |
| Edge functions | No change | No references to this route |
| RLS policies | No change | Not affected by URL paths |
| Frontend routes | Change needed | 11 files with route references |

## Files to Modify

| File | Changes Needed |
|------|----------------|
| `src/pages/Dashboard.tsx` | Update route definitions (3 routes) |
| `src/pages/SignIn.tsx` | Update redirect paths (2 places) |
| `src/components/dashboard/DashboardSidebar.tsx` | Update nav item path |
| `src/components/dashboard/DashboardTopBar.tsx` | Update nav link paths |
| `src/components/dashboard/MobileNavigation.tsx` | Update nav item paths (2 places) |
| `src/components/dashboard/BuyerDashboardHome.tsx` | Update links and navigations |
| `src/components/dashboard/BuyerWishlist.tsx` | Update link path |
| `src/components/dashboard/AIAccountsSection.tsx` | Update notification links and navigations |
| `src/components/dashboard/AccountDetailPage.tsx` | Update navigation paths |
| `src/components/dashboard/ProductFullViewPage.tsx` | Update navigation paths |
| `src/components/seller/SellerOrders.tsx` | Update notification links |

## Detailed Changes

### 1. Dashboard.tsx - Route Definitions

**Before:**
```tsx
<Route path="ai-accounts" element={<AIAccountsSection />} />
<Route path="ai-accounts/:accountId" element={<AccountDetailPage />} />
<Route path="ai-accounts/product/:productId" element={<ProductFullViewPage />} />
```

**After:**
```tsx
<Route path="marketplace" element={<AIAccountsSection />} />
<Route path="marketplace/:accountId" element={<AccountDetailPage />} />
<Route path="marketplace/product/:productId" element={<ProductFullViewPage />} />
```

### 2. SignIn.tsx - Redirects After Login

**Before:**
```tsx
navigate('/dashboard/ai-accounts');
```

**After:**
```tsx
navigate('/dashboard/marketplace');
```

### 3. Sidebar & Navigation Components

Update all nav items from:
```tsx
{ to: '/dashboard/ai-accounts', icon: Store, label: 'Marketplace' }
```

To:
```tsx
{ to: '/dashboard/marketplace', icon: Store, label: 'Marketplace' }
```

### 4. Notification Links

Update links in notifications from:
```tsx
link: '/dashboard/ai-accounts?tab=purchases'
```

To:
```tsx
link: '/dashboard/marketplace?tab=purchases'
```

### 5. Navigation Calls

Update all `navigate()` calls from:
```tsx
navigate('/dashboard/ai-accounts')
navigate('/dashboard/ai-accounts?tab=purchases')
navigate('/dashboard/ai-accounts/product/${id}')
```

To:
```tsx
navigate('/dashboard/marketplace')
navigate('/dashboard/marketplace?tab=purchases')
navigate('/dashboard/marketplace/product/${id}')
```

## What Stays the Same

| Item | Why No Change |
|------|---------------|
| Database table `ai_accounts` | Table name uses underscore, not related to URL |
| Database table `ai_account_purchases` | Same reason |
| Supabase queries | All queries use `ai_accounts` (table name) |
| Edge functions | They query database tables, not URL paths |
| Admin section `/admin/ai-accounts` | This is a separate admin route (can change later if needed) |
| Component name `AIAccountsSection` | Component files can keep their internal names |

## Summary

This is a simple find-and-replace operation:
- Find: `/dashboard/ai-accounts`
- Replace: `/dashboard/marketplace`

Total: ~40 occurrences across 11 files

No database errors, no function errors, no breaking changes - just URL path updates.

