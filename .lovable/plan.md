
# Fix Wallet Section Live Updates from Admin Panel

## Issues Identified

### 1. Critical Database Error: `profiles.country` Does Not Exist
The BFF-BuyerWallet edge function is failing because it tries to query `profiles.country`, but this column doesn't exist in the `profiles` table.

**Current `profiles` columns:**
- id, user_id, email, full_name, avatar_url, is_pro, created_at, updated_at, username, two_factor_enabled

**Missing:** `country`

**Note:** `seller_profiles` has a `country` column, but `profiles` (for buyers) does not.

### 2. Realtime Not Enabled for `withdrawal_method_config`
The `withdrawal_method_config` table is not in the Supabase realtime publication, which prevents live updates from propagating to wallets when admin changes settings.

### 3. Country Auto-Selection in Admin Preview
The admin panel's "Available Withdrawal Methods" section needs to show a default country with enabled methods count badges.

---

## Implementation Plan

### Phase 1: Database Migration
Add the missing `country` column to the `profiles` table and enable realtime for `withdrawal_method_config`.

```sql
-- Add country column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'BD';

-- Add realtime for withdrawal_method_config
ALTER PUBLICATION supabase_realtime ADD TABLE withdrawal_method_config;
```

### Phase 2: Fix BFF-BuyerWallet Fallback Logic
Update the edge function to handle cases where country might be null or missing:

```typescript
// Before:
const { data: profileData } = await supabase
  .from('profiles')
  .select('country')
  .eq('user_id', userId)
  .maybeSingle();

const userCountry = profileData?.country || 'GLOBAL';

// After (with fallback to buyer_payment_accounts):
const { data: profileData } = await supabase
  .from('profiles')
  .select('country')
  .eq('user_id', userId)
  .maybeSingle();

let userCountry = profileData?.country;

// Fallback: check buyer's saved accounts for country
if (!userCountry) {
  const { data: accountData } = await supabase
    .from('buyer_payment_accounts')
    .select('country')
    .eq('user_id', userId)
    .not('country', 'is', null)
    .limit(1)
    .maybeSingle();
  userCountry = accountData?.country;
}

userCountry = userCountry || 'GLOBAL';
```

### Phase 3: Admin Panel Improvements
1. **Country auto-select with badge:** When loading withdrawal tab, auto-select the first country that has configured methods
2. **Live preview section:** Show all enabled methods for selected country with logos
3. **Method count badges:** Display number of active methods per country in dropdown

### Phase 4: Wallet Components Update
Ensure both `BuyerWallet.tsx` and `SellerWallet.tsx`:
1. Subscribe to `withdrawal_method_config` realtime changes
2. Use logo priority: `custom_logo_url` > `payment-logos.ts` registry > fallback color
3. Show country badge with flag and name
4. Display min withdrawal limits per method

---

## Files to Modify

| File | Changes |
|------|---------|
| **Database Migration** | Add `country` to `profiles`, enable realtime for `withdrawal_method_config` |
| `supabase/functions/bff-buyer-wallet/index.ts` | Add fallback logic for country detection |
| `src/components/admin/PaymentSettingsManagement.tsx` | Improve country auto-selection with active method counts |
| `src/components/dashboard/BuyerWallet.tsx` | Verify realtime subscription, logo fallback |
| `src/components/seller/SellerWallet.tsx` | Verify realtime subscription, logo fallback |

---

## Technical Flow After Fix

```text
ADMIN PANEL
    │
    ▼
┌───────────────────────────────────┐
│  withdrawal_method_config table   │
│  (country, account_type, method)  │
└───────────────────────────────────┘
    │
    │ Realtime subscription
    ▼
┌───────────────────────────────────┐
│  BuyerWallet / SellerWallet       │
│  - Fetch enabled methods          │
│  - Filter by user country         │
│  - Display with logos             │
└───────────────────────────────────┘
```

**Logo Priority System:**
1. `custom_logo_url` from database (admin uploaded)
2. `getPaymentLogo(method_code)` from registry
3. Colored fallback with first letter

---

## Expected Outcome

After implementation:
- Admin can add/edit/delete withdrawal methods per country
- Changes sync instantly to buyer and seller wallets
- Logos display correctly with fallbacks
- Country is auto-detected from user profile or payment accounts
- Admin sees live preview of enabled methods per country
