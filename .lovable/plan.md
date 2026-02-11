

## Redesign Buyer and Seller Dashboard Home to Match EzMart HTML Design

Copy the exact layout, cards, charts, text, and visual schema from the provided HTML file into both `BuyerDashboardHome.tsx` and `SellerDashboard.tsx`. No changes to Header or Sidebar -- only the dashboard content area.

### Design Schema from HTML (to be replicated exactly)

The dashboard uses a **4-column grid** layout with these sections:

1. **Row 1 -- 4 Stat Cards** (1 column each):
   - Total Sales: `$983,410`, `+3.34% vs last week`, orange dollar icon
   - Total Orders: `58,375`, `-2.89% vs last week`, gray cart icon
   - Total Visitors: `237,782`, `+8.02% vs last week`, gray user icon
   - (4th column is occupied by Top Categories spanning 2 rows)

2. **Row 2 -- Revenue Analytics (span 2 cols) + Monthly Target (span 1 col) + Top Categories continues**:
   - Revenue Analytics: dual-line chart (solid orange = Revenue, dashed light orange = Orders), "Last 8 Days" dropdown, date axis labels
   - Monthly Target: semi-circle gauge at 85%, "+8.02%", "Great Progress!" message, Target vs Revenue stats in orange background box

3. **Row 3 -- Active User (span 1 col) + Conversion Rate (span 2 cols) + Traffic Sources (span 1 col)**:
   - Active User: 2,758 total, country progress bars (US 36%, UK 24%, Indonesia 17.5%, Russia 15%)
   - Conversion Rate: 5-column funnel (Product Views 25K, Add to Cart 12K, Checkout 8.5K, Purchases 6.2K, Abandoned 3K) with gradient funnel bars
   - Traffic Sources: segmented bar + list (Direct 40%, Organic 30%, Social 15%, Referral 10%, Email 5%)

4. **Top Categories** (right column, spans 2 rows): donut chart with center text "$3.4M Total Sales", category list (Electronics, Fashion, Home & Kitchen, Beauty & Care)

### Color System
- Background: `#f4f5f7`
- Cards: `#ffffff`, border-radius 16px, padding 24px
- Primary orange: `#FF7F00`
- Orange shades: `#FDBA74`, `#FED7AA`, `#FFEDD5`, `#FFC482`, `#FFB362`, `#FF9F42`
- Text main: `#1F2937`, Text muted: `#6B7280`
- Success green: `#10B981`, Danger red: `#EF4444`

### Technical Implementation

#### File 1: `src/components/dashboard/BuyerDashboardHome.tsx`
- **Remove**: GettingStartedSection, ActivityStatsSection, old stat cards, quick actions grid, old recent orders, old quick stats
- **Replace with**: Exact EzMart grid layout with all 9 cards
- **Keep**: All data fetching logic, caching, session handling, error states, loading skeleton
- **Map data**: wallet balance to "Total Sales", order count to "Total Orders", etc.
- **Charts**: Use Recharts (already installed) for Revenue Analytics line chart, and SVG for gauge/donut/funnel
- **Same text**: Use the exact same labels, values format, and percentages from the HTML

#### File 2: `src/components/seller/SellerDashboard.tsx`
- **Remove**: Current stat cards, quick actions, performance metrics row, current revenue chart, top products/recent orders
- **Replace with**: Same EzMart grid layout with all 9 cards
- **Keep**: All data fetching, metrics calculation, date range picker, export, share store modal
- **Map data**: seller revenue to "Total Sales", seller orders to "Total Orders", etc.
- **Charts**: Same Recharts line chart and SVG components as buyer

#### File 3: New shared component `src/components/dashboard/EzMartDashboardGrid.tsx`
- Shared reusable component for the 4-column dashboard grid
- Contains: `Dashboard_StatCard`, `Dashboard_RevenueChart`, `Dashboard_MonthlyTarget`, `Dashboard_TopCategories`, `Dashboard_ActiveUsers`, `Dashboard_ConversionRate`, `Dashboard_TrafficSources`
- Props for dynamic data while keeping the exact same visual layout
- All SVG gauges, donuts, and funnels built inline (matching HTML exactly)

### What Will NOT Change
- Header / TopBar components
- Sidebar components
- Mobile navigation
- Routing structure
- Data fetching / API calls
- Session management
- Context providers
