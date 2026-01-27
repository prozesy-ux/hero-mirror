
# Wallet & Payment System Comprehensive Upgrade Plan

## Overview
This plan addresses:
1. Expanding country support to all 27 currencies (matching CurrencyContext)
2. Adding official logos for all banks, digital wallets, and crypto
3. Fixing missing/broken logos in the selection UI
4. Redesigning Admin Payment Settings with separate Deposit/Withdrawal sections
5. Full database connectivity for all features

---

## Phase 1: Expand digital-wallets-config.ts

### Current Issue
Only 4 countries supported: BD, IN, PK, DEFAULT

### Solution
Expand `SUPPORTED_COUNTRIES` to include all 27 currency countries with official flag images and proper country data.

**File: `src/lib/digital-wallets-config.ts`**

```text
New Countries (27 total):
┌──────────────────────────────────────────────────────────────┐
│ TOP TIER (Position 1-6):                                     │
│ 🇺🇸 USA  🇧🇩 Bangladesh  🇮🇳 India  🇵🇰 Pakistan            │
│ 🇬🇧 UK   🇨🇦 Canada                                         │
├──────────────────────────────────────────────────────────────┤
│ SECOND TIER (Position 7-15):                                 │
│ 🇪🇺 EU  🇦🇺 Australia  🇦🇪 UAE  🇸🇦 Saudi  🇳🇬 Nigeria     │
│ 🇵🇭 Philippines  🇮🇩 Indonesia  🇲🇾 Malaysia  🇻🇳 Vietnam    │
├──────────────────────────────────────────────────────────────┤
│ THIRD TIER (Position 16-27):                                 │
│ 🇹🇭 Thailand  🇪🇬 Egypt  🇰🇪 Kenya  🇿🇦 S.Africa  🇧🇷 Brazil│
│ 🇲🇽 Mexico  🇳🇵 Nepal  🇱🇰 Sri Lanka  🇯🇵 Japan  🇰🇷 Korea │
│ 🇸🇬 Singapore  🇨🇭 Switzerland  🌍 Other                    │
└──────────────────────────────────────────────────────────────┘
```

### Data Structure Updates

**New SUPPORTED_COUNTRIES array** with all 27+ countries:
- US, BD, IN, PK, GB, CA (Top tier - freelancer countries)
- EU, AU, AE, SA, NG, PH, ID, MY, VN (Second tier)
- TH, EG, KE, ZA, BR, MX, NP, LK, JP, KR, SG, CH (Third tier)
- DEFAULT for others

**Country-specific Banks & Digital Wallets:**
| Country | Banks | Digital Wallets |
|---------|-------|-----------------|
| US | Chase, Bank of America, Wells Fargo, Citi | Zelle, Venmo, PayPal, CashApp |
| GB | Barclays, HSBC, Lloyds, NatWest | Monzo, Revolut, Starling |
| CA | TD Bank, RBC, Scotiabank, BMO | Interac, PayPal CA |
| AU | CommBank, ANZ, Westpac, NAB | PayID, Osko |
| AE | Emirates NBD, ADCB, FAB, Mashreq | PayBy, UAE Pass Pay |
| SA | Al Rajhi, SNB, Riyad Bank, SABB | STC Pay, Apple Pay SA |
| NG | GTBank, First Bank, Zenith, Access | OPay, Palmpay, Kuda |
| PH | BDO, BPI, Metrobank, UnionBank | GCash, Maya (PayMaya) |
| ID | BCA, Mandiri, BNI, BRI | GoPay, OVO, Dana, ShopeePay |
| MY | Maybank, CIMB, Public Bank | Touch 'n Go, GrabPay MY |
| VN | Vietcombank, Techcombank, BIDV | MoMo, ZaloPay, VNPay |
| TH | Bangkok Bank, Kasikorn, SCB | PromptPay, TrueMoney |
| EG | CIB, NBE, Banque Misr | Fawry, Vodafone Cash |
| KE | Equity, KCB, Co-op Bank | M-Pesa, Airtel Money |
| ZA | Standard Bank, FNB, ABSA, Nedbank | SnapScan, Zapper |
| BR | Itaú, Bradesco, Nubank, Santander | Pix, PicPay |
| MX | BBVA Mexico, Banamex, Santander MX | SPEI, Mercado Pago |
| NP | Nepal Bank, NIC Asia, Nabil | Khalti, eSewa, IME Pay |
| LK | Commercial Bank, People's Bank, HNB | FriMi, eZ Cash |
| JP | MUFG, Mizuho, SMBC | PayPay, LINE Pay |
| KR | KB Kookmin, Shinhan, Woori | KakaoPay, Toss, Naver Pay |
| SG | DBS, OCBC, UOB | PayNow, GrabPay SG |
| CH | UBS, Credit Suisse, Julius Baer | TWINT |

---

## Phase 2: Add Official Logos for All Payment Methods

### Current Issue
- Some bank logos using clearbit.com (many are broken/returning 404)
- Digital wallet logos inconsistent (mix of SVG, PNG, some broken)
- Account type section uses Lucide icons instead of logos

### Solution

**Use reliable logo sources:**
1. **Primary**: `https://logo.clearbit.com/{domain}` (with fallback)
2. **Backup**: Official CDN URLs from each service
3. **Fallback**: High-quality placeholder with brand color

**Logo quality requirements:**
- Minimum 80x80px resolution
- PNG or SVG format
- White/transparent background

**Account Type Icons - Replace with branded visuals:**
```text
Current: Building2 icon, Smartphone icon, Bitcoin icon
New: Actual logos representing each type
- Bank: Bank building illustration
- Digital Wallet: Wallet logo with gradient
- Crypto: Bitcoin/USDT logos
```

---

## Phase 3: Redesign Admin Payment Settings

### Current Issue
- Single section manages both Deposit and Withdrawal
- Combined table making it confusing
- No clear separation of concerns

### New Architecture

**Split into 2 tabs/sections:**

```text
┌─────────────────────────────────────────────────────────────┐
│  [Deposit Methods]  [Withdrawal Methods]                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DEPOSIT METHODS TAB:                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Payment gateways for users to add funds                 ││
│  │ - Stripe, Razorpay, bKash, Manual                       ││
│  │ - QR codes, account details for manual payments         ││
│  │ - API keys for automatic gateways                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  WITHDRAWAL METHODS TAB:                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Payout methods for sellers/buyers to withdraw           ││
│  │ - Country-based payment methods                         ││
│  │ - Min/Max withdrawal limits                             ││
│  │ - Exchange rates                                        ││
│  │ - Enabled countries filter                              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Deposit Section Features
1. **Gateway cards** with:
   - Logo and name
   - Enable/disable toggle
   - API key configuration
   - QR code upload
   - Account details for manual
   
2. **Stats at top:**
   - Total gateways
   - Active gateways
   - Manual vs Automatic count

### Withdrawal Section Features  
1. **Country-based filtering:**
   - Select country to see available methods
   - Add country-specific payment methods
   
2. **Method cards with:**
   - Official logo
   - Method name (Bank, Wallet, Crypto)
   - Enabled countries list
   - Min/Max limits
   - Exchange rate

3. **Bulk actions:**
   - Enable/disable for all
   - Update limits in batch

---

## Phase 4: Update Wallet Components

### BuyerWallet.tsx & SellerWallet.tsx Updates

**Country Selection Step - Expanded Grid:**
```text
Current: 4 countries (2x2 grid)
New: 27+ countries (scrollable grid with search)

Layout:
┌────────────────────────────────────────────┐
│ 🔍 Search countries...                     │
├────────────────────────────────────────────┤
│ TOP COUNTRIES                              │
│ [🇺🇸 USA] [🇧🇩 BD] [🇮🇳 IN] [🇵🇰 PK]       │
│ [🇬🇧 UK]  [🇨🇦 CA]                         │
├────────────────────────────────────────────┤
│ ALL COUNTRIES (scrollable)                 │
│ [🇦🇺 AU] [🇦🇪 AE] [🇸🇦 SA] [🇳🇬 NG] ...   │
└────────────────────────────────────────────┘
```

**Account Type Selection - With Logos:**
```text
Replace Lucide icons with actual logos:
┌─────────────────────────────────────────────┐
│ [🏦 Bank]  [📱 Digital]  [₿ Crypto]        │
│  Account    Wallet                          │
│                                             │
│ Each showing relevant country-specific      │
│ logos as preview (e.g., for India:          │
│ HDFC, PhonePe, Bitcoin logos)               │
└─────────────────────────────────────────────┘
```

**Bank/Wallet Selection - Fixed Logos:**
- Use proper error handling for broken logos
- Show fallback with brand initial + color
- Ensure consistent sizing (40x40px)

---

## Phase 5: Database Integration

### Current State
- Configuration stored in `digital-wallets-config.ts` (static)
- `payment_methods` table has withdrawal settings

### Enhancement

**Use payment_methods table for dynamic configuration:**
```sql
-- Columns already exist:
- withdrawal_enabled
- min_withdrawal  
- max_withdrawal
- countries (array)
- currency_code
- exchange_rate

-- Already being fetched in wallet components
```

**Flow:**
1. Admin configures methods in PaymentSettingsManagement
2. payment_methods table updated
3. BFF APIs serve live data to wallets
4. Wallet components show real-time enabled methods

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/digital-wallets-config.ts` | Expand to 27+ countries, add all banks/wallets with proper logos |
| `src/components/dashboard/BuyerWallet.tsx` | Update country grid UI, fix logo display |
| `src/components/seller/SellerWallet.tsx` | Same as BuyerWallet |
| `src/components/admin/PaymentSettingsManagement.tsx` | Redesign with Deposit/Withdrawal tabs |

---

## Technical Implementation Details

### 1. digital-wallets-config.ts Structure

```typescript
// Expanded SUPPORTED_COUNTRIES with priority
export const SUPPORTED_COUNTRIES: Country[] = [
  // TOP 6 (priority 1-6) - Freelancer countries
  { code: 'US', name: 'United States', flag: 'https://flagcdn.com/w80/us.png', position: 1 },
  { code: 'BD', name: 'Bangladesh', flag: 'https://flagcdn.com/w80/bd.png', position: 2 },
  // ... 25 more countries
];

// Country-specific banks with reliable logo URLs
export const COUNTRY_BANKS: Record<string, Bank[]> = {
  US: [
    { code: 'chase', name: 'Chase', logo: 'https://logo.clearbit.com/chase.com', color: '#117ACA' },
    { code: 'bofa', name: 'Bank of America', logo: 'https://logo.clearbit.com/bankofamerica.com', color: '#012169' },
    // ...
  ],
  // ... other countries
};

// Country-specific digital wallets
export const DIGITAL_WALLETS: Record<string, DigitalWallet[]> = {
  US: [
    { code: 'venmo', label: 'Venmo', logo: 'https://images.ctfassets.net/.../venmo-logo.png', ... },
    { code: 'cashapp', label: 'Cash App', logo: 'https://logo.clearbit.com/cash.app', ... },
    // ...
  ],
  // ... other countries
};
```

### 2. Logo Fallback Component

```typescript
const LogoWithFallback = ({ src, alt, color }: { src: string; alt: string; color?: string }) => {
  const [error, setError] = useState(false);
  
  if (error || !src) {
    return (
      <div 
        className="w-full h-full rounded-lg flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: color || '#6366f1' }}
      >
        {alt.charAt(0)}
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className="w-full h-full object-contain"
      onError={() => setError(true)}
    />
  );
};
```

### 3. Admin Payment Tabs Structure

```typescript
type PaymentTab = 'deposit' | 'withdrawal';

// Tab navigation
<div className="flex gap-2 mb-6">
  <button onClick={() => setActiveTab('deposit')} 
    className={activeTab === 'deposit' ? 'bg-emerald-500' : 'bg-white/10'}>
    <ArrowUpCircle /> Deposit Methods
  </button>
  <button onClick={() => setActiveTab('withdrawal')}
    className={activeTab === 'withdrawal' ? 'bg-violet-500' : 'bg-white/10'}>
    <ArrowDownCircle /> Withdrawal Methods
  </button>
</div>

// Conditional rendering based on tab
{activeTab === 'deposit' && <DepositMethodsSection />}
{activeTab === 'withdrawal' && <WithdrawalMethodsSection />}
```

---

## Expected Outcome

After implementation:
- 27+ countries selectable when adding payment account
- All banks and digital wallets have official logos
- Broken logos replaced with styled fallbacks
- Admin panel has clear Deposit vs Withdrawal sections
- Everything synced with database in real-time
- Consistent styling across Buyer and Seller dashboards
