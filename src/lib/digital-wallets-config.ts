/**
 * Digital Wallets & Banks Configuration
 * Country-based payment support with official branding
 */

export type AccountType = 'bank' | 'digital_wallet' | 'crypto';
export type AddAccountStep = 'country' | 'type' | 'bank' | 'wallet' | 'details';

export interface Country {
  code: string;
  name: string;
  flag: string;
  position: number;
}

export interface Bank {
  code: string;
  name: string;
  logo: string;
  color: string;
}

export interface DigitalWallet {
  code: string;
  label: string;
  logo: string;
  color: string;
  bgColor: string;
  inputLabel: string;
  placeholder: string;
}

export interface AccountTypeConfig {
  code: AccountType;
  label: string;
  icon: string;
  description: string;
}

// Supported countries with flags sorted by position
export const SUPPORTED_COUNTRIES: Country[] = [
  {
    code: 'BD',
    name: 'Bangladesh',
    flag: 'https://flagcdn.com/w80/bd.png',
    position: 1
  },
  {
    code: 'IN',
    name: 'India',
    flag: 'https://flagcdn.com/w80/in.png',
    position: 2
  },
  {
    code: 'PK',
    name: 'Pakistan',
    flag: 'https://flagcdn.com/w80/pk.png',
    position: 3
  },
  {
    code: 'DEFAULT',
    name: 'Other Countries',
    flag: 'https://cdn-icons-png.flaticon.com/512/814/814513.png',
    position: 4
  }
];

// Account type categories
export const ACCOUNT_TYPES: AccountTypeConfig[] = [
  {
    code: 'bank',
    label: 'Bank Account',
    icon: 'bank',
    description: 'Traditional bank transfer'
  },
  {
    code: 'digital_wallet',
    label: 'Digital Wallet',
    icon: 'wallet',
    description: 'Mobile money & e-wallets'
  },
  {
    code: 'crypto',
    label: 'Crypto',
    icon: 'crypto',
    description: 'Cryptocurrency wallet'
  }
];

// Comprehensive bank lists per country with official logos
export const COUNTRY_BANKS: Record<string, Bank[]> = {
  // Bangladesh Banks (15+ major banks)
  BD: [
    { code: 'brac', name: 'BRAC Bank', logo: 'https://logo.clearbit.com/bracbank.com', color: '#003366' },
    { code: 'dbbl', name: 'Dutch-Bangla Bank', logo: 'https://logo.clearbit.com/dutchbanglabank.com', color: '#00843D' },
    { code: 'ebl', name: 'Eastern Bank', logo: 'https://logo.clearbit.com/ebl.com.bd', color: '#005BAC' },
    { code: 'city', name: 'City Bank', logo: 'https://logo.clearbit.com/thecitybank.com', color: '#ED1C24' },
    { code: 'prime', name: 'Prime Bank', logo: 'https://logo.clearbit.com/primebank.com.bd', color: '#00529B' },
    { code: 'islami', name: 'Islami Bank Bangladesh', logo: 'https://logo.clearbit.com/islamibankbd.com', color: '#00594F' },
    { code: 'pubali', name: 'Pubali Bank', logo: 'https://logo.clearbit.com/pubalibankbd.com', color: '#00467F' },
    { code: 'mtb', name: 'Mutual Trust Bank', logo: 'https://logo.clearbit.com/mutualtrustbank.com', color: '#0072BC' },
    { code: 'ucb', name: 'United Commercial Bank', logo: 'https://logo.clearbit.com/ucb.com.bd', color: '#003366' },
    { code: 'ncc', name: 'NCC Bank', logo: 'https://logo.clearbit.com/nccbank.com.bd', color: '#0054A6' },
    { code: 'sonali', name: 'Sonali Bank', logo: 'https://logo.clearbit.com/sonalibank.com.bd', color: '#CD212A' },
    { code: 'janata', name: 'Janata Bank', logo: 'https://logo.clearbit.com/jb.com.bd', color: '#1D4F91' },
    { code: 'agrani', name: 'Agrani Bank', logo: 'https://logo.clearbit.com/agranibank.org', color: '#00843D' },
    { code: 'rupali', name: 'Rupali Bank', logo: 'https://logo.clearbit.com/rupalibank.org', color: '#0072CE' },
    { code: 'scbd', name: 'Standard Chartered BD', logo: 'https://logo.clearbit.com/sc.com', color: '#0072AA' },
    { code: 'hsbc_bd', name: 'HSBC Bangladesh', logo: 'https://logo.clearbit.com/hsbc.com', color: '#DB0011' },
    { code: 'bankasia', name: 'Bank Asia', logo: 'https://logo.clearbit.com/bankasia.com.bd', color: '#005695' },
    { code: 'onebank', name: 'ONE Bank', logo: 'https://logo.clearbit.com/onebank.com.bd', color: '#ED1C24' },
    { code: 'dhaka', name: 'Dhaka Bank', logo: 'https://logo.clearbit.com/dhakabank.com.bd', color: '#005596' },
    { code: 'ab', name: 'AB Bank', logo: 'https://logo.clearbit.com/abbl.com', color: '#003B71' },
  ],
  
  // India Banks (15+ major banks)
  IN: [
    { code: 'sbi', name: 'State Bank of India', logo: 'https://logo.clearbit.com/sbi.co.in', color: '#22409A' },
    { code: 'hdfc', name: 'HDFC Bank', logo: 'https://logo.clearbit.com/hdfcbank.com', color: '#004C8F' },
    { code: 'icici', name: 'ICICI Bank', logo: 'https://logo.clearbit.com/icicibank.com', color: '#F58220' },
    { code: 'axis', name: 'Axis Bank', logo: 'https://logo.clearbit.com/axisbank.com', color: '#800000' },
    { code: 'kotak', name: 'Kotak Mahindra Bank', logo: 'https://logo.clearbit.com/kotak.com', color: '#ED1C24' },
    { code: 'pnb', name: 'Punjab National Bank', logo: 'https://logo.clearbit.com/pnbindia.in', color: '#EA5B0C' },
    { code: 'bob', name: 'Bank of Baroda', logo: 'https://logo.clearbit.com/bankofbaroda.in', color: '#F47920' },
    { code: 'canara', name: 'Canara Bank', logo: 'https://logo.clearbit.com/canarabank.com', color: '#F9A61A' },
    { code: 'union', name: 'Union Bank of India', logo: 'https://logo.clearbit.com/unionbankofindia.co.in', color: '#005BAC' },
    { code: 'indian', name: 'Indian Bank', logo: 'https://logo.clearbit.com/indianbank.in', color: '#0073CF' },
    { code: 'central', name: 'Central Bank of India', logo: 'https://logo.clearbit.com/centralbankofindia.co.in', color: '#EE3124' },
    { code: 'boi', name: 'Bank of India', logo: 'https://logo.clearbit.com/bankofindia.co.in', color: '#00529B' },
    { code: 'iob', name: 'Indian Overseas Bank', logo: 'https://logo.clearbit.com/iob.in', color: '#003768' },
    { code: 'idbi', name: 'IDBI Bank', logo: 'https://logo.clearbit.com/idbibank.in', color: '#00529B' },
    { code: 'yes', name: 'Yes Bank', logo: 'https://logo.clearbit.com/yesbank.in', color: '#00518F' },
    { code: 'indusind', name: 'IndusInd Bank', logo: 'https://logo.clearbit.com/indusind.com', color: '#880A1F' },
    { code: 'federal', name: 'Federal Bank', logo: 'https://logo.clearbit.com/federalbank.co.in', color: '#0066B3' },
    { code: 'scin', name: 'Standard Chartered India', logo: 'https://logo.clearbit.com/sc.com', color: '#0072AA' },
    { code: 'hsbc_in', name: 'HSBC India', logo: 'https://logo.clearbit.com/hsbc.co.in', color: '#DB0011' },
  ],
  
  // Pakistan Banks (12+ major banks)
  PK: [
    { code: 'hbl', name: 'Habib Bank Limited', logo: 'https://logo.clearbit.com/hbl.com', color: '#00843D' },
    { code: 'ubl', name: 'United Bank Limited', logo: 'https://logo.clearbit.com/ubl.com.pk', color: '#003366' },
    { code: 'mcb', name: 'MCB Bank', logo: 'https://logo.clearbit.com/mcb.com.pk', color: '#00529B' },
    { code: 'allied', name: 'Allied Bank', logo: 'https://logo.clearbit.com/abl.com', color: '#00843D' },
    { code: 'alfalah', name: 'Bank Alfalah', logo: 'https://logo.clearbit.com/bankalfalah.com', color: '#E31837' },
    { code: 'nbp', name: 'National Bank of Pakistan', logo: 'https://logo.clearbit.com/nbp.com.pk', color: '#003366' },
    { code: 'scpk', name: 'Standard Chartered PK', logo: 'https://logo.clearbit.com/sc.com', color: '#0072AA' },
    { code: 'meezan', name: 'Meezan Bank', logo: 'https://logo.clearbit.com/meezanbank.com', color: '#00843D' },
    { code: 'faysal', name: 'Faysal Bank', logo: 'https://logo.clearbit.com/faysalbank.com', color: '#00529B' },
    { code: 'askari', name: 'Askari Bank', logo: 'https://logo.clearbit.com/askaribank.com.pk', color: '#00843D' },
    { code: 'alhabib', name: 'Bank Al Habib', logo: 'https://logo.clearbit.com/bankalhabib.com', color: '#00529B' },
    { code: 'hmetro', name: 'Habib Metropolitan Bank', logo: 'https://logo.clearbit.com/hmb.com.pk', color: '#003366' },
    { code: 'silkbank', name: 'Silk Bank', logo: 'https://logo.clearbit.com/silkbank.com.pk', color: '#8B0000' },
    { code: 'jsbank', name: 'JS Bank', logo: 'https://logo.clearbit.com/jsbl.com', color: '#003366' },
  ],
  
  // Global/International Banks
  DEFAULT: [
    { code: 'wise', name: 'Wise (TransferWise)', logo: 'https://logo.clearbit.com/wise.com', color: '#9FE870' },
    { code: 'payoneer', name: 'Payoneer', logo: 'https://logo.clearbit.com/payoneer.com', color: '#FF4800' },
    { code: 'wellsfargo', name: 'Wells Fargo', logo: 'https://logo.clearbit.com/wellsfargo.com', color: '#D71E28' },
    { code: 'chase', name: 'Chase', logo: 'https://logo.clearbit.com/chase.com', color: '#117ACA' },
    { code: 'bofa', name: 'Bank of America', logo: 'https://logo.clearbit.com/bankofamerica.com', color: '#012169' },
    { code: 'barclays', name: 'Barclays', logo: 'https://logo.clearbit.com/barclays.co.uk', color: '#00AEEF' },
    { code: 'hsbc', name: 'HSBC', logo: 'https://logo.clearbit.com/hsbc.com', color: '#DB0011' },
    { code: 'citi', name: 'Citibank', logo: 'https://logo.clearbit.com/citi.com', color: '#003B70' },
  ]
};

// Country-based digital wallets with official branding
export const DIGITAL_WALLETS: Record<string, DigitalWallet[]> = {
  // Bangladesh
  BD: [
    {
      code: 'bkash',
      label: 'bKash',
      logo: 'https://www.logo.wine/a/logo/BKash/BKash-Icon-Logo.wine.svg',
      color: '#E2136E',
      bgColor: 'bg-pink-50',
      inputLabel: 'bKash Number',
      placeholder: '01XXXXXXXXX'
    },
    {
      code: 'nagad',
      label: 'Nagad',
      logo: 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png',
      color: '#F6A623',
      bgColor: 'bg-orange-50',
      inputLabel: 'Nagad Number',
      placeholder: '01XXXXXXXXX'
    },
    {
      code: 'rocket',
      label: 'Rocket',
      logo: 'https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1CC458D-seeklogo.com.png',
      color: '#8B2F89',
      bgColor: 'bg-purple-50',
      inputLabel: 'Rocket Number',
      placeholder: '01XXXXXXXXX'
    },
    {
      code: 'upay',
      label: 'Upay',
      logo: 'https://play-lh.googleusercontent.com/1dUGBb2e8I-lVPz8ydFJNzLYfVMC5CWvYQvSvZk_dS6GrYlB2Vv1BKBVpSG7vb_M1g',
      color: '#EE3524',
      bgColor: 'bg-red-50',
      inputLabel: 'Upay Number',
      placeholder: '01XXXXXXXXX'
    }
  ],
  
  // India
  IN: [
    {
      code: 'phonepe',
      label: 'PhonePe',
      logo: 'https://download.logo.wine/logo/PhonePe/PhonePe-Logo.wine.png',
      color: '#5F259F',
      bgColor: 'bg-indigo-50',
      inputLabel: 'PhonePe Number / UPI ID',
      placeholder: 'name@ybl or 9XXXXXXXXX'
    },
    {
      code: 'gpay',
      label: 'Google Pay',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png',
      color: '#4285F4',
      bgColor: 'bg-blue-50',
      inputLabel: 'UPI ID / Phone Number',
      placeholder: 'name@okaxis or 9XXXXXXXXX'
    },
    {
      code: 'paytm',
      label: 'Paytm',
      logo: 'https://download.logo.wine/logo/Paytm/Paytm-Logo.wine.png',
      color: '#00BAF2',
      bgColor: 'bg-cyan-50',
      inputLabel: 'Paytm Number / UPI ID',
      placeholder: 'name@paytm or 9XXXXXXXXX'
    },
    {
      code: 'amazonpay',
      label: 'Amazon Pay',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Amazon_Pay_logo.svg/512px-Amazon_Pay_logo.svg.png',
      color: '#FF9900',
      bgColor: 'bg-amber-50',
      inputLabel: 'Amazon Pay UPI ID',
      placeholder: 'name@apl or 9XXXXXXXXX'
    }
  ],
  
  // Pakistan
  PK: [
    {
      code: 'jazzcash',
      label: 'JazzCash',
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9c/JazzCash_logo.png/220px-JazzCash_logo.png',
      color: '#ED1C24',
      bgColor: 'bg-red-50',
      inputLabel: 'JazzCash Number',
      placeholder: '03XXXXXXXXX'
    },
    {
      code: 'easypaisa',
      label: 'Easypaisa',
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c8/Easypaisa.svg/220px-Easypaisa.svg.png',
      color: '#00A651',
      bgColor: 'bg-green-50',
      inputLabel: 'Easypaisa Number',
      placeholder: '03XXXXXXXXX'
    },
    {
      code: 'nayapay',
      label: 'NayaPay',
      logo: 'https://play-lh.googleusercontent.com/8ZMYzPvPl8_s8lnSbMVXvDrGpMqJvS_NXKqXu5HhJYqVxKZLvJr8YQ_QnFXKQC3Bsg',
      color: '#6366F1',
      bgColor: 'bg-violet-50',
      inputLabel: 'NayaPay Number',
      placeholder: '03XXXXXXXXX'
    },
    {
      code: 'sadapay',
      label: 'SadaPay',
      logo: 'https://play-lh.googleusercontent.com/tHlNKj-_4EZzL-4EJdCJTNfYYMq7WQCPvh8qcE6kGQfvSEuLpDpLqFsqKJeP_RFq3w',
      color: '#000000',
      bgColor: 'bg-gray-50',
      inputLabel: 'SadaPay Number',
      placeholder: '03XXXXXXXXX'
    }
  ],
  
  // Default / Global
  DEFAULT: [
    {
      code: 'wise',
      label: 'Wise',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Wise_logo.svg/512px-Wise_logo.svg.png',
      color: '#9FE870',
      bgColor: 'bg-lime-50',
      inputLabel: 'Email / Account ID',
      placeholder: 'your@email.com'
    },
    {
      code: 'payoneer',
      label: 'Payoneer',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Payoneer_logo.svg/512px-Payoneer_logo.svg.png',
      color: '#FF4800',
      bgColor: 'bg-orange-50',
      inputLabel: 'Payoneer Email',
      placeholder: 'your@email.com'
    },
    {
      code: 'skrill',
      label: 'Skrill',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Skrill_logo.svg/512px-Skrill_logo.svg.png',
      color: '#8B3FFD',
      bgColor: 'bg-purple-50',
      inputLabel: 'Skrill Email',
      placeholder: 'your@email.com'
    },
    {
      code: 'paypal',
      label: 'PayPal',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/512px-PayPal.svg.png',
      color: '#003087',
      bgColor: 'bg-blue-50',
      inputLabel: 'PayPal Email',
      placeholder: 'your@email.com'
    }
  ]
};

// Helper function to get countries sorted by position
export const getSortedCountries = (): Country[] => {
  return [...SUPPORTED_COUNTRIES].sort((a, b) => a.position - b.position);
};

// Helper function to get banks for a country
export const getBanksForCountry = (countryCode: string): Bank[] => {
  return COUNTRY_BANKS[countryCode] || COUNTRY_BANKS.DEFAULT;
};

// Helper to get bank by code
export const getBankByCode = (countryCode: string, bankCode: string): Bank | undefined => {
  const banks = getBanksForCountry(countryCode);
  return banks.find(b => b.code === bankCode);
};

// Helper function to get wallets for a country
export const getDigitalWalletsForCountry = (countryCode: string): DigitalWallet[] => {
  return DIGITAL_WALLETS[countryCode] || DIGITAL_WALLETS.DEFAULT;
};

// Helper to get wallet by code
export const getWalletByCode = (code: string): DigitalWallet | undefined => {
  for (const wallets of Object.values(DIGITAL_WALLETS)) {
    const wallet = wallets.find(w => w.code === code);
    if (wallet) return wallet;
  }
  return undefined;
};

// Check if a code is a digital wallet
export const isDigitalWalletCode = (code: string): boolean => {
  return !!getWalletByCode(code);
};

// Check if a code is a bank
export const isBankCode = (code: string): boolean => {
  for (const banks of Object.values(COUNTRY_BANKS)) {
    if (banks.some(b => b.code === code)) return true;
  }
  return false;
};

// Get country name
export const COUNTRY_NAMES: Record<string, string> = {
  BD: 'Bangladesh',
  IN: 'India',
  PK: 'Pakistan',
  DEFAULT: 'International'
};

export const getCountryName = (countryCode: string): string => {
  return COUNTRY_NAMES[countryCode] || COUNTRY_NAMES.DEFAULT;
};

// Get country by code
export const getCountryByCode = (code: string): Country | undefined => {
  return SUPPORTED_COUNTRIES.find(c => c.code === code);
};
