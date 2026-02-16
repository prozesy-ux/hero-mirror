

## Fix: Mobile Login "Something Went Wrong" Crash

### Root Cause

The `lazyWithRetry` function in `App.tsx` has a critical bug. On retry, it calls `lazyWithRetry(importFn, retries - 1)` which returns a `React.LazyExoticComponent` object — **not** the `Promise<{default: ComponentType}>` that `lazy()` expects. So retries silently fail, the error propagates, ErrorBoundary catches it, auto-refreshes once, and if the chunk still fails (common on flaky mobile), the user sees "Something went wrong" permanently.

### Fix 1: Repair `lazyWithRetry` in `src/App.tsx`

Replace the broken retry logic with a proper recursive import retry:

```
Current (broken):
  .then(() => lazyWithRetry(importFn, retries - 1) as any)

Fixed:
  .then(() => retryImport(importFn, retries - 1))
```

The inner retry function should call `importFn()` directly (returning a module promise), not wrap it in another `lazy()`.

### Fix 2: Improve `ErrorBoundary` chunk error recovery in `src/components/ui/error-boundary.tsx`

- Allow up to 3 auto-refresh attempts (not just 1) by storing a counter instead of a flag
- Add cache-busting: clear browser caches before reload so stale chunks are purged
- Reset the counter after 5 minutes so future chunk errors can also auto-recover

### Fix 3: Add `onError` fallback on the `Suspense` for Dashboard route in `src/App.tsx`

Wrap the Dashboard `Suspense` in its own `ErrorBoundary` so chunk failures in Dashboard don't crash the entire app — the user gets a localized retry UI instead of a full white screen.

### Files Modified

| File | Change |
|------|--------|
| `src/App.tsx` | Fix `lazyWithRetry` retry logic; add ErrorBoundary around Dashboard Suspense |
| `src/components/ui/error-boundary.tsx` | Multi-attempt chunk error recovery with cache-busting and counter reset |

### Impact

- No logic or data changes
- Mobile users on flaky networks will get automatic recovery instead of a permanent crash screen
- Retries actually re-fetch the failed chunk instead of silently failing
