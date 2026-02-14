

## Fix: "Something Went Wrong" Error on Mobile After Login

### Root Cause Analysis

The ErrorBoundary (triangle icon with "Something went wrong") appears when the dashboard loads after login on mobile. This is a **React rendering crash**, not an API error (backend logs show no errors).

Two most likely causes:

1. **Chunk loading failure**: The Dashboard page is lazy-loaded via `lazy(() => import("./pages/Dashboard"))`. On slower mobile networks, this dynamic import can fail, triggering the ErrorBoundary.

2. **Component crash during initial render**: A null reference or missing data in one of the dashboard components causes a crash before data loads.

### What We'll Fix

**1. Add auto-retry for chunk loading failures in App.tsx**

Replace the basic `lazy(() => import(...))` with a retry wrapper that automatically retries failed dynamic imports up to 3 times with a delay. This handles flaky mobile connections.

```tsx
// Retry wrapper for lazy loading
const lazyWithRetry = (importFn, retries = 3) => {
  return lazy(() =>
    importFn().catch((err) => {
      if (retries > 0) {
        return new Promise(resolve => setTimeout(resolve, 1000))
          .then(() => lazyWithRetry(importFn, retries - 1));
      }
      throw err;
    })
  );
};
```

Apply to all lazy-loaded pages: Dashboard, Seller, Admin, Store, etc.

**2. Add component-level error boundary inside the Dashboard**

Wrap the `DashboardContent` (where routes render) with its own ErrorBoundary so that if a single section crashes, only that section shows an error -- not the entire app.

**3. Add console logging to the ErrorBoundary**

The current ErrorBoundary logs errors only in development mode. Add a `console.error` that always runs so we can capture the exact error message in production via console logs.

**4. Add null safety guards in AIAccountsSection**

Add defensive checks in the marketplace section (`AIAccountsSection.tsx`) for the initial render when data hasn't loaded yet, preventing potential null reference crashes.

### Files to Change

| File | Change |
|------|--------|
| `src/App.tsx` | Add `lazyWithRetry` wrapper for all lazy imports |
| `src/components/ui/error-boundary.tsx` | Always log errors (not just dev mode), add auto-retry for chunk errors |
| `src/pages/Dashboard.tsx` | Wrap `DashboardContent` routes in a local ErrorBoundary |

### What Stays the Same

- All backend/API logic -- untouched
- All styling and font changes -- preserved
- Sidebar, mobile navigation -- untouched
- Authentication flow -- untouched

