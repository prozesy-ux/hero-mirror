
# Fix Duplicate Withdrawal Constraint Error for Buyer & Seller

## Problem Summary

When a buyer or seller tries to withdraw funds while they already have a pending withdrawal, the database throws a constraint violation error:

```
duplicate key value violates unique constraint "buyer_withdrawals_one_in_progress_per_user"
duplicate key value violates unique constraint "seller_withdrawals_one_in_progress_per_seller"
```

This error appears because unique partial indexes exist that allow only ONE in-progress withdrawal per user/seller.

## Solution: 3-Layer Protection System

```text
Layer 1: Frontend Check (Immediate UX Feedback)
+-------------------+
| BuyerWallet.tsx   |  Check for pending withdrawal BEFORE opening dialog
| SellerWallet.tsx  |
+-------------------+
         |
         v
Layer 2: OTP Edge Function Check (Server-Side Validation)
+---------------------------+
| send-buyer-withdrawal-otp |  Check before generating OTP
| send-withdrawal-otp       |
+---------------------------+
         |
         v
Layer 3: Verify Edge Function Check (Handle Race Conditions)
+-----------------------------+
| verify-buyer-withdrawal-otp |  Catch constraint error gracefully
| verify-withdrawal-otp       |
+-----------------------------+
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/BuyerWallet.tsx` | Add pending check before Withdraw button + error handling |
| `src/components/seller/SellerWallet.tsx` | Add pending check before Withdraw button + error handling |
| `supabase/functions/send-buyer-withdrawal-otp/index.ts` | Check for existing pending withdrawal before OTP |
| `supabase/functions/send-withdrawal-otp/index.ts` | Check for existing pending withdrawal before OTP |
| `supabase/functions/verify-buyer-withdrawal-otp/index.ts` | Handle Postgres error code 23505 gracefully |
| `supabase/functions/verify-withdrawal-otp/index.ts` | Handle Postgres error code 23505 gracefully |

## Implementation Details

### Part 1: Frontend Check (BuyerWallet.tsx & SellerWallet.tsx)

Add a derived state to check if a pending withdrawal exists:

```typescript
// Buyer: Check if any withdrawal is in pending/processing state
const hasPendingWithdrawal = useMemo(() => {
  return withdrawals.some(w => 
    ['pending', 'processing', 'queued', 'in_review'].includes(w.status.toLowerCase())
  );
}, [withdrawals]);

// In handleWithdraw:
if (hasPendingWithdrawal) {
  toast.error('You already have a pending withdrawal. Please wait for it to be processed.');
  return;
}
```

For the non-2FA path (direct insert), handle the constraint error:

```typescript
if (error?.code === '23505') {
  toast.error('You already have a pending withdrawal');
  return;
}
```

### Part 2: OTP Edge Function Check

Add server-side validation before generating OTP:

**send-buyer-withdrawal-otp:**
```typescript
// Check for existing pending withdrawal BEFORE creating OTP
const { data: existingWithdrawal } = await serviceClient
  .from("buyer_withdrawals")
  .select("id, amount, status")
  .eq("user_id", userId)
  .in("status", ["pending", "processing", "queued", "in_review"])
  .maybeSingle();

if (existingWithdrawal) {
  return new Response(
    JSON.stringify({ 
      error: "You already have a pending withdrawal. Please wait for it to be processed.",
      existing_amount: existingWithdrawal.amount
    }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

**send-withdrawal-otp (seller):**
```typescript
// Check for existing pending withdrawal BEFORE creating OTP
const { data: existingWithdrawal } = await serviceClient
  .from("seller_withdrawals")
  .select("id, amount, status")
  .eq("seller_id", sellerProfile.id)
  .in("status", ["pending", "processing", "queued", "in_review"])
  .maybeSingle();

if (existingWithdrawal) {
  return new Response(
    JSON.stringify({ 
      error: "You already have a pending withdrawal. Please wait for it to be processed.",
      existing_amount: existingWithdrawal.amount
    }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Part 3: Verify Edge Function Error Handling

Handle the constraint error gracefully as a last line of defense:

**verify-buyer-withdrawal-otp:**
```typescript
if (withdrawalError) {
  console.error("Withdrawal creation error:", withdrawalError);
  
  // Check if it's a duplicate constraint violation
  if (withdrawalError.code === '23505') {
    return new Response(
      JSON.stringify({ 
        error: "You already have a pending withdrawal. Please wait for it to be processed." 
      }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  return new Response(
    JSON.stringify({ error: "Failed to create withdrawal" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

**verify-withdrawal-otp (seller):**
```typescript
if (withdrawalError) {
  console.error("Withdrawal creation error:", withdrawalError);
  
  // Check if it's a duplicate constraint violation
  if (withdrawalError.code === '23505') {
    return new Response(
      JSON.stringify({ 
        error: "You already have a pending withdrawal. Please wait for it to be processed." 
      }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  return new Response(
    JSON.stringify({ error: "Failed to create withdrawal" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

## Expected Results

| Scenario | Before | After |
|----------|--------|-------|
| Click Withdraw with pending | Shows confusing database error | Shows "You have a pending withdrawal" toast |
| Send OTP with pending | OTP sent, then verify fails with error | OTP request blocked with friendly message |
| Direct withdraw with pending (no 2FA) | Database constraint error | Shows friendly error message |
| Race condition (fast double-click) | Crashes with constraint error | Gracefully caught and shows message |

## User Experience Flow

```text
User clicks "Withdraw"
         |
         v
[Frontend Check] --> Has pending? --> YES --> "You already have a pending withdrawal" (toast)
         |
         NO
         v
[Dialog Opens - Select Amount & Account]
         |
User clicks "Confirm"
         |
         v
[2FA Enabled?]
    |         |
   YES        NO
    |          |
    v          v
[OTP Edge Check]  [Direct Insert]
    |               |
Has pending?     Error code 23505?
  YES --> Error    YES --> "Pending exists"
    |               |
   NO              NO
    v               v
[Send OTP]      [Success]
    |
User enters OTP
    |
    v
[Verify Edge Check]
    |
Insert error 23505? --> YES --> "Pending exists"
    |
   NO
    v
[Withdrawal Created Successfully]
```

## Technical Notes

- **Layer 1 (Frontend)**: Fast feedback, best UX, but can be bypassed
- **Layer 2 (OTP Send)**: Server-side security, prevents wasted OTP emails
- **Layer 3 (Verify)**: Catches race conditions, last line of defense
- All three layers work together for robust protection
- Uses Postgres error code `23505` for unique constraint violations
