

## Update Dashboard Background to #FCFCFC and Unify Font to Inter

### What Changes
1. Replace ALL page background colors (`#f1f5f9` and `#F3EAE0`) with `#FCFCFC` across both Buyer and Seller dashboard sections
2. Ensure the "Inter" font is used consistently in all dashboard content areas (sidebar is NOT touched)

### Files Modified (4 files)

**File 1: `src/components/dashboard/EzMartDashboardGrid.tsx`**
- Change `fontFamily` from `"Inter", system-ui, sans-serif` -- already Inter, confirmed correct
- No background change needed here (grid itself has no page bg)

**File 2: `src/components/dashboard/BuyerDashboardHome.tsx`**
- Line 408: Loading skeleton bg `#f1f5f9` to `#FCFCFC`
- Line 439: Main page bg `#f1f5f9` to `#FCFCFC`

**File 3: `src/components/seller/SellerDashboard.tsx`**
- Line 285: Loading skeleton bg `#f1f5f9` to `#FCFCFC`
- Line 301: Main page bg `#f1f5f9` to `#FCFCFC`

**File 4: `src/components/dashboard/BuyerAnalytics.tsx`**
- Line 259: Loading bg `#F3EAE0` to `#FCFCFC`
- Line 269: Main page bg `#F3EAE0` to `#FCFCFC`

**File 5: `src/components/seller/SellerAnalytics.tsx`**
- Line 360: Loading bg `#F3EAE0` to `#FCFCFC`
- Line 377: Main page bg `#F3EAE0` to `#FCFCFC`

### Font
The HTML reference uses "Inter" as the primary font. The `EzMartDashboardGrid` already uses `fontFamily: '"Inter", system-ui, sans-serif'` -- this is correct and stays. The BuyerAnalytics and SellerAnalytics pages will inherit this font since they use the same grid component. No font changes needed -- Inter is already applied.

### Summary
- Background: `#f1f5f9` / `#F3EAE0` replaced with `#FCFCFC` everywhere
- Font: Already "Inter" -- no changes needed
- Sidebar: NOT touched
- Data logic: NOT touched
