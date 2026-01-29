# Current Project Status

## Completed Features

### Flash Sales Integration ✅
- **Store Page**: Flash deals section with horizontal scrolling above products
- **Buyer Dashboard**: Flash deals section at the top
- **BFF Store Public**: Fetches active flash sales in parallel with products
- **New BFF Flash Sales**: Edge function aggregating all active flash sales
- **Seller Mobile Optimization**: Flash sales management now responsive on mobile

### Custom Password Reset via Resend ✅
- **Database**: Created `password_reset_tokens` table for secure token storage
- **send-password-reset**: Edge function that generates secure tokens and sends branded emails
- **verify-password-reset**: Edge function that validates tokens and updates passwords
- **SignIn.tsx**: Updated to use custom edge function instead of Supabase default
- **ResetPassword.tsx**: Updated to handle custom token verification via URL param

#### Password Reset Flow
```
User clicks "Forgot Password" → SignIn.tsx
       ↓
send-password-reset edge function
       ↓
Generate secure token → Hash with SHA-256 → Store in DB
       ↓
Send professional branded email via Resend (from your domain)
       ↓
User clicks link → /reset-password?token=xxx
       ↓
ResetPassword.tsx extracts token from URL
       ↓
verify-password-reset edge function
       ↓
Validate token (not expired, not used) → Update password via Admin API
       ↓
Mark token as used → Redirect to sign in
```

#### Security Features
- Tokens hashed before storage (SHA-256)
- 1-hour expiration
- Single use only
- Rate limiting (3 requests per email per hour)
- No email enumeration (always returns success)
- Logged in email_logs table

---

## Next Steps

- Test password reset flow end-to-end
- Verify emails arrive from your domain via Resend
- Consider adding similar custom flow for email confirmation
