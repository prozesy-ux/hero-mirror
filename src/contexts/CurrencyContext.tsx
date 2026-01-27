import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  rate: number;
  flag: string;
  priority: number; // Lower = higher priority (shown first)
}

interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (code: string) => void;
  currencies: CurrencyOption[];
  formatAmount: (usdAmount: number, showOriginal?: boolean) => string;
  formatAmountOnly: (usdAmount: number) => string;
  convertToLocal: (usdAmount: number) => number;
  loading: boolean;
}

// 20+ currencies sorted by freelancer country popularity
const DEFAULT_CURRENCIES: CurrencyOption[] = [
  // TOP TIER - Most freelancer countries (priority 1)
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1, flag: '🇺🇸', priority: 1 },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rate: 121, flag: '🇧🇩', priority: 2 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83, flag: '🇮🇳', priority: 3 },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', rate: 278, flag: '🇵🇰', priority: 4 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, flag: '🇬🇧', priority: 5 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36, flag: '🇨🇦', priority: 6 },
  
  // SECOND TIER - Major markets (priority 10+)
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, flag: '🇪🇺', priority: 10 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53, flag: '🇦🇺', priority: 11 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.67, flag: '🇦🇪', priority: 12 },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', rate: 3.75, flag: '🇸🇦', priority: 13 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1550, flag: '🇳🇬', priority: 14 },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', rate: 56, flag: '🇵🇭', priority: 15 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 15800, flag: '🇮🇩', priority: 16 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 4.5, flag: '🇲🇾', priority: 17 },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', rate: 24500, flag: '🇻🇳', priority: 18 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 35, flag: '🇹🇭', priority: 19 },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', rate: 49, flag: '🇪🇬', priority: 20 },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rate: 152, flag: '🇰🇪', priority: 21 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 18, flag: '🇿🇦', priority: 22 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 5.1, flag: '🇧🇷', priority: 23 },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', rate: 17, flag: '🇲🇽', priority: 24 },
  { code: 'NPR', symbol: 'रू', name: 'Nepalese Rupee', rate: 133, flag: '🇳🇵', priority: 25 },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', rate: 325, flag: '🇱🇰', priority: 26 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149, flag: '🇯🇵', priority: 27 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 1320, flag: '🇰🇷', priority: 28 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.34, flag: '🇸🇬', priority: 29 },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', rate: 0.88, flag: '🇨🇭', priority: 30 },
];

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'BD': 'BDT',
  'IN': 'INR',
  'PK': 'PKR',
  'GB': 'GBP',
  'CA': 'CAD',
  'AU': 'AUD',
  'AE': 'AED',
  'SA': 'SAR',
  'NG': 'NGN',
  'PH': 'PHP',
  'ID': 'IDR',
  'MY': 'MYR',
  'VN': 'VND',
  'TH': 'THB',
  'EG': 'EGP',
  'KE': 'KES',
  'ZA': 'ZAR',
  'BR': 'BRL',
  'MX': 'MXN',
  'NP': 'NPR',
  'LK': 'LKR',
  'JP': 'JPY',
  'KR': 'KRW',
  'SG': 'SGD',
  'CH': 'CHF',
  'DEFAULT': 'USD'
};

const STORAGE_KEY = 'seller_display_currency';

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const CurrencyProvider = ({ 
  children,
  sellerCountry
}: { 
  children: ReactNode;
  sellerCountry?: string;
}) => {
  const [currencies, setCurrencies] = useState<CurrencyOption[]>(DEFAULT_CURRENCIES);
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>('USD');
  const [loading, setLoading] = useState(true);

  // Fetch exchange rates from payment_methods table
  const fetchExchangeRates = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('payment_methods')
        .select('currency_code, exchange_rate')
        .eq('is_enabled', true);

      if (data && data.length > 0) {
        const updatedCurrencies = DEFAULT_CURRENCIES.map(currency => {
          const method = data.find(m => m.currency_code === currency.code);
          return {
            ...currency,
            rate: method?.exchange_rate || currency.rate
          };
        });
        // Sort by priority
        updatedCurrencies.sort((a, b) => a.priority - b.priority);
        setCurrencies(updatedCurrencies);
      }
    } catch (error) {
      console.error('[CurrencyContext] Failed to fetch rates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize currency from localStorage or country
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && DEFAULT_CURRENCIES.some(c => c.code === stored)) {
      setSelectedCurrencyState(stored);
    } else if (sellerCountry) {
      const defaultCurrency = COUNTRY_CURRENCY_MAP[sellerCountry] || COUNTRY_CURRENCY_MAP.DEFAULT;
      setSelectedCurrencyState(defaultCurrency);
    }
    
    fetchExchangeRates();
  }, [sellerCountry, fetchExchangeRates]);

  // Persist selection
  const setSelectedCurrency = useCallback((code: string) => {
    setSelectedCurrencyState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  // Get current currency details
  const getCurrentCurrency = useCallback(() => {
    return currencies.find(c => c.code === selectedCurrency) || currencies[0];
  }, [currencies, selectedCurrency]);

  // Format amount with currency symbol
  const formatAmount = useCallback((usdAmount: number, showOriginal = false): string => {
    const currency = getCurrentCurrency();
    const converted = usdAmount * currency.rate;
    
    let formatted: string;
    if (currency.code === 'USD') {
      formatted = `${currency.symbol}${converted.toFixed(2)}`;
    } else {
      formatted = `${currency.symbol}${Math.round(converted).toLocaleString()}`;
    }
    
    if (showOriginal && currency.code !== 'USD') {
      formatted += ` (~$${usdAmount.toFixed(2)})`;
    }
    
    return formatted;
  }, [getCurrentCurrency]);

  // Format amount only (no original)
  const formatAmountOnly = useCallback((usdAmount: number): string => {
    const currency = getCurrentCurrency();
    const converted = usdAmount * currency.rate;
    
    if (currency.code === 'USD') {
      return `${currency.symbol}${converted.toFixed(2)}`;
    }
    return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
  }, [getCurrentCurrency]);

  // Convert to local amount
  const convertToLocal = useCallback((usdAmount: number): number => {
    const currency = getCurrentCurrency();
    return usdAmount * currency.rate;
  }, [getCurrentCurrency]);

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      setSelectedCurrency,
      currencies,
      formatAmount,
      formatAmountOnly,
      convertToLocal,
      loading
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
