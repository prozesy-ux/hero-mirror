
# Complete Admin Payment Settings & Wallet System Upgrade

## Overview
This plan covers:
1. Redesigning Admin Payment Settings with completely separate Deposit and Withdrawal tabs
2. Full country and account-type based control in Withdrawal section
3. Fixing all bank/wallet logos using a hybrid approach (local + external with fallback)
4. Syncing wallet features with admin configuration (country, enabled types, limits)

---

## Architecture Summary

```text
ADMIN PAYMENT SETTINGS (Redesigned)
================================

+--------------------------------------------------+
|  [Deposit Methods]    [Withdrawal Methods]       |
+--------------------------------------------------+

DEPOSIT TAB:
- Add funds/top-up gateways only
- Stripe, Razorpay, bKash, Manual payments
- QR codes, account details, API keys
- Separate from withdrawal completely

WITHDRAWAL TAB:
- Payout methods only (Bank, Digital Wallet, Crypto)
- Country-based method configuration
- Per-wallet brand enable/disable (bKash, PayPal, GCash, etc.)
- Min/max limits, exchange rates
- Uses new withdrawal_methods table or extended config
```

---

## Phase 1: Create Comprehensive Logo Assets

### Files to Create
- `src/lib/payment-logos.ts` - Central logo registry with fallback colors

### Logo Strategy (Hybrid Approach)
1. **Primary source**: External CDN URLs (Clearbit, official CDNs)
2. **Fallback**: Styled placeholder with brand initial + color
3. **Admin upload**: Support storage bucket for custom logos

### Logo Registry Structure
```typescript
export const PAYMENT_LOGOS: Record<string, LogoConfig> = {
  // Banks - USA
  'chase': { url: 'https://logo.clearbit.com/chase.com', color: '#117ACA' },
  'bofa': { url: 'https://logo.clearbit.com/bankofamerica.com', color: '#012169' },
  
  // Banks - Bangladesh
  'brac': { url: 'https://logo.clearbit.com/bracbank.com', color: '#003366' },
  'dbbl': { url: 'https://logo.clearbit.com/dutchbanglabank.com', color: '#00843D' },
  
  // Digital Wallets - Global
  'bkash': { url: '/logos/bkash.svg', color: '#E2136E' },
  'paypal': { url: 'https://logo.clearbit.com/paypal.com', color: '#003087' },
  'venmo': { url: 'https://logo.clearbit.com/venmo.com', color: '#3D95CE' },
  // ... 100+ more entries
};
```

---

## Phase 2: Database Schema Enhancement

### New Table: withdrawal_method_config
To store admin-configurable withdrawal rules per country and type.

```sql
CREATE TABLE IF NOT EXISTS withdrawal_method_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,  -- 'US', 'BD', 'IN', etc.
  account_type TEXT NOT NULL,  -- 'bank', 'digital_wallet', 'crypto'
  method_code TEXT,            -- 'bkash', 'paypal', NULL for type-level
  is_enabled BOOLEAN DEFAULT true,
  min_withdrawal NUMERIC DEFAULT 5,
  max_withdrawal NUMERIC DEFAULT 1000,
  exchange_rate NUMERIC DEFAULT 1,
  custom_logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(country_code, account_type, method_code)
);

-- Enable RLS
ALTER TABLE withdrawal_method_config ENABLE ROW LEVEL SECURITY;

-- Policy: No direct access, only through admin edge functions
CREATE POLICY "No direct access" ON withdrawal_method_config
  FOR ALL USING (false);
```

### Update admin-fetch-data and admin-mutate-data
Add `withdrawal_method_config` to the allowed tables whitelist.

---

## Phase 3: Redesign Admin PaymentSettingsManagement.tsx

### New Component Structure

```text
PaymentSettingsManagement
├── Tab: "Deposit Methods" (emerald theme)
│   ├── Stats: Total gateways, Active, Manual count
│   ├── Gateway Cards Grid:
│   │   └── For each deposit method:
│   │       - Logo + Name + Code
│   │       - Enable/Disable toggle
│   │       - API Key fields (for automatic)
│   │       - QR Code + Account details (for manual)
│   │       - Edit/Delete actions
│   └── Add Deposit Method button
│
└── Tab: "Withdrawal Methods" (violet theme)
    ├── Stats: Countries configured, Methods enabled, Total limits
    ├── Country Filter Dropdown (27+ countries)
    ├── Account Type Tabs: Bank | Digital Wallet | Crypto
    └── Method Cards Grid (per selected country + type):
        └── For each wallet/bank:
            - Official Logo (with fallback)
            - Name + Code
            - Enable/Disable toggle
            - Min/Max withdrawal limits
            - Exchange rate (if non-USD)
            - Save changes button
```

### Key Features
1. **Separate data sources**: 
   - Deposit: Uses `payment_methods` table (existing)
   - Withdrawal: Uses new `withdrawal_method_config` table

2. **Country-based filtering**:
   - Dropdown to select country (27+ options)
   - Shows only methods configured for that country
   - Can add/remove methods per country

3. **Per-wallet brand control**:
   - For Bangladesh: enable/disable bKash, Nagad, Rocket individually
   - For USA: enable/disable Venmo, Zelle, PayPal individually
   - For India: enable/disable PhonePe, Paytm, GooglePay individually

4. **Bulk actions**:
   - Enable/disable all for a country
   - Copy settings from one country to another
   - Update all limits at once

---

## Phase 4: Update BuyerWallet.tsx & SellerWallet.tsx

### Changes Required

1. **Fetch withdrawal configuration from database**:
```typescript
// New: Fetch enabled methods for user's country
const fetchEnabledMethods = async () => {
  const { data } = await supabase
    .from('withdrawal_method_config')
    .select('*')
    .eq('country_code', userCountry)
    .eq('is_enabled', true);
  // Filter available options based on this config
};
```

2. **Filter account types based on admin config**:
   - Only show "Bank Account" if admin enabled banks for user's country
   - Only show "Digital Wallet" if admin enabled wallets for user's country
   - Only show specific brands (bKash, PayPal) if individually enabled

3. **Apply limits from admin config**:
   - Use configured min/max withdrawal amounts
   - Use configured exchange rates

4. **Logo display improvements**:
   - Use `LogoWithFallback` component everywhere
   - Pull logos from central registry
   - Ensure consistent 40x40px sizing

---

## Phase 5: Fix All Bank/Wallet Logos

### digital-wallets-config.ts Updates

Replace broken/missing logo URLs with verified working URLs:

```typescript
// Bangladesh Digital Wallets
BD: [
  { code: 'bkash', label: 'bKash', logo: '/logos/bkash.png', color: '#E2136E' },
  { code: 'nagad', label: 'Nagad', logo: '/logos/nagad.png', color: '#FF6A00' },
  { code: 'rocket', label: 'Rocket', logo: '/logos/rocket.png', color: '#8B2C92' },
  // ...
],

// USA Digital Wallets  
US: [
  { code: 'venmo', label: 'Venmo', logo: 'https://logo.clearbit.com/venmo.com', color: '#3D95CE' },
  { code: 'zelle', label: 'Zelle', logo: 'https://logo.clearbit.com/zellepay.com', color: '#6D1ED4' },
  { code: 'paypal', label: 'PayPal', logo: 'https://logo.clearbit.com/paypal.com', color: '#003087' },
  // ...
],
```

### Local Logo Assets
Create `/public/logos/` folder with SVG/PNG files for critical brands:
- bkash.png, nagad.png, rocket.png (Bangladesh)
- phonepe.png, paytm.png, gpay.png (India)
- easypaisa.png, jazzcash.png (Pakistan)

---

## Phase 6: Admin Data Context Updates

### AdminDataContext.tsx
Add `withdrawalMethodConfig` to the context state:

```typescript
interface AdminDataState {
  // ... existing fields
  withdrawalMethodConfig: any[];
}

// Add to refreshAll():
const [withdrawalConfigRes] = await fetchData('withdrawal_method_config');
```

### admin-fetch-data & admin-mutate-data Edge Functions
Add to allowed tables whitelist:
```typescript
const allowedTables = [
  // ... existing
  'withdrawal_method_config'
];
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/payment-logos.ts` | NEW: Central logo registry |
| `src/lib/digital-wallets-config.ts` | Fix broken logos, add more banks/wallets |
| `src/components/admin/PaymentSettingsManagement.tsx` | Complete redesign with Deposit/Withdrawal tabs |
| `src/components/dashboard/BuyerWallet.tsx` | Fetch enabled methods, filter by config |
| `src/components/seller/SellerWallet.tsx` | Same as BuyerWallet |
| `src/components/ui/logo-with-fallback.tsx` | Enhance with loading states |
| `src/contexts/AdminDataContext.tsx` | Add withdrawal config to state |
| `supabase/functions/admin-fetch-data/index.ts` | Add withdrawal_method_config to whitelist |
| `supabase/functions/admin-mutate-data/index.ts` | Add withdrawal_method_config to whitelist |
| `public/logos/` | NEW: Local logo assets (bkash, nagad, etc.) |

---

## Database Migration

```sql
-- Create withdrawal method configuration table
CREATE TABLE IF NOT EXISTS withdrawal_method_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'digital_wallet', 'crypto')),
  method_code TEXT,
  is_enabled BOOLEAN DEFAULT true,
  min_withdrawal NUMERIC DEFAULT 5,
  max_withdrawal NUMERIC DEFAULT 1000,
  exchange_rate NUMERIC DEFAULT 1,
  custom_logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(country_code, account_type, COALESCE(method_code, ''))
);

-- Enable RLS
ALTER TABLE withdrawal_method_config ENABLE ROW LEVEL SECURITY;

-- Policy: Only through admin edge functions
CREATE POLICY "No direct access" ON withdrawal_method_config
  FOR ALL USING (false);

-- Seed initial data for popular countries
INSERT INTO withdrawal_method_config (country_code, account_type, method_code, is_enabled, min_withdrawal, max_withdrawal)
VALUES 
  ('BD', 'bank', NULL, true, 5, 1000),
  ('BD', 'digital_wallet', 'bkash', true, 5, 500),
  ('BD', 'digital_wallet', 'nagad', true, 5, 500),
  ('BD', 'digital_wallet', 'rocket', true, 5, 500),
  ('IN', 'bank', NULL, true, 5, 1000),
  ('IN', 'digital_wallet', 'phonepe', true, 5, 500),
  ('IN', 'digital_wallet', 'paytm', true, 5, 500),
  ('IN', 'digital_wallet', 'gpay', true, 5, 500),
  ('US', 'bank', NULL, true, 10, 5000),
  ('US', 'digital_wallet', 'venmo', true, 5, 1000),
  ('US', 'digital_wallet', 'paypal', true, 5, 1000),
  ('US', 'digital_wallet', 'zelle', true, 5, 2000),
  ('US', 'crypto', NULL, true, 20, 10000),
  ('PK', 'bank', NULL, true, 5, 1000),
  ('PK', 'digital_wallet', 'easypaisa', true, 5, 500),
  ('PK', 'digital_wallet', 'jazzcash', true, 5, 500)
ON CONFLICT DO NOTHING;
```

---

## Expected Outcome

After implementation:

1. **Admin Panel**:
   - Clear Deposit vs Withdrawal separation
   - Country-based withdrawal method management
   - Individual wallet brand enable/disable
   - All logos display correctly with fallbacks

2. **Buyer/Seller Wallets**:
   - Only show methods enabled by admin for their country
   - Respect min/max limits from admin config
   - All bank/wallet logos load properly
   - Consistent premium UI across both dashboards

3. **Database**:
   - New `withdrawal_method_config` table for granular control
   - Full audit trail through admin edge functions
   - Real-time sync between admin changes and user views
