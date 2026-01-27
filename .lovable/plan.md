
# Migrate Buyer Dashboard to Server-Side Data Loading

## Problem Summary

Your **Buyer Dashboard components** are making **direct database calls** from the browser instead of using the secure server-side BFF (Backend-for-Frontend) endpoints. This causes:

- Database not loading properly (random failures)
- Token/session issues affecting data fetch
- Inconsistent state between components
- No centralized error handling

The **Seller Dashboard** already uses BFF correctly and works reliably. We need to apply the same pattern to the Buyer Dashboard.

---

## Current State vs Target State

```text
CURRENT (Broken):
+----------------+     Direct Supabase     +-------------+
| Browser        | ----------------------> | Database    |
| (BuyerHome)    |   Token can be stale    | (may fail)  |
+----------------+                         +-------------+

TARGET (Reliable):
+----------------+     BFF API Call        +------------------+     Service Role    +-------------+
| Browser        | ----------------------> | Edge Function    | -----------------> | Database    |
| (BuyerHome)    |   Server validates JWT  | (bff-buyer-*)    |   Always works     | (reliable)  |
+----------------+                         +------------------+                    +-------------+
```

---

## Components to Update

| Component | Current | Target |
|-----------|---------|--------|
| `BuyerDashboardHome.tsx` | Direct Supabase calls | Use `bffApi.getBuyerDashboard()` |
| `BuyerOrders.tsx` | Direct Supabase calls | Use BFF for initial load |
| `BuyerWallet.tsx` | Already uses BFF | No changes needed |

---

## Implementation Plan

### Part 1: Enhance BFF Endpoint

Update `supabase/functions/bff-buyer-dashboard/index.ts` to return more complete data:

- Add `wishlistCount` from `buyer_wishlist` table
- Add full order stats (pending, delivered, completed counts)
- Include more order details for display

### Part 2: Update BuyerDashboardHome

Replace direct Supabase calls with BFF API:

```typescript
// Before (current)
const { data: walletData } = await supabase
  .from('user_wallets')
  .select('balance')
  .eq('user_id', user?.id);

// After (server-side)
const result = await bffApi.getBuyerDashboard();
if (result.isUnauthorized) {
  handleUnauthorized();
  return;
}
const { wallet, sellerOrders } = result.data;
```

### Part 3: Update BuyerOrders

Replace initial data fetch with BFF call:

```typescript
// Use BFF for initial load
const result = await bffApi.getBuyerDashboard();
setOrders(result.data.sellerOrders);
```

### Part 4: Add Real-time Subscriptions

Keep Supabase realtime for instant updates AFTER initial BFF load:

```typescript
// BFF for initial load (reliable)
const result = await bffApi.getBuyerDashboard();
setOrders(result.data.sellerOrders);

// Realtime for instant updates (bonus, not critical)
supabase.channel('buyer-orders')
  .on('postgres_changes', {...}, () => refreshFromBFF())
  .subscribe();
```

---

## Files to Modify

| File | Action |
|------|--------|
| `supabase/functions/bff-buyer-dashboard/index.ts` | Enhance with wishlist count and more order data |
| `src/lib/api-fetch.ts` | Update `getBuyerDashboard` response type |
| `src/components/dashboard/BuyerDashboardHome.tsx` | Replace direct Supabase with BFF |
| `src/components/dashboard/BuyerOrders.tsx` | Replace direct Supabase with BFF |

---

## Expected Results

| Issue | Before | After |
|-------|--------|-------|
| Database not loading | Random failures from client | Server-side validation ensures data loads |
| Token issues | Stale tokens cause 401 errors | BFF validates token before querying |
| Inconsistent data | Multiple separate queries | Single BFF call returns all data |
| Error handling | Scattered across components | Centralized in BFF with clean error states |

---

## Technical Details

### BFF Endpoint Enhancement

```typescript
// Add to bff-buyer-dashboard/index.ts
const [
  walletResult,
  sellerOrdersResult,
  wishlistResult  // NEW
] = await Promise.all([
  // ... existing queries
  
  // Wishlist count
  supabase
    .from('buyer_wishlist')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
]);

// Return enhanced data
return successResponse({
  wallet,
  sellerOrders,
  wishlistCount: wishlistResult.count || 0,  // NEW
  orderStats: {  // NEW
    total: sellerOrders.length,
    pending: sellerOrders.filter(o => o.status === 'pending').length,
    delivered: sellerOrders.filter(o => o.status === 'delivered').length,
    completed: sellerOrders.filter(o => o.status === 'completed').length,
    totalSpent: sellerOrders.reduce((sum, o) => sum + o.amount, 0)
  }
});
```

### Component Update Pattern

```typescript
const BuyerDashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchData = async () => {
    const result = await bffApi.getBuyerDashboard();
    
    if (result.isUnauthorized) {
      handleUnauthorized();
      return;
    }
    
    if (result.error) {
      setError(result.error);
      return;
    }
    
    setData(result.data);
    setLoading(false);
  };

  // Initial load from BFF
  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // Realtime for updates
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('buyer-dashboard')
      .on('postgres_changes', { ... }, fetchData)
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [user]);
};
```

---

## Security Benefits

1. **Server-Side Token Validation**: Every request verified by `verifyAuth()` in Edge Function
2. **Service Role Queries**: Database queries use service role (bypasses RLS issues)
3. **No Client-Side Token Leaks**: Sensitive queries happen server-side
4. **Consistent Error Handling**: All errors go through `handleUnauthorized()`

---

## No Changes to Session Logic

This plan only updates **data loading** to use the existing BFF pattern. The session handling you approved previously remains unchanged.
