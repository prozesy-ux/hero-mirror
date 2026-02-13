
## Apply eShop Dashboard Design to Buyer and Seller Dashboards

### What Changes
Replace the current EzMart cream/orange design system in the dashboard grid with the eShop light theme from the uploaded HTML. The left panel (sidebar) is NOT touched.

### Design Token Changes

| Token | Current (EzMart) | New (eShop) |
|-------|-------------------|-------------|
| Page background | `#F3EAE0` (cream) | `#f1f5f9` (slate-100) |
| Card background | `#ffffff` | `#ffffff` (same) |
| Card border-radius | `16px` (rounded-2xl) | `4px` (sharp) |
| Card shadow | `0 1px 3px rgba(0,0,0,0.05)` | none |
| Card border | none | `1px solid #e2e8f0` |
| Primary accent | `#FF7F00` (orange) | `#3b82f6` (blue) |
| Accent tint bg | `#fff7ed` (orange-50) | `rgba(59,130,246,0.1)` (blue tint) |
| Success | `#10b981` | `#10b981` (same) |
| Danger | `#ef4444` | `#ef4444` (same) |
| Warning | `#f59e0b` | `#f59e0b` (same) |
| Text primary | `#1f2937` | `#0f172a` |
| Text secondary | `#6b7280` | `#64748b` |
| Font | Inter | Inter (same) |

### Stat Card Layout Change
- Current: Icon top-right, label top-left, value below, change at bottom
- New (eShop): Label top-left as uppercase 12px, value 24px/600 weight, link text below value ("View net earnings"), icon box 40x40 at absolute bottom-right with colored tint background
- Each stat card gets a unique icon color: Success (green/dollar), Primary (blue/shopping-bag), Warning (yellow/user), Danger (red/wallet)

### Revenue Chart Change
- Current: SVG line chart with orange stroke, dropdown filter
- New (eShop): Bar chart with blue bars, time filter tabs (ALL/1W/1M/6M/1Y) as pill selector, sub-stats row showing Orders/Earning/Refunds/Conversion Ratio in a gray band, tooltip on hover bar

### Active Users / Location Card Change
- Current: "Active User" with country progress bars
- New (eShop): "Sales by Locations" with map placeholder area, "Area Report" blue button, progress bars for regions (South America, North America, Europe, etc.)

### Files Modified (3 files)

**File 1: `src/components/dashboard/EzMartDashboardGrid.tsx`** (main changes)
- `Dashboard_StatCard`: Change borderRadius from 16px to 4px, remove boxShadow, add `border: 1px solid #e2e8f0`, reposition icon to absolute bottom-right 40x40 box, add stat-link underline text, uppercase 12px label, use eShop color mapping per card type
- `Dashboard_TopCategories`: borderRadius 4px, border instead of shadow
- `Dashboard_RevenueChart`: Replace SVG line chart with bar chart, replace dropdown with pill time-filter tabs (ALL/1W/1M/6M/1Y), add revenue-substats row (4 columns: Orders/Earning/Refunds/Conversion), accent from orange to blue, tooltip dark background
- `Dashboard_MonthlyTarget`: borderRadius 4px, border, blue accent instead of orange
- `Dashboard_ActiveUsers`: borderRadius 4px, border, progress bar color to blue, title "Sales by Locations"
- `Dashboard_ConversionRate`: borderRadius 4px, border
- `Dashboard_TrafficSources`: borderRadius 4px, border
- `Dashboard_RecentOrders`: borderRadius 4px, border, category button from orange to blue
- `Dashboard_RecentActivity`: borderRadius 4px, border
- Main grid wrapper: fontFamily stays Inter

**File 2: `src/components/dashboard/BuyerDashboardHome.tsx`**
- Change page background from `#F3EAE0` to `#f1f5f9`
- Change Export button from `bg-[#FF7F00]` to `bg-[#3b82f6]`
- Loading skeleton background from `#F3EAE0` to `#f1f5f9`

**File 3: `src/components/seller/SellerDashboard.tsx`**
- Change page background from `#F3EAE0` to `#f1f5f9`
- Change "Share Store" button from `bg-[#FF7F00]` to `bg-[#3b82f6]`
- Loading skeleton background from `#F3EAE0` to `#f1f5f9`
- Header text colors updated to match eShop palette

### What Stays the Same
- Left panel / sidebar: completely untouched
- All data fetching, contexts, BFF endpoints
- All wallet/billing sections (separate design)
- Mobile navigation
- Functional logic (date filters, export CSV, realtime)
- Seller Analytics deep sections (they use their own card styling)
- Buyer Analytics (uses EzMartDashboardGrid, so inherits changes automatically)
