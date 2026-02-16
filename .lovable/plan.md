

## Fix: Permanent "Something Went Wrong" Crash on Mobile

### Root Cause (The REAL one this time)

The previous fix only addressed `lazyWithRetry` for page-level lazy imports (Dashboard, Seller, etc.). But the **Index page itself** uses raw `lazy()` for 9 below-fold components (AsSeenIn, AboutSection, CompleteBundleCard, etc.) with **zero retry logic and zero error boundaries**. On a flaky mobile connection, any single lazy import failure crashes the entire page because the global ErrorBoundary catches it and shows "Something went wrong".

Additionally, there's no global handler for **unhandled promise rejections** (async errors in useEffect, prefetch, etc.) which can also trigger white screens.

### Fix 1: Index.tsx — Use `lazyWithRetry` + Per-Section Error Boundaries

**File: `src/pages/Index.tsx`**

- Replace all 9 `lazy()` calls with `lazyWithRetry` (imported from a shared utility)
- Wrap each lazy section in a lightweight error boundary that renders nothing on failure (graceful degradation) instead of crashing the whole page
- Create a tiny `SectionErrorBoundary` that catches errors per-section and renders an empty div

### Fix 2: Extract `lazyWithRetry` to Shared Utility

**New File: `src/lib/lazy-with-retry.ts`**

- Move `retryImport` and `lazyWithRetry` from `App.tsx` into a shared module
- Both `App.tsx` and `Index.tsx` import from this shared location
- Same retry logic: 3 attempts, 1s delay between each

### Fix 3: Global Unhandled Rejection Handler

**File: `src/App.tsx`**

- Add a `window.addEventListener('unhandledrejection', ...)` handler inside the App component via useEffect
- This catches async errors that escape React's rendering lifecycle (fetch failures, dynamic import rejections from prefetcher, etc.)
- Prevents them from crashing the app — logs them silently instead

### Fix 4: Make ErrorBoundary "Try Again" More Resilient

**File: `src/components/ui/error-boundary.tsx`**

- On "Try Again", also clear `sessionStorage` chunk error counter so retries aren't blocked
- Add `window.addEventListener('error')` in constructor to catch script-level errors too

### Files Modified

| File | Change |
|------|--------|
| `src/lib/lazy-with-retry.ts` | New shared utility: `retryImport` + `lazyWithRetry` |
| `src/pages/Index.tsx` | Use `lazyWithRetry` for all 9 lazy components; wrap each in `SectionErrorBoundary` |
| `src/App.tsx` | Import `lazyWithRetry` from shared utility; add global `unhandledrejection` handler; convert App to function component with useEffect |
| `src/components/ui/error-boundary.tsx` | Clear chunk counter on "Try Again"; minor resilience improvements |

### Why This Is Permanent

The previous fix only covered page-level lazy loading. This fix covers:
- Every lazy import in the entire app (pages AND sections)
- Async errors outside React lifecycle (unhandled rejections)
- Per-section graceful degradation (one failed section does not kill the page)
- Retry logic on ALL dynamic imports (3 attempts with 1s delay)

After this, the "Something went wrong" screen becomes virtually impossible to trigger on normal usage.

