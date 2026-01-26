
# Enhanced Payment Account System with Country-Based Withdrawal Methods

## Overview
Transform the "Add Payment Account" flow to include:
1. **Country Selection First** - Users select their country (with country flag logos, sorted by position)
2. **Country-Specific Withdrawal Methods** - Show Bank Account, Digital Wallet, Crypto based on selected country
3. **Comprehensive Bank Lists** - All major banks per country with official logos
4. **Enhanced Digital Wallet UI** - Updated number field overlays with wallet-specific formatting
5. **Admin Panel Integration** - Manage all banks, wallets, and countries from Payment Settings

---

## Implementation Plan

### Phase 1: Enhance Digital Wallets Config

**File: `src/lib/digital-wallets-config.ts`**

Add new exports:
- `SUPPORTED_COUNTRIES` - List of countries with flags, codes, and sort position
- `COUNTRY_BANKS` - Comprehensive bank lists per country with official logos
- Country flag URLs for Bangladesh, India, Pakistan, and global option

```text
SUPPORTED_COUNTRIES:
┌─────────────────────────────────────────────────────────┐
│  Position │  Code │  Name        │  Flag Logo         │
├─────────────────────────────────────────────────────────┤
│     1     │  BD   │  Bangladesh  │  [BD Flag]         │
│     2     │  IN   │  India       │  [IN Flag]         │
│     3     │  PK   │  Pakistan    │  [PK Flag]         │
│     4     │  DEFAULT │ Global    │  [Globe Icon]      │
└─────────────────────────────────────────────────────────┘

COUNTRY_BANKS (per country - minimum 10-15 major banks each):
Bangladesh: Sonali Bank, Janata Bank, Agrani Bank, BRAC Bank, Dutch Bangla Bank, Eastern Bank, Prime Bank, City Bank, Islami Bank, Pubali Bank, etc.
India: SBI, HDFC, ICICI, Axis, Kotak, Punjab National, Bank of Baroda, Canara Bank, etc.
Pakistan: HBL, UBL, MCB, Allied Bank, Bank Alfalah, National Bank of Pakistan, etc.
```

---

### Phase 2: Update Add Account Modal Flow

**Files: `BuyerWallet.tsx` and `SellerWallet.tsx`**

Change the flow to a 4-tier system:

**Step 0: Select Country (NEW STEP)**
```text
┌─────────────────────────────────────────────────────────┐
│  Select Your Country                                    │
├─────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ [BD Flag]  │  │ [IN Flag]  │  │ [PK Flag]  │       │
│  │ Bangladesh │  │   India    │  │  Pakistan  │       │
│  └────────────┘  └────────────┘  └────────────┘       │
│                  ┌────────────┐                        │
│                  │ [Globe]    │                        │
│                  │   Other    │                        │
│                  └────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

**Step 1: Select Account Type (existing)**
- Bank Account (with country-specific bank logo)
- Digital Wallet (with wallet icon)
- Crypto (with crypto icon)

**Step 2: If Bank Account selected - Show Country Banks**
```text
┌─────────────────────────────────────────────────────────┐
│  Select Bank (Bangladesh)                               │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ [Logo]      │  │ [Logo]      │  │ [Logo]      │    │
│  │ BRAC Bank   │  │ Dutch Bangla│  │ Eastern Bank│    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ [Logo]      │  │ [Logo]      │  │ [Logo]      │    │
│  │ City Bank   │  │ Prime Bank  │  │ Islami Bank │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│  ... more banks ...                                    │
│  ┌──────────────────────────────────────────────────┐ │
│  │ [+] Other Bank (enter manually)                  │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Step 3: If Digital Wallet selected - Show Country Wallets (existing)**

**Step 4: Enter Account Details (existing but enhanced)**
- Digital wallet number field shows formatted overlay like "bKash Number (01XXXXXXXXX)"
- Bank account shows selected bank logo and name

---

### Phase 3: Bank Configuration

Add comprehensive bank data to config file:

**Bangladesh Banks (15+ banks):**
- Sonali Bank, Janata Bank, Agrani Bank, Rupali Bank
- BRAC Bank, Dutch-Bangla Bank, Eastern Bank, City Bank
- Prime Bank, Islami Bank Bangladesh, Pubali Bank
- Mutual Trust Bank, Standard Chartered BD, HSBC BD
- Bank Asia, ONE Bank, Dhaka Bank

**India Banks (15+ banks):**
- State Bank of India, HDFC Bank, ICICI Bank, Axis Bank
- Kotak Mahindra, Punjab National Bank, Bank of Baroda
- Canara Bank, Union Bank, Indian Bank, Central Bank
- Bank of India, Indian Overseas Bank, IDBI Bank, Yes Bank

**Pakistan Banks (12+ banks):**
- Habib Bank Limited (HBL), United Bank Limited (UBL)
- MCB Bank, Allied Bank, Bank Alfalah
- National Bank of Pakistan, Standard Chartered PK
- Meezan Bank, Faysal Bank, Askari Bank
- Bank Al Habib, Habib Metropolitan Bank

**Global Banks:**
- Wise, Payoneer (for international transfers)
- Wells Fargo, Chase, Bank of America (US)
- Barclays, HSBC (UK)

---

### Phase 4: Digital Wallet Number Field Enhancement

Update the digital wallet input fields to show contextual overlays:

| Wallet | Input Label | Placeholder |
|--------|-------------|-------------|
| bKash | bKash Number | 01XXXXXXXXX |
| Nagad | Nagad Number | 01XXXXXXXXX |
| Rocket | Rocket Number | 01XXXXXXXXX |
| PhonePe | PhonePe UPI ID | name@ybl |
| Google Pay | UPI ID / Phone | name@okaxis |
| Paytm | Paytm UPI ID | name@paytm |
| JazzCash | JazzCash Number | 03XXXXXXXXX |
| Easypaisa | Easypaisa Number | 03XXXXXXXXX |

---

### Phase 5: Admin Panel Enhancement

**File: `PaymentSettingsManagement.tsx`**

Add new sections:

1. **Country Management Tab**
   - Enable/disable countries
   - Set country display order
   - Upload country flag logos

2. **Banks Management Section**
   - Add/edit banks per country
   - Upload bank logos
   - Set bank display order
   - Enable/disable specific banks

3. **Digital Wallets Section** (rename from "bKash/UPI")
   - Manage wallet display per country
   - Upload wallet logos
   - Configure wallet-specific number formats

---

### Phase 6: Database Considerations

Create new database table for country-specific banks (optional future enhancement):

```sql
-- For now, use static config in TypeScript
-- Future: Create admin_bank_configs table
-- This allows admin to manage banks without code changes
```

For MVP, we use static TypeScript configuration which is:
- Faster to implement
- No database overhead
- Easy to maintain
- Can be migrated to database later

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/digital-wallets-config.ts` | MODIFY | Add SUPPORTED_COUNTRIES, COUNTRY_BANKS with logos |
| `src/components/dashboard/BuyerWallet.tsx` | MODIFY | Add country selection step, bank selection, enhanced UI |
| `src/components/seller/SellerWallet.tsx` | MODIFY | Same changes as BuyerWallet |
| `src/components/admin/PaymentSettingsManagement.tsx` | MODIFY | Add banks/wallets/countries management section |

---

### Technical Notes

1. **Country Flags**: Use high-quality flag icons from CDN (flagcdn.com or similar)
2. **Bank Logos**: Use official logo URLs from bank websites or logo databases
3. **Sorting**: Countries and banks sorted by `position` field for admin control
4. **"Other Bank" Option**: Always available for custom bank entry
5. **Backwards Compatibility**: Existing saved accounts continue to work
6. **Mobile Responsive**: Grid layouts adjust for mobile (2 cols) vs desktop (3+ cols)

---

### Testing Checklist

- Country selection shows flags sorted by position
- Selecting Bangladesh shows BD banks and digital wallets
- Selecting India shows IN banks and digital wallets  
- Selecting Pakistan shows PK banks and digital wallets
- Selecting Other/Global shows international options
- Bank selection shows official logos
- Digital wallet number fields show correct format overlays
- Admin can manage countries, banks, and wallets from settings
- Existing saved accounts display correctly
