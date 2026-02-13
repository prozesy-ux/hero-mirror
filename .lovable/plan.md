

## Apply "Inter" Font to All Dashboard Sections

### Problem
The uploaded HTML design uses `"Inter"` as the primary font. Currently, only the `EzMartDashboardGrid` component explicitly sets Inter. All other dashboard pages inherit "DM Sans" from the global CSS (`src/index.css`), so the font doesn't match the design.

### Solution
Add `fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'` to every dashboard section wrapper. The sidebar is NOT touched.

### Files to Update (24 files)

**Page Layouts (2 files)**
1. `src/pages/Dashboard.tsx` - Add Inter font to main wrapper
2. `src/pages/Seller.tsx` - Add Inter font to main wrapper

**Top Bars (2 files)**
3. `src/components/dashboard/DashboardTopBar.tsx` - Add Inter font
4. `src/components/seller/SellerTopBar.tsx` - Add Inter font

**Dashboard Home Pages (2 files)**
5. `src/components/dashboard/BuyerDashboardHome.tsx` - Add Inter font to outer div
6. `src/components/seller/SellerDashboard.tsx` - Add Inter font to outer div

**Analytics (2 files)**
7. `src/components/dashboard/BuyerAnalytics.tsx` - Add Inter font
8. `src/components/seller/SellerAnalytics.tsx` - Add Inter font

**Seller Sub-Sections (16 files)**
9. `src/components/seller/SellerOrders.tsx`
10. `src/components/seller/SellerInventory.tsx`
11. `src/components/seller/SellerPerformance.tsx`
12. `src/components/seller/SellerReports.tsx`
13. `src/components/seller/SellerMarketing.tsx`
14. `src/components/seller/SellerCustomers.tsx`
15. `src/components/seller/SellerSupport.tsx`
16. `src/components/seller/SellerSecurityLogs.tsx`
17. `src/components/seller/SellerNotificationCenter.tsx`
18. `src/components/seller/SellerProductAnalytics.tsx`
19. `src/components/seller/SellerServiceBookings.tsx`
20. `src/components/seller/SellerReviewsManagement.tsx`
21. `src/components/seller/SellerFeatureRequests.tsx`
22. `src/components/seller/SellerRefundManagement.tsx`
23. `src/components/seller/SellerFlashSales.tsx`
24. `src/components/seller/SellerDeliveryInventory.tsx`

### What Changes Per File
Each file's outermost dashboard `div` gets the style attribute updated to include:
```
fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
```

This matches exactly what the HTML design uses:
```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### What Stays the Same
- Background color (`#F3EAE0`) -- stays as is
- Sidebar/left panel -- NOT touched
- All data logic, contexts, BFF endpoints -- NOT touched
- Card styles, colors, layout -- NOT touched
