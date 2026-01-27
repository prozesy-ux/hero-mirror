

# Server-Side Session Handling - Comprehensive Fix

## Problem Analysis

After reviewing the codebase, I identified several issues causing session logout problems:

### Current Architecture Issues

1. **Client-Side Session Validation Gaps**
   - `useAuth.ts` uses `getSession()` which reads from localStorage but doesn't validate the token server-side
   - If the token is expired/invalid but still in localStorage, the user appears "logged in" until an API call fails
   - No proactive session health check

2. **Race Conditions in Auth State**
   - `onAuthStateChange` listener and `getSession()` can both trigger state updates
   - Profile and admin role checks happen in parallel without proper coordination
   - Loading state can finish before all data is fetched

3. **Token Refresh Issues**
   - `autoRefreshToken: true` in client config should work, but network issues can cause silent failures
   - No heartbeat to detect stale sessions before user actions fail
   - `refreshSession()` in `api-fetch.ts` only triggers on 401 responses (reactive, not proactive)

4. **Protected Route Timeout Logic**
   - 10-second timeout with `window.location.reload()` can cause infinite loops
   - Recovery attempt uses `getSession()` (still client-side, not server-validated)

5. **Session Storage Caching**
   - Admin role cached in `sessionStorage` persists even if session is invalidated
   - No cache invalidation on session refresh

---

## Solution: Server-Side Session Validation

### Part 1: Create Session Validation Edge Function

A new edge function that validates the JWT and returns session health status:

**File: `supabase/functions/validate-session/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  verifyAuth, 
  corsHeaders, 
  errorResponse, 
  successResponse,
  createServiceClient
} from '../_shared/auth-verify.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const authResult = await verifyAuth(authHeader);

    if (!authResult.success || !authResult.userId) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: authResult.error,
          code: 'INVALID_SESSION'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch minimal profile data to confirm user exists
    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, email')
      .eq('user_id', authResult.userId)
      .maybeSingle();

    // Check admin role server-side
    const { data: hasAdmin } = await supabase
      .rpc('has_role', { _user_id: authResult.userId, _role: 'admin' });

    return successResponse({
      valid: true,
      userId: authResult.userId,
      email: authResult.email,
      isAdmin: hasAdmin === true,
      profileExists: !!profile,
      validatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ValidateSession] Error:', error);
    return errorResponse('Validation failed', 500);
  }
});
```

---

### Part 2: Update `useAuth.ts` with Server-Side Validation

**Key Changes:**

1. Add a `validateSessionServer()` function that calls the edge function
2. Run server validation on initial mount and after token refresh
3. Clear stale cache if server says session is invalid
4. Add a periodic heartbeat (every 5 minutes) to detect stale sessions proactively

```typescript
// New function to validate session server-side
const validateSessionServer = async (accessToken: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });

    const result = await response.json();
    
    if (!result.data?.valid) {
      console.warn('[Auth] Server validation failed:', result.data?.error);
      // Clear stale session
      await supabase.auth.signOut();
      return false;
    }

    // Update admin status from server (source of truth)
    setIsAdmin(result.data.isAdmin);
    return true;
  } catch (error) {
    console.error('[Auth] Server validation error:', error);
    return false; // Assume invalid on network error
  }
};
```

---

### Part 3: Update `ProtectedRoute.tsx`

**Key Changes:**

1. Remove the `window.location.reload()` recovery (causes loops)
2. Use server-side validation instead of client-side `getSession()`
3. Clear redirect to signin on any validation failure

```typescript
// In timeout handler:
const validateResult = await validateSessionServer();
if (!validateResult) {
  // Server confirmed session is invalid
  setTimedOut(true);
} else {
  // Session is valid, just slow - continue waiting
  setIsRecovering(false);
}
```

---

### Part 4: Update `api-fetch.ts` with Proactive Validation

**Key Changes:**

1. Before making requests, check if token is near expiry (within 5 minutes)
2. If near expiry, proactively refresh before the request
3. Add structured error codes for better handling

```typescript
// Check token expiry before request
const session = await supabase.auth.getSession();
if (session.data.session) {
  const exp = session.data.session.expires_at;
  const now = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60;
  
  if (exp && (exp - now) < fiveMinutes) {
    console.log('[ApiFetch] Token near expiry, refreshing proactively');
    await supabase.auth.refreshSession();
  }
}
```

---

### Part 5: Add Session Heartbeat System

**File: `src/hooks/useSessionHeartbeat.ts`**

A hook that runs in the background to:
1. Check session health every 5 minutes
2. Proactively refresh if token is expiring
3. Redirect to signin if session becomes invalid

```typescript
const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useSessionHeartbeat = () => {
  const { isAuthenticated, signOut } = useAuthContext();

  useEffect(() => {
    if (!isAuthenticated) return;

    const heartbeat = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.warn('[Heartbeat] No session found - signing out');
          await signOut();
          window.location.href = '/signin';
          return;
        }

        // Check if token is near expiry
        const exp = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const tenMinutes = 10 * 60;

        if (exp && (exp - now) < tenMinutes) {
          console.log('[Heartbeat] Token expiring soon, refreshing...');
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('[Heartbeat] Refresh failed:', error);
            await signOut();
            window.location.href = '/signin';
          }
        }
      } catch (error) {
        console.error('[Heartbeat] Error:', error);
      }
    };

    // Run immediately, then every 5 minutes
    heartbeat();
    const interval = setInterval(heartbeat, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated, signOut]);
};
```

---

### Part 6: Integrate Heartbeat in Dashboard Pages

Add the heartbeat hook to both buyer and seller dashboard wrappers:

```typescript
// In Dashboard.tsx and Seller.tsx
import { useSessionHeartbeat } from '@/hooks/useSessionHeartbeat';

const Dashboard = () => {
  useSessionHeartbeat(); // Starts background session monitoring
  // ... rest of component
};
```

---

### Part 7: Clear Stale Admin Cache

Update `useAuth.ts` to clear admin cache on session change:

```typescript
// In onAuthStateChange handler
if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
  // Clear admin cache to force re-check
  sessionStorage.removeItem(`admin_${session?.user?.id || 'unknown'}`);
}
```

---

## Implementation Files

| File | Action |
|------|--------|
| `supabase/functions/validate-session/index.ts` | **Create** - Server-side session validator |
| `src/hooks/useAuth.ts` | **Update** - Add server validation, clear stale cache |
| `src/hooks/useSessionHeartbeat.ts` | **Create** - Background session health monitor |
| `src/components/auth/ProtectedRoute.tsx` | **Update** - Use server validation, remove reload loop |
| `src/lib/api-fetch.ts` | **Update** - Proactive token refresh before expiry |
| `src/pages/Dashboard.tsx` | **Update** - Add heartbeat hook |
| `src/pages/Seller.tsx` | **Update** - Add heartbeat hook |
| `supabase/config.toml` | **Update** - Add validate-session function config |

---

## Expected Results

| Issue | Before | After |
|-------|--------|-------|
| Stale session in localStorage | User appears logged in, API calls fail | Session validated server-side, redirect to signin |
| Token expiry during use | 401 error on next API call | Proactive refresh 5 min before expiry |
| Admin role cached incorrectly | Stale admin status persists | Cache cleared on token refresh |
| Infinite reload loop | `window.location.reload()` loops | Clean redirect to signin |
| No health monitoring | Issues discovered only on user action | Background heartbeat every 5 min |

---

## Security Improvements

1. **Server-Side Source of Truth** - All session validation happens in edge function using `verifyAuth()`
2. **No Client-Side Trust** - Admin status fetched from server, not cached localStorage
3. **Proactive Refresh** - Tokens refreshed before expiry, reducing window for stale sessions
4. **Clean Signout** - Invalid sessions are fully cleared, including all cached data

