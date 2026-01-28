
# Fix Purchase Flow - Funds Not Deducting from Balance

## Problem Identified

When a buyer makes a purchase:
1. The transaction shows as "spent" in the order/transaction history
2. BUT the wallet balance is NOT being deducted properly

The root cause: The current purchase code uses non-atomic operations that can fail silently after order creation.

## Current Broken Flow (Store.tsx)

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. INSERT seller_orders (succeeds)                          │
│ 2. UPDATE user_wallets balance (can fail silently)          │
│ 3. No wallet_transactions record created                    │
│ 4. No seller pending balance added                          │
└─────────────────────────────────────────────────────────────┘
```

## Solution: Use Atomic RPC Function

The database already has a `purchase_seller_product` function that does everything atomically with row-level locking. We need to USE IT.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Store.tsx` | Replace manual INSERT/UPDATE with RPC call |
| `src/components/dashboard/AIAccountsSection.tsx` | Replace manual INSERT/UPDATE with RPC call |

## Technical Changes

### 1. Store.tsx - handlePurchase function (lines 446-470)

**Before (broken):**
```typescript
const { error } = await supabase.from('seller_orders').insert({
  seller_id: product.seller_id,
  buyer_id: user.id,
  product_id: product.id,
  amount: product.price,
  seller_earning: product.price * 0.85,
  status: 'pending'
});

if (error) throw error;

await supabase
  .from('user_wallets')
  .update({ balance: wallet!.balance - product.price })
  .eq('user_id', user.id);
```

**After (fixed):**
```typescript
const commissionRate = 0.10; // 10% platform commission
const sellerEarning = product.price * (1 - commissionRate);

const { data: result, error } = await supabase.rpc('purchase_seller_product', {
  p_buyer_id: user.id,
  p_seller_id: product.seller_id,
  p_product_id: product.id,
  p_product_name: product.name,
  p_amount: product.price,
  p_seller_earning: sellerEarning
});

if (error) throw error;

const purchaseResult = result as { success: boolean; error?: string; order_id?: string };
if (!purchaseResult.success) {
  throw new Error(purchaseResult.error || 'Purchase failed');
}

// Update local wallet state with new balance
setWallet(prev => prev ? { ...prev, balance: (prev.balance || 0) - product.price } : null);
```

### 2. AIAccountsSection.tsx - handlePurchaseSellerProduct (lines 627-760)

Replace the entire manual flow with the atomic RPC call:

**Before (broken):**
```typescript
// 1. Deduct from buyer wallet (manual update)
const newBalance = currentBalance - product.price;
const { error: updateError } = await supabase
  .from('user_wallets')
  .update({ balance: newBalance })
  .eq('user_id', user.id);

// 2. Create wallet transaction record (separate operation)
// 3. Create seller order (separate operation)
// 4. Add to seller pending balance (separate operation)
```

**After (fixed):**
```typescript
const commissionRate = 0.10;
const sellerEarning = product.price * (1 - commissionRate);

const { data: result, error } = await supabase.rpc('purchase_seller_product', {
  p_buyer_id: user.id,
  p_seller_id: product.seller_id,
  p_product_id: product.id,
  p_product_name: product.name,
  p_amount: product.price,
  p_seller_earning: sellerEarning
});

if (error) throw error;

const purchaseResult = result as { success: boolean; error?: string; order_id?: string };
if (!purchaseResult.success) {
  throw new Error(purchaseResult.error || 'Purchase failed');
}

// Continue with notifications...
```

### 3. AIAccountsSection.tsx - handlePendingPurchase (lines 763-824)

Same fix for the pending purchase handler (post-auth flow).

## What the RPC Function Does (Atomic)

The `purchase_seller_product` function does everything in ONE database transaction:

1. **Locks the wallet row** - Prevents race conditions/double-spending
2. **Validates balance** - Returns error if insufficient funds
3. **Deducts from buyer wallet** - Atomically updates balance
4. **Creates wallet_transactions record** - Purchase is logged
5. **Adds to seller pending_balance** - Seller sees their earning
6. **Creates seller_orders record** - Order is created
7. **Returns success/error** - Single response with new balance

## Expected Outcome

After this fix:
- Wallet balance deducts correctly on every purchase
- Transaction record always created
- No race conditions or double-spending possible
- Seller pending balance always updated
- Order and transaction are always in sync

## Summary

This is a critical bug fix that replaces 4 separate database operations with 1 atomic RPC call, ensuring purchases always correctly deduct the buyer's balance.
