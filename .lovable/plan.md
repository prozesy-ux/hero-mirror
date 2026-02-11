

# Redesign: Seller Product Edit as Side Panel + Enhanced Left Sidebar

## Overview
Replace the full-page navigation edit flow with an inline slide-over panel (Sheet) in the seller products page. Redesign the right sidebar into a rich "Product Command Center" with more actions, quick stats per product, and better visual labels. Add a functional left-side action bar when a product is selected.

---

## Changes

### 1. SellerProducts.tsx -- Replace Full-Page Edit with Sheet Panel

**Current behavior:** Clicking "Edit" navigates to `/seller/products/edit/:id` (full page `NewProduct.tsx`).

**New behavior:** Clicking "Edit" opens a `Sheet` (slide-over drawer) from the right side, containing all editable fields inline. The product grid stays visible behind it.

- Import `Sheet, SheetContent, SheetHeader, SheetTitle` from `@/components/ui/sheet`
- Add state: `editSheetProduct` (the product being edited inline)
- The Sheet will contain:
  - Product name, description (textarea), price, stock, compare-at price
  - Multi-image uploader (compact)
  - Category chips selection
  - Tags input with popular suggestions
  - Toggles: Available, Chat Allowed, Requires Email
  - Card Appearance customizer (collapsed by default via `Collapsible`)
  - Save / Save as Draft / Cancel buttons at the bottom
- Keep the full-page `NewProduct.tsx` route for **creating new** products only (it has the type selector wizard which makes sense as full-page)
- The edit Sheet reuses existing `handleSubmit` logic but scoped to the selected product

### 2. Right Sidebar -- Product Command Center (when product selected)

When a product is clicked, the right sidebar transforms from the default stats view into a rich "Product Command Center":

**Card Preview Section:**
- `ProductCardRenderer` preview (already exists)
- Below: "As seen by buyers" label

**Quick Actions Grid (2x2):**
- Edit (opens Sheet)
- Duplicate
- Copy Link
- View in Store (opens store URL)

**Product Stats Card:**
- Sales count for this product
- Revenue earned
- Views (if tracked)
- Status badge (Live / Pending / Draft / Hidden)
- Created date
- Last updated date

**Danger Zone:**
- Toggle visibility (Show/Hide)
- Delete product (with confirmation)

**When no product selected:** Show the existing stats summary + comic illustration

### 3. Product Grid Cards -- Enhanced Labels and Info

Update the card overlay system on the product grid:

- **Status badge**: Move from top-left to a bottom bar overlay with icon + label
- **Product type badge**: Show the product type (e.g., "Course", "E-book", "Bundle") as a small pill in the top-right
- **Sales counter**: Small badge showing sold count at bottom-left
- **Price tag**: Prominent price label overlay
- **Hover actions**: Keep Edit, Copy, More menu but improve styling with tooltips

### 4. Bulk Actions Bar

Add a bulk selection mode:
- Checkbox on each card (visible on hover, always visible when in bulk mode)
- When 1+ products selected, show a floating action bar at bottom:
  - "X selected" count
  - Bulk Hide / Show
  - Bulk Delete
  - Bulk Change Category
  - Clear Selection

---

## Technical Details

### Sheet Edit Form
The edit form inside the Sheet will use the same `supabase.from('seller_products').update()` pattern already in `handleSubmit`. The form state will be initialized from the selected product when the Sheet opens.

```text
State flow:
1. User clicks Edit on product card
2. editSheetProduct = product (populate form fields)
3. Sheet opens from right
4. User edits fields
5. Save -> supabase update -> refreshProducts() -> close Sheet
```

### Files Modified
1. **`src/components/seller/SellerProducts.tsx`** -- Major rewrite:
   - Add Sheet-based edit panel
   - Redesign right sidebar as Product Command Center
   - Add product type badges + sales counters on grid cards
   - Add bulk selection mode with floating action bar

### Dependencies
- Uses existing `Sheet` component from `@/components/ui/sheet`
- Uses existing `Collapsible` from Radix
- Uses existing `CardCustomizer`, `MultiImageUploader`, `ProductCardRenderer`
- No new packages needed

