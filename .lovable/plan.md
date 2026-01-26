

# Analytics Section Redesign - Amazon Seller Central Style

## Overview

This plan recreates the Seller Analytics page to **exactly match** the Amazon Seller Central Behance reference design. The key focus is on replicating the visual structure, typography, chart styles, and card layouts from the reference.

---

## Reference Design Analysis (from Behance screenshot)

### Key Visual Elements to Replicate:

| Element | Reference Design |
|---------|------------------|
| **Top Stat Cards** | 4 cards in row: Today's Order (65), Today's Sale (₹42,350), Total Balance (₹2,76,000), Returns & Refunds (16) |
| **Stat Card Style** | White bg, orange icons on right, percentage change badge with arrow |
| **Sales Details Chart** | Large AreaChart with blue gradient, month dropdown (January), percentage Y-axis |
| **Quick Stats Grid** | 2x2 grid: Marketplace (01), Buyer's Message (14), Buy Box Wins (80%), Customer Feedback (★★★★) |
| **Chart Tooltip** | Shows value on hover (e.g., 64,664.77) |

### Color Palette (from reference):
| Element | Color |
|---------|-------|
| Card Background | `#FFFFFF` |
| Page Background | `#F7F8FA` |
| Stat Card Icon | `#FF9900` (Amazon Orange) |
| Chart Line | `#3B82F6` (Blue) |
| Positive Change | `#10B981` (Emerald) |
| Text Primary | `#1E293B` |
| Text Secondary | `#64748B` |

### Typography (from reference):
| Element | Style |
|---------|-------|
| Stat Numbers | 32px, font-weight: 800 |
| Stat Label | 12px, font-weight: 500, slate-500 |
| Change Badge | 11px, font-weight: 600, emerald |
| Card Title | 14px, font-weight: 600, slate-800 |

---

## New Analytics Layout

```text
┌─────────────────────────────────────────────────────────────────┐
│  Analytics Header                              [Period: January] │
├───────────────┬───────────────┬───────────────┬─────────────────┤
│ Page Views    │ Visitors      │ Clicks        │ Orders          │
│ 1,247         │ 892           │ 456           │ 65              │
│ ↑ 12.5%       │ ↑ 8.3%        │ ↓ 2.1%        │ ↑ 15.6%         │
│ [📊 icon]     │ [👁 icon]     │ [🖱 icon]     │ [🛒 icon]       │
├───────────────┴───────────────┴───────────────┴─────────────────┤
│                                                                  │
│  ┌───────────────────────────────────┐  ┌────────────────────┐  │
│  │ Sales Details                     │  │ Quick Stats        │  │
│  │ [Month dropdown]                  │  │ ┌─────┐ ┌─────┐   │  │
│  │                                   │  │ │ 01  │ │ 14  │   │  │
│  │     [Blue AreaChart]              │  │ │Mkt  │ │Msgs │   │  │
│  │  100% ─────────────────           │  │ └─────┘ └─────┘   │  │
│  │   80% ─────────────────           │  │ ┌─────┐ ┌─────┐   │  │
│  │   60% ─────────────────           │  │ │ 80% │ │★★★★ │   │  │
│  │   40% ─────────────────           │  │ │BuyBx│ │Fdbck│   │  │
│  │   20% ─────────────────           │  │ └─────┘ └─────┘   │  │
│  │      5k 10k 15k 20k 25k           │  └────────────────────┘  │
│  └───────────────────────────────────┘                          │
│                                                                  │
│  ┌───────────────────────────────────┐  ┌────────────────────┐  │
│  │ Order Status (Donut Chart)        │  │ Top Products       │  │
│  │                                   │  │                    │  │
│  │   [Donut with legend]             │  │ 1. Product A $120  │  │
│  │   • Completed: 45                 │  │ 2. Product B $98   │  │
│  │   • Pending: 12                   │  │ 3. Product C $76   │  │
│  │   • Delivered: 8                  │  │                    │  │
│  └───────────────────────────────────┘  └────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Revenue by Day of Week (Horizontal Bar Chart)            │   │
│  │                                                           │   │
│  │ Mon ████████████████ $1,250                              │   │
│  │ Tue ██████████████ $980                                  │   │
│  │ Wed ████████████ $870                                    │   │
│  │ Thu ██████████████████ $1,420                            │   │
│  │ Fri ████████████████████████ $1,890                      │   │
│  │ Sat ████████████████████████████ $2,100                  │   │
│  │ Sun ██████████████████████ $1,650                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stat Card Design (Exact Match to Reference)

```tsx
// Card structure matching Behance reference exactly
<div className="bg-white rounded-2xl p-5 border border-slate-100">
  <div className="flex items-start justify-between">
    {/* Left: Text content */}
    <div>
      <p className="text-xs font-medium text-slate-500">Page Views</p>
      <p className="text-3xl font-extrabold text-slate-800 mt-1">1,247</p>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-emerald-500">↗</span>
        <span className="text-xs font-semibold text-emerald-600">12.5% Up from yesterday</span>
      </div>
    </div>
    {/* Right: Icon - Amazon Orange background */}
    <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
      <BarChart3 className="h-6 w-6 text-orange-500" />
    </div>
  </div>
</div>
```

---

## Quick Stats Grid (2x2 - Exact Match)

```tsx
// 2x2 grid matching reference
<div className="grid grid-cols-2 gap-4">
  {/* Marketplace */}
  <div className="bg-white rounded-xl p-4 border border-slate-100">
    <div className="flex items-center gap-3">
      <Globe className="h-6 w-6 text-blue-500" />
      <div>
        <p className="text-2xl font-bold text-slate-800">01</p>
        <p className="text-xs text-slate-500">Market Place</p>
      </div>
    </div>
  </div>
  
  {/* Buyer's Message */}
  <div className="bg-white rounded-xl p-4 border border-slate-100">
    <div className="flex items-center gap-3">
      <MessageSquare className="h-6 w-6 text-blue-500" />
      <div>
        <p className="text-2xl font-bold text-slate-800">14</p>
        <p className="text-xs text-slate-500">Buyer's Message</p>
      </div>
    </div>
  </div>
  
  {/* Buy Box Wins */}
  <div className="bg-white rounded-xl p-4 border border-slate-100">
    <div className="flex items-center gap-3">
      <TrendingUp className="h-6 w-6 text-emerald-500" />
      <div>
        <p className="text-2xl font-bold text-slate-800">80%</p>
        <p className="text-xs text-slate-500">Buy Box Wins</p>
      </div>
    </div>
  </div>
  
  {/* Customer Feedback */}
  <div className="bg-white rounded-xl p-4 border border-slate-100">
    <div className="flex items-center gap-3">
      <Star className="h-6 w-6 text-amber-500" />
      <div>
        <div className="flex gap-0.5">
          {[1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
          <Star className="h-4 w-4 text-slate-300" />
        </div>
        <p className="text-xs text-slate-500">Customer Feedback (56)</p>
      </div>
    </div>
  </div>
</div>
```

---

## Sales Details Chart (Exact Match)

**Key features from reference:**
- Month dropdown selector in top-right (January, February, etc.)
- Y-axis shows percentage (20%, 40%, 60%, 80%, 100%)
- X-axis shows values (5k, 10k, 15k, 20k, 25k, 30k, 35k, 40k, 45k)
- Blue line with gradient fill
- Tooltip showing exact value on hover

```tsx
<div className="bg-white rounded-2xl border border-slate-100 p-5">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-base font-semibold text-slate-800">Sales Details</h3>
    <Select value={month} onValueChange={setMonth}>
      <SelectTrigger className="w-32 h-9 rounded-lg border-slate-200">
        <SelectValue placeholder="January" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="january">January</SelectItem>
        <SelectItem value="february">February</SelectItem>
        <!-- ... months ... -->
      </SelectContent>
    </Select>
  </div>
  
  <ResponsiveContainer width="100%" height={280}>
    <AreaChart data={salesData}>
      <defs>
        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
      <XAxis dataKey="x" tick={{ fontSize: 11, fill: '#64748B' }} />
      <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#64748B' }} />
      <Tooltip />
      <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fill="url(#salesGradient)" />
    </AreaChart>
  </ResponsiveContainer>
</div>
```

---

## Data Mapping

| Reference Metric | Our Data Source |
|------------------|-----------------|
| Page Views | Simulated based on orders * 15 |
| Visitors | Unique buyers count |
| Clicks | Simulated based on orders * 5 |
| Orders | `analyticsData.totalOrders` |
| Marketplace | Fixed "01" (single store) |
| Buyer's Message | Count of chat messages (or simulated) |
| Buy Box Wins | `analyticsData.conversionRate` |
| Customer Feedback | Product ratings average |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/seller/SellerAnalytics.tsx` | Complete redesign to match reference |

---

## Technical Implementation

1. **Replace top stat cards** with Page Views, Visitors, Clicks, Orders (Amazon orange icons)
2. **Add Quick Stats 2x2 grid** with Marketplace, Messages, Buy Box Wins, Feedback
3. **Update Sales Details chart** with month dropdown and exact styling
4. **Keep existing data calculations** but map to new visual components
5. **Add horizontal bar chart** for day-of-week breakdown (matching "Most Active Days" from reference)
6. **Maintain mobile responsiveness** with proper grid collapsing

---

## Expected Result

The Analytics section will look **identical** to the Amazon Seller Central Behance reference with:
- Same card layouts and spacing
- Same font sizes and weights
- Same chart styles (blue AreaChart with gradient)
- Same Quick Stats 2x2 grid design
- All using your actual seller data from `SellerContext`

