

# Fix Available Withdrawal Methods - RLS Policy Issue

## Root Cause Identified

The `withdrawal_method_config` table has a **blocking RLS policy** that prevents any direct access:

```sql
Policy: "No direct access to withdrawal config"
Command: ALL
USING (false)
```

This means:
- The `fetchWithdrawalMethods()` function in both wallets queries the table but returns **empty results**
- Even though the database has **44 enabled methods**, the frontend receives nothing
- The admin panel works because it uses edge functions with service role key (bypasses RLS)

---

## Solution

### Option 1: Add RLS Policy for Authenticated Users (Recommended)

Create a new policy that allows signed-in users to **read** enabled withdrawal methods:

```sql
CREATE POLICY "Authenticated users can read enabled withdrawal config"
ON public.withdrawal_method_config
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND is_enabled = true
);
```

This is secure because:
- Only authenticated users can access
- Only enabled methods are visible (admin can hide methods by disabling)
- No write access (insert/update/delete still blocked)

### Option 2: Use a Public View (Alternative)

Create a view that exposes only necessary fields:

```sql
CREATE VIEW public.withdrawal_methods_public
WITH (security_invoker=on) AS
SELECT id, country_code, account_type, method_code, method_name, 
       min_withdrawal, max_withdrawal, exchange_rate, custom_logo_url, brand_color
FROM public.withdrawal_method_config
WHERE is_enabled = true;
```

Then update wallet components to query the view instead.

---

## Implementation Plan

### Step 1: Add RLS Policy (Database Migration)

```sql
-- Allow authenticated users to read enabled withdrawal methods
CREATE POLICY "Authenticated users can read enabled withdrawal config"
ON public.withdrawal_method_config
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND is_enabled = true
);
```

### Step 2: No Frontend Code Changes Needed

The existing code in both `BuyerWallet.tsx` and `SellerWallet.tsx` is already correct:
- `fetchWithdrawalMethods()` queries the table properly
- `displayMethods` filters by country correctly
- Grid layout with logos is already implemented

Once the RLS policy is added, the query will return data and the preview will work.

---

## Why Previous Fixes Didn't Work

All the previous code changes were correct, but they couldn't fix the issue because:

1. **Code was fine** - `previewCountry` initialization, `displayMethods` filter, grid layout - all correct
2. **Data exists** - 44 enabled methods in the database
3. **RLS blocks everything** - The `USING (false)` policy returns empty results regardless of what the code does

---

## Expected Results After Fix

| Feature | Before | After |
|---------|--------|-------|
| Buyer Wallet Preview | Empty | Shows 6 BD methods immediately |
| Seller Wallet Preview | Empty | Shows seller's country methods |
| Country Switch | Nothing happens | Shows selected country's methods + GLOBAL |
| Admin Changes | Already works | Still works (uses service role) |
| Digital Wallet Images | Can't test | Shows admin-uploaded logos |

---

## Technical Details

### Current RLS Policy (Blocking)
```sql
Policy: "No direct access to withdrawal config"
Command: ALL
USING: false
```

### New RLS Policy (Read Access)
```sql
Policy: "Authenticated users can read enabled withdrawal config"
Command: SELECT
USING: auth.uid() IS NOT NULL AND is_enabled = true
```

### Security Considerations
- Only authenticated users can read (not public)
- Only enabled methods are visible (admin control)
- No write access from frontend (admin-only via edge functions)
- Sensitive fields like exchange rates are intentionally exposed (needed for currency conversion display)

---

## Verification Steps

1. Add the RLS policy via database migration
2. Open Buyer Dashboard → Wallet → See BD methods appear
3. Switch to India → See IN methods + GLOBAL methods
4. Open Seller Dashboard → Wallet → See seller's country methods
5. Admin changes logo → Wallet preview updates in real-time

