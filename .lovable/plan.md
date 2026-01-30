
# Fix SellerReports Currency Display

## Problem

The SellerReports section is displaying amounts with a hardcoded INR symbol (`₹`) without proper currency conversion. The database stores all amounts in **USD base currency**, but the component displays them as if they were already in INR.

**Example of current bug:**
- Order amount in database: `2.5` (meaning $2.50 USD)
- Current display: `₹2.5` (incorrectly showing USD value with INR symbol)
- Should display: `$2.50` or `₹208` (properly converted)

## Root Cause

In `SellerReports.tsx`, the summary values are generated with hardcoded `₹` symbols:

```typescript
// Lines 128-131
'Total Revenue': `₹${filteredOrders.reduce((sum, o) => sum + o.amount, 0)}`
'Total Earnings': `₹${filteredOrders.reduce((sum, o) => sum + o.seller_earning, 0)}`
'Avg Order Value': `₹${...}`
```

The component does not use the `useCurrency()` hook which other seller components (like `SellerDashboard.tsx` and `SellerWallet.tsx`) use correctly.

## Solution

Import and use the currency context to format amounts properly with conversion.

### Changes Required

**File: `src/components/seller/SellerReports.tsx`**

1. Import the currency hook:
```typescript
import { useCurrency } from '@/contexts/CurrencyContext';
```

2. Use the hook in the component:
```typescript
const { formatAmountOnly } = useCurrency();
```

3. Update all summary values to use `formatAmountOnly()` instead of hardcoded symbols:

| Location | Before | After |
|----------|--------|-------|
| Line 128 | `` `₹${total}` `` | `formatAmountOnly(total)` |
| Line 129 | `` `₹${earnings}` `` | `formatAmountOnly(earnings)` |
| Line 131 | `` `₹${avg}` `` | `formatAmountOnly(avg)` |
| Line 174 | `` `₹${revenue}` `` | `formatAmountOnly(revenue)` |
| Line 205 | `` `₹${revenue}` `` | `formatAmountOnly(revenue)` |
| Line 206 | `` `₹${customerValue}` `` | `formatAmountOnly(customerValue)` |

## Technical Details

The `formatAmountOnly()` function from `CurrencyContext`:
- Takes a USD amount as input
- Converts to the user's selected display currency using the stored exchange rate
- Returns a properly formatted string with the correct currency symbol

```typescript
// Example: formatAmountOnly(2.5) with INR selected
// Returns: "₹208" (2.5 × 83 rate, properly converted)
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/seller/SellerReports.tsx` | Import `useCurrency`, replace hardcoded `₹` with `formatAmountOnly()` |

## Expected Result

| Metric | Before (Incorrect) | After (Correct) |
|--------|-------------------|-----------------|
| Total Revenue (for $252.50 USD) | `₹252.5` | `$252.50` or `₹20,958` (if INR selected) |
| Avg Order Value (for $25.25 USD) | `₹25` | `$25.25` or `₹2,096` (if INR selected) |

The currency will now match the user's selection in the currency dropdown and properly convert values.
