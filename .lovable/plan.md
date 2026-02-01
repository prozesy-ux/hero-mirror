

# Fix: NewProduct Missing SellerProvider Context

## Problem

The `/seller/products/new` route is throwing this error:
```
useSellerContext must be used within a SellerProvider
```

**Root Cause**: In `App.tsx`, the `NewProduct` page is defined as a separate route (line 89-93) that bypasses the `Seller` page component. Since `SellerProvider` is only set up inside `Seller.tsx`, the `NewProduct` component cannot access the seller context.

## Solution

Remove the separate `/seller/products/new` route from `App.tsx` and instead add it as a nested route **inside** the `Seller.tsx` routing, where the `SellerProvider` wraps all child components.

## Files to Modify

| File | Action |
|------|--------|
| `src/App.tsx` | Remove the separate `/seller/products/new` route (lines 89-93) |
| `src/pages/Seller.tsx` | Add `NewProduct` as a nested route inside `SellerProvider` |

## Implementation Details

### 1. Remove Separate Route from App.tsx

**Before:**
```typescript
<Route path="/seller/*" element={
  <Suspense fallback={<AppShell variant="seller" />}>
    <Seller />
  </Suspense>
} />
<Route path="/seller/products/new" element={
  <Suspense fallback={<AppShell variant="seller" />}>
    <NewProduct />
  </Suspense>
} />
```

**After:**
```typescript
<Route path="/seller/*" element={
  <Suspense fallback={<AppShell variant="seller" />}>
    <Seller />
  </Suspense>
} />
// Remove the separate /seller/products/new route
```

### 2. Add NewProduct Route Inside Seller.tsx

The `Seller.tsx` component already has a `Routes` block that handles nested routes. Add `NewProduct` as one of those routes:

```typescript
import NewProduct from './NewProduct';  // Add import

// Inside the SellerDashboardLayout Routes block:
<Routes>
  <Route path="/" element={<SellerDashboard />} />
  <Route path="/products" element={<SellerProducts />} />
  <Route path="/products/new" element={<NewProduct />} />  // Add this
  <Route path="/orders" element={<SellerOrders />} />
  // ... other routes
</Routes>
```

This ensures `NewProduct` is rendered inside the `SellerProvider` context that wraps the entire seller dashboard.

## Visual Explanation

```text
BEFORE (broken):
App.tsx
├── /seller/* → Seller.tsx → [SellerProvider] → SellerProducts, etc.
└── /seller/products/new → NewProduct ❌ (NO SellerProvider!)

AFTER (fixed):
App.tsx
└── /seller/* → Seller.tsx → [SellerProvider]
                              ├── /products → SellerProducts
                              ├── /products/new → NewProduct ✅
                              └── ... other routes
```

## Summary

- Remove duplicate route from `App.tsx`
- Add `NewProduct` as nested route in `Seller.tsx` (inside SellerProvider)
- The `/seller/products/new` URL will work the same way, but now with proper context access

