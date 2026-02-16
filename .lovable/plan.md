

## Permanent Fix: "Something Went Wrong" on Mobile After Sign-In

### The Real Root Cause

The Service Worker (`public/sw.js`) caches all JavaScript and CSS files using a **"cache first"** strategy. This means:

1. You publish a new version of the app
2. The user's browser loads the new HTML page
3. But the Service Worker serves **old, stale JavaScript** from its cache
4. The old JavaScript doesn't match the new HTML, causing crashes
5. The error is NOT detected as a "chunk loading" error, so the auto-recovery doesn't kick in
6. After 3 failed retries, the user sees "Something went wrong" permanently

This is why it happens mostly on mobile -- mobile browsers keep service workers alive longer and cache more aggressively.

### The Fix (3 Changes)

#### 1. Fix the Service Worker caching strategy (`public/sw.js`)

- Change `.js` and `.css` files from **cache-first** to **network-first** strategy
- This ensures users always get fresh code when online, with cache only as offline fallback
- Remove the hardcoded `CACHE_VERSION` and use a timestamp-based approach so caches auto-invalidate

#### 2. Make ErrorBoundary do a full reload for ANY error, not just chunk errors (`src/components/ui/error-boundary.tsx`)

- Currently, the auto-page-refresh only happens for errors containing "Failed to fetch dynamically imported module"
- Stale-cache errors have different error messages (type errors, undefined references, etc.)
- The fix: On the FIRST error of any kind, clear caches and reload the page once. Only show the error UI if the reload also fails.
- This makes recovery work for ALL error types, not just chunk errors

#### 3. Unregister stale service workers on app startup (`src/App.tsx`)

- Add code to `App.tsx` that checks if the service worker is outdated and forces it to update
- Send a `skipWaiting` message to any waiting service worker so fresh code takes effect immediately
- Clear old caches on version mismatch

### Files Modified

| File | Change |
|------|--------|
| `public/sw.js` | Switch JS/CSS from cache-first to network-first; auto-versioning |
| `src/components/ui/error-boundary.tsx` | Auto-reload on ANY first error (not just chunk errors); clear SW caches before reload |
| `src/App.tsx` | Force SW update on startup; send skipWaiting; clear stale caches |

### Why This Is Truly Permanent

Previous fixes only handled "chunk loading" errors (a specific error message). But stale service worker caches cause **different** error messages (type errors, undefined variables, etc.) that bypassed all the retry logic. This fix:

- Eliminates stale caches at the source (network-first for code files)
- Forces service worker updates on every app load
- Auto-recovers from ANY error type by doing a full reload with cache clear
- The "Something went wrong" screen becomes virtually impossible to reach

