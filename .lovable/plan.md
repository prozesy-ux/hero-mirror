

## Fix: Dashboard Crash After Email Login (Root Cause Found)

### The Actual Root Cause

The previous fix (didInitialLoad ref) only solves the **page refresh/OAuth redirect** race condition. The **email login** crash has a different root cause:

In `SignIn.tsx`, after a successful `signIn()` call, the code navigates to `/dashboard` **immediately** (line 119: `handlePostAuthRedirect()`). But at this point, `onAuthStateChange` hasn't fired yet, so `user` is still `null` in the auth context. The dashboard components then render with a null user and crash.

### Timeline of the Bug

```text
1. User on /signin, loading=false, user=null (correct - not logged in)
2. signIn(email, password) succeeds
3. Token saved to localStorage by Supabase SDK
4. handlePostAuthRedirect() navigates to /dashboard IMMEDIATELY
5. ProtectedRoute checks localStorage -> token exists -> allows through
6. Dashboard checks loading -> false (was set during initial mount)
7. Dashboard renders children with user=null
8. Components crash -> "Something went wrong"
9. onAuthStateChange fires (too late - crash already happened)
```

### Solution (3 files)

**1. `src/pages/SignIn.tsx` -- Stop racing the auth state**
- Remove the direct `handlePostAuthRedirect()` call after `signIn()` and `signUp()` success
- Instead, show a "Signing in..." state and let the existing `useEffect` (lines 78-86) handle navigation AFTER `user` is populated by `onAuthStateChange`
- This is the PRIMARY fix -- it eliminates the race entirely

**2. `src/pages/Dashboard.tsx` -- Add user guard as safety net**
- Change `if (loading)` to `if (loading || !user)` before rendering dashboard children
- This ensures the dashboard NEVER renders with a null user, regardless of how the user arrived
- Shows AppLoader until user is fully available

**3. `src/hooks/useAuth.ts` -- Re-trigger loading on sign-in**
- When `onAuthStateChange` fires with `SIGNED_IN` event and `didInitialLoad` is true (meaning user just signed in, not page load), briefly set `loading = true` while fetching profile/admin role
- Set `loading = false` only after profile and admin checks complete
- This gives Dashboard the correct signal to wait

### Why Previous Fixes Didn't Work

The `didInitialLoad` ref only prevents premature `setLoading(false)` during **initial page load** (OAuth redirect). For email login:
- The user is already on the page
- `loading` was already set to `false` during initial mount (no session at that point)
- `signIn()` returns before `onAuthStateChange` fires
- Nothing re-sets `loading = true` during the sign-in transition
- Dashboard renders immediately with null user

### Why This Fix is Permanent

- **SignIn.tsx**: Navigation only happens after `user` is confirmed in auth context (useEffect dependency)
- **Dashboard.tsx**: Double guard (`loading || !user`) catches any edge case where user is null
- **useAuth.ts**: Loading state accurately reflects auth transitions, not just initial load
- Works for ALL login methods: email, Google, Apple, magic link
- No timing dependency -- purely state-driven navigation

