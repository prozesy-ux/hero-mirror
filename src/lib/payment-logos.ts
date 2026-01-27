// Central payment logo registry with fallback colors
// Uses hybrid approach: external CDN URLs + fallback brand colors

export interface LogoConfig {
  url: string;
  color: string;
  name?: string;
}

// Clearbit Logo API base URL
const CLEARBIT_BASE = 'https://logo.clearbit.com';

// Helper to create Clearbit URL
const cb = (domain: string) => `${CLEARBIT_BASE}/${domain}`;

export const PAYMENT_LOGOS: Record<string, LogoConfig> = {
  // ============================================
  // DIGITAL WALLETS - BANGLADESH
  // ============================================
  'bkash': { 
    url: 'https://www.bkash.com/sites/default/files/bKash_Logo.png', 
    color: '#E2136E',
    name: 'bKash'
  },
  'nagad': { 
    url: 'https://nagad.com.bd/wp-content/uploads/2019/07/nagad-icon.png', 
    color: '#FF6A00',
    name: 'Nagad'
  },
  'rocket': { 
    url: 'https://www.dutchbanglabank.com/img/rocket/Rocket.png', 
    color: '#8B2C92',
    name: 'Rocket'
  },
  'upay': { 
    url: cb('upaybd.com'), 
    color: '#00A884',
    name: 'Upay'
  },
  'tap': { 
    url: cb('tapbd.com'), 
    color: '#1E88E5',
    name: 'Tap'
  },
  'surecash': { 
    url: cb('surecash.net'), 
    color: '#00BCD4',
    name: 'SureCash'
  },

  // ============================================
  // DIGITAL WALLETS - INDIA
  // ============================================
  'phonepe': { 
    url: cb('phonepe.com'), 
    color: '#5F259F',
    name: 'PhonePe'
  },
  'paytm': { 
    url: cb('paytm.com'), 
    color: '#00BAF2',
    name: 'Paytm'
  },
  'gpay': { 
    url: cb('pay.google.com'), 
    color: '#4285F4',
    name: 'Google Pay'
  },
  'amazonpay': { 
    url: cb('pay.amazon.com'), 
    color: '#FF9900',
    name: 'Amazon Pay'
  },
  'mobikwik': { 
    url: cb('mobikwik.com'), 
    color: '#00BFFF',
    name: 'MobiKwik'
  },
  'freecharge': { 
    url: cb('freecharge.in'), 
    color: '#7B68EE',
    name: 'FreeCharge'
  },
  'bhim': { 
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/BHIM_Logo.png', 
    color: '#00587A',
    name: 'BHIM UPI'
  },

  // ============================================
  // DIGITAL WALLETS - PAKISTAN
  // ============================================
  'easypaisa': { 
    url: cb('easypaisa.com.pk'), 
    color: '#00A651',
    name: 'EasyPaisa'
  },
  'jazzcash': { 
    url: cb('jazzcash.com.pk'), 
    color: '#ED1C24',
    name: 'JazzCash'
  },
  'sadapay': { 
    url: cb('sadapay.pk'), 
    color: '#6366F1',
    name: 'SadaPay'
  },
  'nayapay': { 
    url: cb('nayapay.com'), 
    color: '#00C853',
    name: 'NayaPay'
  },
  'upaisa': { 
    url: cb('ufone.com'), 
    color: '#E91E63',
    name: 'UPaisa'
  },

  // ============================================
  // DIGITAL WALLETS - USA
  // ============================================
  'venmo': { 
    url: cb('venmo.com'), 
    color: '#3D95CE',
    name: 'Venmo'
  },
  'paypal': { 
    url: cb('paypal.com'), 
    color: '#003087',
    name: 'PayPal'
  },
  'zelle': { 
    url: cb('zellepay.com'), 
    color: '#6D1ED4',
    name: 'Zelle'
  },
  'cashapp': { 
    url: cb('cash.app'), 
    color: '#00D632',
    name: 'Cash App'
  },
  'applepay': { 
    url: cb('apple.com'), 
    color: '#000000',
    name: 'Apple Pay'
  },
  'googlepay': { 
    url: cb('pay.google.com'), 
    color: '#4285F4',
    name: 'Google Pay'
  },

  // ============================================
  // DIGITAL WALLETS - UK/EUROPE
  // ============================================
  'revolut': { 
    url: cb('revolut.com'), 
    color: '#0075EB',
    name: 'Revolut'
  },
  'wise': { 
    url: cb('wise.com'), 
    color: '#9FE870',
    name: 'Wise'
  },
  'monzo': { 
    url: cb('monzo.com'), 
    color: '#FF5C5C',
    name: 'Monzo'
  },
  'n26': { 
    url: cb('n26.com'), 
    color: '#36A18B',
    name: 'N26'
  },
  'klarna': { 
    url: cb('klarna.com'), 
    color: '#FFB3C7',
    name: 'Klarna'
  },
  'skrill': { 
    url: cb('skrill.com'), 
    color: '#862165',
    name: 'Skrill'
  },
  'neteller': { 
    url: cb('neteller.com'), 
    color: '#7AB800',
    name: 'Neteller'
  },

  // ============================================
  // DIGITAL WALLETS - SOUTHEAST ASIA
  // ============================================
  'gcash': { 
    url: cb('gcash.com'), 
    color: '#007DFE',
    name: 'GCash'
  },
  'maya': { 
    url: cb('maya.ph'), 
    color: '#00D66E',
    name: 'Maya'
  },
  'grabpay': { 
    url: cb('grab.com'), 
    color: '#00B14F',
    name: 'GrabPay'
  },
  'dana': { 
    url: cb('dana.id'), 
    color: '#118EEA',
    name: 'DANA'
  },
  'ovo': { 
    url: cb('ovo.id'), 
    color: '#4C3494',
    name: 'OVO'
  },
  'gopay': { 
    url: cb('gojek.com'), 
    color: '#00AA13',
    name: 'GoPay'
  },
  'shopeepay': { 
    url: cb('shopee.com'), 
    color: '#EE4D2D',
    name: 'ShopeePay'
  },
  'touchngo': { 
    url: cb('touchngo.com.my'), 
    color: '#005ABB',
    name: 'Touch n Go'
  },
  'boost': { 
    url: cb('myboost.com.my'), 
    color: '#EF3340',
    name: 'Boost'
  },

  // ============================================
  // DIGITAL WALLETS - AFRICA
  // ============================================
  'opay': { 
    url: cb('opayweb.com'), 
    color: '#1DC06D',
    name: 'OPay'
  },
  'palmpay': { 
    url: cb('palmpay.com'), 
    color: '#5D3FD3',
    name: 'PalmPay'
  },
  'kuda': { 
    url: cb('kuda.com'), 
    color: '#40196D',
    name: 'Kuda'
  },
  'mpesa': { 
    url: cb('safaricom.co.ke'), 
    color: '#4CAF50',
    name: 'M-Pesa'
  },
  'flutterwave': { 
    url: cb('flutterwave.com'), 
    color: '#F5A623',
    name: 'Flutterwave'
  },
  'chipper': { 
    url: cb('chippercash.com'), 
    color: '#6C5CE7',
    name: 'Chipper Cash'
  },

  // ============================================
  // CRYPTO
  // ============================================
  'bitcoin': { 
    url: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', 
    color: '#F7931A',
    name: 'Bitcoin'
  },
  'ethereum': { 
    url: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', 
    color: '#627EEA',
    name: 'Ethereum'
  },
  'usdt': { 
    url: 'https://cryptologos.cc/logos/tether-usdt-logo.png', 
    color: '#26A17B',
    name: 'USDT'
  },
  'usdc': { 
    url: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', 
    color: '#2775CA',
    name: 'USDC'
  },
  'bnb': { 
    url: 'https://cryptologos.cc/logos/bnb-bnb-logo.png', 
    color: '#F3BA2F',
    name: 'BNB'
  },
  'solana': { 
    url: 'https://cryptologos.cc/logos/solana-sol-logo.png', 
    color: '#9945FF',
    name: 'Solana'
  },
  'litecoin': { 
    url: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png', 
    color: '#BFBBBB',
    name: 'Litecoin'
  },
  'tron': { 
    url: 'https://cryptologos.cc/logos/tron-trx-logo.png', 
    color: '#EF0027',
    name: 'TRON'
  },

  // ============================================
  // PAYMENT GATEWAYS (DEPOSIT)
  // ============================================
  'stripe': { 
    url: cb('stripe.com'), 
    color: '#635BFF',
    name: 'Stripe'
  },
  'razorpay': { 
    url: cb('razorpay.com'), 
    color: '#0080FF',
    name: 'Razorpay'
  },
  'paystack': { 
    url: cb('paystack.com'), 
    color: '#00C3F7',
    name: 'Paystack'
  },
  'payu': { 
    url: cb('payu.com'), 
    color: '#8CC63F',
    name: 'PayU'
  },
  'sslcommerz': { 
    url: cb('sslcommerz.com'), 
    color: '#00B7C4',
    name: 'SSLCommerz'
  },

  // ============================================
  // BANKS - BANGLADESH
  // ============================================
  'brac': { 
    url: cb('bracbank.com'), 
    color: '#003366',
    name: 'BRAC Bank'
  },
  'dbbl': { 
    url: cb('dutchbanglabank.com'), 
    color: '#00843D',
    name: 'Dutch-Bangla Bank'
  },
  'city': { 
    url: cb('thecitybank.com'), 
    color: '#004B87',
    name: 'City Bank'
  },
  'ebl': { 
    url: cb('ebl.com.bd'), 
    color: '#E31937',
    name: 'Eastern Bank'
  },
  'scb_bd': { 
    url: cb('sc.com'), 
    color: '#0072AA',
    name: 'Standard Chartered BD'
  },
  'islami': { 
    url: cb('islamibankbd.com'), 
    color: '#006341',
    name: 'Islami Bank'
  },

  // ============================================
  // BANKS - INDIA
  // ============================================
  'hdfc': { 
    url: cb('hdfcbank.com'), 
    color: '#004C8F',
    name: 'HDFC Bank'
  },
  'icici': { 
    url: cb('icicibank.com'), 
    color: '#F58220',
    name: 'ICICI Bank'
  },
  'sbi': { 
    url: cb('sbi.co.in'), 
    color: '#1F4E79',
    name: 'State Bank of India'
  },
  'axis': { 
    url: cb('axisbank.com'), 
    color: '#97144D',
    name: 'Axis Bank'
  },
  'kotak': { 
    url: cb('kotak.com'), 
    color: '#ED1C24',
    name: 'Kotak Mahindra'
  },
  'pnb': { 
    url: cb('pnbindia.in'), 
    color: '#E31837',
    name: 'Punjab National Bank'
  },

  // ============================================
  // BANKS - USA
  // ============================================
  'chase': { 
    url: cb('chase.com'), 
    color: '#117ACA',
    name: 'Chase'
  },
  'bofa': { 
    url: cb('bankofamerica.com'), 
    color: '#012169',
    name: 'Bank of America'
  },
  'wellsfargo': { 
    url: cb('wellsfargo.com'), 
    color: '#D71E28',
    name: 'Wells Fargo'
  },
  'citi': { 
    url: cb('citi.com'), 
    color: '#003B70',
    name: 'Citibank'
  },
  'usbank': { 
    url: cb('usbank.com'), 
    color: '#0F3C6E',
    name: 'US Bank'
  },
  'capitalone': { 
    url: cb('capitalone.com'), 
    color: '#004977',
    name: 'Capital One'
  },

  // ============================================
  // BANKS - UK
  // ============================================
  'barclays': { 
    url: cb('barclays.co.uk'), 
    color: '#00AEEF',
    name: 'Barclays'
  },
  'hsbc': { 
    url: cb('hsbc.com'), 
    color: '#DB0011',
    name: 'HSBC'
  },
  'lloyds': { 
    url: cb('lloydsbank.com'), 
    color: '#024731',
    name: 'Lloyds Bank'
  },
  'natwest': { 
    url: cb('natwest.com'), 
    color: '#42145F',
    name: 'NatWest'
  },
  'santander_uk': { 
    url: cb('santander.co.uk'), 
    color: '#EC0000',
    name: 'Santander UK'
  },

  // ============================================
  // BANKS - PAKISTAN
  // ============================================
  'hbl': { 
    url: cb('hbl.com'), 
    color: '#00843D',
    name: 'Habib Bank'
  },
  'ubl': { 
    url: cb('ubl.com.pk'), 
    color: '#E31B23',
    name: 'United Bank'
  },
  'mcb': { 
    url: cb('mcb.com.pk'), 
    color: '#003A70',
    name: 'MCB Bank'
  },
  'alfalah': { 
    url: cb('bankalfalah.com'), 
    color: '#005596',
    name: 'Bank Alfalah'
  },
  'meezan': { 
    url: cb('meezanbank.com'), 
    color: '#006747',
    name: 'Meezan Bank'
  },

  // ============================================
  // GENERIC/FALLBACK
  // ============================================
  'bank': { 
    url: '', 
    color: '#1E3A5F',
    name: 'Bank Transfer'
  },
  'digital_wallet': { 
    url: '', 
    color: '#6366F1',
    name: 'Digital Wallet'
  },
  'crypto': { 
    url: '', 
    color: '#F59E0B',
    name: 'Cryptocurrency'
  },
  'manual': { 
    url: '', 
    color: '#64748B',
    name: 'Manual Transfer'
  },
};

/**
 * Get logo config for a payment method code
 * Falls back to a generic config if not found
 */
export const getPaymentLogo = (code: string): LogoConfig => {
  const lowerCode = code.toLowerCase().replace(/[^a-z0-9]/g, '');
  return PAYMENT_LOGOS[lowerCode] || {
    url: '',
    color: '#6366F1',
    name: code
  };
};

/**
 * Country configuration for withdrawal methods
 */
export const COUNTRY_CONFIG: Record<string, { name: string; flag: string; currency: string; currencySymbol: string }> = {
  'BD': { name: 'Bangladesh', flag: '🇧🇩', currency: 'BDT', currencySymbol: '৳' },
  'IN': { name: 'India', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹' },
  'PK': { name: 'Pakistan', flag: '🇵🇰', currency: 'PKR', currencySymbol: '₨' },
  'US': { name: 'United States', flag: '🇺🇸', currency: 'USD', currencySymbol: '$' },
  'GB': { name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£' },
  'CA': { name: 'Canada', flag: '🇨🇦', currency: 'CAD', currencySymbol: 'C$' },
  'AU': { name: 'Australia', flag: '🇦🇺', currency: 'AUD', currencySymbol: 'A$' },
  'DE': { name: 'Germany', flag: '🇩🇪', currency: 'EUR', currencySymbol: '€' },
  'FR': { name: 'France', flag: '🇫🇷', currency: 'EUR', currencySymbol: '€' },
  'IT': { name: 'Italy', flag: '🇮🇹', currency: 'EUR', currencySymbol: '€' },
  'ES': { name: 'Spain', flag: '🇪🇸', currency: 'EUR', currencySymbol: '€' },
  'NL': { name: 'Netherlands', flag: '🇳🇱', currency: 'EUR', currencySymbol: '€' },
  'PH': { name: 'Philippines', flag: '🇵🇭', currency: 'PHP', currencySymbol: '₱' },
  'ID': { name: 'Indonesia', flag: '🇮🇩', currency: 'IDR', currencySymbol: 'Rp' },
  'MY': { name: 'Malaysia', flag: '🇲🇾', currency: 'MYR', currencySymbol: 'RM' },
  'SG': { name: 'Singapore', flag: '🇸🇬', currency: 'SGD', currencySymbol: 'S$' },
  'TH': { name: 'Thailand', flag: '🇹🇭', currency: 'THB', currencySymbol: '฿' },
  'VN': { name: 'Vietnam', flag: '🇻🇳', currency: 'VND', currencySymbol: '₫' },
  'NG': { name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', currencySymbol: '₦' },
  'KE': { name: 'Kenya', flag: '🇰🇪', currency: 'KES', currencySymbol: 'KSh' },
  'ZA': { name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', currencySymbol: 'R' },
  'GH': { name: 'Ghana', flag: '🇬🇭', currency: 'GHS', currencySymbol: '₵' },
  'EG': { name: 'Egypt', flag: '🇪🇬', currency: 'EGP', currencySymbol: 'E£' },
  'AE': { name: 'UAE', flag: '🇦🇪', currency: 'AED', currencySymbol: 'د.إ' },
  'SA': { name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', currencySymbol: '﷼' },
  'TR': { name: 'Turkey', flag: '🇹🇷', currency: 'TRY', currencySymbol: '₺' },
  'BR': { name: 'Brazil', flag: '🇧🇷', currency: 'BRL', currencySymbol: 'R$' },
  'MX': { name: 'Mexico', flag: '🇲🇽', currency: 'MXN', currencySymbol: '$' },
  'JP': { name: 'Japan', flag: '🇯🇵', currency: 'JPY', currencySymbol: '¥' },
  'KR': { name: 'South Korea', flag: '🇰🇷', currency: 'KRW', currencySymbol: '₩' },
  'CN': { name: 'China', flag: '🇨🇳', currency: 'CNY', currencySymbol: '¥' },
  'GLOBAL': { name: 'Global', flag: '🌍', currency: 'USD', currencySymbol: '$' },
};

export const ACCOUNT_TYPES = [
  { code: 'bank', label: 'Bank Account', icon: 'Building2', color: '#1E3A5F' },
  { code: 'digital_wallet', label: 'Digital Wallet', icon: 'Wallet', color: '#6366F1' },
  { code: 'crypto', label: 'Cryptocurrency', icon: 'Bitcoin', color: '#F59E0B' },
] as const;

export type AccountType = typeof ACCOUNT_TYPES[number]['code'];
