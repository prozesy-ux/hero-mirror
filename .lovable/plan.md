
# Fix Wallet Section Issues - Complete Fixes

## Issues Identified

### 1. Remove "Min: $5000" Text from Bank Section
**Location:** `BuyerWallet.tsx` (Lines 758-760) and `SellerWallet.tsx` (Lines 776-778)

Current code displays:
```tsx
<p className="text-gray-500 text-xs mt-1">
  Min: ${method.min_withdrawal}
</p>
```
This needs to be removed from the "Available Withdrawal Methods" section entirely.

### 2. Country Selection Option Missing for Users
**Issue:** Users (e.g., Bangladesh users) cannot change country to preview withdrawal methods for other countries.
**Location:** `BuyerWallet.tsx` and `SellerWallet.tsx` - Lines 726-773

The current header shows the country badge but has NO selector for users to change it:
```tsx
<Badge variant="outline" className="ml-2 text-xs">
  {COUNTRY_CONFIG[userCountry]?.flag || '🌍'} {COUNTRY_CONFIG[userCountry]?.name || userCountry}
</Badge>
```

**Solution:** Add a dropdown to allow users to preview methods for other countries while their actual withdrawals remain tied to their profile country.

### 3. Admin Panel Logo Not Updating
**Issue:** In the admin panel's "Available Withdrawal Methods" preview section and the withdrawal method cards, logos are not displaying correctly.

**Root Cause Analysis:**
- The `getMethodLogo` helper in `PaymentSettingsManagement.tsx` (Lines 296-303) correctly prioritizes `custom_logo_url > registry > fallback`
- However, the `LogoWithFallback` component expects `src` to be a valid URL - if the `method_code` doesn't match any registry entry AND no `custom_logo_url` is set, it passes an empty string

**Current logic at line 297:**
```tsx
const logoConfig = getPaymentLogo(method.method_code || method.account_type);
```
When `method_code` is something like "bkash" but the registry has it lowercase, and no custom_logo_url is set, it should still work. However if the code doesn't match at all, it returns empty URL.

### 4. Wallet Section Logos Not Showing
**Same Issue:** The wallet components use identical logo logic but logos aren't rendering.

---

## Implementation Plan

### Phase 1: Remove "Min: $X" Text from Available Withdrawal Methods

**BuyerWallet.tsx** - Remove lines 758-760:
```tsx
// REMOVE THIS:
<p className="text-gray-500 text-xs mt-1">
  Min: ${method.min_withdrawal}
</p>
```

**SellerWallet.tsx** - Remove lines 776-778:
```tsx
// REMOVE THIS:  
<p className="text-gray-500 text-xs mt-1">
  Min: ${method.min_withdrawal}
</p>
```

### Phase 2: Add Country Preview Selector to Wallet Sections

Add a dropdown above the "Available Withdrawal Methods" section that allows users to PREVIEW methods for other countries:

```tsx
{/* Country Preview Selector */}
<div className="flex items-center gap-3 mb-4">
  <Label className="text-sm text-gray-600">Preview for:</Label>
  <Select value={previewCountry} onValueChange={setPreviewCountry}>
    <SelectTrigger className="w-[180px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {/* User's default country first */}
      <SelectItem value={userCountry}>
        {COUNTRY_CONFIG[userCountry]?.flag} {COUNTRY_CONFIG[userCountry]?.name} (Your Country)
      </SelectItem>
      <div className="h-px bg-gray-200 my-1" />
      {/* Other available countries from withdrawal config */}
      {availableCountries.filter(c => c !== userCountry).map(code => (
        <SelectItem key={code} value={code}>
          {COUNTRY_CONFIG[code]?.flag} {COUNTRY_CONFIG[code]?.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**State additions:**
```tsx
const [previewCountry, setPreviewCountry] = useState<string>(userCountry);

// Derive available countries from withdrawal methods
const availableCountries = useMemo(() => {
  const countries = [...new Set(withdrawalMethods.map(m => m.country_code))];
  return countries;
}, [withdrawalMethods]);

// Filter methods by preview country
const filteredMethods = useMemo(() => {
  return withdrawalMethods.filter(m => m.country_code === previewCountry);
}, [withdrawalMethods, previewCountry]);
```

### Phase 3: Fix Logo Rendering in All Components

The issue is that `LogoWithFallback` shows the fallback letter when `src` is empty. The `getPaymentLogo` function returns empty string if no match.

**Enhanced logo fetching with better fallback:**

In both wallet components and admin panel, ensure the logo helper properly handles edge cases:

```tsx
const getMethodLogoUrl = (method: WithdrawalMethod) => {
  // 1. Priority: custom_logo_url from database
  if (method.custom_logo_url) return method.custom_logo_url;
  
  // 2. Check registry by method_code
  if (method.method_code) {
    const logoConfig = getPaymentLogo(method.method_code);
    if (logoConfig.url) return logoConfig.url;
  }
  
  // 3. Return empty (fallback to letter placeholder)
  return '';
};
```

This is already correct. The actual issue might be with how the `LogoWithFallback` component handles the src/alt combination. Let me verify the component is receiving correct props.

**Ensure brand colors are passed correctly:**
```tsx
<LogoWithFallback
  src={logoUrl}
  alt={method.method_name}
  color={method.brand_color || logoConfig.color} // Ensure color is passed
  className="h-10 w-10 mx-auto mb-3"
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/BuyerWallet.tsx` | Remove min withdrawal text, add country preview selector, verify logo props |
| `src/components/seller/SellerWallet.tsx` | Same changes as BuyerWallet |
| `src/components/admin/PaymentSettingsManagement.tsx` | Verify logo rendering in withdrawal cards |

---

## Technical Implementation Details

### BuyerWallet.tsx Changes:

1. **Add new state:**
```tsx
const [previewCountry, setPreviewCountry] = useState<string>('');
```

2. **Sync previewCountry with userCountry on load:**
```tsx
useEffect(() => {
  if (userCountry && !previewCountry) {
    setPreviewCountry(userCountry);
  }
}, [userCountry]);
```

3. **Derive available countries:**
```tsx
const availableCountries = useMemo(() => {
  return [...new Set(withdrawalMethods.map(m => m.country_code))];
}, [withdrawalMethods]);
```

4. **Filter methods by preview country:**
```tsx
const displayMethods = useMemo(() => {
  if (!previewCountry) return withdrawalMethods;
  return withdrawalMethods.filter(m => m.country_code === previewCountry);
}, [withdrawalMethods, previewCountry]);
```

5. **Update the UI section** - Replace the header and remove min text.

### SellerWallet.tsx Changes:
Same pattern as BuyerWallet.

---

## Expected Results After Fix

1. **No "Min: $X" text** in the Available Withdrawal Methods cards - cleaner UI
2. **Country dropdown** allows Bangladesh users (and all users) to preview methods for other countries
3. **Logos display correctly** with priority: custom_logo_url > registry match > colored letter fallback
4. **Admin panel logos** update properly when method_code is entered
5. **Real-time sync** - when admin adds/removes methods, wallet sections update automatically

---

## Summary of Removals/Additions

**Remove:**
- "Min: ${method.min_withdrawal}" text from BuyerWallet.tsx line 758-760
- "Min: ${method.min_withdrawal}" text from SellerWallet.tsx line 776-778

**Add:**
- Country preview dropdown selector in BuyerWallet.tsx
- Country preview dropdown selector in SellerWallet.tsx  
- `previewCountry` state and related filtering logic
- Better logo fallback handling if needed
