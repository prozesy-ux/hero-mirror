
# Fix Google Sign-In: Remove Supabase URL and Show Uptoza Inc Branding

## Problem
Google OAuth currently redirects through `bzooojifrzwdyvbuyoel.supabase.co`, which:
- Shows the Supabase URL on Google's consent screen instead of your brand
- Requires complex manual Google Cloud Console configuration
- Is slow and error-prone to set up

## Solution
Switch to **Lovable Cloud's managed Google OAuth**, which:
- Handles all redirect URLs automatically (no manual Google Console setup needed)
- Shows "Uptoza Inc" branding when configured in Cloud settings
- Works instantly without waiting for DNS or Google propagation

## Changes Required

### 1. Configure Lovable Cloud Google OAuth
- Use the built-in tool to generate the managed OAuth module (`src/integrations/lovable/`)
- This creates the `lovable.auth.signInWithOAuth("google", ...)` function

### 2. Update `src/hooks/useAuth.ts`
- Replace `supabase.auth.signInWithOAuth({ provider: 'google' })` with `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`

### 3. Update `src/pages/Seller.tsx`
- Replace the direct `supabase.auth.signInWithOAuth` call in `handleGoogleAuth` with the Lovable managed OAuth call
- Keep the seller-specific redirect logic

### 4. Remove Old Google Console Config (Optional)
- You can remove or keep the old Google Cloud Console OAuth client -- it won't be used anymore
- Lovable Cloud manages the Google credentials automatically

## Result
- Google consent screen will no longer show `bzooojifrzwdyvbuyoel.supabase.co`
- No manual Google Cloud Console configuration needed
- Sign-in works immediately after approval
