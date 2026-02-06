
# Add Neo-Brutalist Hover Effects to Products Section & New Product Page

## Overview

Add the neo-brutalist hover effect (`hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`) to all cards in the SellerProducts section and NewProduct page. The shadow only appears on hover, creating interactive feedback.

## Hover Effect Pattern

```css
hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow
```

---

## Files to Update

### 1. SellerProducts.tsx

**Product Grid Cards (Line 452)**

Current:
```tsx
className={`bg-white border rounded-xl overflow-hidden group shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${...}`}
```

Change to:
```tsx
className={`bg-white border rounded-xl overflow-hidden group hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer ${...}`}
```

Remove: `shadow-sm`, `hover:shadow-md`, `hover:-translate-y-0.5`

---

### 2. ProductTypeSelector.tsx

**Compact Mode Cards (Lines 35-40)**

Current:
```tsx
className={cn(
  "flex flex-col gap-4 p-4 rounded border text-left transition-all bg-white h-full",
  isSelected
    ? "border-slate-900"
    : "border-slate-200 hover:border-slate-400"
)}
```

Change to:
```tsx
className={cn(
  "flex flex-col gap-4 p-4 rounded border text-left transition-shadow bg-white h-full hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
  isSelected
    ? "border-slate-900"
    : "border-slate-200"
)}
```

**Products Grid Cards (Lines 71-76)**

Same pattern - add `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`

**Services Grid Cards (Lines 111-116)**

Same pattern - add `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`

---

### 3. NewProduct.tsx

**Main Content Container (Line 321)**

Current:
```tsx
<div className="bg-white rounded border">
```

Change to:
```tsx
<div className="bg-white rounded border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
```

**Summary Card (Line 371)**

Current:
```tsx
<div className="p-6 bg-gray-50 rounded border space-y-4">
```

Change to:
```tsx
<div className="p-6 bg-gray-50 rounded border space-y-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
```

**Pay What You Want Card (Line 610)**

Current:
```tsx
<div className="p-6 bg-white rounded border">
```

Change to:
```tsx
<div className="p-6 bg-white rounded border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
```

**Pre-order Card (Line 647)**

Same pattern - add hover shadow

**Availability Card (if exists)**

Same pattern - add hover shadow

---

## Summary of Changes

| File | Element | Change |
|------|---------|--------|
| SellerProducts.tsx | Product grid cards | Replace `hover:shadow-md` with neo-brutalist hover |
| ProductTypeSelector.tsx | Type selection cards (3 grids) | Add neo-brutalist hover |
| NewProduct.tsx | Main container | Add neo-brutalist hover |
| NewProduct.tsx | Summary card | Add neo-brutalist hover |
| NewProduct.tsx | Pricing option cards | Add neo-brutalist hover |

**Total: ~15 card elements to update**

This will ensure all cards in the Products section and New Product page have the consistent neo-brutalist hover effect that only shows when hovering.
