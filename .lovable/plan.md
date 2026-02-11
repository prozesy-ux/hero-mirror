

## Rewrite EzMartDashboardGrid to Exactly Match HTML

The current component has many deviations from the HTML file. This plan rewrites `EzMartDashboardGrid.tsx` to be a pixel-perfect copy.

### All Differences Found (Current vs HTML)

**1. Stat Cards**
- HTML: Label TOP-LEFT, icon TOP-RIGHT (36x36px, 8px radius). Value is 28px font. Badge is plain text "+3.34%" (no pill background, no TrendingUp/Down icons). Period text "vs last week" inline after badge.
- Current: Icon LEFT in 48px circle, badge RIGHT in pill with arrow icons. Value is 24px. Period on separate line.

**2. Top Categories**
- HTML: Has "See All" link in header. Donut uses `<circle>` with `stroke-dasharray` and `rotate(-90deg)`. Center text uses absolute positioned div (not SVG text). Category list shows dollar amounts ($1,200,000) not percentages. Dots are square (2px border-radius).
- Current: No "See All". Uses arc paths. SVG text center. Shows percentages. Round dots.

**3. Revenue Analytics**
- HTML: Has orange filled "Last 8 Days" dropdown button (bg orange, white text). Chart is raw SVG with hand-drawn path curves and a tooltip bubble showing "$14,521". X-axis: "12 Aug" to "19 Aug". Y-axis: 16K/12K/8K/4K/0.
- Current: Uses Recharts LineChart with legend. No dropdown button.

**4. Monthly Target**
- HTML: Has "..." (more-horizontal) icon instead of percentage badge. Gauge uses `<circle>` with stroke-dasharray inside rotated SVG. Text below says "Great Progress!" with party emoji, then "Our achievement increased by $200,000; let's reach 100% next month." Target shows "$600.000" / "$510.000".
- Current: Has percentage badge with TrendingUp. Uses arc paths. Different text. Shows dynamic amounts.

**5. Active Users**
- HTML: Has "..." icon. Shows "Users" label with "+8.02%" green badge floating right. No flags. Progress bar colors alternate: #f97316, #fdba74, #f97316, #fed7aa. 6px height bars.
- Current: Has flags. All bars same orange. 8px bars. No "Users" subtitle or badge.

**6. Conversion Rate**
- HTML: Has "This Week" dropdown button. 5-column grid showing label (with line breaks), then large value (25,000 not 25K), then small green/red badge (+9%, -5%). Below: funnel bars 100px tall with specific colors (#ffe4c2, #ffd4a2, #ffc482, #ffb362, #ff9f42), rounded top corners only.
- Current: Single row with gradient bars and percentage-based heights. Values show "25K" shorthand. No badges.

**7. Traffic Sources**
- HTML: Has "..." icon. Bars are 50px tall (not 3px). Colors: #ffedd5, #fed7aa, #fdba74, #fb923c, #f97316. Labels: "Direct Traffic", "Organic Search", "Social Media", "Referral Traffic", "Email Campaigns". Dots are square (2px radius).
- Current: 12px thin bar. Different colors. Short labels. Round dots.

**8. Grid Gap**
- HTML: 24px gap. Current: 20px (gap-5).

### Changes

**File: `src/components/dashboard/EzMartDashboardGrid.tsx`** -- Full rewrite

Every sub-component will be rewritten to match the HTML exactly:

- `Dashboard_StatCard`: Label top-left, 36x36 icon top-right (8px radius), 28px value, plain text badge (no pills/arrows), inline "vs last week"
- `Dashboard_RevenueChart`: Remove Recharts, use pure SVG paths matching HTML curves exactly. Orange "Last 8 Days" button. Tooltip bubble at the specific point. Y-axis labels. X-axis "12 Aug" through "19 Aug"
- `Dashboard_MonthlyTarget`: More-horizontal icon. Circle-based gauge with rotate(-90deg). Exact text with emoji and "$200,000" message. Static "$600.000" / "$510.000"
- `Dashboard_TopCategories`: "See All" link. Circle-based donut with stroke-dasharray. Absolute-positioned center text div. Dollar amounts in list. Square dots
- `Dashboard_ActiveUsers`: More-horizontal icon. "Users" subtitle with floating "+8.02%" badge. No flags. Alternating bar colors. 6px bars
- `Dashboard_ConversionRate`: "This Week" dropdown. 5-column grid with full numbers (25,000), green/red badges. Funnel bars with specific colors and 100px height
- `Dashboard_TrafficSources`: More-horizontal icon. 50px tall segmented bars. Specific colors. Full labels. Square dots
- Grid gap: 24px

**File: `src/components/dashboard/BuyerDashboardHome.tsx`** -- Update data props

- Update `trafficSources` colors to match HTML (#ffedd5, #fed7aa, #fdba74, #fb923c, #f97316) and full labels ("Direct Traffic", "Organic Search", etc.)
- Update `conversionFunnel` to include full numbers and badge values
- Remove flags from `activeUsersByCountry`, add bar colors
- Update `topCategories` to include dollar amounts

**File: `src/components/seller/SellerDashboard.tsx`** -- Same data prop updates as buyer

### What Does NOT Change
- Header, Sidebar, mobile navigation -- untouched
- All data fetching, caching, session logic -- untouched
- Routing, context providers -- untouched
