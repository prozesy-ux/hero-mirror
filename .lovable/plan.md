

# Bug Fixes Implementation Plan

## Issues Identified

Based on my analysis of the codebase, here are the 5 issues that need to be fixed:

### Issue 1: Agency Ads Card in Both Dashboard Sidebars
**Location**: `DashboardSidebar.tsx` (lines 85-128), `SellerSidebar.tsx` (lines 98-141)
**Problem**: The "Ads Agency" promotional card with Meta and Google Ads logos is present in both the buyer and seller dashboard sidebars.
**Solution**: Remove the Ads Agency card section from both sidebar components.

### Issue 2: Buyer Dashboard Layout Position
**Location**: `Dashboard.tsx`, `DashboardSidebar.tsx`, `MobileNavigation.tsx`
**Current State**: The buyer dashboard already mirrors the seller dashboard structure (top bar at `top-16`, sidebar with `72px` collapsed/`60` expanded width, mobile bottom nav).
**Assessment**: After comparing both layouts, they are already synchronized. No changes needed here - the layouts are identical in positioning.

### Issue 3: Voice Search Not Working on Mobile
**Location**: `useVoiceSearch.ts`, `VoiceSearchButton.tsx`, `AIAccountsSection.tsx`, `Store.tsx`
**Problem**: The Web Speech API has limited support on mobile devices (especially iOS Safari and some Android browsers). The `onResult` callback dependency in the useEffect causes the recognition instance to be recreated on every render, breaking the recognition state.
**Root Cause**: 
1. The `onResult` callback is included in the useEffect dependency array (line 120), causing the speech recognition to be recreated on each render
2. Mobile browsers often require HTTPS and explicit user interaction
3. The recognition instance is not properly persisted across renders

**Solution**: 
- Move `onResult` callback to a ref to prevent recreation
- Add mobile-specific handling for Safari/WebKit
- Improve error messages for mobile users

### Issue 4: Image Search Not Working
**Location**: `ImageSearchButton.tsx`, `image-search` edge function
**Assessment**: The image search implementation looks correct - it calls the `image-search` edge function with base64 or URL. Need to verify the edge function is deployed and working.
**Action**: Check edge function deployment status and logs.

### Issue 5: Store Page Products Not Showing
**Location**: `Store.tsx`, `bff-store-public` edge function
**Problem**: The BFF error handling in Store.tsx (lines 329-336) checks for `errorData.notFound` but the edge function returns `{ notFound: true }` only for 404. When there's another error or the function isn't deployed, products won't load.
**Current Behavior**: Console log shows `[Store] BFF response` is logged, suggesting the BFF is working. The issue may be:
1. Products exist but have `is_available: false` or `is_approved: false`
2. The seller's `is_active` is false
3. The store_slug doesn't match

**Solution**: Add comprehensive fallback logging and ensure both BFF path and fallback path work correctly.

---

## Implementation Details

### Fix 1: Remove Ads Agency Cards from Sidebars

**File: `src/components/dashboard/DashboardSidebar.tsx`**
- Remove lines 85-128 (the entire "Ads Agency Card" section including both collapsed and expanded states)
- Keep only the navigation and collapse toggle

**File: `src/components/seller/SellerSidebar.tsx`**
- Remove lines 98-141 (the entire "Ads Agency Card" section)
- Keep only the navigation and collapse toggle

**File: `src/components/dashboard/MobileNavigation.tsx`**
- Remove lines 217-240 (the Ads Agency card in the mobile Sheet sidebar)

**File: `src/components/seller/SellerMobileNavigation.tsx`**
- Remove lines 169-194 (the Ads Agency card in the mobile Sheet sidebar)

---

### Fix 2: Voice Search Mobile Compatibility

**File: `src/hooks/useVoiceSearch.ts`**

```typescript
// Key changes:
1. Use useRef for the onResult callback to prevent recreation
2. Add mobile browser detection and adjusted settings
3. Improve error handling for mobile-specific issues
4. Add retry mechanism for mobile Safari

// Changes:
- Line 43: Add onResultRef = useRef(onResult)
- Line 52: Update onResultRef.current = onResult in effect
- Line 120: Remove onResult from dependency array
- Add mobile-specific error handling
- Add check for secure context (HTTPS requirement)
```

**Updated implementation structure:**
```typescript
export function useVoiceSearch(onResult?: (text: string) => void) {
  // Store callback in ref to avoid recreating recognition
  const onResultRef = useRef(onResult);
  
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!isSupported) return;
    
    // Check for secure context (required for microphone)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      console.warn('Voice search requires HTTPS');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // ... setup with onResultRef.current instead of onResult
  }, [isSupported]); // Remove onResult from deps
}
```

---

### Fix 3: Store Products Not Showing

**File: `src/pages/Store.tsx`**

Improve error handling and fallback logic:

```typescript
// Lines 329-389 - Enhanced error handling
const fetchStoreData = async () => {
  setLoading(true);
  
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bff-store-public?slug=${storeSlug}`,
      { /* headers */ }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('[Store] BFF error response:', { status: response.status, errorData });
      
      // Check for various not-found indicators
      if (response.status === 404 || errorData.notFound || errorData.code === 'NOT_FOUND') {
        console.log('[Store] Store not found via BFF');
        // Fall through to direct query as backup
        throw new Error('FALLBACK_NEEDED');
      }
      throw new Error(errorData.error || 'Failed to load store');
    }

    const data = await response.json();
    // ... rest of success handling
  } catch (error: any) {
    console.log('[Store] BFF failed, trying direct Supabase query:', error.message);
    // Fallback logic...
  }
};
```

---

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/dashboard/DashboardSidebar.tsx` | Remove code | Remove Ads Agency card (lines 85-128) |
| `src/components/seller/SellerSidebar.tsx` | Remove code | Remove Ads Agency card (lines 98-141) |
| `src/components/dashboard/MobileNavigation.tsx` | Remove code | Remove Ads Agency card from mobile sidebar |
| `src/components/seller/SellerMobileNavigation.tsx` | Remove code | Remove Ads Agency card from mobile sidebar |
| `src/hooks/useVoiceSearch.ts` | Refactor | Fix callback recreation issue, add mobile support |
| `src/pages/Store.tsx` | Fix logic | Improve BFF error handling and fallback |

---

## Technical Notes

### Voice Search Mobile Limitations
- iOS Safari: Requires user interaction to start, may timeout quickly
- Android Chrome: Generally works but needs HTTPS
- The fix uses useRef pattern to prevent unnecessary recreation of speech recognition

### Store Products Debug Steps
1. Verify seller has `is_active: true`
2. Verify products have both `is_available: true` AND `is_approved: true`
3. Verify store_slug matches exactly (case-sensitive in Postgres)
4. Check browser console for `[Store]` prefixed logs

### Mobile Responsiveness
- Both dashboards already use identical responsive breakpoints
- Bottom navigation is fixed at `bottom-0` with safe-area-inset
- Content has appropriate `pb-24 lg:pb-0` padding for mobile nav

