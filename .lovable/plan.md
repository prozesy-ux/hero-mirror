
# Currency Display & Selection for Seller Dashboard

## Problem Summary

The seller dashboard currently displays all monetary values with a **"$" symbol in USD**, but the actual values stored are in USD while the user sees the "$" prefix. You want to add a **currency selector** that:

1. Uses **USD as the base/primary currency** (all values stored in USD)
2. Allows sellers to **select their display currency** (e.g., INR)
3. Converts values using **exchange rates from Google** (currently managed via `payment_methods.exchange_rate` in admin)
4. Mirrors the buyer dashboard's currency selection behavior
5. Defaults based on **seller's country**

---

## Current State Analysis

### How Exchange Rates Work Now
- Exchange rates are stored in `payment_methods` table: INR = 91, BDT = 121, PKR = 290
- Admin manages these via `PaymentSettingsManagement.tsx`
- Used in `BillingSection.tsx` for top-up conversions
- Used in `SellerWallet.tsx` for withdrawal amount display

### Where Currency is Displayed (Seller)
| Component | Current Display | Issue |
|-----------|----------------|-------|
| `SellerTopBar.tsx` | `$XX.XX` | Hardcoded $ |
| `SellerMobileHeader.tsx` | `$XX.XX` | Hardcoded $ |
| `SellerDashboard.tsx` | `$XXX` | Hardcoded $ |
| `SellerWallet.tsx` | `$XX.XX` | Hardcoded $ |
| `SellerAnalytics.tsx` | `$XX.XX` | Hardcoded $ |
| `SellerProducts.tsx` | `$XX.XX` | Hardcoded $ |
| `SellerOrders.tsx` | `$XX.XX` | Hardcoded $ |

---

## Implementation Plan

### Phase 1: Create Currency Context & Hook

**File: `src/contexts/CurrencyContext.tsx`** (new)

Create a shared currency context that:
- Stores selected display currency (default: USD)
- Fetches exchange rates from `payment_methods` table
- Provides conversion helper functions
- Persists selection in `localStorage`
- Auto-detects default based on seller country

```text
+-------------------+
|  CurrencyContext  |
+-------------------+
| - selectedCurrency: string (USD, INR, BDT, PKR)
| - exchangeRates: Map<string, number>
| - formatAmount(usd): string
| - setDisplayCurrency(code): void
+-------------------+
```

### Phase 2: Currency Selector Component

**File: `src/components/ui/currency-selector.tsx`** (new)

A dropdown selector showing:
- Currency code and symbol
- Flag or icon (optional)
- Current exchange rate

Placed in:
- `SellerTopBar.tsx` (desktop header)
- `SellerMobileHeader.tsx` (mobile header)

### Phase 3: Update Display Components

Replace hardcoded `$` symbols with dynamic formatting:

| File | Change |
|------|--------|
| `SellerTopBar.tsx` | Add currency selector, use `formatAmount()` |
| `SellerMobileHeader.tsx` | Add currency selector, use `formatAmount()` |
| `SellerDashboard.tsx` | Convert all $ displays to `formatAmount()` |
| `SellerWallet.tsx` | Convert balance/withdrawal displays |
| `SellerAnalytics.tsx` | Convert chart tooltips and stats |
| `SellerProducts.tsx` | Convert product prices |
| `SellerOrders.tsx` | Convert order amounts |

### Phase 4: Add to SellerContext

Update `SellerContext.tsx` to:
- Include seller's country for default currency detection
- Integrate with CurrencyContext

### Phase 5: Sync Exchange Rates

The admin panel already manages exchange rates in `payment_methods`. These will be fetched by the CurrencyContext and used for conversions.

---

## Technical Details

### Currency Options
```javascript
const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 91 },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rate: 121 },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', rate: 290 }
];
```

### Format Function Example
```javascript
const formatAmount = (usdAmount: number): string => {
  const rate = exchangeRates[selectedCurrency] || 1;
  const symbol = currencySymbols[selectedCurrency] || '$';
  const converted = usdAmount * rate;
  
  // Round for non-USD currencies
  if (selectedCurrency === 'USD') {
    return `${symbol}${converted.toFixed(2)}`;
  }
  return `${symbol}${Math.round(converted).toLocaleString()}`;
};
```

### Country to Currency Mapping
```javascript
const COUNTRY_CURRENCY_MAP = {
  'IN': 'INR',
  'BD': 'BDT', 
  'PK': 'PKR',
  'DEFAULT': 'USD'
};
```

---

## Files to Create
1. `src/contexts/CurrencyContext.tsx`
2. `src/components/ui/currency-selector.tsx`

## Files to Modify
1. `src/contexts/SellerContext.tsx` - Add country field
2. `src/components/seller/SellerTopBar.tsx` - Add selector, update display
3. `src/components/seller/SellerMobileHeader.tsx` - Add selector, update display
4. `src/components/seller/SellerDashboard.tsx` - Update all amount displays
5. `src/components/seller/SellerWallet.tsx` - Update balance displays
6. `src/components/seller/SellerAnalytics.tsx` - Update chart/stats
7. `src/components/seller/SellerProducts.tsx` - Update price displays
8. `src/components/seller/SellerOrders.tsx` - Update order amounts
9. `src/pages/Seller.tsx` - Wrap with CurrencyProvider

---

## User Experience

1. Seller opens dashboard - sees amounts in their **country's default currency** (auto-detected)
2. Currency selector in header shows current selection with dropdown
3. All amounts across dashboard convert instantly when currency changes
4. Selection persists across sessions via localStorage
5. Original USD values shown as secondary (e.g., "₹9,100 (~$100)")
