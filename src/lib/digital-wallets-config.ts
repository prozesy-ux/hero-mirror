/**
 * Digital Wallets Configuration
 * Country-based digital wallet support with official branding
 */

export type AccountType = 'bank' | 'digital_wallet' | 'crypto';

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
    }
  ]
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

// Get country name
export const COUNTRY_NAMES: Record<string, string> = {
  BD: 'Bangladesh',
  IN: 'India',
  PK: 'Pakistan',
  DEFAULT: 'Global'
};

export const getCountryName = (countryCode: string): string => {
  return COUNTRY_NAMES[countryCode] || COUNTRY_NAMES.DEFAULT;
};
