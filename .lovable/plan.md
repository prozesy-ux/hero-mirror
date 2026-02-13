

## Change All Dashboard Background from #F3EAE0 to #f1f5f9 (Matching HTML Code)

### What the HTML Code Uses
Reading the HTML line by line, these are the exact design tokens:
- **Background**: `--bg-app: #f1f5f9` (slate-100)
- **Font**: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Card background**: `#ffffff`
- **Card border**: `1px solid #e2e8f0`
- **Text primary**: `#0f172a`
- **Text secondary**: `#64748b`
- **Primary accent**: `#3b82f6`

### What Changes
Replace `#F3EAE0` (cream) with `#f1f5f9` (slate-100) across ALL dashboard sections. Font is already "Inter" -- no font changes needed.

### Files to Update (24 files)

**Page Layouts (2 files)**
1. `src/pages/Dashboard.tsx` -- lines 48, 91: `#F3EAE0` to `#f1f5f9`
2. `src/pages/Seller.tsx` -- lines 559, 600: `#F3EAE0` to `#f1f5f9`

**Top Bars (2 files)**
3. `src/components/dashboard/DashboardTopBar.tsx` -- line 179: `#F3EAE0` to `#f1f5f9`
4. `src/components/seller/SellerTopBar.tsx` -- line 154: `#F3EAE0` to `#f1f5f9`

**Dashboard Home (2 files)**
5. `src/components/dashboard/BuyerDashboardHome.tsx` -- loading + main bg
6. `src/components/seller/SellerDashboard.tsx` -- lines 285, 301: `#F3EAE0` to `#f1f5f9`

**Analytics (2 files)**
7. `src/components/dashboard/BuyerAnalytics.tsx` -- loading + main bg
8. `src/components/seller/SellerAnalytics.tsx` -- loading + main bg

**Seller Sub-Sections (16 files)**
9. `src/components/seller/SellerOrders.tsx` -- lines 304, 321
10. `src/components/seller/SellerInventory.tsx` -- lines 113, 125
11. `src/components/seller/SellerPerformance.tsx` -- lines 84, 101
12. `src/components/seller/SellerReports.tsx` -- loading + main
13. `src/components/seller/SellerMarketing.tsx` -- lines 186, 198
14. `src/components/seller/SellerCustomers.tsx` -- loading + main
15. `src/components/seller/SellerSupport.tsx` -- loading + main
16. `src/components/seller/SellerSecurityLogs.tsx` -- lines 40, 47
17. `src/components/seller/SellerNotificationCenter.tsx` -- loading + main
18. `src/components/seller/SellerProductAnalytics.tsx` -- lines 74, 82, 105
19. `src/components/seller/SellerServiceBookings.tsx` -- loading + main
20. `src/components/seller/SellerReviewsManagement.tsx` -- loading + main
21. `src/components/seller/SellerFeatureRequests.tsx` -- loading + main
22. `src/components/seller/SellerRefundManagement.tsx` -- lines 50, 66
23. `src/components/seller/SellerFlashSales.tsx` -- lines 149, 156
24. `src/components/seller/SellerDeliveryInventory.tsx` -- lines 238, 249

### What Stays the Same
- Sidebar (left panel) -- NOT touched
- Font -- already "Inter", no changes needed
- Card styles, borders, text colors -- already match the HTML code
- All data logic and backend connections -- NOT touched

### Summary
Simple find-and-replace: every `#F3EAE0` in the 24 dashboard files becomes `#f1f5f9` to exactly match the HTML design code.

