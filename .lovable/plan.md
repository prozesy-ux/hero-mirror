

## Redesign Google Sign-In Popup to LinkedIn-Style Overlay

### What Changes
Restyle the existing `GoogleSignInPopup.tsx` to match the LinkedIn/Google One Tap overlay pattern shown in the reference image:

**Current**: Dark-themed card with "Welcome to Uptoza" heading and a basic button
**New**: Clean white overlay card with:
- "Sign in to Uptoza with Google" header text with Google icon and close button on the same line
- A prominent account-style button showing "Continue with Google" with avatar placeholder and subtitle
- Subtle drop shadow, white background, thin border
- Slides in from top-right like LinkedIn's overlay
- Same visibility/dismiss logic (unchanged)

### Design Details (matching LinkedIn reference)
- White background card, rounded corners, soft shadow
- Top row: Google "G" icon + "Sign in to Uptoza with Google" text + X close button
- Divider line
- Main CTA: "Continue with Google" button styled like an account row (icon + text)
- Small footer text: "By continuing, you agree to our Terms & Privacy Policy"
- Width ~320px, fixed top-right position

### File Modified
- `src/components/GoogleSignInPopup.tsx` — UI redesign only, no logic changes

