

## Fix: Dashboard Crash After Login (All Login Methods)

### Problem
After signing in (Google OAuth, email/password, or any method), the dashboard crashes with "Something went wrong" on mobile. This is caused by a race condition in the auth initialization where components try to query the database before the user object is fully available.

### Root Cause

In `useAuth.ts`, two things set `loading = false`:
1. `onAuthStateChange` callback (line 177) -- fires early, before `getSession()` finishes
2. `getSession().then(...)` (lines 198/201) -- fires after profile is loaded

On mobile (slower connections), the `onAuthStateChange` fires first with `INITIAL_SESSION`, sets `loading = false`, and dashboard components mount and try to use `user.id` before the session is fully established. This causes crashes in `DashboardTopBar` and `MobileNavigation` where database queries run without error protection.

### Solution (4 files)

**1. `src/hooks/useAuth.ts` -- Fix the loading race condition**
- Add a `didInitialLoad` ref to prevent `onAuthStateChange` from setting `loading = false` before `getSession` finishes
- Only `getSession` controls the initial `loading = false`
- After initial load, `onAuthStateChange` can freely update state
- Wrap profile fetch in try/catch

**2. `src/components/dashboard/DashboardTopBar.tsx` -- Add error protection**
- Wrap all three `useEffect` hooks (unread count, wallet, notifications) in try/catch blocks
- The `if (!user) return` guards already exist (lines 59, 85, 117) -- just need try/catch around the async calls inside

**3. `src/components/dashboard/MobileNavigation.tsx` -- Add error protection**
- Wrap `fetchUnreadCount` and `fetchNotifications` in try/catch blocks
- Guards already exist (lines 48, 85, 106) -- just need error handling

**4. `src/pages/Dashboard.tsx` -- Guard heartbeat and add loading state**
- Add a loading check before rendering `DashboardLayout` so child components don't mount before auth is ready
- Show a simple loading state while auth initializes

### Technical Details

Key change in `useAuth.ts`:
```
BEFORE:
  onAuthStateChange -> setLoading(false)  // fires FIRST, too early
  getSession -> setLoading(false)          // fires SECOND, correct

AFTER:
  didInitialLoad ref = false
  onAuthStateChange -> if !didInitialLoad, skip setLoading(false)
  getSession completes all checks -> setLoading(false), didInitialLoad = true
  Future onAuthStateChange events -> can update state freely
```

Key change in DashboardTopBar/MobileNavigation:
```tsx
// Wrap async calls in try/catch
useEffect(() => {
  if (!user) return;
  const fetch = async () => {
    try {
      const { count } = await supabase.from('support_messages')...
      setUnreadCount(count || 0);
    } catch (err) {
      console.warn('[TopBar] Non-critical fetch error:', err);
    }
  };
  fetch();
}, [user]);
```

Key change in Dashboard.tsx:
```tsx
const Dashboard = () => {
  const { loading, user } = useAuthContext();
  // Don't render dashboard children until auth is settled
  if (loading) {
    return <AppShell variant="dashboard" />;
  }
  // ... rest of dashboard
};
```

### Why This Permanently Fixes It
- Loading state waits for ALL initial auth operations before rendering dashboard children
- Works identically for Google OAuth, email/password, magic link, and any future auth method
- Even if a component renders early, try/catch prevents crashes from bubbling to ErrorBoundary
- Heartbeat only runs after user exists
- No more race between `onAuthStateChange` and `getSession`
