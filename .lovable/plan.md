

# Fix SignIn Page Infinite Loading After Google OAuth

## Problem Identified

The SignIn page gets stuck on "Signing you in..." forever because:

1. Google OAuth returns to `/signin#access_token=...&refresh_token=...`
2. SignIn.tsx detects the hash and immediately clears it using `window.history.replaceState()`
3. This destroys the tokens **before** Supabase SDK can read them
4. Supabase SDK never receives the tokens → `onAuthStateChange` never fires
5. User state remains `null` forever → stuck on loading screen

## Why Seller Page Works

The Seller page doesn't have this OAuth hash handling code. It lets Supabase SDK naturally process the tokens from the URL hash, so authentication completes successfully.

## Solution

Remove the custom OAuth hash detection entirely. Let Supabase SDK handle it automatically - it already does this correctly!

### Changes to `src/pages/SignIn.tsx`:

1. **Remove the `oauthPending` state** - not needed anymore
2. **Remove the OAuth hash detection useEffect** - Supabase handles this automatically
3. **Remove the loading screen block** - no more manual OAuth tracking
4. **Keep the existing auto-redirect logic** - it will work naturally once Supabase processes tokens

```text
Before (broken):
- Detect hash → clear hash → set pending → wait forever

After (working):
- Supabase SDK automatically detects hash
- SDK processes tokens internally
- onAuthStateChange fires SIGNED_IN
- useAuth sets user state
- Existing auto-redirect navigates to dashboard
```

### Technical Changes:

**DELETE** (lines 18, 27-47):
```typescript
// DELETE: const [oauthPending, setOauthPending] = useState(false);

// DELETE: The entire OAuth hash detection useEffect
useEffect(() => {
  if (didProcessOAuth.current) return;
  const hash = window.location.hash;
  // ... all of this
}, []);
```

**DELETE** (lines 179-192):
```typescript
// DELETE: The oauthPending loading screen
if (oauthPending && !user) {
  return (
    <div className="flex min-h-dvh...">
      ...Signing you in...
    </div>
  );
}
```

**KEEP**:
- The `didProcessOAuth` ref (for safety, though not strictly needed)
- The auto-redirect useEffect that checks `user` and `authLoading`
- All form handling code

## Expected Flow After Fix

```text
1. User clicks "Continue with Google"
2. Redirects to Google OAuth
3. Google returns with #access_token=...
4. Supabase SDK detects hash automatically
5. SDK processes tokens, stores in localStorage
6. onAuthStateChange fires SIGNED_IN
7. useAuth sets user state, authLoading becomes false
8. Auto-redirect useEffect triggers → handlePostAuthRedirect()
9. User lands on dashboard
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/SignIn.tsx` | Remove oauthPending state, OAuth hash effect, and loading screen |

## Summary

The fix is simple: **stop interfering with Supabase's token processing**. 

The custom OAuth handling was destroying the tokens before Supabase could read them. By removing this code, we let Supabase do its job automatically. The existing auto-redirect logic will handle navigation once authentication completes.

