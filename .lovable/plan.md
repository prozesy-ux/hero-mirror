

## Add Recent Orders Table and Recent Activity Section to Both Dashboards

### What Gets Added

A new row below the existing analytics grid on **both** the Seller Dashboard and Buyer Dashboard, containing two side-by-side panels matching the screenshot design:

**Left panel (75% width): Recent Orders Table**
- Header with "Recent Orders" title, search input ("Search product, customer"), and orange "All Categories" dropdown filter
- Table columns: No, Order ID, Customer (with avatar), Product (with icon), Qty, Total, Status (colored badge)
- Shows the 5 most recent orders
- Status badges: Shipped (blue), Processing (gray), Delivered (green), Pending (orange)

**Right panel (25% width): Recent Activity**
- Header with "Recent Activity" title and "..." menu
- Activity items with colored icons, description text, and timestamp
- Shows purchase events, price updates, reviews, and stock alerts

### Design Specs (from screenshot)
- White rounded cards on the beige (#F3EAE0) background
- Orange accent color for badges and category filter button
- Clean table with subtle row dividers
- Avatar circles for customers, small product thumbnails
- Activity icons in orange/amber circle backgrounds

### Technical Plan

**File 1: `src/components/dashboard/EzMartDashboardGrid.tsx`**
- Add two new sub-components at the bottom of the file:
  - `Dashboard_RecentOrders`: Table with search, category filter, and 5 order rows
  - `Dashboard_RecentActivity`: Activity feed with icon + description + time
- Add new props to `DashboardStatData` interface:
  - `recentOrders`: array of `{ id, orderId, customerName, customerAvatar, productName, productIcon, qty, total, status }`
  - `recentActivity`: array of `{ id, icon, message, time }`
- Render both components as a new row in the main grid (3 cols + 1 col layout)

**File 2: `src/components/seller/SellerDashboard.tsx`**
- Build `recentOrders` from `filteredOrders` (map first 5 orders with buyer info from context)
- Build `recentActivity` from orders/products data (recent purchases, status changes)
- Pass both arrays into `dashboardData`

**File 3: `src/components/dashboard/BuyerDashboardHome.tsx`**
- Build `recentOrders` from `filteredOrders` (map first 5 orders with seller info)
- Build `recentActivity` from orders data (recent purchases, reviews)
- Pass both arrays into `dashboardData`

### Layout Structure
```text
+------------------------------------------+
|  Existing EzMartDashboardGrid content    |
|  (stat cards, charts, funnels)           |
+------------------------------------------+
|  Recent Orders (3 cols)  | Activity (1c) |
|  - Search + Filter       | - Feed items  |
|  - Table with 5 rows     |               |
+------------------------------------------+
```

This adds the section inline within the existing grid component, keeping both dashboards visually identical in structure while showing context-appropriate data (seller sees buyer names, buyer sees seller/store names).
