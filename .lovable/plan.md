

# Enterprise-Grade Session & Data Reliability Implementation

## PROJECT: Uptoza Marketplace
## GOAL: Zero random logout, zero page delay, zero auth flicker, million-user scalability

---

## Root Cause Analysis

After thorough codebase review, I identified these critical issues:

| Problem | Root Cause | Location |
|---------|-----------|----------|
| Random logouts | 5-second timeout in ProtectedRoute triggers redirect before auth loads | `ProtectedRoute.tsx:13` |
| Auth flicker on /seller | Double auth check - page has its own `!isAuthenticated` check that shows login form prematurely | `Seller.tsx:654-669` |
| Data load delays | Components wait for auth to complete before fetching data | `BuyerDashboardHome.tsx:77` |
| 12h session not working | Client-side timestamp can fail; server validation triggers logout | `useSessionHeartbeat.ts:54-61` |
| Direct route access fails | ProtectedRoute blocks rendering until server validation completes | `ProtectedRoute.tsx:70-126` |

---

## Architecture Changes

### Current Flow (BROKEN)
```text
User visits /dashboard
       │
       ▼
ProtectedRoute checks auth.loading
       │
       ▼ (5 second timeout)
Server validation call
       │
       ▼ (if fails or slow)
REDIRECT TO /signin ← PROBLEM!
```

### New Flow (FIXED)
```text
User visits /dashboard
       │
       ▼
Check localStorage for Supabase session token
       │
       ├─ No token → Redirect /signin
       │
       └─ Has token → RENDER PAGE INSTANTLY
                            │
                            ▼
                 Background validation (non-blocking)
                            │
                 If expired > 12h → Soft banner "Session expired"
                 If < 12h → Silent refresh
                 NEVER auto-redirect
```

---

## Implementation Plan

### Phase 1: Optimistic Session Detection

**New File: `src/lib/session-detector.ts`**

Create a fast, synchronous check for session existence:

```typescript
/**
 * Fast Session Detector
 * Checks localStorage for Supabase session token existence
 * Does NOT validate token - just checks if one exists
 */

export function hasLocalSession(): boolean {
  try {
    const keys = Object.keys(localStorage);
    // Supabase stores session with key like: sb-<project-ref>-auth-token
    return keys.some(k => 
      k.startsWith('sb-') && k.includes('-auth-token')
    );
  } catch {
    return false;
  }
}

export function getStoredSessionExpiry(): number | null {
  try {
    const keys = Object.keys(localStorage);
    const authKey = keys.find(k => k.startsWith('sb-') && k.includes('-auth-token'));
    if (!authKey) return null;
    
    const data = JSON.parse(localStorage.getItem(authKey) || '{}');
    return data.expires_at ? data.expires_at * 1000 : null;
  } catch {
    return null;
  }
}
```

### Phase 2: Remove All Blocking Auth Checks

**File: `src/components/auth/ProtectedRoute.tsx`**

Complete rewrite with optimistic rendering:

| Current Behavior | New Behavior |
|-----------------|--------------|
| Wait 5s for auth, then validate, then render | Check localStorage instantly, render if token exists |
| Redirect on timeout | Never redirect automatically |
| Show skeleton during validation | Render actual page, validate in background |
| Force logout on validation failure | Show soft banner, allow retry |

Key changes:
- Remove `AUTH_TIMEOUT` redirect logic
- Use `hasLocalSession()` for instant decision
- Render children immediately if local session exists
- Background validation only sets a state flag, never redirects
- Add `sessionExpired` state for soft banner

### Phase 3: Fix Seller Page Double Auth Check

**File: `src/pages/Seller.tsx`**

Current problem (line 654-669):
```typescript
// CURRENT - WRONG
if (authLoading || loading) {
  return <Loader />; // Blocks page
}
if (!isAuthenticated) {
  return <SellerAuthForm />; // Shows login to logged-in users!
}
```

New approach:
```typescript
// NEW - CORRECT
// If local session exists, render page shell immediately
if (hasLocalSession()) {
  if (loading && !sellerProfile) {
    return <SellerSkeleton />; // Show branded skeleton
  }
  // Continue with normal logic...
}

// Only show auth form if truly no session
if (!hasLocalSession() && !authLoading) {
  return <SellerAuthForm />;
}
```

### Phase 4: Pre-fetch Data on Login

**File: `src/hooks/useAuth.ts`**

Add data prefetching when user signs in:

```typescript
// In onAuthStateChange, after SIGNED_IN:
if (event === 'SIGNED_IN') {
  markSessionStart();
  
  // Pre-warm cache for instant page loads
  Promise.allSettled([
    bffApi.getBuyerDashboard(),
    bffApi.getSellerDashboard()
  ]).catch(() => {}); // Silent - just warming cache
}
```

### Phase 5: Never Auto-Logout (Soft Expiry)

**File: `src/hooks/useSessionHeartbeat.ts`**

Replace all `signOut()` + redirect with soft state:

```typescript
// BEFORE - WRONG
if (refreshError && !isSessionValid()) {
  await signOut();
  window.location.href = '/signin'; // Forces logout
}

// AFTER - CORRECT
if (refreshError && !isSessionValid()) {
  setSessionExpiredState(true); // Just set a flag
  // User sees soft banner, can click to re-login
  // BUT stays on page, can view cached data
}
```

**New: Session Expired Banner Component**

Create `src/components/ui/session-expired-banner.tsx`:

```typescript
const SessionExpiredBanner = ({ onRelogin }) => (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 
                  bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 
                  shadow-lg flex items-center gap-3">
    <Clock className="w-5 h-5 text-amber-600" />
    <span className="text-sm text-amber-800">Session expired</span>
    <Button size="sm" onClick={onRelogin}>Re-login</Button>
  </div>
);
```

### Phase 6: Upgrade validate-session Edge Function

**File: `supabase/functions/validate-session/index.ts`**

Add server-side 12-hour grace period tracking:

```typescript
// After JWT verification:
const now = Date.now();
const tokenExp = authResult.exp ? authResult.exp * 1000 : 0;

// Even if JWT is technically expired, check server-side login timestamp
if (!authResult.success && tokenExp > 0) {
  // Token expired - check if within 12-hour grace window
  const hoursSinceExpiry = (now - tokenExp) / (1000 * 60 * 60);
  
  if (hoursSinceExpiry < 12) {
    // Within grace window - try to issue new token
    return successResponse({
      valid: true,
      shouldRefresh: true, // Client should call refreshSession
      graceWindow: true,
      hoursRemaining: 12 - hoursSinceExpiry
    });
  }
}
```

### Phase 7: Global Auth State Machine

**File: `src/contexts/AuthContext.tsx`**

Add new state properties for UI:

```typescript
interface AuthContextType {
  // Existing
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // NEW - UI State Machine
  uiReady: boolean;        // Always true after first render
  sessionVerified: boolean; // True after server validation
  canMutate: boolean;       // True only when session is verified
  sessionExpired: boolean;  // True when 12h+ expired
  
  // NEW - Actions
  revalidateSession: () => Promise<void>;
  softLogout: () => void;   // Just clears state, no redirect
}
```

This enables:
- `uiReady` = Always render UI immediately
- `sessionVerified` = Allow writes only after validation
- `canMutate` = Disable buttons until verified
- `sessionExpired` = Show soft banner

### Phase 8: Realtime Channel Stability

**Files:** All components with realtime subscriptions

On session refresh, realtime channels can become stale. Add cleanup:

```typescript
// In useAuth.ts onAuthStateChange:
if (event === 'TOKEN_REFRESHED') {
  // Emit event for components to resubscribe
  window.dispatchEvent(new CustomEvent('session-refreshed'));
}

// In dashboard components:
useEffect(() => {
  const handleRefresh = () => {
    supabase.removeChannel(channelRef.current);
    // Resubscribe with new token
    subscribeToChannel();
  };
  
  window.addEventListener('session-refreshed', handleRefresh);
  return () => window.removeEventListener('session-refreshed', handleRefresh);
}, []);
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/session-detector.ts` | Fast localStorage session check |
| `src/components/ui/session-expired-banner.tsx` | Soft expiry notification |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/auth/ProtectedRoute.tsx` | Remove blocking checks, optimistic render |
| `src/pages/Seller.tsx` | Remove double auth check, use session detector |
| `src/pages/Dashboard.tsx` | Add session expired banner integration |
| `src/hooks/useSessionHeartbeat.ts` | Never auto-logout, set soft state instead |
| `src/hooks/useAuth.ts` | Add prefetch, new state properties |
| `src/contexts/AuthContext.tsx` | Add UI state machine properties |
| `src/lib/api-fetch.ts` | Never call handleUnauthorized, return state |
| `supabase/functions/validate-session/index.ts` | Add 12h grace window logic |
| `src/components/dashboard/BuyerDashboardHome.tsx` | Use canMutate for actions |

---

## Behavior After Implementation

| Scenario | Before | After |
|----------|--------|-------|
| User visits /dashboard (logged in) | 5s wait, may redirect | Instant render |
| User visits /seller (logged in) | Shows login form briefly | Instant render |
| Network hiccup during heartbeat | Auto-logout | Stays logged in |
| Token expires at hour 6 | May logout | Silent refresh |
| Token expires at hour 13 | May logout | Soft banner, stays on page |
| User clicks "Log Out" | Redirects | Redirects (only manual) |
| Data fetch fails | May show error | Shows cached data |
| BFF returns 401 | Redirects to login | Shows soft banner |

---

## Mutation Safety

During unverified session state:
- READ operations: Allowed (use cache)
- WRITE operations: Disabled (button states)
- Purchase/Withdraw: Blocked until verified

```typescript
// In any component with mutation:
const { canMutate, revalidateSession } = useAuthContext();

<Button 
  disabled={!canMutate}
  onClick={handlePurchase}
>
  {canMutate ? 'Buy Now' : 'Verifying session...'}
</Button>
```

---

## Performance Expectations

| Metric | Before | After |
|--------|--------|-------|
| Time to first paint | 2-5s | <100ms |
| Auth flicker | Frequent | Zero |
| Random logouts | Frequent | Zero |
| Direct route access | Often fails | Always works |
| Data loading | After auth | Pre-cached |

---

## Technical Summary

1. **Optimistic Rendering** - Render pages instantly if localStorage has session token
2. **Background Validation** - Validate server-side without blocking UI
3. **12-Hour Server Grace** - Server decides validity, not client
4. **No Auto-Redirects** - Only manual logout redirects
5. **Soft Expiry Banner** - User stays on page, sees gentle prompt
6. **Mutation Lock** - Writes disabled until session verified
7. **Data Prefetch** - Dashboard data cached on login
8. **Realtime Stability** - Channels resubscribe on token refresh

