

## Unify Seller Analytics Design with Buyer Analytics + Add Deep Analytics Features

### Overview
Two major goals:
1. Apply the same clean design from SellerAnalytics (EzMart Dashboard Grid) to BuyerAnalytics -- replacing its current custom recharts-based layout with the unified `EzMartDashboardGrid` component
2. Expand SellerAnalytics with deep analytics features: per-product analytics, store-level reports, page view tracking, traffic sources, and comprehensive data sections

---

### Part 1: BuyerAnalytics -- Same Design as SellerAnalytics

**File: `src/components/dashboard/BuyerAnalytics.tsx`**

Currently BuyerAnalytics uses custom `StatCard`, `QuickStatItem` components, recharts `BarChart`/`PieChart` directly. The SellerAnalytics uses the unified `EzMartDashboardGrid` component with the standardized cream background, EzMart 4-column grid, and SVG charts.

Changes:
- Remove all inline recharts components (BarChart, PieChart, etc.) and custom StatCard/QuickStatItem components
- Import and use `EzMartDashboardGrid` with `DashboardStatData` (same as SellerAnalytics)
- Wrap in `bg-[#F3EAE0] min-h-screen p-8` cream background (matching seller)
- Map buyer data to the `DashboardStatData` interface:
  - `totalSales` = totalSpent
  - `totalOrders` = order count
  - `totalVisitors` = unique products bought
  - `thirdCardLabel` = "Completion Rate" / `thirdCardValue` = percentage
  - `topCategories` = top products by spending
  - `activeUsers` = total orders (buyer perspective)
  - `activeUsersByCountry` = spending by day of week (repurposed)
  - `conversionFunnel` = order status funnel (Pending, Delivered, Completed, Refunded)
  - `trafficSources` = order status breakdown
  - `dailyRevenue` = daily spending data
  - `recentOrders` = recent purchases
- Keep the same header toolbar (date range picker, period selector, Export button) but update Export button to `bg-[#FF7F00]` orange (matching seller)
- Add title "Analytics" with subtitle "Track your purchase history" (matching seller header style)

---

### Part 2: SellerAnalytics -- Deep Analytics Expansion

**File: `src/components/seller/SellerAnalytics.tsx`**

Add new sections BELOW the existing `EzMartDashboardGrid` to provide deep analytics. These sections use real data from `productAnalytics`, `trafficAnalytics`, `buyerCountries`, and orders already available in `SellerContext`.

#### Section 1: Per-Product Performance Table
A sortable table showing each product's individual metrics:
- Product name + icon
- Views (from `product_analytics`)
- Clicks (from `product_analytics`)
- Purchases (from `product_analytics`)
- Revenue (from `product_analytics`)
- Conversion Rate (purchases/views %)
- Data filtered by the existing date range picker

#### Section 2: Traffic Sources Breakdown
A card showing traffic source distribution from `seller_traffic_analytics.source`:
- Horizontal bar chart showing Direct, Social, Organic, Referral percentages
- Total page views and unique visitors stats
- Source trend over time (daily page views grouped by source)

#### Section 3: Geographic Distribution (Buyer Countries)
An expanded country breakdown card:
- Top 10 countries with percentage bars (from `buyerCountries`)
- Total unique buyers count
- Country-specific order count and revenue

#### Section 4: Store Health Summary
Quick metrics card showing:
- Average Rating (already fetched, currently only in header)
- Total lifetime views (sum of all `product_analytics.views`)
- Click-through rate (total clicks / total views)
- Purchase conversion rate (total purchases / total clicks)
- Revenue per view metric

#### Section 5: Time-Based Trends
- Views over time chart (daily views from `product_analytics` aggregated)
- Clicks over time overlaid
- Peak hours / peak days analysis from order timestamps

All new sections use the existing cream background (`bg-[#F3EAE0]`), white cards with `bg-white rounded-2xl shadow-sm p-6`, and the orange accent color (`#FF7F00`) -- matching the current EzMart design system.

---

### Files Modified

| File | Changes |
|------|---------|
| `src/components/dashboard/BuyerAnalytics.tsx` | Full rewrite to use `EzMartDashboardGrid`, cream background, orange export button, matching seller layout |
| `src/components/seller/SellerAnalytics.tsx` | Add 5 new deep analytics sections below existing grid using real context data |

### What Stays the Same
- `EzMartDashboardGrid` component is NOT modified
- BFF endpoint is NOT modified (all data already available)
- `SellerContext` is NOT modified (analytics data already exposed)
- Header toolbar (date range, period selector, export) keeps same functionality
- All existing EzMart grid sections (Revenue chart, Monthly Target, Funnel, etc.) remain unchanged

