
Goal
- Stop the “Session Expired” banner from appearing after 5–10 minutes (especially after tab switch) and prevent dashboards from “dying” until the user manually logs in again.
- Keep the “enterprise UX” rule: no forced logout/redirect unless user manually logs out or clears cookies.

What is happening (root cause)
1) Your dashboard components treat any “unauthorized” response as “session expired” immediately.
   - Example: BuyerDashboardHome.tsx calls bffApi.getBuyerDashboard()
   - If apiFetch can’t get a session from supabase.auth.getSession() (even temporarily), apiFetch returns:
     - status 401, error “No active session”, isUnauthorized: true
   - BuyerDashboardHome then calls setSessionExpired(true) and shows the Session Expired banner.
   - This can happen during tab switching/backgrounding due to browser throttling, suspended storage access, token refresh race, or a transient “null session” from the SDK.

2) Heartbeat doesn’t always protect you when session becomes temporarily null.
   - useSessionHeartbeat only runs when isAuthenticated === true.
   - isAuthenticated is currently computed as !!session in useAuth().
   - So if session becomes null temporarily, heartbeat stops, and recovery doesn’t run.

3) Service Worker caching is risky for authenticated BFF endpoints.
   - public/sw.js caches “/functions/v1/bff-” with stale-while-revalidate for all BFF endpoints.
   - That pattern includes authenticated endpoints (buyer dashboard / wallet / seller dashboard).
   - Even if you cache only “response.ok”, this can still cause “wrong/stale user data” risks and can produce confusing behavior after tab switch. It also makes debugging much harder.

4) Cache version mismatch can amplify “first load” and “random break” issues.
   - src/lib/cache-utils.ts APP_VERSION is 1.0.3
   - public/sw.js CACHE_VERSION is v1.0.3
   - Your memory says version moved beyond that before; any mismatch or stale SW can keep old runtime behavior around longer than expected.

Permanent fix (high level)
A) Make “optimistic auth” consistent everywhere:
   - If a local auth token exists (localStorage) and the 12-hour window is still valid, the app should behave as logged-in even if supabase.auth.getSession() briefly returns null.
   - Only treat as “expired” when BOTH are true:
     - recovery fails AND
     - user is beyond the 12-hour grace window (isSessionValid() === false)

B) Make apiFetch resilient:
   - If getSession() returns null, do not immediately return isUnauthorized.
   - Instead:
     1) attempt sessionRecovery.recover()
     2) re-check getSession()
     3) only then return unauthorized if truly unrecoverable AND out of 12h window
   - This prevents false “session expired” after tab switch.

C) Make Heartbeat independent from `!!session`:
   - Heartbeat should run when either:
     - user is authenticated by real session OR
     - hasLocalSession() returns true (optimistic local token) and within grace
   - That way, after tab switch, the heartbeat can restore the session in the background.

D) Stop caching authenticated BFF requests in the Service Worker:
   - If request includes Authorization header, bypass caching (network-only).
   - Also optionally: remove/limit the “/functions/v1/bff-” caching pattern and instead cache only public BFF endpoints (marketplace/store) by explicit list.

E) Add a “reconnect” state instead of “expired” for transient failures:
   - On dashboard pages, if a request fails with 401/no-session but still within 12h window:
     - show a small “Reconnecting…” notice
     - trigger refreshSession()
     - keep cached data visible
     - do NOT show “Session Expired” banner

Concrete implementation steps (files)
1) Update apiFetch behavior (src/lib/api-fetch.ts)
   - Change the “no session” branch:
     - Current: immediately returns { status: 401, isUnauthorized: true, error: 'No active session' }
     - New:
       1) If no session, try sessionRecovery.recover()
       2) If recover succeeded, retry getAccessToken and continue request
       3) If recover failed:
          - If isSessionValid() (within 12h window): return a non-unauthorized error like:
            - status: 503 (or 0), isUnauthorized: false, error: 'Reconnecting…'
            - This prevents UI from flipping to “expired”
          - Else (12h expired): return isUnauthorized true (real expired)
   - Add targeted logs:
     - “[ApiFetch] getSession returned null, trying recovery…”
     - “[ApiFetch] recovery failed but within 12h window; soft-failing without logout”

2) Make “authenticated” state tolerant of transient null sessions (src/hooks/useAuth.ts and src/contexts/AuthContext.tsx)
   - Keep the last known good session/user in state unless we receive SIGNED_OUT.
   - Do not set user/session to null just because getSession() returns null once.
   - Compute isAuthenticated as:
     - `!!session || hasLocalSession()` (from src/lib/session-detector.ts)
   - Ensure AuthProvider’s “sessionVerified” logic doesn’t incorrectly “unverify” on transient null.

3) Run heartbeat based on “optimistic auth”, not only `!!session` (src/hooks/useSessionHeartbeat.ts)
   - Replace `if (!isAuthenticated) return;` with logic that includes:
     - if hasLocalSession() and isSessionValid() => still run heartbeat
   - When heartbeat finds no session:
     - already tries sessionRecovery.recover()
     - but today it returns early without updating UI if within 12h; we keep that,
       but we must ensure components don’t interpret it as “expired”.

4) Fix dashboards that aggressively mark session expired (at least BuyerDashboardHome.tsx, BuyerOrders.tsx, SellerContext.tsx)
   - Change unauthorized handling:
     - If result.isUnauthorized:
       - check isSessionValid()
       - If within 12h window:
         - do NOT call setSessionExpired(true)
         - keep cached data
         - show “Reconnecting…” + a button “Retry now” which triggers refreshSession() then fetchData()
       - If outside 12h window:
         - setSessionExpired(true) (current behavior)
   - This prevents the fake “expired” banner when the tab returns and the SDK is still catching up.

5) Service worker: stop caching authenticated requests (public/sw.js)
   - In fetch handler, add:
     - If request.headers has ‘Authorization’ OR url pathname includes “bff-buyer-” / “bff-seller-”:
       - do not use cache; let it go network-only
   - Keep caching for public endpoints:
     - bff-marketplace-home
     - bff-store-public
   - This reduces weird “works then stops” behavior after tab switch and avoids cross-user caching risks.

6) Align cache versions and force a clean update (src/lib/cache-utils.ts + public/sw.js)
   - Bump APP_VERSION and CACHE_VERSION together (same new version string).
   - This guarantees old SW + old cached bundles are discarded and everyone gets the fixed session logic.

7) Add small diagnostics to confirm the fix
   - Add console logs (kept minimal) in:
     - useSessionHeartbeat heartbeat() when it sees no session and when recovery succeeds
     - apiFetch when session is null and when recovery happens
   - This will let us confirm the exact reason for any future session issue in one screenshot of the console.

Testing plan (what we will verify)
1) Login with Google.
2) Open /dashboard/home and keep it open.
3) Wait 10–15 minutes; switch tabs and return.
4) Confirm:
   - No forced logout
   - No Session Expired banner during the first 12 hours
   - Dashboard continues to fetch data after returning to the tab
5) Simulate a network blip (toggle offline/online).
6) Confirm:
   - It shows cached data + “Reconnecting…”
   - Auto-recovers without forcing sign-in.

Expected outcome
- Dashboard will not randomly show “Session Expired” after 5–10 minutes.
- Tab switching will no longer break the session.
- If the browser temporarily loses access to session data, the app will “self-heal” silently and keep working like Gmail/Upwork: only manual logout or cookie clear logs the user out.

Notes / constraints (honest)
- True “forever login” across weeks/months depends on refresh-token policies controlled by the backend auth provider and user browser settings. But we can guarantee:
  - No random logout in normal usage
  - 12-hour grace enforced by your own UI rules
  - Automatic self-recovery on tab switch and temporary session null states
