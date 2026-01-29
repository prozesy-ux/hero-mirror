
# Dashboard Charts & Order Cards Redesign

## Overview

This plan redesigns all charts and order cards in Buyer and Seller dashboards to exactly match the Shoplytic and Dokani reference images, using only real database data from the existing BFF endpoints.

---

## Reference Design Analysis

### Chart Design (Shoplytic Style)
- **Orange solid bar charts** (not blue area charts)
- Bar color: `#F97316` (orange-500)
- Rounded top corners on bars (`radius={[6, 6, 0, 0]}`)
- Light gray horizontal grid lines only (no vertical)
- Y-axis: k-formatted values (10k, 20k, 30k)
- Legend with colored dots above chart
- Period dropdown selector ("This Week", "This Month")
- White card with subtle shadow

### Stat Card Design (Shoplytic Style)
- Icon on RIGHT side (not left)
- Small uppercase label (11px, slate-500)
- Large bold value (32px)
- Percentage change with arrow below
- "View more" link at bottom right

### Order Card Design (Dokani Style)
- Grouped header: "Customer: email | Date of Order: date"
- Order ID on the right of header
- Product row with checkbox, image, name, quantity, price
- Status badge (Pending: Orange, Shipped: Teal, Completed: Green)
- Action buttons: "Print Label" (blue), "Cancel" (red outline)

---

## Files to Modify

### 1. `src/components/seller/SellerDashboard.tsx`

**Changes:**
- Replace `AreaChart` with `BarChart` (orange bars)
- Add chart legend with colored dots
- Update Y-axis to show k-formatted values
- Remove chart subtitle "Revenue over time"

**Current Chart (lines 436-476):**
```tsx
<AreaChart data={chartData}>
  <defs>
    <linearGradient id="dashboardSalesGradient">...</linearGradient>
  </defs>
  <Area type="monotone" dataKey="sales" fill="url(#dashboardSalesGradient)" />
</AreaChart>
```

**New Chart:**
```tsx
{/* Chart Legend */}
<div className="flex items-center gap-4 mb-4">
  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full bg-orange-500" />
    <span className="text-xs text-slate-600">Revenue</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full bg-slate-400" />
    <span className="text-xs text-slate-600">Orders</span>
  </div>
</div>

<BarChart data={chartData}>
  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
  <YAxis 
    tick={{ fontSize: 11, fill: '#64748B' }} 
    axisLine={false} 
    tickLine={false}
    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
  />
  <Tooltip 
    contentStyle={{ 
      borderRadius: 12, 
      border: 'none', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      padding: '12px 16px'
    }}
  />
  <Bar dataKey="sales" fill="#F97316" radius={[6, 6, 0, 0]} />
</BarChart>
```

### 2. `src/components/seller/SellerAnalytics.tsx`

**Changes:**
- Replace `AreaChart` with `BarChart` (orange bars)
- Add legend with colored dots
- Update stat cards to match reference (icon on right, "View more" link)

**New Stat Card Layout:**
```tsx
<div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
        Today's Orders
      </p>
      <p className="text-[32px] font-extrabold text-slate-800 mt-1 leading-tight">
        {value}
      </p>
      <div className="flex items-center gap-1.5 mt-2">
        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-[11px] font-semibold text-emerald-600">
          2.3% Last Week
        </span>
      </div>
      <button className="flex items-center gap-1 mt-3 text-[11px] text-slate-500 hover:text-slate-700">
        View more <ArrowRight className="h-3 w-3" />
      </button>
    </div>
    <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
      <ShoppingCart className="h-6 w-6 text-orange-500" />
    </div>
  </div>
</div>
```

### 3. `src/components/dashboard/BuyerAnalytics.tsx`

**Changes:**
- Replace "Spending Details" AreaChart with orange BarChart
- Add legend dots
- Update stat card icons to right side
- Keep using real order data from database

### 4. `src/components/dashboard/BuyerDashboardHome.tsx`

**Changes:**
- Update stat cards to match reference design (icon on right)
- Add "View more" links with arrow icons
- Keep FlashSaleSection integration

### 5. `src/components/seller/SellerOrders.tsx`

**Changes:**
- Redesign order cards to match Dokani reference
- Add grouped header row: Customer + Date + Order ID
- Add checkbox column for bulk selection
- Add "Print Label" and "Cancel Order" buttons
- Status badge colors: Pending (orange), Shipped (teal), Completed (green)

**New Order Card Layout:**
```tsx
<div className="bg-white rounded-xl border border-slate-100 mb-4 overflow-hidden">
  {/* Order Header */}
  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
      <span>Customer: <strong className="text-slate-800">{order.buyer?.email}</strong></span>
      <span className="text-slate-300 hidden sm:inline">|</span>
      <span>Date: {format(new Date(order.created_at), 'dd MMM, yyyy')}</span>
    </div>
    <span className="text-xs text-slate-500 font-mono">
      Order ID: #{order.id.slice(0,8).toUpperCase()}
    </span>
  </div>
  
  {/* Product Row */}
  <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
    <Checkbox checked={selected} onCheckedChange={handleSelect} />
    <img src={order.product?.icon_url} className="w-16 h-16 rounded-lg object-cover" />
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-slate-800 truncate">{order.product?.name}</p>
      <p className="text-sm text-slate-500">Quantity: 1</p>
    </div>
    <div className="text-right">
      <p className="font-bold text-lg text-slate-800">{formatAmountOnly(order.amount)}</p>
    </div>
    {getStatusBadge(order.status)}
    
    {/* Actions - Stack on mobile */}
    <div className="flex gap-2 w-full sm:w-auto">
      {order.status === 'pending' && (
        <>
          <Button size="sm" className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            <Send className="w-4 h-4 mr-1" /> Deliver
          </Button>
        </>
      )}
      {order.status === 'delivered' && (
        <Button size="sm" variant="outline" className="flex-1 sm:flex-none border-emerald-500 text-emerald-600 rounded-lg">
          <Pencil className="w-4 h-4 mr-1" /> Edit
        </Button>
      )}
    </div>
  </div>
</div>
```

### 6. `src/components/dashboard/BuyerOrders.tsx`

**Changes:**
- Apply same Dokani order card design
- Update status badge colors to match reference
- Add seller info in header instead of buyer
- Keep all existing real data fetching via BFF

---

## Design Specifications

### Color Palette
| Element | Color |
|---------|-------|
| Bar Chart Fill | `#F97316` (orange-500) |
| Secondary Bar | `#94A3B8` (slate-400) |
| Grid Lines | `#E2E8F0` (slate-200) |
| Axis Text | `#64748B` (slate-500) |
| Pending Status | `bg-orange-100 text-orange-700` |
| Shipped/Delivered | `bg-teal-100 text-teal-700` |
| Completed | `bg-emerald-100 text-emerald-700` |
| Cancelled | `bg-red-100 text-red-700` |

### Typography
| Element | Style |
|---------|-------|
| Stat Card Label | 11px, uppercase, font-medium, text-slate-500 |
| Stat Card Value | 32px, font-extrabold, text-slate-800 |
| Chart Legend | 12px, text-slate-600 |
| Order Header | 14px, text-slate-600 |
| Order ID | 12px, font-mono, text-slate-500 |

---

## Mobile Responsiveness

### Charts
- Full width with horizontal scroll prevention
- Responsive height: 250px mobile, 280px desktop
- Touch-friendly tooltips

### Order Cards
- Header stacks vertically on mobile
- Product info + actions stack vertically
- Buttons become full-width on mobile
- Checkbox remains accessible

### Stat Cards
- 2 columns on mobile, 4 columns on desktop
- Icon size remains 12x12 (w-12 h-12)
- Text scales appropriately

---

## Data Sources (Outlet Data Only)

All data comes from existing BFF endpoints:

| Component | Data Source |
|-----------|-------------|
| Seller Charts | `useSellerContext()` → orders, products, wallet |
| Seller Orders | `useSellerContext()` → orders with product/buyer details |
| Buyer Charts | `bffApi.getBuyerDashboard()` → sellerOrders |
| Buyer Orders | `bffApi.getBuyerDashboard()` → sellerOrders with seller details |

No mock data is used - all metrics are calculated from real database records.

---

## Files Summary

| File | Changes |
|------|---------|
| `src/components/seller/SellerDashboard.tsx` | AreaChart → BarChart, add legend, k-format Y-axis |
| `src/components/seller/SellerAnalytics.tsx` | AreaChart → BarChart, add legend, update stat cards |
| `src/components/dashboard/BuyerDashboardHome.tsx` | Update stat card layout (icon right) |
| `src/components/dashboard/BuyerAnalytics.tsx` | AreaChart → BarChart, add legend |
| `src/components/seller/SellerOrders.tsx` | Dokani order card design |
| `src/components/dashboard/BuyerOrders.tsx` | Dokani order card design |

---

## Expected Outcome

After implementation:
1. All charts use orange bar style matching Shoplytic reference exactly
2. Stat cards have icon on right with "View more" links
3. Chart legends with colored dots above each chart
4. Y-axis shows k-formatted values (10k, 20k)
5. Order cards match Dokani reference with grouped headers
6. All designs fully responsive on mobile
7. No section titles (context from navigation)
8. All real data from BFF endpoints (no mock data)
