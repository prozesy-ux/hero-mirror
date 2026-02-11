

# Switch Google & Apple OAuth from Lovable Cloud to Direct Supabase

## What's Changing

Replace the Lovable Cloud OAuth handler (`lovable.auth.signInWithOAuth`) with Supabase's native `supabase.auth.signInWithOAuth` for both Google and Apple sign-in. This will fix the `redirect_uri_mismatch` error because the redirect URI will go directly through your Supabase project callback (`https://bzooojifrzwdyvbuyoel.supabase.co/auth/v1/callback`), which you can control in Google Cloud Console.

## Technical Details

### File: `src/hooks/useAuth.ts`

**Google Sign-In** (lines 236-245) -- Replace with:
```typescript
const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/signin',
    }
  });
  return { data, error };
};
```

**Apple Sign-In** (lines 247-256) -- Replace with:
```typescript
const signInWithApple = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: window.location.origin + '/signin',
    }
  });
  return { data, error };
};
```

### Google Cloud Console -- Required Redirect URI

After this change, the redirect URI sent to Google will be:
- `https://bzooojifrzwdyvbuyoel.supabase.co/auth/v1/callback`

Make sure this exact URI is in your Google Cloud Console under **Authorized redirect URIs**.

### No Other Files Need Changes

- `SignIn.tsx` already calls `signInWithGoogle()` / `signInWithApple()` -- no changes needed
- `AuthContext.tsx` passes through from `useAuth` -- no changes needed
- The `src/integrations/lovable/index.ts` file will remain but won't be used for OAuth anymore

