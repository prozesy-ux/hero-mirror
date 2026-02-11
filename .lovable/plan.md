

# Fix Seller Customers Section -- Currency, Data & Error Issues

## Problems Found

1. **Hardcoded INR symbol** -- Uses `₹` instead of `useCurrency` hook (every other seller component uses it)
2. **No currency conversion** -- Amounts are stored in USD but displayed with `₹` without conversion
3. **Redundant Supabase query** -- Fetches buyer profiles directly (may fail due to RLS), when the BFF already provides buyer info on each order
4. **No error handling** -- Silent failures on profile fetch
5. **Missing imports** -- `useCurrency` not imported

## Changes

### File: `src/components/seller/SellerCustomers.tsx`

**1. Add `useCurrency` import and hook call**
- Import `useCurrency` from `@/contexts/CurrencyContext`
- Call `const { formatAmountOnly } = useCurrency();` inside the component

**2. Use BFF buyer data instead of separate Supabase query**
- The `orders` from SellerContext already include `buyer?.email` and `buyer?.full_name` (fetched by BFF)
- Remove the separate `supabase.from('profiles')` query entirely
- Build customer data directly from orders, extracting buyer info from `order.buyer`

**3. Replace all hardcoded currency symbols**
- Line 203: `₹{stats.avgOrderValue.toFixed(0)}` becomes `{formatAmountOnly(stats.avgOrderValue)}`
- Line 227: `₹{stats.topSpender.total_spent}` becomes `{formatAmountOnly(stats.topSpender.total_spent)}`
- Line 315: `₹{customer.total_spent}` becomes `{formatAmountOnly(customer.total_spent)}`
- CSV export: Use formatted amount with currency

**4. Fix the useEffect logic**
- Remove async Supabase fetch, use synchronous mapping from `orders` array
- Build `buyerMap` grouping orders by `buyer_id` and extract `email`/`full_name` from `order.buyer`
- Remove `loading` state dependency on async fetch -- data is already available from context

**5. Add proper error state**
- If no orders exist, show "No customers yet" instead of empty state after loading

## Technical Details

The key change is removing this block:
```tsx
// REMOVE: Direct Supabase call that can fail
const { data: profiles } = await supabase
  .from('profiles')
  .select('user_id, email, full_name, avatar_url')
  .in('user_id', buyerIds);
```

And replacing with data already in the orders:
```tsx
// USE: BFF-provided buyer data from orders
orders.forEach(order => {
  if (!buyerMap.has(order.buyer_id)) {
    buyerMap.set(order.buyer_id, {
      email: order.buyer?.email || 'Unknown',
      full_name: order.buyer?.full_name || null,
      // ... stats
    });
  }
});
```

This eliminates the RLS issue, removes an unnecessary network call, and ensures data is always consistent with what the BFF provides.

