
# Connect "Available Withdrawal Methods" to Admin Panel

## Overview
The "Available Withdrawal Methods" section in BuyerWallet and SellerWallet needs to fetch data from the admin-controlled `withdrawal_method_config` table instead of the current `payment_methods` table. This ensures:

1. **Live updates**: When admin enables/disables a method, wallets reflect changes immediately
2. **Country-based filtering**: Users only see methods enabled for their country  
3. **Correct logos**: Uses the `payment-logos.ts` registry with `custom_logo_url` fallback
4. **No deposit connection**: Completely separate from the deposit methods

---

## Current State

### BuyerWallet.tsx (Lines 716-748)
- Fetches from `payment_methods` table via BFF API
- Shows `method.icon_url` with generic fallback
- No country filtering
- Not connected to `withdrawal_method_config`

### SellerWallet.tsx (Lines 729-761)
- Similar logic, same issues
- Fetches from `payment_methods` directly

### Admin Panel
- `withdrawal_method_config` table has:
  - `country_code`, `account_type`, `method_code`
  - `is_enabled`, `min_withdrawal`, `max_withdrawal`
  - `custom_logo_url`, `brand_color`, `method_name`
- Already seeded with data for BD, GB, US, IN, PK, etc.

---

## Implementation Plan

### Step 1: Update BFF Endpoints to Include Withdrawal Config

**bff-buyer-wallet/index.ts**
Add fetching `withdrawal_method_config` for user's country:
```typescript
// Get user's country from profile or buyer_payment_accounts
const profileResult = await supabase
  .from('profiles')
  .select('country')
  .eq('user_id', userId)
  .single();

const userCountry = profileResult.data?.country || 'GLOBAL';

// Fetch withdrawal methods for user's country + GLOBAL
const withdrawalConfigResult = await supabase
  .from('withdrawal_method_config')
  .select('*')
  .in('country_code', [userCountry, 'GLOBAL'])
  .eq('is_enabled', true)
  .order('account_type, method_name');
```

**bff-seller-dashboard/index.ts**
Same pattern - fetch config based on seller's country from `seller_profiles.country`.

### Step 2: Update BuyerWallet.tsx

**Add new state for withdrawal config:**
```typescript
interface WithdrawalMethod {
  id: string;
  country_code: string;
  account_type: 'bank' | 'digital_wallet' | 'crypto';
  method_code: string | null;
  method_name: string;
  is_enabled: boolean;
  min_withdrawal: number;
  max_withdrawal: number;
  custom_logo_url: string | null;
  brand_color: string | null;
  exchange_rate: number;
}

const [withdrawalMethods, setWithdrawalMethods] = useState<WithdrawalMethod[]>([]);
```

**Replace "Available Withdrawal Methods" section (Lines 716-748):**
```typescript
{/* Available Withdrawal Methods - from Admin Config */}
<div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
  <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-4 flex items-center gap-2">
    <CreditCard className="text-violet-500" size={20} />
    Available Withdrawal Methods
    <Badge variant="outline" className="ml-2 text-xs">
      {getCountryName(userCountry)}
    </Badge>
  </h3>
  
  {withdrawalMethods.length === 0 ? (
    <p className="text-gray-500 text-center py-8">
      No withdrawal methods available for your region. Contact admin.
    </p>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {withdrawalMethods.map((method) => {
        const logoConfig = getPaymentLogo(method.method_code || method.account_type);
        const logoUrl = method.custom_logo_url || logoConfig.url;
        const brandColor = method.brand_color || logoConfig.color;
        
        return (
          <div 
            key={method.id}
            className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 text-center hover:shadow-md hover:border-violet-200 transition-all"
          >
            <LogoWithFallback
              src={logoUrl}
              alt={method.method_name}
              fallbackColor={brandColor}
              className="h-10 w-10 mx-auto mb-3"
            />
            <p className="text-gray-900 font-semibold text-sm">
              {method.method_name}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Min: ${method.min_withdrawal}
            </p>
            <Badge 
              variant="secondary" 
              className="mt-2 text-[10px]"
              style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
            >
              {method.account_type === 'bank' ? 'Bank' : 
               method.account_type === 'digital_wallet' ? 'Wallet' : 'Crypto'}
            </Badge>
          </div>
        );
      })}
    </div>
  )}
</div>
```

### Step 3: Update SellerWallet.tsx

Same changes as BuyerWallet - replace the "Available Withdrawal Methods" section with the admin-connected version.

### Step 4: Add Real-Time Subscription

**BuyerWallet.tsx & SellerWallet.tsx:**
```typescript
// Subscribe to withdrawal config changes
const configChannel = supabase
  .channel('withdrawal-config-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'withdrawal_method_config'
  }, () => {
    // Refetch withdrawal methods
    fetchWithdrawalMethods();
  })
  .subscribe();
```

### Step 5: Import getPaymentLogo Helper

```typescript
import { getPaymentLogo, COUNTRIES } from '@/lib/payment-logos';
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/bff-buyer-wallet/index.ts` | Add `withdrawal_method_config` fetch + return |
| `supabase/functions/bff-seller-dashboard/index.ts` | Add `withdrawal_method_config` fetch + return |
| `src/components/dashboard/BuyerWallet.tsx` | Replace available methods section, add real-time |
| `src/components/seller/SellerWallet.tsx` | Same as BuyerWallet |

---

## Expected Behavior After Implementation

1. **Admin enables bKash for BD**: Buyer/Seller in BD sees bKash appear in "Available Withdrawal Methods"
2. **Admin disables PayPal for US**: Buyer/Seller in US no longer sees PayPal
3. **Admin updates min_withdrawal**: New limit reflected immediately
4. **Admin uploads custom logo**: Logo updates in all wallet views
5. **GLOBAL methods (crypto)**: Visible to all users regardless of country

---

## Technical Notes

- **No deposit section changes**: The deposit methods remain unchanged and separate
- **Logo priority**: `custom_logo_url` > `payment-logos.ts` registry > fallback color placeholder
- **Country detection**: Uses `profiles.country` for buyers, `seller_profiles.country` for sellers
- **Real-time sync**: Supabase subscription on `withdrawal_method_config` table triggers refetch
