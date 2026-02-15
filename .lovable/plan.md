

## Add Google Sign-In Popup on Public Pages

### What This Does
When any visitor (not logged in) lands on public pages like the homepage, marketplace, 404 page, etc., a small floating popup will appear in the top-right corner prompting them to sign in with Google -- similar to the Tencent Cloud reference image. One click takes them straight to the dashboard.

### How It Works
1. A new `GoogleSignInPopup` component renders on all public pages for unauthenticated users
2. It shows a clean card with the user-friendly "Continue with Google" button
3. After successful sign-in, the user is redirected to `/dashboard/marketplace`
4. The popup can be dismissed (closed) and won't reappear for that browser session
5. It does NOT show if the user is already logged in or is on the `/signin` page

### Design
- Fixed position: top-right corner (like the reference image)
- Dark card with border, subtle shadow
- Google icon + "Sign in with Google" button
- Small "x" close button
- Smooth fade-in animation
- Dismissal saved to sessionStorage so it doesn't keep reappearing

### Changes

**New File: `src/components/GoogleSignInPopup.tsx`**
- Floating popup component
- Uses `useAuthContext()` to check if user is already logged in (if yes, don't render)
- Uses `signInWithGoogle()` from auth context for the sign-in action
- Checks `sessionStorage` for dismissal state
- Shows on all pages except `/signin` and `/signup`
- After successful Google sign-in, redirects to `/dashboard/marketplace`

**File: `src/App.tsx`**
- Add `<GoogleSignInPopup />` inside the `BrowserRouter` so it has access to routing context
- Renders globally -- the component itself handles visibility logic (hides when logged in, on signin page, or dismissed)

### Technical Details

| Aspect | Detail |
|--------|--------|
| Trigger | Appears 2 seconds after page load (delay for non-intrusive UX) |
| Visibility | Only for unauthenticated users, not on /signin or /signup |
| Dismiss | Close button saves to sessionStorage (resets on new browser session) |
| Auth flow | Uses existing `signInWithGoogle()` which redirects to Google OAuth |
| Post-auth | OAuth returns to `/signin` which handles redirect to dashboard |
| Position | Fixed top-right, z-50, responsive (smaller on mobile) |

### Files
- **New**: `src/components/GoogleSignInPopup.tsx`
- **Modified**: `src/App.tsx` (add one line to render the popup)
