
# Fix Wallet Logos from Admin Panel Synchronization

## Problem Summary

The user has identified three key issues with the wallet sections:

1. **Available Withdrawal Methods preview** - Should show ONLY images from admin panel (no text names), with image sizes matching the deposit section
2. **Add Account Steps 2 & 3** - Bank/wallet selection should use logos updated in admin panel
3. **Country filter** - Should show ALL countries, not just those with configured methods

---

## Implementation Plan

### Part 1: Fix "Available Withdrawal Methods" Preview Section

**Current State (BuyerWallet.tsx lines 803-834):**
- Shows logo + method name text + badge
- Image size: `h-10 w-10`

**Required Changes:**
- Remove method name text and badge - show ONLY the logo image
- Change image size to match deposit section: `h-8 w-auto` (like BillingSection line 703)
- Clean, minimal layout showing just the official logos

**Files:** `BuyerWallet.tsx`, `SellerWallet.tsx`

---

### Part 2: Fix Country Dropdown to Show All Countries

**Current State:**
```typescript
const availableCountries = useMemo(() => {
  const countries = [...new Set(withdrawalMethods.map(m => m.country_code))];
  return countries.filter(c => c);
}, [withdrawalMethods]);
```
This only shows countries that have configured withdrawal methods.

**Required Changes:**
- Import `COUNTRY_CONFIG` from payment-logos
- Show ALL countries from `COUNTRY_CONFIG` in the dropdown
- Indicate which have configured methods (optional badge/count)

---

### Part 3: Fix Add Account Step 3 Logos

**Current State (lines 1397-1467):**
- Banks: Uses `bank.logo` directly from `getAvailableBanks()` result
- Wallets: Uses `wallet.logo` directly from `getAvailableDigitalWallets()` result

The merge functions (lines 211-248) ARE working correctly - they already override with `custom_logo_url` when available. However, the image rendering in Step 3 needs to use the merged logo consistently.

**Verification Needed:**
- Confirm the `getAvailableBanks()` and `getAvailableDigitalWallets()` functions return the admin-configured logos
- The returned `bank.logo` and `wallet.logo` should already contain the merged value

**No changes needed if merge is working** - just verify the data flow is correct.

---

## Technical Changes

### File: `src/components/dashboard/BuyerWallet.tsx`

**Change 1: Update Country Dropdown (lines 784-797)**
```typescript
// Before: Only shows countries with configured methods
{availableCountries.filter(c => c !== userCountry).map(code => (

// After: Show ALL countries from COUNTRY_CONFIG
{Object.keys(COUNTRY_CONFIG).filter(c => c !== userCountry).map(code => (
```

**Change 2: Update Preview Grid (lines 803-834)**
```typescript
// Before: Shows logo + name + badge
<div className="p-4 rounded-xl ...">
  <LogoWithFallback
    src={logoUrl}
    alt={method.method_name}
    color={brandColor}
    className="h-10 w-10 mx-auto mb-3"
  />
  <p className="text-gray-900 font-semibold text-sm">
    {method.method_name}
  </p>
  <Badge ...>...</Badge>
</div>

// After: Shows ONLY logo (matching deposit section style)
<div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-all">
  <img 
    src={logoUrl}
    alt={method.method_name}
    className="h-8 w-auto object-contain"
    onError={(e) => {
      // Fallback to LogoWithFallback on error
      (e.target as HTMLImageElement).style.display = 'none';
    }}
  />
</div>
```

### File: `src/components/seller/SellerWallet.tsx`

Apply the same changes as BuyerWallet.tsx.

---

## Visual Before/After

### Available Withdrawal Methods Preview

**Before:**
```text
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   [logo]    │ │   [logo]    │ │   [logo]    │
│   bKash     │ │   Nagad     │ │   Rocket    │
│  [Wallet]   │ │  [Wallet]   │ │  [Wallet]   │
└─────────────┘ └─────────────┘ └─────────────┘
```

**After (matching deposit section):**
```text
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│[logo] │ │[logo] │ │[logo] │ │[logo] │
└───────┘ └───────┘ └───────┘ └───────┘
```

### Country Dropdown

**Before:** Only BD, IN, PK (configured countries)

**After:** All countries from COUNTRY_CONFIG (BD, IN, PK, US, UK, CA, AU, etc.)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/BuyerWallet.tsx` | Update preview grid (images only, proper sizing), expand country dropdown |
| `src/components/seller/SellerWallet.tsx` | Same changes as BuyerWallet |

---

## Expected Behavior After Fix

1. **Admin uploads bKash logo** → Preview shows ONLY the logo image (no text)
2. **Image sizing** → Matches deposit section (`h-8 w-auto`)
3. **Country dropdown** → Shows ALL countries, user can preview methods for any country
4. **Add Account Step 3** → Uses admin-configured logos via the existing merge logic
