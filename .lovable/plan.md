

# Amazon Seller Central Dashboard Redesign

## Overview

This plan recreates the Seller Dashboard to match the **Amazon Seller Central / Shopeers** design aesthetic from the Behance reference images. The redesign focuses on:

- **Light gray background (#F7F8FA)** with clean white cards
- **Professional sans-serif typography** (Inter/Plus Jakarta Sans)
- **4 top stat cards** with colored icons (not gradients)
- **Sales Details AreaChart** with clean styling
- **Order Details Table** with proper filters
- **Quick Stats grid** and product performance sections
- **Enhanced date/period filters** (Today, Yesterday, Week, Month, Custom)

---

## Design Specifications from Reference

### Color Palette
| Element | Color |
|---------|-------|
| Background | `#F7F8FA` (light gray) |
| Card Background | `#FFFFFF` (pure white) |
| Primary Accent | `#10B981` (emerald/green for positive) |
| Secondary Accent | `#F59E0B` (amber for orders/pending) |
| Text Primary | `#1E293B` (slate-800) |
| Text Secondary | `#64748B` (slate-500) |
| Border | `#E2E8F0` (slate-200) |
| Chart Line | `#3B82F6` (blue-500) |

### Typography
| Element | Size | Weight |
|---------|------|--------|
| Stat Numbers | 28-32px | 700-800 |
| Card Headers | 16px | 600 |
| Labels | 12px | 500 |
| Body Text | 14px | 400 |

### Spacing
| Element | Value |
|---------|-------|
| Card Padding | 20-24px |
| Card Border Radius | 16px (rounded-2xl) |
| Grid Gap | 16-24px |
| Section Margin | 24px |

---

## Components to Redesign

### 1. SellerDashboard.tsx (Main Dashboard)

**Current State**: Uses gradient cards, TikTok-style trust score banner, timeline-style activity

**New Design Structure**:

```text
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard Header (title + date selector + export button)       │
├────────────┬────────────┬────────────┬────────────┬─────────────┤
│ Today's    │ Today's    │ Total      │ Returns &  │             │
│ Orders     │ Sales      │ Balance    │ Refunds    │             │
│ 65         │ $42,350    │ $2,76,000  │ 16         │             │
│ ↑ 1.3%     │ ↑ 8.5%     │            │            │             │
├────────────┴────────────┴────────────┴────────────┴─────────────┤
│                                                                  │
│  ┌─────────────────────────────────┐  ┌──────────────────────┐  │
│  │ Sales Details (AreaChart)       │  │ Quick Stats          │  │
│  │ - Period selector               │  │ - Marketplace: 01    │  │
│  │ - Blue line chart               │  │ - Messages: 14       │  │
│  │                                 │  │ - Buy Box Wins: 80%  │  │
│  │                                 │  │ - Feedback: ★★★★     │  │
│  └─────────────────────────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────┐  ┌──────────────────────┐  │
│  │ Order Details (Table)           │  │ Low Stock Products   │  │
│  │ - View All | Today | Week       │  │ - Product carousel   │  │
│  │ - ID, Product, Qty, Date, Status│  │                      │  │
│  │                                 │  │                      │  │
│  └─────────────────────────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Best Selling Products (Table)                            │   │
│  │ - ID, Name, Sold, Revenue, Rating                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Changes**:
- Replace gradient stat cards with **white cards + colored icons**
- Add **trust score as a subtle badge** (not banner)
- Move chart to main content area with clean styling
- Add **Order Details Table** inline on dashboard
- Add **Low Stock / Out of Stock** product carousel
- Add **Best Selling Products** table

### 2. SellerOrders.tsx (Orders Section)

**Enhanced Filters**:
- Today / Yesterday / This Week / This Month / Last 30 Days / Custom Range
- Status tabs (Pending, Delivered, Completed, Refunded, All)
- Search by Order ID, Product, Buyer
- Export to CSV with date range
- Bulk actions for pending orders

**Table Design**:
```text
Order ID  │ Product Name         │ Qty │ Order Date - Time    │ Delivery Date │ Status
TX56320   │ [img] Apple Watch    │ 01  │ 21.02.2024 - 05:43 PM│ 25.02.2024    │ [Pending]
TX24167   │ [img] Red Book       │ 02  │ 21.02.2024 - 12:53 PM│ 25.02.2024    │ [Pending]
TX32485   │ [img] Pink dress     │ 01  │ 16.02.2024 - 10:14 AM│ 20.02.2024    │ [Return]
TX61573   │ [img] Mobile         │ 04  │ 15.02.2024 - 04:10 PM│ 18.02.2024    │ [Delivered]
```

### 3. SellerAnalytics.tsx (Analytics Section)

**Layout Following Shopeers Reference**:
- **Page Views, Visitors, Clicks, Orders** stat cards at top
- **Total Profit** large AreaChart (2/3 width)
- **Most Active Days** bar chart (1/3 width)
- **Customers breakdown** (Retailers, Distributors, Wholesalers)
- **Repeat Customer Rate** circular progress
- **Best Selling Products** table

### 4. SellerSettings.tsx (Settings Section - Mobile App Style)

**Following the Orange Gradient Mobile Reference**:
- **Profile Header** with orange-to-red gradient banner
- **Stats row**: Wishlist count, Coupons, Points
- **My Orders section** with status icons (Pending, Processing, Shipped, Review, Preorder)
- **Services section** with icon grid (Browsing History, Address, Support, About Us)
- **Settings list** (Account Settings, Address Book, Country, Currency, Language, Notifications, Privacy)

### 5. New Component: Dashboard_Stats_Cards

Reusable stat card matching Amazon design:

```tsx
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: { value: number; direction: 'up' | 'down' };
  icon: LucideIcon;
  iconBg: string; // e.g., 'bg-emerald-100'
  iconColor: string; // e.g., 'text-emerald-600'
}
```

### 6. New Component: Dashboard_Sales_Chart

Clean AreaChart with:
- Period dropdown (January, February, etc.)
- Blue gradient fill
- Tooltip on hover
- Responsive sizing

### 7. New Component: Dashboard_Order_Table

Inline order table with:
- Column headers: Order ID, Product Name, Qty, Order Date - Time, Delivery Date, Status
- Row hover effects
- Status badges (Pending=amber, Delivered=blue, Completed=green, Return=red)
- Pagination or "View All" link

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/seller/SellerDashboard.tsx` | **Rewrite** | Complete redesign to Amazon Seller Central layout |
| `src/components/seller/SellerAnalytics.tsx` | **Modify** | Update to Shopeers-style layout with multiple charts |
| `src/components/seller/SellerOrders.tsx` | **Modify** | Enhanced table design with more filter options |
| `src/components/seller/SellerSettings.tsx` | **Modify** | Mobile app-style with gradient header |
| `src/index.css` | **Add** | Amazon dashboard specific utility classes |

---

## Technical Implementation

### Phase 1: Dashboard Main Page
1. Create new stat card components (white bg + colored icon)
2. Build Sales Details AreaChart section
3. Create Order Details table (inline preview)
4. Add Quick Stats 2x2 grid
5. Add Low Stock product carousel
6. Add Best Selling Products table

### Phase 2: Orders Section Enhancement
1. Add comprehensive date range filters
2. Implement table-style order display
3. Add column sorting
4. Enhance bulk actions UI

### Phase 3: Analytics Redesign
1. Update stat cards to match main dashboard
2. Add "Most Active Days" bar chart
3. Add customer segmentation display
4. Add repeat customer rate indicator

### Phase 4: Settings Mobile Style
1. Create gradient profile header
2. Add order status icon row
3. Create services icon grid
4. Style settings list items

---

## Component Structure

```text
SellerDashboard/
├── Dashboard_Header (title + date + export)
├── Dashboard_Stats_Grid (4 stat cards)
├── Dashboard_Main_Content
│   ├── Dashboard_Sales_Chart (2/3 width)
│   └── Dashboard_Quick_Stats (1/3 width)
├── Dashboard_Secondary_Content
│   ├── Dashboard_Order_Table (2/3 width)
│   └── Dashboard_Low_Stock (1/3 width)
└── Dashboard_Best_Sellers (full width table)
```

---

## Mobile Responsiveness

- **Desktop**: Full grid layout as shown in reference
- **Tablet**: 2-column grids collapse appropriately
- **Mobile**: Single column stack with horizontal scrolling for tables

---

## Data Integration

All existing data from `SellerContext` will be used:
- `profile` - Seller info and trust score
- `wallet` - Balance and pending amounts
- `products` - For low stock and best sellers
- `orders` - For order table and stats
- `withdrawals` - For financial overview

No backend changes required - this is purely a frontend redesign.

