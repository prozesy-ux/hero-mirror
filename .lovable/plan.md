
## Fix: Force "Inter" Font on All Dashboard Elements

### Root Cause
The inline `fontFamily: "Inter"` on dashboard wrapper divs is being **overridden** by:
1. `src/index.css` line 208: `html { font-family: "DM Sans" }` -- sets DM Sans globally
2. `tailwind.config.ts` line 17: `font-sans: ['DM Sans']` -- Tailwind's default sans maps to DM Sans
3. `seller-dashboard` CSS class: forces "Plus Jakarta Sans" on some seller components
4. Browser default: child elements (buttons, inputs) inherit from `html`, not from parent divs

The inline style on the wrapper only affects that specific div. All children (text, buttons, inputs, headings) still inherit "DM Sans" from the `html` rule.

### Solution
Add a single CSS class `.dashboard-inter` in `src/index.css` that forces Inter on the element AND all descendants:

```css
.dashboard-inter,
.dashboard-inter * {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
}
```

Then replace the inline `style={{ fontFamily: ... }}` on all 24 dashboard files with this CSS class instead.

### Files to Change

**1. `src/index.css`** -- Add the `.dashboard-inter` class (1 addition, ~4 lines)

**2. All 24 dashboard files** -- Replace inline font style with `className="dashboard-inter"`:
- `src/pages/Dashboard.tsx` (main wrapper)
- `src/pages/Seller.tsx` (main wrapper)
- `src/components/dashboard/DashboardTopBar.tsx`
- `src/components/seller/SellerTopBar.tsx`
- `src/components/dashboard/BuyerDashboardHome.tsx` (loading + main)
- `src/components/seller/SellerDashboard.tsx` (loading + main)
- `src/components/dashboard/BuyerAnalytics.tsx` (loading + main)
- `src/components/seller/SellerAnalytics.tsx` (loading + main)
- `src/components/seller/SellerOrders.tsx` (also remove `seller-dashboard` class)
- `src/components/seller/SellerInventory.tsx`
- `src/components/seller/SellerPerformance.tsx`
- `src/components/seller/SellerReports.tsx`
- `src/components/seller/SellerMarketing.tsx`
- `src/components/seller/SellerCustomers.tsx`
- `src/components/seller/SellerSupport.tsx`
- `src/components/seller/SellerSecurityLogs.tsx`
- `src/components/seller/SellerNotificationCenter.tsx`
- `src/components/seller/SellerProductAnalytics.tsx`
- `src/components/seller/SellerServiceBookings.tsx`
- `src/components/seller/SellerReviewsManagement.tsx`
- `src/components/seller/SellerFeatureRequests.tsx`
- `src/components/seller/SellerRefundManagement.tsx`
- `src/components/seller/SellerFlashSales.tsx`
- `src/components/seller/SellerDeliveryInventory.tsx`

**3. `src/components/seller/SellerSettings.tsx`** -- Replace `seller-dashboard` class with `dashboard-inter`

### Why This Works
- The `!important` flag overrides both `html { font-family: "DM Sans" }` and the `seller-dashboard` class
- The `*` wildcard selector ensures ALL child elements (buttons, inputs, spans, headings) use Inter
- A single CSS class is cleaner than inline styles on every component
- Only affects dashboard sections -- landing page, marketplace, and other pages keep their existing fonts

### What Stays the Same
- Sidebar (left panel) -- NOT touched
- Background color `#f1f5f9` -- stays
- All data logic and backend -- NOT touched
- Non-dashboard pages keep "DM Sans"
