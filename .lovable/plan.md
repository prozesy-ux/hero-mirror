

## Fix Sign-In Loading Issues

### Problems Identified

Based on my analysis of the codebase, there are **3 critical issues** causing the infinite loading state on sign-in:

| Issue | Location | Description |
|-------|----------|-------------|
| 1. OAuth processing stuck | `SignIn.tsx:189` | `oauthProcessing` state never gets cleared after OAuth callback |
| 2. No safety timeout | `SignIn.tsx` | If auth state change never fires, loading screen stays forever |
| 3. Missing redirect timeout | `SignIn.tsx` | After successful OAuth, navigation can fail silently |

### Root Cause Analysis

```text
User clicks "Sign in with Google"
        ↓
Google OAuth redirects back with #access_token=...
        ↓
SignIn.tsx detects hash, sets oauthProcessing = true ← NEVER CLEARED
        ↓
Supabase SDK processes token (supposed to fire onAuthStateChange)
        ↓
If onAuthStateChange doesn't fire (race condition) → INFINITE LOADING
        ↓
User refreshes → hash is gone, but oauthProcessing ref is stale
```

The `didProcessOAuth.current = true` is set but never reset. On refresh, the component re-mounts with `didProcessOAuth.current = false`, BUT the `oauthProcessing` state from line 189 check `(authLoading && window.location.hash.includes('access_token'))` can still show loading if `authLoading` is true and there's timing issues.

### The Fix

#### 1. Add Safety Timeout for OAuth Processing (`SignIn.tsx`)

Add a 10-second timeout that clears the OAuth processing state if auth doesn't complete:

```typescript
// After setting oauthProcessing = true
useEffect(() => {
  if (!oauthProcessing) return;
  
  // Safety timeout - if OAuth doesn't complete in 10s, clear loading
  const timeout = setTimeout(() => {
    console.warn('[SignIn] OAuth processing timeout - clearing loading state');
    setOauthProcessing(false);
  }, 10000);
  
  return () => clearTimeout(timeout);
}, [oauthProcessing]);
```

#### 2. Clear OAuth State After Auth State Change (`SignIn.tsx`)

Ensure `oauthProcessing` is set to false when auth completes successfully:

```typescript
// In the auto-redirect useEffect
useEffect(() => {
  if (didAutoRedirect.current) return;
  if (authLoading) return;
  if (!user) {
    // Auth finished loading but no user - clear OAuth processing
    if (oauthProcessing) {
      console.log('[SignIn] Auth loaded without user - clearing OAuth state');
      setOauthProcessing(false);
    }
    return;
  }

  // User exists, proceed with redirect
  didAutoRedirect.current = true;
  setOauthProcessing(false); // ← ADD THIS
  handlePostAuthRedirect();
}, [user, authLoading, oauthProcessing]);
```

#### 3. Fix OAuth Processing Check Logic (`SignIn.tsx`)

Change line 189 to be more robust:

```typescript
// Current (buggy):
if (oauthProcessing || (authLoading && window.location.hash.includes('access_token'))) {

// Fixed:
if (oauthProcessing && window.location.hash.includes('access_token')) {
```

The `authLoading` check can trigger false positives when the page loads without a hash.

#### 4. Use Lovable Cloud's Managed OAuth

The project is using `supabase.auth.signInWithOAuth` directly instead of the managed `lovable.auth.signInWithOAuth`. This needs to be configured:

**Files to Update:**
- `src/hooks/useAuth.ts` - Update `signInWithGoogle` function
- `src/pages/Seller.tsx` - Update `handleGoogleAuth` function

After running the `supabase--configure-social-auth` tool, the code will use:

```typescript
import { lovable } from "@/integrations/lovable/index";

const signInWithGoogle = async () => {
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  return { data: null, error };
};
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/SignIn.tsx` | Add safety timeout, fix OAuth processing logic, clear state on redirect |
| `src/hooks/useAuth.ts` | Use `lovable.auth.signInWithOAuth` for Google (after tool config) |
| `src/pages/Seller.tsx` | Update Google auth to use managed OAuth |

### Implementation Steps

1. **Configure Lovable Cloud OAuth** - Run the configuration tool to generate the lovable integration
2. **Update SignIn.tsx** - Add safety timeout and fix OAuth processing logic
3. **Update useAuth.ts** - Switch to managed Google OAuth
4. **Update Seller.tsx** - Switch to managed Google OAuth for seller flow

### Expected Result

After implementation:
- OAuth loading screen has 10-second safety timeout
- Loading state clears properly after auth completes or fails
- Google OAuth uses Lovable Cloud's managed solution for reliability
- Page refresh after OAuth won't show infinite loading

