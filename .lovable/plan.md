

## Fix: Dashboard Crash After Login on Mobile

### Problem
After signing in with Google on mobile, the dashboard shows "Something went wrong" (the error boundary screen). This happens because of race conditions during authentication -- multiple components try to fetch data before the session is fully established.

### Root Causes

1. **Double loading in useAuth**: Both `getSession()` and `onAuthStateChange` run simultaneously. On mobile (slower connections), `setLoading(false)` can fire before the profile and admin role checks complete, causing child components to render with null data and crash.

2. **No error protection in Dashboard child components**: `DashboardTopBar` and `MobileNavigation` immediately query the database (notifications, wallet, etc.) using `user.id` -- but `user` can briefly be null during the auth transition, causing unhandled errors that bubble up to the ErrorBoundary.

3. **Heartbeat fires too early**: `useSessionHeartbeat` runs immediately on mount and calls `supabase.auth.getSession()` while the OAuth callback is still processing tokens, potentially triggering recovery loops.

### Solution (4 files changed)

**1. `src/hooks/useAuth.ts` -- Fix the loading race condition**
- Ensure `setLoading(false)` is called only ONCE after ALL initial checks (session + profile + admin role) complete
- Add a `didInitialLoad` ref to prevent `onAuthStateChange` from setting `loading = false` before `getSession` finishes
- Wrap all async operations in try/catch to prevent unhandled rejections

**2. `src/components/dashboard/DashboardTopBar.tsx` -- Guard against null user**
- Add early return guards: if `!user` return null or skeleton
- Wrap all Supabase queries in try/catch blocks
- This prevents crashes when the component renders before auth is ready

**3. `src/components/dashboard/MobileNavigation.tsx` -- Guard against null user**
- Same pattern: guard all `user.id` access with null checks
- Wrap Supabase queries in try/catch

**4. `src/pages/Dashboard.tsx` -- Add error protection to Dashboard mount**
- Wrap `useSessionHeartbeat` call inside a condition that checks `user` exists first
- Add a brief loading state while auth context settles on mobile

### Technical Details

Key change in `useAuth.ts`:
```
// BEFORE (broken):
onAuthStateChange fires -> setLoading(false)  // TOO EARLY
getSession fires -> also sets loading false    // RACE

// AFTER (fixed):
didInitialLoad ref = false
onAuthStateChange fires -> if !didInitialLoad, skip setLoading
getSession finishes all checks -> setLoading(false), didInitialLoad = true
onAuthStateChange fires again -> now safe to update state
```

Key change in DashboardTopBar/MobileNavigation:
```tsx
// BEFORE: crashes if user is null
useEffect(() => {
  const { count } = await supabase.from('support_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)  // CRASH: user is null

// AFTER: safe
useEffect(() => {
  if (!user) return;  // Guard
  try {
    const { count } = await supabase.from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
  } catch (err) {
    console.warn('Non-critical fetch error:', err);
  }
```

### Why This Will Permanently Fix It
- The loading state now waits for ALL initial auth operations before rendering dashboard children
- Even if a child component renders early, null guards prevent crashes
- All async database calls are wrapped in try/catch so errors are logged, not thrown
- The heartbeat waits for user to exist before running
- No more race conditions between OAuth callback processing and component mounting

