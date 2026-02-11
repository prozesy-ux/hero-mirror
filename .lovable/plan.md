

# Fix Google Sign-In 403 Error in Preview Browser

## Problem
- Google Sign-In shows "403 - you do not have access" in the Lovable preview browser
- This happens because `supabase.auth.signInWithOAuth` sends the preview URL to Google, but that URL is not registered in your Google Cloud Console
- Email sign-in actually works (confirmed in auth logs -- status 200 login from preview)

## Solution
Revert Google and Apple Sign-In back to Lovable-managed OAuth (`lovable.auth.signInWithOAuth`), which automatically handles preview URLs.

## Technical Changes

### File: `src/hooks/useAuth.ts`

Replace the current `signInWithGoogle` (lines 236-244) with:
```typescript
const signInWithGoogle = async () => {
  const { lovable } = await import('@/integrations/lovable/index');
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (result.error) {
    return { data: null, error: result.error };
  }
  return { data: result, error: null };
};
```

Replace the current `signInWithApple` (lines 246-254) with:
```typescript
const signInWithApple = async () => {
  const { lovable } = await import('@/integrations/lovable/index');
  const result = await lovable.auth.signInWithOAuth("apple", {
    redirect_uri: window.location.origin,
  });
  if (result.error) {
    return { data: null, error: result.error };
  }
  return { data: result, error: null };
};
```

## Why This Works
- Lovable-managed OAuth automatically registers and handles all preview URLs and published domains
- Your custom Google OAuth credentials (already configured in Cloud Authentication Settings) will still be used
- Email/password sign-in remains unchanged (it already works)

## Only 1 File Changes
- `src/hooks/useAuth.ts` -- revert the two OAuth methods

