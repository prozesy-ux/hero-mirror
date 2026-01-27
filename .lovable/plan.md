
# Fix Wallet Section Logos and Admin Panel Synchronization

## Issues Identified

### Issue 1: Available Withdrawal Methods - Logos Not Showing Properly
The "Available Withdrawal Methods" section in Buyer and Seller wallets shows logos based on `getPaymentLogo(method.method_code)`, but:
- The `method_code` stored in `withdrawal_method_config` may not match the keys in `PAYMENT_LOGOS` registry
- When no match is found, `getPaymentLogo()` returns an empty URL
- The `LogoWithFallback` component correctly falls back to a colored letter, but the expected official logos from admin panel aren't syncing

**Root Cause**: The logo URL stored in `custom_logo_url` from admin panel is NOT being prioritized correctly, and the registry lookup is case-sensitive

### Issue 2: Add Account Steps 2 & 3 - Wallet/Bank Selection Images
The "Select Bank" (Step 3) and "Select Wallet" (Step 3) sections use images from `digital-wallets-config.ts`:
- `bank.logo` from `COUNTRY_BANKS` array
- `wallet.logo` from `DIGITAL_WALLETS` array

These are hardcoded in the config file and are NOT connected to admin panel `withdrawal_method_config`. When admin updates logos via `custom_logo_url`, these steps don't reflect the changes.

### Issue 3: Admin Panel Preview Section Logos
The admin panel "AVAILABLE WITHDRAWAL METHODS" preview section at line 936-961 shows logos using `getMethodLogo()` which works correctly, but the cards in the grid (lines 996-1070) may have inconsistent logo display.

---

## Implementation Plan

### Step 1: Create a Unified Logo Helper Function
Create a helper that:
1. First checks `withdrawal_method_config.custom_logo_url` (admin uploaded)
2. Then checks `PAYMENT_LOGOS` registry by `method_code` (case-insensitive)
3. Finally falls back to brand color with first letter

**Location**: `src/lib/payment-logos.ts`

```typescript
// Enhanced getPaymentLogo with case-insensitive matching
export const getPaymentLogo = (code: string | null): LogoConfig => {
  if (!code) return { url: '', color: '#6366f1' };
  
  // Case-insensitive lookup
  const normalizedCode = code.toLowerCase().trim();
  const match = PAYMENT_LOGOS[normalizedCode];
  
  return match || { url: '', color: '#6366f1' };
};
```

### Step 2: Fix BuyerWallet.tsx "Available Withdrawal Methods" Section

**Current (Line 772-787)**:
```tsx
{displayMethods.map((method) => {
  const logoConfig = getPaymentLogo(method.method_code || method.account_type);
  const logoUrl = method.custom_logo_url || logoConfig.url;
  const brandColor = method.brand_color || logoConfig.color || '#6366f1';
```

This is correct, but we need to ensure `method.custom_logo_url` and `method.brand_color` are properly fetched from the database. The issue may be that the BFF endpoint isn't returning these fields.

**Check**: Verify `bff-buyer-wallet` returns `custom_logo_url` and `brand_color` from `withdrawal_method_config`.

### Step 3: Update Add Account Steps 2 & 3 to Use Admin-Configured Logos

**Problem**: The `getAvailableBanks()` and `getAvailableDigitalWallets()` functions return data from static `digital-wallets-config.ts`, NOT from admin panel.

**Solution**: Modify these functions to merge admin-configured logos with the static registry:

```typescript
const getAvailableBanks = useCallback(() => {
  if (!selectedCountry) return [];
  const staticBanks = getBanksForCountry(selectedCountry);
  
  // Merge with admin-configured withdrawal methods for this country/type
  return staticBanks.map(bank => {
    const adminConfig = withdrawalMethods.find(
      m => m.country_code === selectedCountry && 
           m.account_type === 'bank' && 
           m.method_code?.toLowerCase() === bank.code.toLowerCase()
    );
    return {
      ...bank,
      logo: adminConfig?.custom_logo_url || bank.logo,
      color: adminConfig?.brand_color || bank.color,
    };
  });
}, [selectedCountry, withdrawalMethods]);
```

Same pattern for `getAvailableDigitalWallets()`.

### Step 4: Ensure Admin Panel Logo Preview Works

**Current Implementation (Line 296-303)**:
```tsx
const getMethodLogo = (method: WithdrawalMethod) => {
  const logoConfig = getPaymentLogo(method.method_code || method.account_type);
  return {
    url: method.custom_logo_url || logoConfig.url,
    color: method.brand_color || logoConfig.color,
    name: method.method_name || logoConfig.name,
  };
};
```

This is correct. The issue may be case sensitivity in `method_code` lookup.

### Step 5: Fix Case-Insensitive Logo Lookup in payment-logos.ts

**Current `getPaymentLogo` function needs enhancement**:
```typescript
export const getPaymentLogo = (code: string): LogoConfig => {
  // Current: Direct lookup (case sensitive)
  return PAYMENT_LOGOS[code] || { url: '', color: '#6366f1' };
};
```

**Enhanced version**:
```typescript
export const getPaymentLogo = (code: string | null): LogoConfig => {
  if (!code) return { url: '', color: '#6366f1', name: '' };
  
  // Try exact match first
  if (PAYMENT_LOGOS[code]) return PAYMENT_LOGOS[code];
  
  // Try case-insensitive match
  const lowerCode = code.toLowerCase();
  const matchKey = Object.keys(PAYMENT_LOGOS).find(k => k.toLowerCase() === lowerCode);
  
  return matchKey ? PAYMENT_LOGOS[matchKey] : { url: '', color: '#6366f1', name: '' };
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/payment-logos.ts` | Add case-insensitive matching to `getPaymentLogo()` |
| `src/components/dashboard/BuyerWallet.tsx` | Update `getAvailableBanks()` and `getAvailableDigitalWallets()` to merge admin logos |
| `src/components/seller/SellerWallet.tsx` | Same changes as BuyerWallet |
| `supabase/functions/bff-buyer-wallet/index.ts` | Verify `custom_logo_url` and `brand_color` are returned |

---

## Technical Details

### Logo Priority System (Final)
```
1. withdrawal_method_config.custom_logo_url (admin uploaded)
2. PAYMENT_LOGOS[method_code] (registry with case-insensitive match)
3. DIGITAL_WALLETS[country][wallet.code].logo (static config)
4. Colored fallback with first letter of method name
```

### Data Flow After Fix
```
ADMIN PANEL
    │
    ├── Updates withdrawal_method_config.custom_logo_url
    ├── Updates withdrawal_method_config.brand_color
    │
    ▼
REALTIME SUBSCRIPTION
    │
    ▼
┌─────────────────────────────────┐
│  BuyerWallet / SellerWallet     │
│  ─────────────────────────────  │
│  Available Withdrawal Methods   │  ← Uses admin logo via priority system
│  ─────────────────────────────  │
│  Add Account → Step 2 (Type)    │  ← Static icons (Bank/Wallet/Crypto)
│  Add Account → Step 3 (Select)  │  ← Merges admin logos with static config
│  Add Account → Step 4 (Details) │  ← Shows selected method branding
└─────────────────────────────────┘
```

---

## Expected Behavior After Implementation

1. **Admin uploads bKash logo** → Wallet sections show the uploaded logo immediately
2. **Admin sets brand color #E2136E** → Fallback placeholders use this color
3. **Steps 2 & 3 in Add Account** → Show official images from config, overridden by admin uploads if set
4. **Country filter works** → Switching preview country shows correct methods with logos
5. **Case insensitivity** → method_code "bKash", "BKASH", "bkash" all match the same logo
