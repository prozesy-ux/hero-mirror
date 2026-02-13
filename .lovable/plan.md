

## Fix Google Sign-In Redirect + Default Dashboard Route

### Problem
1. After Google sign-in, OAuth redirects to `/` (home page) instead of back to `/signin` where the post-auth redirect logic lives -- so users see the main website and have to sign in again
2. When the redirect does work, it goes to `/dashboard` (home section) instead of `/dashboard/marketplace`

### Root Cause
- In `useAuth.ts` line 239, `redirect_uri` is set to `window.location.origin` (which is just `/`), so after Google OAuth completes, the browser lands on the home page where there's no redirect logic
- In `SignIn.tsx` line 75, the default fallback redirect is `/dashboard` instead of `/dashboard/marketplace`

### Changes (2 files)

**File 1: `src/hooks/useAuth.ts`**
- Line 239: Change Google OAuth `redirect_uri` from `window.location.origin` to `window.location.origin + '/signin'`
- Line 251: Change Apple OAuth `redirect_uri` from `window.location.origin` to `window.location.origin + '/signin'`
- This ensures after OAuth completes, the user lands back on `/signin` where `handlePostAuthRedirect()` runs automatically via the `useEffect` that watches `user`

**File 2: `src/pages/SignIn.tsx`**
- Line 75: Change default redirect from `navigate("/dashboard")` to `navigate("/dashboard/marketplace")`
- This makes the marketplace section the default landing after sign-in (instead of dashboard home)

### Flow After Fix

```text
User clicks "Continue with Google"
  -> Google OAuth screen
  -> Redirects back to /signin (not /)
  -> SignIn useEffect detects user is authenticated
  -> handlePostAuthRedirect() runs
  -> Navigates to /dashboard/marketplace
```

### What Stays the Same
- All priority redirects (pending purchase, pending chat, store return, returnTo param) remain unchanged
- Email/password sign-in flow is unaffected (already calls handlePostAuthRedirect directly)
- Apple sign-in gets the same fix automatically
- ProtectedRoute, AuthContext, session management -- all unchanged

