
# Fix Flash Sales Integration & Mobile Design

## Overview

After thorough investigation, I found the following issues:

1. **Seller Reports** - Already uses real database data (verified working - orders and products come from BFF)
2. **Flash Sales NOT showing on Store/Buyer pages** - The flash sale components exist but are NOT integrated into the store product cards or buyer dashboard
3. **Flash Sales mobile design** - The seller dashboard flash sales list uses horizontal layout that breaks on mobile

---

## Issue Analysis

### Flash Sales Data
The database has active flash sales:

```text
Product: Netflix Cheap Monthly Account
Discount: 20%
Original: $10 → Sale: $8
Ends: 2026-01-31
```

### Missing Integration Points

| Page | Current State | What's Needed |
|------|--------------|---------------|
| Store Page (Store.tsx) | Products show regular price | Show flash sale badge + discounted price |
| Store Product Cards | No flash sale awareness | Pass flash sale data, show countdown |
| Buyer Dashboard | No flash sales section | Add "Flash Deals" section at top |
| BFF Store Public | Doesn't fetch flash sales | Add flash_sales query |

---

## Files to Modify

### 1. Backend: `supabase/functions/bff-store-public/index.ts`
**Add flash sales query in parallel with products:**

```typescript
// Add to parallel fetch:
supabase
  .from('flash_sales')
  .select(`
    *,
    product:seller_products!inner(id, name, icon_url, description, price, seller_id)
  `)
  .eq('seller_id', seller.id)
  .eq('is_active', true)
  .gt('ends_at', new Date().toISOString())
  .gte('starts_at', new Date().toISOString())
```

Return `flashSales` in response object.

### 2. Frontend: `src/pages/Store.tsx`
**Add flash sales state and section:**

- Add `flashSales` state from BFF response
- Display "Flash Deals" section above products when flash sales exist
- Use `FlashSaleCard` component for each active sale

### 3. Product Cards: `src/components/store/StoreProductCard.tsx` & `StoreProductCardCompact.tsx`
**Add flash sale props and display:**

- Accept optional `flashSale` prop
- Show flash sale badge (FlashSaleBadge component)
- Display sale price crossed out with original price
- Show countdown timer

### 4. Mobile Design: `src/components/seller/SellerFlashSales.tsx`
**Fix mobile layout (lines 274-340):**

Current issue: Horizontal flex layout breaks on mobile.

```tsx
// Change from horizontal to vertical stacking on mobile:
<div className={`p-4 rounded-xl border ${...}`}>
  {/* Mobile: Stack vertically */}
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    {/* Product info - always show */}
    <div className="flex items-center gap-3 min-w-0">
      {/* image + name/price */}
    </div>
    
    {/* Stats row - horizontal on mobile */}
    <div className="flex items-center justify-between sm:justify-end sm:gap-4">
      {/* countdown, sold count, delete button */}
    </div>
  </div>
</div>
```

### 5. Buyer Dashboard: `src/components/dashboard/BuyerDashboardHome.tsx`
**Add Flash Deals section:**

- Fetch active flash sales from across all sellers
- Display horizontally scrolling flash sale cards at top
- Use compact `FlashSaleCard` component

### 6. New BFF: Create `supabase/functions/bff-flash-sales/index.ts`
**Aggregate active flash sales from all sellers:**

```typescript
// Public endpoint - no auth required
const { data: flashSales } = await supabase
  .from('flash_sales')
  .select(`
    *,
    product:seller_products(id, name, icon_url, price, seller_id),
    seller:seller_profiles!inner(store_name, store_slug, is_verified)
  `)
  .eq('is_active', true)
  .gt('ends_at', new Date().toISOString())
  .lte('starts_at', new Date().toISOString())
  .order('discount_percentage', { ascending: false })
  .limit(20);
```

---

## Visual Changes

### Store Page - Flash Deals Section

```text
┌─────────────────────────────────────────────┐
│  ⚡ FLASH DEALS                             │
├─────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ Product  │ │ Product  │ │ Product  │  →   │
│ │ $8 ($10) │ │ $15 $20  │ │ $5 $8    │      │
│ │ 20% OFF  │ │ 25% OFF  │ │ 37% OFF  │      │
│ │ 2d 14h   │ │ 1d 6h    │ │ 5h 32m   │      │
│ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────┘
```

### Mobile Product Card with Flash Sale

```text
┌─────────────────────┐
│ [⚡ 20% OFF]        │
│ ┌─────────────────┐ │
│ │                 │ │
│ │  Product Image  │ │
│ │                 │ │
│ └─────────────────┘ │
│ Product Name        │
│ $8.00  $10.00       │
│ ⏰ 2d 14h 32m       │
│ [    Buy Now     ]  │
└─────────────────────┘
```

### Seller Flash Sales - Mobile Optimized

```text
┌─────────────────────────────┐
│ ┌────┐ Netflix Account      │
│ │    │ $8.00 $10.00 20% OFF │
│ └────┘                      │
├─────────────────────────────┤
│ ⏰ 2d 14h  │ 0 sold │  🗑   │
└─────────────────────────────┘
```

---

## Technical Details

### Database Query Optimization
Flash sales RLS policy already allows:
- Public SELECT for active sales within date range
- Seller management for own sales

### Performance
- Add flash sales to BFF response (single request)
- Cache flash sales with 5-minute TTL
- Use realtime subscription for countdown sync

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/bff-store-public/index.ts` | EDIT | Add flash sales to store data |
| `supabase/functions/bff-flash-sales/index.ts` | CREATE | New endpoint for buyer dashboard |
| `src/pages/Store.tsx` | EDIT | Display flash sales section |
| `src/components/store/StoreProductCard.tsx` | EDIT | Show flash sale badge/price |
| `src/components/store/StoreProductCardCompact.tsx` | EDIT | Mobile flash sale support |
| `src/components/seller/SellerFlashSales.tsx` | EDIT | Mobile-responsive layout |
| `src/components/dashboard/BuyerDashboardHome.tsx` | EDIT | Add Flash Deals section |

---

## Expected Outcome

After implementation:
1. Store pages show flash sale badges on discounted products
2. Buyers see "Flash Deals" section on dashboard with countdown timers
3. Seller flash sales management works properly on mobile
4. Products with active flash sales display sale price + original price
5. Countdown timers sync in real-time
