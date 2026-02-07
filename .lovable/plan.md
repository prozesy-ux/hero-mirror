

# Fix Seller Sidebar: Products as Dropdown Parent

## Overview

Correct the sidebar structure so that "Products" is the main collapsible dropdown item, with Discount, Coupons, Flash Sales, and Inventory as its sub-items.

---

## New Structure

```text
Home
Sales
Customers
Analytics
Payouts
▼ Products (dropdown parent - opens on hover/click)
  ├─ Discount
  ├─ Coupons
  ├─ Flash Sales
  └─ Inventory
Insights
Reports
Performance
Chat
───────────
Settings
Help
Collapse
User Profile
```

---

## Changes to SellerSidebar.tsx

### 1. Rename Section and Update Items

**Current (Wrong):**
```tsx
const discountItems = [
  { to: '/seller/products', icon: GumroadProductsIcon, label: 'Products' },
  { to: '/seller/coupons', icon: GumroadCouponsIcon, label: 'Coupons' },
  ...
];
```

**New (Correct):**
```tsx
const productSubItems = [
  { to: '/seller/discount', icon: GumroadDiscountIcon, label: 'Discount' },
  { to: '/seller/coupons', icon: GumroadCouponsIcon, label: 'Coupons' },
  { to: '/seller/flash-sales', icon: GumroadFlashSaleIcon, label: 'Flash Sales' },
  { to: '/seller/inventory', icon: GumroadInventoryIcon, label: 'Inventory' },
];
```

### 2. Update State Variable Name

**Current:**
```tsx
const [discountOpen, setDiscountOpen] = useState(false);
```

**New:**
```tsx
const [productsOpen, setProductsOpen] = useState(false);
```

### 3. Update Active Check

**Current:**
```tsx
const isDiscountActive = discountItems.some(item => isActive(item.to));
```

**New:**
```tsx
const isProductsActive = productSubItems.some(item => isActive(item.to)) || isActive('/seller/products');
```

### 4. Update Collapsible Section

Change the dropdown trigger from "Discount" icon/label to "Products" icon/label:

**Current:**
```tsx
<GumroadDiscountIcon size={16} />
<span>Discount</span>
```

**New:**
```tsx
<GumroadProductsIcon size={16} />
<span>Products</span>
```

### 5. Add Products Page Link (Optional)

If clicking "Products" should also navigate to `/seller/products`, make it a link that also toggles the dropdown.

---

## File to Update

| File | Change |
|------|--------|
| `src/components/seller/SellerSidebar.tsx` | Rename dropdown to "Products", add Discount as sub-item |

---

## Result

The sidebar will show:
- **Products** as the main collapsible section
- Sub-items: Discount, Coupons, Flash Sales, Inventory
- Opens on hover or click

