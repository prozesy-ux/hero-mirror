
# Fix Google OAuth Login - Token Processing Race Condition

## Problem

After clicking "Continue with Google" and completing authentication:
1. User returns to `/signin#access_token=...`  
2. SignIn.tsx immediately clears the hash and navigates to `/dashboard`
3. **BUT** Supabase SDK hasn't processed the tokens yet - localStorage is still empty
4. ProtectedRoute checks `hasLocalSession()` → returns `false`
5. User gets redirected back to `/signin` → stuck in a loop

The optimistic redirect happens **before** the tokens are saved to localStorage.

## Root Cause

The Supabase SDK processes OAuth tokens from the URL hash **asynchronously**. When we call `navigate('/dashboard')` immediately after detecting the hash, we're navigating BEFORE the SDK has finished:
1. Parsing the hash
2. Validating the tokens  
3. Storing them in localStorage

## Solution

Instead of navigating immediately (which causes the race condition), we need to **wait for the Supabase SDK to complete token processing** while keeping the UI fast.

### Approach: Wait for `onAuthStateChange` Signal

The Supabase SDK fires `SIGNED_IN` event via `onAuthStateChange` once tokens are processed and stored. We should:
1. Detect OAuth hash → set a flag but **don't navigate yet**
2. Let Supabase SDK process the hash naturally
3. When `onAuthStateChange` fires `SIGNED_IN` → then navigate

This ensures tokens are in localStorage before navigation, while keeping the transition as fast as possible.

---

## Implementation

### File: `src/pages/SignIn.tsx`

**Changes:**

1. **Remove the immediate optimistic redirect** (lines 27-45)
2. **Add OAuth pending state** to track when we're waiting for auth
3. **Show minimal loading UI** while tokens are processed (1-2 seconds max)
4. **Navigate in the existing auto-redirect useEffect** once user is set

```typescript
// NEW: Track OAuth pending state
const [oauthPending, setOauthPending] = useState(false);

// Handle OAuth token detection - but DON'T navigate yet
useEffect(() => {
  if (didProcessOAuth.current) return;
  
  const hash = window.location.hash;
  if (!hash || hash.length < 10) return;
  
  if (hash.includes('access_token=')) {
    didProcessOAuth.current = true;
    console.log('[SignIn] OAuth tokens detected - waiting for SDK to process');
    
    // Clear the URL hash immediately (cosmetic)
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    
    // Mark as pending - don't navigate yet!
    // The existing auto-redirect useEffect will handle navigation 
    // once onAuthStateChange fires and user is set
    setOauthPending(true);
  }
}, []);

// Existing auto-redirect effect already handles navigation
useEffect(() => {
  if (didAutoRedirect.current) return;
  if (authLoading) return;
  if (!user) return;

  didAutoRedirect.current = true;
  handlePostAuthRedirect();  // This will fire once tokens are processed
}, [user, authLoading]);
```

**Add minimal loading UI** when OAuth is pending:

```typescript
// Show clean transition during OAuth processing (1-2 seconds max)
if (oauthPending && !user) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black">
      <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-black/20 mb-6">
        <img src={uptozaLogo} alt="Uptoza" className="h-12 w-auto rounded-xl" />
      </div>
      <div className="flex items-center gap-3 text-white">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-lg font-medium">Signing you in...</span>
      </div>
    </div>
  );
}
```

---

## Why This Works

1. **Token Detection**: SignIn.tsx detects `#access_token=` in hash
2. **Set Pending**: Sets `oauthPending=true`, clears URL hash (cosmetic)
3. **Show Loader**: Brief loading screen appears (typically 1-2 seconds)
4. **SDK Processes**: Supabase SDK parses hash, validates tokens, stores in localStorage
5. **Auth State Changes**: `onAuthStateChange` fires `SIGNED_IN` event
6. **useAuth Updates**: Sets `user` and `session` state
7. **Auto-Redirect**: The existing `useEffect` sees `user` is set → navigates to dashboard
8. **ProtectedRoute Works**: `hasLocalSession()` returns `true` because tokens are now in localStorage

---

## Key Points

| Aspect | Implementation |
|--------|----------------|
| No race condition | Wait for `onAuthStateChange` before navigating |
| Fast UX | Loading screen shows 1-2 seconds max |
| Reliable | Tokens guaranteed in localStorage before dashboard |
| Simple | Uses existing auto-redirect logic |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/SignIn.tsx` | Add `oauthPending` state, remove immediate navigation, add loading UI |

---

## Expected Flow After Fix

```text
1. User clicks "Continue with Google"
2. Redirects to Google OAuth
3. Google returns with #access_token=...
4. SignIn.tsx detects hash
5. Sets oauthPending=true, clears hash
6. Shows loading screen (1-2 sec)
7. Supabase SDK processes tokens → stores in localStorage
8. onAuthStateChange fires SIGNED_IN
9. useAuth sets user state
10. Auto-redirect useEffect triggers → navigate('/dashboard')
11. ProtectedRoute: hasLocalSession() = true ✓
12. Dashboard renders successfully
```
