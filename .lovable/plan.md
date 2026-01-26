
# Fix: Withdrawal OTP Not Opening - Missing 2FA Field in Profile

## Root Cause Identified

After investigating the code flow, I found the exact issue:

### The Problem: Missing Field in TypeScript Interface

**File: `src/contexts/SellerContext.tsx` (lines 7-18)**

The `SellerProfile` interface is missing the `two_factor_enabled` field:

```typescript
interface SellerProfile {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  store_logo_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  commission_rate: number;
  total_sales: number;
  total_orders: number;
  // ❌ MISSING: two_factor_enabled field!
}
```

**File: `src/components/seller/SellerWallet.tsx` (line 415)**

The withdrawal handler checks for 2FA status:

```typescript
const is2FAEnabled = (profile as any)?.two_factor_enabled !== false;
```

Because the field is missing from the interface:
- The value is `undefined`
- `undefined !== false` evaluates to `true`
- The code ALWAYS tries to send OTP, even when it shouldn't
- BUT the actual backend data has `two_factor_enabled: true` for all sellers

### Why This Breaks the Flow

1. **Database Reality**: All sellers have `two_factor_enabled: true` (confirmed via query)
2. **BFF Returns It**: The `bff-seller-dashboard` fetches `seller_profiles` with `select('*')` which includes this field
3. **TypeScript Strips It**: The frontend interface doesn't define it, so TypeScript doesn't recognize it
4. **Code Uses `any`**: The check uses `(profile as any)` to bypass TypeScript, but the field is still undefined
5. **Always Defaults to True**: `undefined !== false` is `true`, so OTP is always attempted

### Additional Issue: API Key Was Invalid

You provided a new Resend API key: `re_EomoCGaJ_6RqyUFzXc1UR1SSquuW5rYt9`

The old key was returning 401 errors, which we've already fixed by updating the secret.

---

## Solution Plan

### Step 1: Add Missing Field to SellerProfile Interface

**File: `src/contexts/SellerContext.tsx`**

Update the interface to include the 2FA field:

```typescript
interface SellerProfile {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  store_logo_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  commission_rate: number;
  total_sales: number;
  total_orders: number;
  two_factor_enabled: boolean;  // ✅ ADD THIS
}
```

### Step 2: Verify BFF Returns the Field

**File: `supabase/functions/bff-seller-dashboard/index.ts` (line 41)**

The BFF already fetches all fields correctly:

```typescript
const { data: profile, error: profileError } = await supabase
  .from('seller_profiles')
  .select('*')  // ✅ Already includes two_factor_enabled
  .eq('user_id', userId)
  .single();
```

No changes needed here.

### Step 3: Improve 2FA Check Logic

**File: `src/components/seller/SellerWallet.tsx` (line 415)**

Improve the check to be more explicit:

```typescript
// Old (buggy):
const is2FAEnabled = (profile as any)?.two_factor_enabled !== false;

// New (explicit):
const is2FAEnabled = profile.two_factor_enabled === true;
```

Now that the interface includes the field, we don't need `as any` and can use proper type checking.

### Step 4: Add Console Logging for Debugging

Add debug logs to confirm the value flows through:

```typescript
console.log('[WITHDRAW] Profile 2FA status:', {
  two_factor_enabled: profile.two_factor_enabled,
  is2FAEnabled
});
```

---

## Expected Behavior After Fix

### When 2FA is Enabled (Default)
1. User clicks "Withdraw" → Console shows "2FA enabled - sending OTP..."
2. Edge function receives request → Generates 6-digit OTP
3. OTP stored in `withdrawal_otps` table
4. Email sent via Resend (with valid API key)
5. Frontend receives success response
6. **OTP modal opens** with input field
7. User receives email with code
8. User enters code → Withdrawal processed

### When 2FA is Disabled
1. User clicks "Withdraw" → Console shows "2FA disabled - processing direct withdrawal..."
2. Withdrawal created immediately (no OTP)
3. Balance deducted
4. Success toast shown

---

## Technical Flow Diagram

```text
User Clicks "Withdraw"
        │
        ▼
Check profile.two_factor_enabled
        │
   ┌────┴─────┐
   │          │
   ▼          ▼
 true       false
   │          │
   │    Create withdrawal directly
   │    (skip OTP)
   │          │
   ▼          ▼
Call send-withdrawal-otp
   │
   ▼
Generate OTP + Store in DB
   │
   ▼
Send Email via Resend
   │
   ▼
✅ Open OTP Modal
   │
   ▼
User enters 6-digit code
   │
   ▼
Verify OTP + Process withdrawal
```

---

## Files to Modify

| File | Change | Lines |
|------|--------|-------|
| `src/contexts/SellerContext.tsx` | Add `two_factor_enabled: boolean` to `SellerProfile` interface | 7-18 |
| `src/components/seller/SellerWallet.tsx` | Improve 2FA check logic, add debug logging | 415-420 |

---

## Why This Will Fix the Issue

1. **Proper Data Flow**: The `two_factor_enabled` field will flow from database → BFF → frontend properly
2. **Type Safety**: TypeScript will recognize the field, no need for `as any` casting
3. **Correct Logic**: The check will properly evaluate the boolean value instead of defaulting to `true`
4. **Valid API Key**: The new Resend key will allow emails to send successfully
5. **Better Debugging**: Console logs will show the actual 2FA status for troubleshooting

---

## Testing Checklist

After implementing the fix:

✅ **Test 1: With 2FA Enabled (Default)**
- Go to Seller Dashboard → Wallet tab
- Click "Withdraw" button
- Select account and amount
- **Expected**: Console shows "2FA enabled", OTP modal opens, email received

✅ **Test 2: Check Console Logs**
- Open browser DevTools → Console tab
- Look for: `[WITHDRAW] Profile 2FA status: { two_factor_enabled: true, is2FAEnabled: true }`
- Verify edge function logs show: `[OTP] Generated OTP for seller...`

✅ **Test 3: Verify Email Delivery**
- Check registered email inbox
- Look for email with subject: "Withdrawal Verification Code: XXXXXX"
- Verify 6-digit code is visible

✅ **Test 4: Complete Withdrawal**
- Enter the 6-digit OTP code
- **Expected**: "Withdrawal submitted successfully!" toast
- Check withdrawals list for new pending request

---

## Security Note

All sellers currently have `two_factor_enabled: true` by default, which is the secure behavior. This fix ensures the frontend properly respects that setting instead of accidentally breaking the OTP flow due to a missing TypeScript field.
