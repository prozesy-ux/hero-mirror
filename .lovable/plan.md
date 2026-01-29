
# Seller Dashboard Redesign - ScatterPie Analytics Style

## Overview

This plan redesigns the Seller Dashboard to exactly match the ScatterPie Analytics reference image. Using only real outlet data from the existing BFF endpoints, no mock data.

---

## Reference Image Analysis (ScatterPie Analytics)

### Top Row - 5 Stat Cards
| Card | Label | Value Format | Icon | Change Indicator |
|------|-------|--------------|------|------------------|
| 1 | Revenue (in Lacs) | ₹ 1,7043.99 | None | ↘ 65.23% Than Last Week (red) |
| 2 | Outstanding (in Lacs) | ₹ 3,348.78 | None | ↗ 65.23% Than Last Week (green) |
| 3 | Target Quantity | ₹ 346,146 | None | No indicator |
| 4 | Dispatch Quantity | 550,131 | Truck icon (left) | ↘ 5648 Than Last Week (red) |
| 5 | Target Achieved | 159% | Target icon (left) | ↗ 0.00% Than Last Week |

**Stat Card Style:**
- White background with subtle left border accent (coral/orange)
- Small gray label at top (11px)
- Large bold value (28-32px)
- Green/red percentage change with arrow below

### Second Row - 3 Section Cards
| Section | Type | Style |
|---------|------|-------|
| Payment Deliquancy Bucket | Stacked horizontal bar | Orange gradient segments with legend |
| Top Performing Distributor | Horizontal bar chart | Coral bars, labels on left, values on right |
| Top Performing Salespersons | Horizontal bar chart | Coral bars, labels on left, values on right |

### Third Row - Year Over Year Growth
- Two white boxes side-by-side showing:
  - FY 2019: 7,618
  - FY 2020: 9,431 (with ↗ 23.80% green indicator)

### Fourth Row - Multi-line Chart + Table
| Section | Description |
|---------|-------------|
| Year Over Year Growth | Line chart with 3 series (FY 2018, FY 2019, FY 2020), circular markers, month labels |
| Top 5 States | Table with columns: States, Dispatch Quantity, Revenue, Outstanding, % of Total Revenue |

### Fifth Row - Grouped Bar Chart + Map
| Section | Description |
|---------|-------------|
| Quarter Over Quarter trend | Grouped vertical bar chart with multiple quarters, legend on right |
| Geographical Analysis | Map showing India with total stats |

---

## Files to Modify

### `src/components/seller/SellerDashboard.tsx`

**Complete redesign to match ScatterPie reference:**

### 1. Top Stat Cards (5 cards in a row)

```tsx
{/* Stat Cards Row - 5 Cards */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
  {/* Revenue */}
  <div className="bg-white rounded-xl p-4 border-l-4 border-l-orange-400 shadow-sm">
    <p className="text-[11px] text-slate-500 font-medium">Revenue</p>
    <p className="text-2xl lg:text-[28px] font-bold text-slate-800 mt-1">
      {formatAmountOnly(totalRevenue)}
    </p>
    <div className="flex items-center gap-1 mt-2 text-[11px]">
      {revenueChange >= 0 ? (
        <>
          <TrendingUp className="h-3 w-3 text-emerald-500" />
          <span className="text-emerald-600 font-medium">{revenueChange.toFixed(2)}%</span>
        </>
      ) : (
        <>
          <TrendingDown className="h-3 w-3 text-red-500" />
          <span className="text-red-600 font-medium">{Math.abs(revenueChange).toFixed(2)}%</span>
        </>
      )}
      <span className="text-slate-400">Than Last Week</span>
    </div>
  </div>
  {/* ... 4 more similar cards */}
</div>
```

### 2. Horizontal Bar Charts - Top Performing Products/Buyers

```tsx
{/* Top Performing Products - Horizontal Bar */}
<div className="bg-white rounded-xl p-5 shadow-sm">
  <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Performing Products</h3>
  <div className="space-y-3">
    {topProducts.map((product, i) => (
      <div key={i} className="flex items-center gap-3">
        <span className="text-xs text-slate-600 w-24 truncate">{product.name}</span>
        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
            style={{ width: `${(product.revenue / maxRevenue) * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-slate-700 w-16 text-right">
          {formatAmountOnly(product.revenue)}
        </span>
      </div>
    ))}
  </div>
</div>
```

### 3. Year Over Year Comparison Boxes

```tsx
{/* Year Over Year Growth Boxes */}
<div className="flex gap-4">
  <div className="bg-white rounded-xl p-4 shadow-sm flex-1">
    <p className="text-xs text-slate-500 font-medium">Last Month</p>
    <p className="text-2xl font-bold text-slate-800 mt-1">{formatAmountOnly(lastMonthRevenue)}</p>
  </div>
  <div className="bg-white rounded-xl p-4 shadow-sm flex-1">
    <p className="text-xs text-slate-500 font-medium">This Month</p>
    <p className="text-2xl font-bold text-slate-800 mt-1">{formatAmountOnly(thisMonthRevenue)}</p>
    <div className="flex items-center gap-1 mt-1">
      <TrendingUp className="h-3 w-3 text-emerald-500" />
      <span className="text-xs font-medium text-emerald-600">{monthlyGrowth.toFixed(2)}%</span>
    </div>
  </div>
</div>
```

### 4. Multi-Line Chart (Year Over Year Growth)

```tsx
{/* Line Chart with Multiple Series */}
<LineChart data={monthlyData}>
  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v/1000}k`} />
  <Line type="monotone" dataKey="thisYear" stroke="#F97316" strokeWidth={2} dot={{ r: 4 }} />
  <Line type="monotone" dataKey="lastYear" stroke="#94A3B8" strokeWidth={2} dot={{ r: 4 }} />
</LineChart>
```

### 5. Top Buyers Table

```tsx
{/* Top Buyers Table */}
<div className="bg-white rounded-xl shadow-sm overflow-hidden">
  <h3 className="text-sm font-semibold text-slate-800 p-4 border-b">Top Buyers</h3>
  <table className="w-full text-sm">
    <thead className="bg-orange-50">
      <tr>
        <th className="text-left p-3 text-xs font-semibold text-slate-600">Buyer</th>
        <th className="text-right p-3 text-xs font-semibold text-slate-600">Orders</th>
        <th className="text-right p-3 text-xs font-semibold text-slate-600">Revenue</th>
        <th className="text-right p-3 text-xs font-semibold text-slate-600">% of Total</th>
      </tr>
    </thead>
    <tbody>
      {topBuyers.map((buyer, i) => (
        <tr key={i} className="border-b border-slate-50">
          <td className="p-3 text-slate-700">{buyer.email}</td>
          <td className="p-3 text-right text-slate-600">{buyer.orderCount}</td>
          <td className="p-3 text-right font-medium text-slate-800">{formatAmountOnly(buyer.revenue)}</td>
          <td className="p-3 text-right">
            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">
              {buyer.percentage.toFixed(2)}%
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 6. Grouped Bar Chart (Period Comparison)

```tsx
{/* Grouped Bar Chart */}
<BarChart data={periodData}>
  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
  <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B' }} />
  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v/1000}k`} />
  <Bar dataKey="currentPeriod" fill="#F97316" radius={[4, 4, 0, 0]} />
  <Bar dataKey="previousPeriod" fill="#FED7AA" radius={[4, 4, 0, 0]} />
</BarChart>
```

---

## Data Sources (Real Outlet Data Only)

| Metric | Source |
|--------|--------|
| Total Revenue | `orders.reduce((sum, o) => sum + o.seller_earning, 0)` |
| Total Orders | `orders.length` |
| Pending Balance | `wallet?.pending_balance` |
| Completed Orders | `orders.filter(o => o.status === 'completed').length` |
| Top Products | Aggregated from `orders` grouped by `product_id` |
| Top Buyers | Aggregated from `orders` grouped by `buyer_id` |
| Monthly Trends | `orders` grouped by month |
| Period Comparison | `orders` filtered by date ranges |

---

## Color Palette (ScatterPie Reference)

| Element | Color |
|---------|-------|
| Primary Accent | `#F97316` (orange-500) |
| Secondary Bar | `#FED7AA` (orange-200) |
| Left Border Accent | `#FB923C` (orange-400) |
| Positive Change | `#10B981` (emerald-500) |
| Negative Change | `#EF4444` (red-500) |
| Table Header BG | `#FFF7ED` (orange-50) |
| Grid Lines | `#E2E8F0` (slate-200) |

---

## Typography (ScatterPie Reference)

| Element | Style |
|---------|-------|
| Card Label | 11px, font-medium, text-slate-500 |
| Card Value | 28px, font-bold, text-slate-800 |
| Change Text | 11px, font-medium, with arrow icon |
| Section Title | 14px, font-semibold, text-slate-800 |
| Table Header | 12px, font-semibold, text-slate-600, uppercase |
| Table Cell | 14px, text-slate-700 |

---

## Layout Structure

```text
┌─────────────────────────────────────────────────────────────────────┐
│  [Revenue]  [Pending]  [Orders]  [Products]  [Completion %]         │
│   5 Stat Cards with left border accent                              │
├─────────────────────────────────────────────────────────────────────┤
│  [Order Status Bar]  │  [Top Products]  │  [Top Buyers]             │
│   Stacked bar        │   Horizontal bar │   Horizontal bar          │
├─────────────────────────────────────────────────────────────────────┤
│  [Last Month] [This Month] ← Year comparison boxes                  │
├─────────────────────────────────────────────────────────────────────┤
│  [Monthly Trend Line Chart]          │  [Top Buyers Table]          │
│   Multi-line with circular markers   │   With orange header         │
├─────────────────────────────────────────────────────────────────────┤
│  [Period Comparison Bar Chart]       │  [Order Summary Stats]       │
│   Grouped vertical bars              │   2x2 grid with metrics      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Mobile Responsiveness

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 768px) | Stat cards: 2 columns, Charts: full width stacked |
| Tablet (768-1024px) | Stat cards: 3 columns, Charts: 2 column grid |
| Desktop (> 1024px) | Stat cards: 5 columns, Charts: 3 column grid |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/seller/SellerDashboard.tsx` | Complete redesign with ScatterPie layout |
| `src/components/seller/SellerAnalytics.tsx` | Add multi-line chart, update horizontal bars |

---

## Expected Outcome

After implementation:
1. 5 stat cards with left border accent (orange)
2. Horizontal bar charts for top products and buyers
3. Year-over-year comparison boxes
4. Multi-line trend chart with circular markers
5. Data table with orange header row
6. Grouped bar chart for period comparison
7. All real data from `useSellerContext()` - no mock data
8. Fully responsive on mobile/tablet/desktop
9. Exact color palette and typography from reference
