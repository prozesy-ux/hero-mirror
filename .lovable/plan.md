

## Use Exact HTML Static Data in Dashboard Grid

The current `EzMartDashboardGrid` component structure and styling already matches the HTML. The problem is it pulls dynamic values through props. The user wants the **exact same data values from the HTML** hardcoded -- no dynamic data mapping.

### What Changes

**File: `src/components/dashboard/EzMartDashboardGrid.tsx`**
- Hardcode all stat card values exactly as HTML: `$983,410`, `58,375`, `237,782`
- Hardcode all badge values: `+3.34%`, `-2.89%`, `+8.02%`
- Remove the `data.formatAmount()` and `data.totalOrders.toLocaleString()` calls from stat cards
- Keep the `DashboardStatData` interface and props for future use, but render static HTML values for now
- All other sub-components (Revenue Chart, Monthly Target, Active Users, Conversion Rate, Traffic Sources) already use hardcoded HTML-matching values -- no changes needed there

**File: `src/components/dashboard/BuyerDashboardHome.tsx`**
- No changes needed -- the grid component will ignore dynamic data and show HTML values

**File: `src/components/seller/SellerDashboard.tsx`**
- No changes needed -- same grid, same static values

### What Does NOT Change
- Sidebar, Header, mobile navigation -- untouched
- All data fetching, caching, session logic -- untouched
- Grid layout, card styling, SVG charts, colors, fonts -- already match HTML
- Routing and context providers -- untouched

### Summary
Only the 3 stat card values and their badge percentages need to be hardcoded to match the HTML exactly. Everything else in the component already matches the HTML source.
