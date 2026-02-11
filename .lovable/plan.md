

# Fix: Product Page Data Counting + Draft Mode on Edit

## Problems Found

### 1. Product Stats Not Counting Correctly
The Products page calculates revenue as `sold_count * price` (an approximation). This is inaccurate because:
- Products may have been sold at different prices over time
- Discounts, coupons, and PWYW pricing are not reflected
- The actual earnings data exists in `orders` from SellerContext but is not used

**Fix:** Use real order data from `useSellerContext()` to calculate accurate revenue per product, and show real sales counts from orders.

### 2. Edited Products Should Go to Draft Mode
Currently, when a seller edits a published product, it stays live (`is_approved` remains `true`). The user wants edited products to go into a "draft" state requiring re-approval.

**Fix:** When updating a product in `NewProduct.tsx`, set `is_approved = false` so the product goes back to pending/draft status after editing. Add a "Save as Draft" button alongside the "Publish" button so sellers can choose.

### 3. Missing Draft Status + Save as Draft Button
The product editor only has a "Publish" button. There is no way to save a product as a draft without publishing it.

**Fix:** Add a "Save as Draft" button that saves the product with `is_available = false` and `is_approved = false`. Add "Draft" as a status filter option in `SellerProducts.tsx`.

### 4. Status Badge Missing "Draft"
Product cards only show "Live" or "Pending" badges. Need to add "Draft" status for products that were saved but not yet submitted for approval.

---

## Technical Changes

### File 1: `src/pages/NewProduct.tsx`
- Add a `handleSaveDraft` function that saves the product with `is_available: false` (draft mode, not published)
- Add a "Save as Draft" button in the header alongside "Publish"
- When editing an already-approved product, set `is_approved: false` on update so it goes back to pending review
- Show a warning message when editing a live product: "Editing will move this product back to review"

### File 2: `src/components/seller/SellerProducts.tsx`
- Fix revenue calculation: Use `orders` from `useSellerContext()` to calculate real revenue per product instead of `sold_count * price`
- Add "Draft" to the status filter dropdown (products where `is_available = false` AND `is_approved = false`)
- Update status badge to show "Draft" for draft products (distinct from "Pending" which means submitted for approval)
- Add a draft count to the stats row

### File 3: `src/components/seller/SellerDashboard.tsx`
- Add a "Draft Products" count to the dashboard stats using the products data
- Show draft products count alongside active products

---

## Stats Calculation Fix (Detail)

Current (inaccurate):
```
totalRevenue = products.reduce((sum, p) => sum + (p.sold_count * p.price), 0)
```

Fixed (using real order data):
```
totalRevenue = orders.reduce((sum, o) => sum + Number(o.seller_earning), 0)
totalSales = orders.length
```

Per-product revenue will be calculated by matching `orders` to `product_id`.

---

## Draft Mode Flow

```text
New Product --> [Save as Draft] --> Draft (not visible to buyers)
                                    |
Draft ---------> [Publish] -------> Pending Approval --> Admin Approves --> Live
                                    |
Live ----------> [Edit & Save] ---> Pending Approval --> Admin Approves --> Live
```

- "Save as Draft": `is_available = false`, `is_approved = false`
- "Publish": `is_available = true`, `is_approved = false` (goes to admin review)
- When editing a live product: `is_approved` resets to `false`
