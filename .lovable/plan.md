

# Fix Withdrawal OTP Email - Update API Key & Improve Error Handling

## Issue Summary

The OTP modal opens but no email is received because:
1. The current `RESEND_API_KEY` in secrets is returning a 401 Unauthorized error
2. The edge function silently ignores email failures and returns "success" even when email fails

Your DNS records are correctly configured (verified `resend._domainkey` DKIM record visible).

---

## Solution

### Step 1: Update RESEND_API_KEY Secret

Replace the old API key with your new key: `re_EomoCGaJ_6RqyUFzXc1UR1SSquuW5rYt9`

### Step 2: Fix Edge Function Error Handling

Update `supabase/functions/send-withdrawal-otp/index.ts` to properly handle email failures:

**Current Problem (lines 186-191):**
```typescript
if (!emailRes.ok) {
  console.error("Email send failed:", await emailRes.text());
  // BUG: Continues and returns success!
}
```

**Fix - Return error and cleanup OTP if email fails:**
```typescript
if (!emailRes.ok) {
  const errorText = await emailRes.text();
  console.error("Email send failed:", errorText);
  
  // Delete OTP since email failed
  await serviceClient
    .from("withdrawal_otps")
    .delete()
    .eq("seller_id", sellerProfile.id)
    .eq("otp_code", otpCode);
    
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: "Failed to send verification email. Please try again.",
      debug: errorText
    }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Step 3: Add Debug Logging

Add console logs to track the flow:
- Log when OTP is generated
- Log email sending attempt
- Log success/failure responses

---

## Files to Update

| File | Changes |
|------|---------|
| **Secrets** | Update `RESEND_API_KEY` with new key |
| `supabase/functions/send-withdrawal-otp/index.ts` | Add proper email error handling, add debug logging |

---

## Expected Result After Fix

1. User clicks "Withdraw" button
2. OTP generated and stored in database
3. Email sent via Resend with new valid API key
4. **If email succeeds**: OTP modal shows, user receives email with 6-digit code
5. **If email fails**: OTP deleted, user sees clear error message

---

## Technical Flow

```text
User Clicks Withdraw
        │
        ▼
Generate 6-digit OTP
        │
        ▼
Store OTP in withdrawal_otps table
        │
        ▼
Send email via Resend API
        │
   ┌────┴────┐
   │         │
   ▼         ▼
SUCCESS    FAILURE
   │         │
   │    Delete OTP from DB
   │         │
   │    Return error response
   │         │
   ▼         ▼
Return success    Show error toast
Show OTP modal
```

