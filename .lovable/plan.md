

# Enhanced Seller Products Section: Full Redesign

## Overview
Major upgrade to the seller products management page with a 3-column layout, richer card labels, an expanded edit sheet, and new functional panels on both left and right sides.

---

## Changes

### 1. Three-Column Layout (Left Panel | Grid | Right Panel)

Replace the current 2-column (7+3) layout with a 3-column layout:

```text
+------------------+------------------------------+--------------------+
|  Left Panel (2)  |    Product Grid (6)          |  Right Panel (2)   |
|                  |                              |                    |
|  - Cart/Queue    |  - Enhanced cards            |  - Preview         |
|  - Quick Stats   |  - Status, Type, Labels      |  - Actions         |
|  - Filters       |  - Sales, Price overlays     |  - Stats           |
|  - Categories    |                              |  - Danger Zone     |
+------------------+------------------------------+--------------------+
```

**Left Panel Contents:**
- **Product Queue / Cart**: Shows a mini-list of recently edited or selected products (like a shopping cart sidebar). Clicking items scrolls to them in the grid.
- **Quick Stats Dashboard**: Total products, live, pending, drafts, total revenue, total sales -- each as compact stat cards with icons
- **Category Filters**: Vertical list of categories with product counts, clickable to filter the grid
- **Status Filters**: Visual pills for All/Live/Pending/Draft/Hidden with counts
- **Sort Controls**: Dropdown moved here from the top bar
- **Bulk Mode Toggle**: Moved from top bar into this panel

### 2. Enhanced Product Grid Cards

Redesign the card overlay system with richer visual labels:

- **Product Type Icon + Label**: Pill badge at top-left with icon (e.g., Video icon + "Course") using colored backgrounds per type
- **Status Bar**: Bottom gradient bar with status icon+label on left, price on right
- **Sales Counter Badge**: Small pill showing "X sold" with ShoppingBag icon, only if sales > 0
- **Stock Warning**: If stock < 5, show amber "Low Stock" pill
- **Compare Price**: Show crossed-out original price next to current price if compare_at_price exists
- **Category Tags**: Small faded category name labels below the card renderer
- **Hover Overlay**: Semi-transparent dark overlay with centered action buttons (Edit, Duplicate, Copy Link, View Store, Delete) arranged vertically with labels -- replaces the current small icon-only buttons

### 3. Expanded Edit Sheet

Add more fields and sections to the edit Sheet:

- **SEO Section** (Collapsible): Slug editor, meta description preview
- **Pricing Section**: Add "Pay what you want" toggle, minimum price field
- **Delivery Settings** (Collapsible): Instant download toggle, delivery instructions textarea
- **Product Type Display**: Show the current product type as a read-only badge at the top of the sheet (cannot change type after creation)
- **Live Preview**: Small card preview at the top of the sheet that updates as the user edits fields
- **Changelog**: "Last saved X minutes ago" timestamp at the bottom

### 4. Right Panel -- Product Command Center (Enhanced)

When a product is selected:
- **Card Preview**: Larger preview with "Buyer View" label (already exists, keep)
- **Quick Actions**: Change from 2x2 grid to vertical list with icons + descriptions:
  - Edit -- "Open editor panel"
  - Duplicate -- "Create a copy"
  - Copy Link -- "Share URL"
  - View Store -- "Open in new tab"
  - Analytics -- "View product stats" (navigates to SellerProductAnalytics)
  - Share -- "Social share options"
- **Stats Card**: Enhanced with mini sparkline/bar for sales trend (using existing recharts), conversion rate calculation
- **Danger Zone**: Keep as-is

When no product selected:
- Show overall store health summary
- "Top Performing" mini-card showing best-selling product
- "Needs Attention" section showing products with 0 sales or low stock

---

## Technical Details

### File: `src/components/seller/SellerProducts.tsx`

**Layout Change:**
```text
Current:  lg:grid-cols-10 -> col-span-7 + col-span-3
New:      lg:grid-cols-12 -> col-span-2 + col-span-7 + col-span-3
```

On mobile, left panel becomes a collapsible drawer or hidden entirely. Grid and right panel stack vertically.

**Left Panel State:**
- `recentlyEdited: string[]` -- tracks last 5 edited product IDs for the "queue" section
- Category counts computed from `products` array
- Status counts already exist (`liveProducts`, `pendingProducts`, etc.)

**Card Overlay Redesign:**
- Replace the current small hover buttons with a full-card dark overlay containing vertically stacked labeled buttons
- Add `PRODUCT_TYPE_COLORS` map for colored type badges (e.g., Course = purple, E-book = blue, Software = green)
- Add stock warning logic: `product.stock > 0 && product.stock < 5`

**Edit Sheet Additions:**
- Add `slug` field to `ProductFormData` interface
- Add `meta_description` field
- Add `pay_what_you_want` boolean and `minimum_price` number
- Add `delivery_instructions` textarea
- These fields map to existing or new columns in `seller_products`

**No new dependencies needed** -- uses existing Sheet, Collapsible, ScrollArea, recharts, Badge, Tooltip components.

### Database Consideration
The `slug`, `meta_description`, and `delivery_instructions` fields may need to be verified as existing columns in `seller_products`. If not present, a migration will be created to add them. The `pay_what_you_want` and `minimum_price` fields would also need columns if not present.

