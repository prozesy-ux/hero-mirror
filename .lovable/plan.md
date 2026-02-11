

# Apply EzMart Dashboard Design to Seller and Buyer Dashboards

## Reference Design Analysis

The uploaded EzMart HTML defines a warm, professional dashboard with these exact design specifications:

### Color System
- Background: `#F5F1ED` (warm beige)
- Cards: `white` with `1px solid #F0F0F0` border
- Primary accent: `#FF8A00` (orange) with gradient shades: `#FF9933`, `#FFB366`, `#FFCC99`, `#FFE5CC`
- Text: `#333` primary, `#666` secondary, `#999` muted
- Positive change: `#10B981` green
- Negative change: `#EF4444` red

### Layout Rules
- Sidebar: `240px` wide, white bg, fixed, orange active state with `box-shadow: 0 4px 12px rgba(255, 138, 0, 0.3)`
- Top bar: `80px` height, white, sticky, search + notifications + user profile
- Content: `32px` padding, `24px` grid gaps
- Cards: `12px` border-radius, `24px` padding, hover: `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08)` + `translateY(-2px)`

### Card Components
- Stats cards: 3-column grid, icon box (`48x48`, `#FF8A00` bg, white icon), title (`14px`, `#666`), value (`28px`, bold), change indicator
- Highlight card: `background: #FFECD1`
- Small stat cards: 4-column grid, colored icon boxes, `24px` value

### Charts (using Recharts equivalents)
- Revenue Analytics: Line chart (2fr width), solid + dashed lines, orange palette
- Monthly Target: Circular SVG progress (85%), info box with `#FFF5EB` bg
- Active Users: Progress bars by country, orange gradient fills
- Conversion Rate: Vertical bar chart, 5-step funnel stats
- Top Categories: Donut chart with center text
- Traffic Sources: Horizontal bar chart with legend

### Typography
- Page title: `32px`, `700` weight
- Card value: `28px`, `700` weight
- Chart title: `18px`, `600` weight
- Labels: `14px`, `500` weight
- Small text: `12px`

---

## What Changes (Design Only -- NO Logic Changes)

All existing data fetching, metrics calculations, context usage, and business logic remain **completely untouched**. Only CSS classes and JSX structure change.

---

## Files to Modify

### 1. `src/components/seller/SellerDashboard.tsx` (Seller Home)

Restyle the entire seller dashboard home to match EzMart layout:

- **Stats Row**: Change from 4-column `StatCard` components to 3-column EzMart-style cards with orange icon boxes (`48x48`, rounded-lg, `#FF8A00` bg), `28px` values, and `+/-` change indicators below
- **Quick Actions**: Restyle from neobrutalism cards to EzMart `small-stat-card` style (white, `12px` radius, subtle hover shadow)
- **Performance Metrics**: Replace the 3-column completion/status/monthly row with:
  - Left (2fr): Revenue Trend chart stays but gets EzMart styling (white card, `12px` radius, chart header with orange filter button, legend dots)
  - Right (1fr): Monthly Target circular progress widget (SVG circle, `85%` center text, info box with warm orange bg, target/revenue stats grid)
- **Top Products**: Restyle progress bars to use orange gradient fills (`#FF8A00` to `#FFE5CC`)
- **Recent Orders**: Keep list but update to EzMart card styling (white, subtle border, hover shadow)
- **Add 4-column bottom stats row**: Avg Order Value, Return Rate, Customer Satisfaction, Active Products -- styled as `small-stat-card` with colored icon boxes

### 2. `src/components/dashboard/BuyerDashboardHome.tsx` (Buyer Home)

Apply same EzMart design pattern:

- **Remove** `GettingStartedSection` and `ActivityStatsSection` (Gumroad-specific components)
- **Add** EzMart-style page title: `"Dashboard"` at `32px` bold
- **Stats Row**: 3-column EzMart cards for Wallet Balance, Total Spent, Total Orders -- with orange icon boxes and change indicators
- **Main Content**: 2fr:1fr grid with:
  - Left: Spending trend chart (recharts AreaChart) with EzMart styling
  - Right: Monthly summary circular progress or order breakdown
- **Quick Actions**: 3-column row with EzMart hover style (shadow + translateY)
- **Recent Orders**: Same data, EzMart card style
- **Bottom Stats**: 4-column `small-stat-card` row for Completed/Pending/Wishlist/Delivered

### 3. `src/components/seller/SellerAnalytics.tsx` (Seller Analytics)

- **Stats cards**: Replace local `StatCard` component with EzMart 3-column style (orange icon boxes)
- **Sales Details chart**: Keep BarChart but update card styling to EzMart (white, `12px` radius, chart header with filter button)
- **Quick Stats**: Change from 2x2 grid to EzMart `small-stat-card` 4-column layout with colored icon boxes
- **Day-of-week and status charts**: Apply EzMart card wrapper styling
- **Top Products table**: Use EzMart category-list style with colored dots

### 4. `src/components/dashboard/BuyerAnalytics.tsx` (Buyer Analytics)

- **Stats cards**: 3-column EzMart style with orange icon boxes
- **Charts**: Apply EzMart card wrapper, chart headers, orange filter buttons
- **Category breakdown**: Use EzMart donut chart style with center text and category list below
- **Monthly trend**: EzMart horizontal bar or vertical bar with orange palette

### 5. `src/components/marketplace/StatCard.tsx` (Shared StatCard)

Add a new variant `variant="ezmart"` to the StatCard component:
- White bg, `12px` border-radius, `24px` padding
- Orange icon box (`48x48`) in top-right
- Title at `14px` `#666`, value at `28px` bold
- Change indicator with green/red colors
- Hover: `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08)` + `translateY(-2px)`
- Optional `highlight` prop for `#FFECD1` background

### 6. `src/components/seller/SellerSidebar.tsx` (Seller Sidebar)

Restyle from black Gumroad sidebar to EzMart white sidebar:
- Background: `white` with `border-right: 1px solid #E5E5E5`
- Width: `240px` (currently `208px`/`w-52`)
- Logo: Dark text on white bg
- Nav items: `#666` text, `8px` border-radius, hover: `#F5F5F5` bg + `translateX(4px)`
- Active: `#FF8A00` bg, white text, orange box shadow
- Bottom section: `border-top: 1px solid #F0F0F0`

### 7. `src/components/dashboard/DashboardSidebar.tsx` (Buyer Sidebar)

Same EzMart white sidebar styling as seller:
- White bg, dark text navigation
- Orange active state
- Hover translateX animation

### 8. `src/components/seller/SellerTopBar.tsx` (Seller Top Bar)

- Background: `white` (from `#FBF8F3`)
- Height: `80px` (from `64px`)
- Search box: `#F5F5F5` bg, no border, `8px` radius
- Icon buttons: Transparent bg, hover `#F5F5F5`, `scale(1.1)` on hover
- Notification dot: Red (`#EF4444`)
- User profile section: Avatar + name + role + chevron

### 9. `src/components/dashboard/DashboardTopBar.tsx` (Buyer Top Bar)

Same EzMart top bar styling as seller:
- White bg, `80px` height
- Consistent icon button and notification styling

### 10. `src/pages/Dashboard.tsx` and `src/pages/Seller.tsx`

- Update background color from `#FBF8F3` to `#F5F1ED`
- Update sidebar width offset from `lg:ml-52`/`lg:ml-[72px]` to `lg:ml-[240px]`/`lg:ml-[72px]`

---

## Design Tokens Summary

All components will use these consistent values:

```text
Background:     #F5F1ED
Card bg:        white
Card border:    1px solid #F0F0F0
Card radius:    12px
Card padding:   24px
Card hover:     shadow 0 8px 24px rgba(0,0,0,0.08) + translateY(-2px)

Accent:         #FF8A00
Accent shades:  #FF9933, #FFB366, #FFCC99, #FFE5CC
Highlight bg:   #FFECD1
Info box bg:    #FFF5EB

Text primary:   #333333
Text secondary: #666666
Text muted:     #999999

Sidebar width:  240px (expanded), 72px (collapsed)
Topbar height:  80px
Content pad:    32px
Grid gap:       24px
```

## What Does NOT Change

- All data fetching logic (BFF API calls, Supabase queries)
- All context usage (SellerContext, AuthContext, CurrencyContext)
- All metrics calculations and useMemo blocks
- All routing and navigation paths
- All real-time subscriptions
- All export/download functionality
- All modals (ShareStore, etc.)
- Mobile navigation components
- Session management logic
