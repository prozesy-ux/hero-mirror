import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  rate: number;
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

const DEFAULT_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 91 },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rate: 121 },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', rate: 290 }
];

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'IN': 'INR',
  'BD': 'BDT',
  'PK': 'PKR',
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
