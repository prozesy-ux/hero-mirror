

## Fix Buyer Dashboard: Date Filter, Monthly Target, and Improve Cards

### Issues Found

1. **Revenue Analytics date filter not working**: The Buyer Dashboard has NO date picker or period selector -- unlike the Seller Dashboard which has a full date range picker + period dropdown (7d/30d/90d/custom). The Revenue chart just hardcodes last 30 days with no way to change it.

2. **Monthly Target overlay issue**: The SVG gauge has `overflow: hidden` on a 100px-tall container displaying a 180px SVG, causing clipping. The percentage text and progress info overlap.

3. **"Total Visitors" irrelevant for buyer**: This stat card shows wishlist count labeled as "visitors" which makes no sense for a buyer. Should be replaced with "Wallet Balance" -- the most relevant buyer metric.

### Changes

#### File 1: `src/components/dashboard/BuyerDashboardHome.tsx`
- Add date range picker + period selector (7d/30d/90d/custom) matching the Seller Dashboard header exactly
- Add Export button for order data
- Add `filteredOrders` state that filters orders by selected date range
- Recalculate all metrics (dailyRevenue, topCategories, conversionFunnel, stats) based on filtered orders instead of all orders
- Replace "Total Visitors" (3rd stat card) with "Wallet Balance" showing real wallet balance
- Add welcome header with user greeting

#### File 2: `src/components/dashboard/EzMartDashboardGrid.tsx`
- Fix Monthly Target gauge: increase container height from 100px to 110px, remove `overflow: hidden`, adjust SVG positioning so the arc and percentage text don't overlap
- Fix the Target/Revenue summary box at the bottom to have proper spacing and not overlap the gauge
- Add `walletBalance` optional field to `DashboardStatData` interface
- Allow the 3rd stat card label to be customizable (pass label/value from parent) so Buyer can show "Wallet Balance" while Seller shows "Total Visitors"

### Technical Details

**Date Filter Implementation** (copied from SellerDashboard):
- `period` state: `'7d' | '30d' | '90d' | 'custom'`
- `dateRange` state: `DateRange` from react-day-picker
- `Calendar` component with `mode="range"` and `pointer-events-auto`
- `Select` dropdown for quick period switching
- `filteredOrders = orders.filter(o => orderDate >= from && orderDate <= to)`
- All computed metrics (dailyRevenue, topCategories, conversionFunnel, stats) recalculated from `filteredOrders`

**Monthly Target Fix**:
- Container: change from `height: '100px'` to `height: '110px'`, remove `overflow: hidden`
- Add `marginBottom: '8px'` between gauge and summary section
- Ensure percentage text `position: absolute; bottom: 0` sits cleanly below the arc

**3rd Stat Card Change**:
- Add optional `thirdCardLabel` and `thirdCardValue` to `DashboardStatData`
- Buyer passes: label="Wallet Balance", value=formatted wallet balance
- Seller keeps: label="Total Visitors", value=view count
- Falls back to existing `totalVisitors` if custom fields not provided

