

# Update Apple Sign-In Branding to "Uptoza"

## What We'll Change

The Apple Sign-In consent screen currently shows "Sign in to Lovable" -- this needs to display "Uptoza" instead so users see the correct brand during authentication.

## Technical Details

### Modified File: `src/pages/SignIn.tsx`
- Update the Apple Sign-In button label from "Continue with Apple" to "Use your Apple Account to sign in to Uptoza" (or keep it as "Continue with Apple" -- the button text itself is fine)

### Key Note
The "Sign in to Lovable" text that appears during the Apple OAuth flow is controlled by the **Lovable Cloud authentication configuration**, not by the frontend code. The button text on your sign-in page already says "Continue with Apple" which is correct.

To change the branding shown during the Apple OAuth consent screen:
- This requires configuring your own Apple Developer account with Apple Sign-In credentials (Service ID, Team ID, Key ID, Private Key)
- The display name shown during Apple Sign-In is set in your **Apple Developer Console** under Services IDs configuration

### What We Can Do in Code
- Update any references to "Lovable" on the sign-in page to say "Uptoza"
- Ensure all visible branding on the sign-in form references "Uptoza"

### File: `src/pages/SignIn.tsx`
- Scan for any "Lovable" text references and replace with "Uptoza"
- Ensure page title, headings, and meta tags reference "Uptoza"

