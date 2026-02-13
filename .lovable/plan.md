

## Make Seller Analytics an Exact Copy of Dashboard Home Design

### Current Situation
Both `SellerAnalytics.tsx` and `SellerDashboard.tsx` already use the same `<EzMartDashboardGrid />` component, so the core layout and charts are identical. However, there are small data-mapping differences that cause visual inconsistencies:

1. **Category colors**: Analytics uses 6 mixed colors (`#FF7F00, #3B82F6, #10B981...`), Dashboard Home uses 4 orange-gradient shades (`#ff7f00, #fdba74, #fed7aa, #e5e7eb`)
2. **Conversion funnel bars**: Analytics uses distinct colors per bar (`#FF7F00, #3B82F6, #F59E0B...`), Dashboard Home uses orange gradient shades (`#ffe4c2, #ffd4a2, #ffc482...`)
3. **Active Users section**: Analytics shows hardcoded "Direct/Social/Organic/Referral", Dashboard Home shows "Product Views"
4. **Traffic sources**: Different calculation logic for order breakdown percentages

### Changes (1 file)

**File: `src/components/seller/SellerAnalytics.tsx`**

Align all data mapping to exactly match `SellerDashboard.tsx`:

- Change `CATEGORY_COLORS` from mixed rainbow to orange gradient: `['#ff7f00', '#fdba74', '#fed7aa', '#e5e7eb']`
- Update `conversionFunnel` to use orange gradient bar colors (`#ffe4c2`, `#ffd4a2`, `#ffc482`, `#ffb362`, `#ff9f42`) and match the badge/barHeight calculation from Dashboard Home
- Update `activeUsersByCountry` to use real product view data instead of hardcoded percentages
- Update `trafficSources` to match Dashboard Home's order status breakdown logic (Completed, Delivered, Pending, Cancelled/Refunded with green/blue/amber/red)
- Keep Analytics-specific features: date range picker, period selector, and Export CSV button in the header

### Result
The Analytics page will be a pixel-perfect visual match of the Dashboard Home grid, with the only difference being the Analytics header toolbar (date filters + export).
