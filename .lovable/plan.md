

# 24-Hour Persistent Login Plan

## Current Behavior

The app currently:
1. Uses Supabase auth with `persistSession: true` and `autoRefreshToken: true`
2. Has a heartbeat that checks every 5 minutes and refreshes tokens
3. **Problem**: If any session check fails, it immediately signs out the user

## Goal

- User logs in once → stays logged in for 24 hours minimum
- No automatic logout unless:
  1. User manually clicks "Log Out"
  2. User hasn't used the app for 24+ hours
  3. Refresh token is truly expired (server-side invalid)

## Implementation

### 1. Add Session Persistence Tracking

Create a new utility to track login timestamps:

**File: `src/lib/session-persistence.ts`**
```typescript
const SESSION_KEY = 'app_session_start';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const markSessionStart = () => {
  localStorage.setItem(SESSION_KEY, Date.now().toString());
};

export const isSessionValid = (): boolean => {
  const start = localStorage.getItem(SESSION_KEY);
  if (!start) return true; // No timestamp = new session, allow
  return Date.now() - parseInt(start) < SESSION_DURATION;
};

export const clearSessionTimestamp = () => {
  localStorage.removeItem(SESSION_KEY);
};
```

### 2. Update Heartbeat - More Resilient

**File: `src/hooks/useSessionHeartbeat.ts`**

Key changes:
- **Don't immediately sign out on failures** - try to recover first
- Only sign out if 24-hour window has passed AND refresh fails
- Add retry logic for token refresh

```typescript
const heartbeat = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // If no session but within 24-hour window, try to recover
    if (error || !session) {
      // Attempt refresh before giving up
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !data.session) {
        // Check if within 24-hour window - if so, don't force logout
        if (isSessionValid()) {
          console.log('[Heartbeat] Session issue but within 24h window - staying logged in');
          return; // Don't sign out
        }
        // Only sign out if truly expired (24h+)
        await signOut();
        clearSessionTimestamp();
        window.location.href = '/signin';
      }
      return;
    }

    // Proactive refresh (same as before)
    const exp = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    if (exp && (exp - now) < TOKEN_REFRESH_THRESHOLD) {
      await supabase.auth.refreshSession();
    }
  } catch (error) {
    // On error, don't sign out - just log
    console.error('[Heartbeat] Error:', error);
  }
};
```

### 3. Update Auth Hook - Mark Session on Login

**File: `src/hooks/useAuth.ts`**

Add session timestamp when user logs in:

```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ ... });
  if (!error && data.session) {
    markSessionStart(); // Track 24-hour window
  }
  return { data, error };
};

const signInWithGoogle = async () => {
  // Google OAuth will trigger onAuthStateChange
  // Mark session there
};

// In onAuthStateChange:
if (event === 'SIGNED_IN') {
  markSessionStart();
}

const signOut = async () => {
  clearSessionTimestamp(); // Clear on manual logout
  const { error } = await supabase.auth.signOut();
  return { error };
};
```

### 4. Update ProtectedRoute - Don't Force Logout

**File: `src/components/auth/ProtectedRoute.tsx`**

If auth loading times out, check 24-hour window before redirecting:

```typescript
// Instead of immediate redirect on timeout:
if (authLoadingTimedOut && !isAuthenticated) {
  if (isSessionValid()) {
    // Try silent refresh instead of redirect
    await supabase.auth.refreshSession();
    return; // Don't redirect yet
  }
  // Only redirect if truly expired
  navigate('/signin');
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/session-persistence.ts` | **NEW** - 24-hour tracking utilities |
| `src/hooks/useSessionHeartbeat.ts` | More resilient, don't force logout |
| `src/hooks/useAuth.ts` | Mark session start on login |
| `src/components/auth/ProtectedRoute.tsx` | Check 24h window before redirect |

## How It Works

```text
User Login
    │
    ▼
┌──────────────────────┐
│ markSessionStart()   │ ← Store timestamp in localStorage
│ 24-hour timer begins │
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│ Session Heartbeat    │ ← Runs every 5 minutes
│ Refreshes JWT tokens │
│ Keeps session alive  │
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│ Token Refresh Fails? │
│ Check 24h window:    │
│ - Within 24h → STAY  │
│ - Beyond 24h → LOGOUT│
└──────────────────────┘
```

## Expected Behavior After Implementation

| Scenario | Current | After |
|----------|---------|-------|
| Network hiccup during heartbeat | Logs out | Stays logged in |
| Browser tab inactive for hours | May logout | Stays logged in |
| Token refresh fails once | Logs out | Retries, stays in |
| User closes browser, returns next day (< 24h) | Often logged out | Stays logged in |
| User inactive for 24+ hours | - | Logs out (expected) |
| User clicks "Log Out" | Logs out | Logs out |

## Technical Notes

1. **Refresh tokens** in Supabase are valid for much longer than JWTs (default 7 days)
2. The 24-hour window is a **client-side grace period** - the actual token refresh happens server-side
3. This change makes the auth system more **fault-tolerant** while still being secure

