
# Fix Stripe Popup Being Blocked

## Problem Identified

When clicking "Pay" for Stripe, the browser **blocks the popup** because:

1. User clicks button → triggers async API call to `create-topup`
2. API call takes 1-2 seconds to complete
3. Then code calls `window.open(data.url, '_blank')`
4. Browser blocks this because the "user gesture" expired during the async wait

Other sites work because they either:
- Redirect the same tab (`window.location.href`)
- Open the popup window immediately on click, then update its URL after the API call

---

## Solution

Change from `window.open()` to `window.location.href` to redirect the current tab to Stripe Checkout. This is the most reliable method and matches how most payment sites work.

---

## File to Modify

**`src/components/dashboard/BillingSection.tsx`**

### Change (around line 337-338)

**Before:**
```typescript
if (data?.url) {
  window.open(data.url, '_blank');
}
```

**After:**
```typescript
if (data?.url) {
  window.location.href = data.url;
}
```

---

## Why This Works

| Method | Popup Blocked? | User Experience |
|--------|----------------|-----------------|
| `window.open('url', '_blank')` | YES (after async) | New tab blocked |
| `window.location.href = url` | NO | Redirects same tab, returns after payment |

The `success_url` in the edge function already points back to `/dashboard/billing?topup=success`, so users will return to the billing page after payment.

---

## Alternative (If You Want New Tab)

If you really want a new tab, you can open a blank popup immediately on click, then set its location after the API call:

```typescript
const popup = window.open('about:blank', '_blank');
// ... make API call ...
if (popup && data?.url) {
  popup.location.href = data.url;
}
```

But the redirect approach is simpler and more reliable.

---

## Also Fix CORS Headers

While fixing this, I'll also update the CORS headers in `create-topup` and `verify-topup` edge functions to ensure they work properly with the Supabase client.

### Files to Update CORS:
1. `supabase/functions/create-topup/index.ts`
2. `supabase/functions/verify-topup/index.ts`

### CORS Change:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

---

## Expected Outcome

After this fix:
- Clicking "Pay" will immediately redirect to Stripe Checkout (no popup blocker)
- After payment, user returns to billing page
- Payment verification happens automatically
- CORS errors eliminated
