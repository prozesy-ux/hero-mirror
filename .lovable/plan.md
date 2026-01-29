
# Custom Password Reset Email via Resend

## Overview

Currently, password reset emails are sent by the default system (`no-reply@auth.lovable.cloud`) using a basic template. This plan implements a custom password reset flow using your existing Resend email system with your professional Uptoza-branded templates.

---

## Current Flow vs New Flow

| Step | Current | New |
|------|---------|-----|
| User clicks "Forgot Password" | `supabase.auth.resetPasswordForEmail()` | Custom edge function |
| Email sent from | `no-reply@auth.lovable.cloud` | `EMAIL_FROM_ADDRESS` via Resend |
| Email template | Default Supabase template | Your custom `password_reset` template |
| Token verification | Supabase built-in | Custom `password_reset_tokens` table |

---

## Changes Required

### 1. Database Table: `password_reset_tokens`

Create a table to store secure reset tokens:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users |
| email | TEXT | User's email address |
| token | TEXT | Secure random token (hashed) |
| expires_at | TIMESTAMP | Expiry time (1 hour) |
| used | BOOLEAN | Whether token has been used |
| created_at | TIMESTAMP | Creation time |

### 2. New Edge Function: `send-password-reset`

Creates secure token, stores in database, sends branded email via Resend.

**Flow:**
1. Receive email address
2. Look up user in auth.users
3. Generate cryptographically secure token
4. Store hashed token in `password_reset_tokens`
5. Send email using your `password_reset` template via Resend
6. Return success (always return success to prevent email enumeration)

### 3. Update Edge Function: `verify-password-reset`

Verifies token and updates password:

**Flow:**
1. Receive token and new password
2. Look up token in database
3. Verify not expired and not used
4. Update user password via Admin API
5. Mark token as used
6. Return success

### 4. Update SignIn.tsx

Replace the current `handleForgotPassword` function:

```tsx
// Current (line 158-171)
const { error } = await supabase.auth.resetPasswordForEmail(...)

// New
const { data, error } = await supabase.functions.invoke('send-password-reset', {
  body: { email: resetEmail.trim() }
});
```

### 5. Update ResetPassword.tsx

Update to handle custom token verification instead of relying on Supabase session:

- Parse token from URL query parameter
- Call `verify-password-reset` edge function with token and new password
- Handle success/error states

---

## Email Template Used

Your existing `password_reset` template from `email-templates.ts` will be used:

- Professional white design with Uptoza branding
- Key icon header
- "Reset Password" CTA button
- 1-hour expiry notice
- Sent from your verified domain via Resend

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/send-password-reset/index.ts` | CREATE | Generate token, send email via Resend |
| `supabase/functions/verify-password-reset/index.ts` | CREATE | Verify token, update password |
| `src/pages/SignIn.tsx` | EDIT | Use custom edge function for forgot password |
| `src/pages/ResetPassword.tsx` | EDIT | Use custom token verification |
| Database migration | CREATE | Add `password_reset_tokens` table |

---

## Security Considerations

1. **Token Hashing**: Tokens are hashed before storage (prevents database leak exposure)
2. **Rate Limiting**: 3 requests per email per hour to prevent abuse
3. **No Email Enumeration**: Always return success message regardless of whether email exists
4. **1-Hour Expiry**: Short token lifetime for security
5. **Single Use**: Tokens can only be used once
6. **Secure Random**: Uses `crypto.randomUUID()` for token generation

---

## Technical Details

**Token Flow:**
```text
User enters email
       ↓
send-password-reset edge function
       ↓
Generate secure token → Hash → Store in DB
       ↓
Send email via Resend with reset URL
       ↓
User clicks link → /reset-password?token=xxx
       ↓
verify-password-reset edge function
       ↓
Validate token → Update password → Mark used
       ↓
Redirect to dashboard
```

**Reset URL Format:**
```
https://yoursite.com/reset-password?token=abc123def456...
```

---

## Expected Outcome

After implementation:
1. Password reset emails come from your domain via Resend
2. Emails use your professional Uptoza-branded template
3. Full control over email content and styling
4. All security emails consistent with your design system
5. Email logs tracked in your `email_logs` table
