

## Rebuild Buyer Analytics to Match Seller Analytics Layout Exactly

### What Changes
The Buyer Analytics currently has a different layout and chart structure from the Seller Analytics. This plan will rebuild BuyerAnalytics to use the **exact same layout, cards, charts, and flow** as the Seller Analytics -- just with buyer-relevant labels (e.g., "Total Spent" instead of "Today's Sale").

### Current Differences

| Feature | Seller Analytics | Buyer Analytics (Current) |
|---------|-----------------|--------------------------|
| Stats Grid | 4 cards in 1 row (Today's Order, Today's Sale, Total Balance, Returns) | 4 cards (Total Spent, Total Orders, Avg Order, This Month) |
| Main Chart Row | 2/3 width bar chart + 1/3 quick stats (2x2 grid) | 2-column: bar chart + pie chart |
| Second Row | 3-column: Order Status donut + Top Products + Revenue by Day | Separate monthly trend bar chart |
| Header Controls | Date picker + Period dropdown + Export (right-aligned) | Same style (already matching) |

### Target Layout (Copy from Seller Analytics)

**Row 1: 4 Stat Cards** (already similar, keep buyer labels)
- Total Spent (with % change vs last period)
- Total Orders
- Avg Order Value  
- This Month spending

**Row 2: Main Content (3-column grid)**
- **2/3 width**: Spending Details bar chart (orange bars, same chart config as Seller)
- **1/3 width**: Quick Stats 2x2 grid with:
  - Products Purchased count
  - Wishlist Items count
  - Completion Rate %
  - Customer Rating (star display)

**Row 3: Second Content (3-column grid)**  
- Order Status donut chart (Completed/Delivered/Pending/Refunded)
- Top Products purchased (ranked list with amounts)
- Spending by Day of Week (horizontal bar chart)

### File to Update

**`src/components/dashboard/BuyerAnalytics.tsx`** -- Full rewrite to match Seller Analytics structure:
1. Add missing imports (AreaChart, PieChart, Cell, etc.)
2. Add day-of-week and status breakdown data calculations
3. Add StatCard and QuickStatItem inline components (same as Seller)
4. Restructure JSX layout to match Seller's 3-column grid pattern
5. Match all chart configurations (colors, tooltips, borders, padding)
6. Keep all existing buyer data fetching logic unchanged

### Design Consistency
- All stat cards: `bg-white border rounded p-8`, text-4xl values, text-base labels
- All chart containers: `bg-white rounded-lg border p-6`
- Quick stat items: `bg-white border rounded p-8`
- Header controls: Already matching (date picker + period + export)
- Font: Inter family throughout
- Chart colors: Orange (#F97316) for main bar, Blue (#3B82F6) for secondary, Green (#10B981) for success

