
# Enterprise Stability Fix Plan - Zero Data Load Failures

## Critical Issues Identified

After thorough codebase analysis against your 18-point checklist, I found **5 critical bugs** causing the "data not load" issues:

| Issue | Root Cause | Affected Checklist Items |
|-------|-----------|-------------------------|
| `handleUnauthorized()` forces logout | Called in 4 components, triggers `signOut()` + redirect | #2, #3, #4, #10, #15, #16 |
| BFF 401 response triggers redirect | Instead of soft banner, user is kicked out | #2, #3, #16 |
| No cached data fallback | When BFF fails, UI shows error instead of cached data | #10, #12 |
| Realtime channels not resubscribing | After token refresh, channels go dead | #13, #14 |
| Mutation lock not enforced | `canMutate` exists but not used in purchase/withdrawal flows | #17, #18 |

---

## Fix 1: Remove `handleUnauthorized()` Calls

**Problem**: 4 components call `handleUnauthorized()` which triggers `signOut()` + redirect to `/signin`:

- `BuyerDashboardHome.tsx` (line 54)
- `BuyerWallet.tsx` (line 288)
- `BuyerOrders.tsx` (line 84)
- `SellerContext.tsx` (line 144)

**Solution**: Replace with soft state - set `sessionExpired = true` and show banner instead of forcing redirect.

```typescript
// BEFORE (WRONG - Forces logout)
if (result.isUnauthorized) {
  handleUnauthorized();
  return;
}

// AFTER (CORRECT - Soft state)
if (result.isUnauthorized) {
  setSessionExpired(true);
  setError('Session expired - please re-login');
  return;
}
```

**Files to modify**:
- `src/components/dashboard/BuyerDashboardHome.tsx`
- `src/components/dashboard/BuyerWallet.tsx`
- `src/components/dashboard/BuyerOrders.tsx`
- `src/contexts/SellerContext.tsx`

---

## Fix 2: Update `api-fetch.ts` to Never Force Logout

**Problem**: `handleUnauthorized()` function in `api-fetch.ts` calls `supabase.auth.signOut()` and redirects.

**Solution**: Remove the auto-signout behavior. Return error state only - let UI decide what to do.

```typescript
// NEW - Soft unauthorized handler
export function handleUnauthorized(): void {
  // DO NOT call signOut() - this causes forced logout
  // Just emit an event for UI to show soft banner
  window.dispatchEvent(new CustomEvent('session-unauthorized'));
  console.warn('[ApiFetch] Unauthorized - soft state triggered');
}
```

**File to modify**: `src/lib/api-fetch.ts`

---

## Fix 3: Add Cached Data Fallback in Components

**Problem**: When BFF fails (network error, timeout, 500), UI shows error with "Try Again" button. No cached data shown.

**Solution**: Use React Query for automatic caching, or implement localStorage cache fallback.

```typescript
// In fetchData function:
const fetchData = async () => {
  setLoading(true);
  
  const result = await bffApi.getBuyerDashboard();
  
  if (result.error && !result.isUnauthorized) {
    // Try to load from cache
    const cached = localStorage.getItem('buyer_dashboard_cache');
    if (cached) {
      const cachedData = JSON.parse(cached);
      setData(cachedData.data);
      setError('Using cached data - some info may be outdated');
    } else {
      setError(result.error);
    }
    setLoading(false);
    return;
  }
  
  if (result.data) {
    setData(result.data);
    // Cache for offline use
    localStorage.setItem('buyer_dashboard_cache', JSON.stringify({
      data: result.data,
      timestamp: Date.now()
    }));
  }
  setLoading(false);
};
```

**Files to modify**:
- `src/components/dashboard/BuyerDashboardHome.tsx`
- `src/contexts/SellerContext.tsx`

---

## Fix 4: Realtime Channel Resubscription on Token Refresh

**Problem**: When `TOKEN_REFRESHED` event fires, existing realtime channels have stale tokens and stop receiving updates.

**Solution**: Listen for `session-refreshed` event and resubscribe channels.

```typescript
// In SellerContext.tsx and BuyerDashboardHome.tsx:
useEffect(() => {
  const handleSessionRefresh = () => {
    console.log('[Component] Session refreshed - resubscribing realtime');
    // Remove and resubscribe all channels
    supabase.removeAllChannels();
    // Re-run the subscription setup
    setupRealtimeSubscriptions();
  };
  
  window.addEventListener('session-refreshed', handleSessionRefresh);
  return () => window.removeEventListener('session-refreshed', handleSessionRefresh);
}, []);
```

**Files to modify**:
- `src/contexts/SellerContext.tsx`
- `src/components/dashboard/BuyerDashboardHome.tsx`
- `src/components/dashboard/BuyerWallet.tsx`

---

## Fix 5: Enforce Mutation Lock in Purchase/Withdrawal Flows

**Problem**: `canMutate` state exists in AuthContext but is not checked before sensitive operations.

**Solution**: Add `canMutate` check before all write operations.

```typescript
// In purchase handler:
const { canMutate, sessionVerified } = useAuthContext();

const handlePurchase = async (product) => {
  if (!canMutate) {
    toast.error('Please wait - verifying your session...');
    return;
  }
  
  // Proceed with purchase...
};

// In UI:
<Button 
  disabled={!canMutate || purchasing}
  onClick={() => handlePurchase(product)}
>
  {!canMutate ? 'Verifying...' : 'Buy Now'}
</Button>
```

**Files to modify**:
- `src/pages/Store.tsx` (purchase flow)
- `src/components/dashboard/BuyerWallet.tsx` (withdrawal flow)
- `src/components/seller/SellerWallet.tsx` (seller withdrawal)

---

## Fix 6: Add Session Expired Banner to Seller Dashboard

**Problem**: Seller page has the banner but SellerContext doesn't propagate the expired state properly.

**Solution**: Pass `setSessionExpired` from AuthContext into SellerContext's unauthorized handler.

**Files to modify**:
- `src/contexts/SellerContext.tsx`

---

## Implementation Summary

| File | Changes |
|------|---------|
| `src/lib/api-fetch.ts` | Remove `signOut()` call from `handleUnauthorized()` |
| `src/components/dashboard/BuyerDashboardHome.tsx` | Remove `handleUnauthorized()`, add cache fallback, add realtime resubscription |
| `src/components/dashboard/BuyerWallet.tsx` | Remove `handleUnauthorized()`, add `canMutate` check, add realtime resubscription |
| `src/components/dashboard/BuyerOrders.tsx` | Remove `handleUnauthorized()`, add cache fallback |
| `src/contexts/SellerContext.tsx` | Remove `handleUnauthorized()`, use `setSessionExpired`, add realtime resubscription |
| `src/pages/Store.tsx` | Add `canMutate` check before purchase |
| `src/components/seller/SellerWallet.tsx` | Add `canMutate` check before withdrawal |

---

## Expected Results After Fix

| Checklist Item | Current | After Fix |
|----------------|---------|-----------|
| #2 No Auto Logout | FAIL - `handleUnauthorized` forces logout | PASS - Soft banner only |
| #3 12-Hour Session | PARTIAL - BFF 401 triggers logout | PASS - Grace window honored |
| #10 DB Failure ≠ Logout | FAIL - Shows error | PASS - Shows cached data |
| #12 Search Without DB | FAIL - Breaks | PASS - Uses cache |
| #13 Realtime After Refresh | FAIL - Channels die | PASS - Channels resubscribe |
| #14 Realtime After Token Refresh | FAIL - No updates | PASS - Auto-resubscribe |
| #15 Network Offline | FAIL - Error shown | PASS - Cached UI |
| #16 Session Expired (>12h) | FAIL - Redirect | PASS - Soft banner |
| #17 Mutation Lock | FAIL - Actions allowed | PASS - Blocked until verified |
| #18 Write Enable After Verify | PASS | PASS |

---

## Technical Architecture After Fix

```text
User Action (Purchase/Withdraw)
       │
       ▼
Check canMutate state
       │
       ├─ false → Show "Verifying..." (blocked)
       │
       └─ true → Proceed with API call
                    │
                    ├─ Success → Update UI
                    │
                    ├─ 401 → Set sessionExpired = true
                    │         Show soft banner
                    │         DO NOT redirect
                    │
                    └─ Network error → Show cached data
                                       Show "Using offline data" badge
```

This plan addresses ALL identified failures in your 18-point checklist by:

1. **Never forcing logout** - Only soft banners
2. **Honoring 12-hour session** - Server decides, not client
3. **Caching data locally** - Works offline
4. **Resubscribing realtime channels** - After token refresh
5. **Locking mutations** - Until session verified
