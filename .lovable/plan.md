

# Complete Wallet Section Fix - Both Dashboards

## Root Cause Analysis

After reviewing the code, I identified **4 specific bugs**:

### Bug 1: `previewCountry` Initialization Race Condition
- `previewCountry` starts as empty string `''`
- `displayMethods` returns empty when `filterCountry` is falsy
- The `useEffect` sync only triggers when `userCountry`/`sellerCountry` is set AND `previewInitialized.current` is false
- **Problem**: Data fetches complete, but `previewCountry` may still be empty

### Bug 2: Preview Design Mismatch
- **Billing Section**: Uses `grid grid-cols-2 sm:grid-cols-3 gap-4` with method names and type labels
- **Wallet Section**: Uses `flex flex-wrap gap-3` with no labels

### Bug 3: Digital Wallet Image Matching Fails
- `getAvailableDigitalWallets()` matches by `method_code`
- Database often has `method_code = null`
- No fallback matching by `method_name`

### Bug 4: `displayMethods` Missing Fallback
- Returns empty array when `filterCountry` is empty
- Should fallback to 'BD' when no country is set

---

## Implementation Plan

### File 1: `src/components/dashboard/BuyerWallet.tsx`

#### Change 1: Fix `previewCountry` initialization (line 152)
```typescript
// FROM:
const [previewCountry, setPreviewCountry] = useState<string>('');

// TO:
const [previewCountry, setPreviewCountry] = useState<string>('BD');
```

#### Change 2: Sync preview immediately when userCountry is fetched (line 295)
```typescript
// FROM:
if (fetchedCountry) setUserCountry(fetchedCountry);

// TO:
if (fetchedCountry) {
  setUserCountry(fetchedCountry);
  // Immediately sync preview country if not already set by user
  if (!previewInitialized.current) {
    setPreviewCountry(fetchedCountry);
    previewInitialized.current = true;
  }
}
```

#### Change 3: Add fallback to `displayMethods` (lines 197-204)
```typescript
const displayMethods = useMemo(() => {
  const filterCountry = previewCountry || userCountry || 'BD';
  return allWithdrawalMethods.filter(m => 
    m.country_code === filterCountry || m.country_code === 'GLOBAL'
  );
}, [allWithdrawalMethods, previewCountry, userCountry]);
```

#### Change 4: Fix `getAvailableDigitalWallets` to match by name (lines 231-248)
```typescript
const getAvailableDigitalWallets = useCallback(() => {
  const country = selectedCountry || userCountry;
  const staticWallets = getDigitalWalletsForCountry(country);
  
  return staticWallets.map(wallet => {
    // Match by method_code first, then by method_name as fallback
    const adminConfig = withdrawalMethods.find(
      m => m.country_code === country && 
           m.account_type === 'digital_wallet' && 
           (
             (m.method_code && m.method_code.toLowerCase() === wallet.code.toLowerCase()) ||
             m.method_name.toLowerCase() === wallet.label.toLowerCase()
           )
    );
    return {
      ...wallet,
      logo: adminConfig?.custom_logo_url || wallet.logo,
      color: adminConfig?.brand_color || wallet.color,
    };
  });
}, [selectedCountry, userCountry, withdrawalMethods]);
```

#### Change 5: Fix `getAvailableBanks` similarly (lines 251-268)
```typescript
const getAvailableBanks = useCallback(() => {
  const country = selectedCountry || userCountry;
  const staticBanks = getBanksForCountry(country);
  
  return staticBanks.map(bank => {
    // Match by method_code first, then by method_name as fallback
    const adminConfig = withdrawalMethods.find(
      m => m.country_code === country && 
           m.account_type === 'bank' && 
           (
             (m.method_code && m.method_code.toLowerCase() === bank.code.toLowerCase()) ||
             m.method_name.toLowerCase() === bank.name.toLowerCase()
           )
    );
    return {
      ...bank,
      logo: adminConfig?.custom_logo_url || bank.logo,
      color: adminConfig?.brand_color || bank.color,
    };
  });
}, [selectedCountry, userCountry, withdrawalMethods]);
```

#### Change 6: Update preview design to match Billing Section (lines 824-858)
```tsx
// FROM:
<div className="flex flex-wrap gap-3">
  {displayMethods.map((method) => {
    ...
    return (
      <div 
        className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center..."
        title={method.method_name}
      >
        {/* Just logo, no name */}
      </div>
    );
  })}
</div>

// TO:
<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
  {displayMethods.map((method) => {
    const logoConfig = getPaymentLogo(method.method_code || method.account_type);
    const logoUrl = method.custom_logo_url || logoConfig.url;
    const brandColor = method.brand_color || logoConfig.color || '#6366f1';
    
    return (
      <div 
        key={method.id}
        className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center hover:bg-gray-100 transition-all"
      >
        {logoUrl ? (
          <img 
            src={logoUrl}
            alt={method.method_name}
            className="h-8 w-auto mx-auto mb-2 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`h-8 w-8 mx-auto mb-2 rounded-lg items-center justify-center text-white font-bold text-sm ${logoUrl ? 'hidden' : 'flex'}`}
          style={{ backgroundColor: brandColor }}
        >
          {method.method_name.charAt(0).toUpperCase()}
        </div>
        <p className="text-gray-900 font-medium text-sm">{method.method_name}</p>
        <p className="text-gray-500 text-xs capitalize">{method.account_type.replace('_', ' ')}</p>
      </div>
    );
  })}
</div>
```

---

### File 2: `src/components/seller/SellerWallet.tsx`

Apply **identical changes**:

#### Change 1: Initialize `previewCountry` to 'BD' (line 156)
#### Change 2: Sync preview immediately after `fetchSellerCountry` - update the function (lines 328-338)
```typescript
const fetchSellerCountry = async () => {
  if (!profile?.id) return;
  const { data } = await supabase
    .from('seller_profiles')
    .select('country')
    .eq('id', profile.id)
    .single();
  if (data?.country) {
    setSellerCountry(data.country);
    // Immediately sync preview country if not already set by user
    if (!previewInitialized.current) {
      setPreviewCountry(data.country);
      previewInitialized.current = true;
    }
  }
};
```

#### Change 3: Add 'BD' fallback to `displayMethods` (lines 189-196)
#### Change 4: Fix `getAvailableDigitalWallets` to match by name (lines 223-240)
#### Change 5: Fix `getAvailableBanks` similarly (lines 243-260)
#### Change 6: Update preview design to match Billing Section (lines 830-864)

---

## Summary of Changes

| Issue | Fix | Files |
|-------|-----|-------|
| Preview empty on load | Initialize `previewCountry` to 'BD' + sync immediately | Both |
| Country switch shows nothing | `displayMethods` fallback to 'BD' | Both |
| Design mismatch | Grid layout + method name + type label | Both |
| Digital wallet images missing | Match by `method_name` as fallback | Both |
| Bank images missing | Match by `method_name` as fallback | Both |

---

## Expected Results

1. **Buyer Wallet**: Default country preview shows immediately on load
2. **Seller Wallet**: Same behavior - shows seller's country methods on load
3. **Country Switch**: Instantly shows selected country's methods + GLOBAL
4. **Design**: Grid layout with logos, names, and type labels - matching Billing section
5. **Step 3 Images**: Admin-uploaded logos appear correctly in Add Account flow
6. **Admin Changes**: Real-time sync already working via Supabase subscriptions

