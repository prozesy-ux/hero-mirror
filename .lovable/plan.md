

# Fix Store Page Crash - Missing CurrencyProvider

## Problem Identified

The Store page at `/store/:storeSlug` is crashing with a React error, showing the ErrorBoundary "Something went wrong" screen. 

**Root Cause:** The Store page imports marketplace search components (`SearchSuggestions`, `MobileSearchOverlay`) that use `useCurrency()` hook from `CurrencyContext`. However, the Store page is **NOT wrapped in `CurrencyProvider`**, causing a runtime error:

```
Error: useCurrency must be used within a CurrencyProvider
```

## Solution

Wrap the Store page content with `CurrencyProvider` - exactly as is done in Dashboard.tsx and Seller.tsx.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Store.tsx` | Add `CurrencyProvider` import and wrap `StoreContent` component |

## Implementation Details

**1. Add import for CurrencyProvider:**
```typescript
import { CurrencyProvider } from '@/contexts/CurrencyContext';
```

**2. Wrap the Store component with CurrencyProvider:**

The Store component currently returns:
```typescript
const Store = () => {
  return (
    <FloatingChatProvider>
      <StoreContent />
    </FloatingChatProvider>
  );
};
```

Should become:
```typescript
const Store = () => {
  return (
    <CurrencyProvider>
      <FloatingChatProvider>
        <StoreContent />
      </FloatingChatProvider>
    </CurrencyProvider>
  );
};
```

This follows the same pattern used by:
- `Dashboard.tsx` (line 99-109)
- `Seller.tsx` (line 710-716)

## Expected Outcome

1. Store page loads without crashing
2. Products display correctly with proper currency formatting
3. Search suggestions and filter components work correctly
4. Mobile search overlay functions properly

