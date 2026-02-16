

## Fix: iOS-Only Dashboard Crash After Login

### Problem
The dashboard crash after login only happens on iOS (Safari and Chrome/WebKit). Android and desktop work fine. This is a known issue where `supabase.auth.getSession()` briefly returns `null` on iOS even when the user is authenticated.

### Why iOS is Different
- WebKit cookie/session initialization is slower than other browsers
- After OAuth redirect or sign-in, the session may be `null` for a brief period
- The Supabase JS client's authorization headers may not be set immediately
- The session often only "appears" after the tab is backgrounded and reopened

### Solution (1 file: `src/hooks/useAuth.ts`)

**1. iOS Detection Helper**
- Add a simple `isIosBrowser()` check using `navigator.userAgent`

**2. iOS Session Retry on SIGNED_IN**
- When `onAuthStateChange` fires `SIGNED_IN` on iOS, wait 500ms then re-fetch the session via `supabase.auth.getSession()` to ensure headers are initialized
- This gives WebKit time to finalize cookie/session storage

**3. Visibility Change Listener**
- Add a `visibilitychange` event listener that re-fetches the session when the tab becomes visible
- This handles the iOS case where the session only populates after backgrounding/foregrounding
- Clean up listener on unmount

**4. iOS Retry Before Giving Up on Null Session**
- When `onAuthStateChange` reports a null session on iOS (and it's not a SIGNED_OUT event), retry up to 3 times with 500ms delays before accepting the null
- Uses a ref counter to prevent infinite loops

### What This Does NOT Change
- All existing logic (didInitialLoad, optimistic auth, loading guards) stays intact
- Android and desktop behavior is unchanged -- the retry/visibility logic only activates on iOS
- SignIn.tsx and Dashboard.tsx remain as-is from previous fixes

### Why This is the Permanent Fix
- Directly addresses the known iOS WebKit timing issue
- Retry mechanism gives iOS time to initialize the session
- Visibility listener catches the case where session appears after tab switch
- Combined with existing guards (loading || !user), the dashboard never renders with null user on any platform

