

## Redesign Seller Analytics to Match Dashboard Home Card Style

### What Changes

Replace the current recharts-based Analytics page with the same EzMart dashboard grid design system used on the Dashboard Home page. This means using the same raw SVG charts, inline style cards, and layout patterns from `EzMartDashboardGrid.tsx`.

### Current vs New

**Current Analytics Page**: Uses recharts library (BarChart, PieChart, AreaChart) with Tailwind classes, has a different visual feel from the dashboard home.

**New Analytics Page**: Will use the same raw SVG-based charts and inline style cards as the Dashboard Home -- Revenue Analytics line chart, Monthly Target gauge, Top Categories donut, Conversion Rate funnel, Active Users, and Order Breakdown sections.

### New Layout Structure

```text
Row 1: [Total Sales] [Total Orders] [Total Balance] [Top Categories (spans 2 rows)]
Row 2: [Revenue Analytics (2 cols)]              [Monthly Target]  [    ...continued    ]
Row 3: [Active Users] [Conversion Rate (2 cols)]                   [Order Breakdown]
```

### Sections (matching screenshot exactly)

1. **Stat Cards (3)**: Total Sales (with % change vs last week), Total Orders (with % change), Total Visitors/Balance (with % change) -- same card component as Dashboard Home
2. **Top Categories**: Donut chart with product category breakdown and legend -- same SVG donut as Dashboard Home
3. **Revenue Analytics**: SVG line chart with orange filter dropdown (Last 7/14/30 Days, All Time) -- same component as Dashboard Home
4. **Monthly Target**: Semicircular gauge showing monthly progress % -- same gauge as Dashboard Home
5. **Active Users**: Count with country breakdown bars -- same as Dashboard Home
6. **Conversion Rate**: Product Views, Total Orders, Pending, Completed, Cancelled with funnel bars -- same as Dashboard Home
7. **Order Breakdown**: Horizontal stacked bar + legend percentages -- same as Dashboard Home

### Technical Plan

**File: `src/components/seller/SellerAnalytics.tsx`** (full rewrite)

- Remove all recharts imports (AreaChart, BarChart, PieChart, etc.)
- Import `EzMartDashboardGrid` and its `DashboardStatData` interface from the existing grid component
- Keep the existing data computation logic (date range filtering, period selection, export button, avg rating fetch)
- Instead of rendering custom recharts, compute and pass data into `EzMartDashboardGrid` using the same `DashboardStatData` shape:
  - `totalSales` = filtered period total earnings
  - `totalOrders` = filtered period order count  
  - `totalVisitors` = unique buyer count from filtered orders
  - `topCategories` = top products mapped as categories with colors
  - `dailyRevenue` = daily revenue array for the SVG line chart
  - `monthlyTarget` / `monthlyRevenue` = computed from current vs previous month
  - `conversionFunnel` = Product Views, Total Orders, Pending, Completed, Cancelled
  - `activeUsers` = unique buyers with country breakdown
  - `recentOrders` / `recentActivity` = from filtered orders
- Keep the header with date range picker, period selector, and Export button above the grid
- Render `<EzMartDashboardGrid data={dashboardData} />` for the main content

This reuses the existing pixel-perfect EzMart grid component rather than duplicating its code, ensuring the Analytics page looks identical to the Dashboard Home while showing analytics-specific filtered data.

