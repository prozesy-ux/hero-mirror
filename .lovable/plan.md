

# Fix: Add CurrencyProvider to Marketplace Page

## Problem

The public marketplace page (`/marketplace` and `/marketplace/:productSlug`) crashes with the error:
```
Error: useCurrency must be used within a CurrencyProvider
```

This happens because `GumroadHeader.tsx` now uses the `CurrencySelector` component (from the last update), but the `Marketplace.tsx` page is not wrapped in a `CurrencyProvider` like the Dashboard page is.

## Solution

Wrap the Marketplace page content with `CurrencyProvider` to match the Dashboard pattern.

## File to Modify

`src/pages/Marketplace.tsx`

## Implementation

### 1. Add Import

```tsx
import { CurrencyProvider } from '@/contexts/CurrencyContext';
```

### 2. Wrap Return Content

```tsx
const Marketplace = () => {
  // ... existing code ...

  return (
    <CurrencyProvider>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <GumroadHeader ... />
        
        {/* Rest of marketplace content */}
        ...
      </div>
    </CurrencyProvider>
  );
};
```

Also wrap the early returns (loading state and full view):

```tsx
// Loading state
if (urlProductLoading) {
  return (
    <CurrencyProvider>
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-black/50">Loading product...</div>
      </div>
    </CurrencyProvider>
  );
}

// Full view state
if (productSlug && urlProduct) {
  return (
    <CurrencyProvider>
      <MarketplaceProductFullView ... />
    </CurrencyProvider>
  );
}
```

## Comparison

| Page | Before | After |
|------|--------|-------|
| `/dashboard/*` | Wrapped in CurrencyProvider | No change |
| `/marketplace` | No CurrencyProvider (crashes) | Wrapped in CurrencyProvider (works) |
| `/marketplace/:slug` | No CurrencyProvider (crashes) | Wrapped in CurrencyProvider (works) |

## Summary

This is a one-file fix that adds the missing `CurrencyProvider` wrapper to the Marketplace page, matching how the Dashboard page handles it. This will resolve the "useCurrency must be used within a CurrencyProvider" error.

