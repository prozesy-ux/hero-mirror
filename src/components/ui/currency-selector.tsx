import { useCurrency } from '@/contexts/CurrencyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

interface CurrencySelectorProps {
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

export const CurrencySelector = ({ variant = 'default', className = '' }: CurrencySelectorProps) => {
  const { selectedCurrency, setSelectedCurrency, currencies, loading } = useCurrency();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl animate-pulse ${className}`}>
        <div className="h-4 w-4 bg-slate-200 rounded" />
        <div className="h-4 w-10 bg-slate-200 rounded" />
      </div>
    );
  }

  const currentCurrency = currencies.find(c => c.code === selectedCurrency);

  if (variant === 'minimal') {
    return (
      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
        <SelectTrigger className={`w-auto gap-1.5 bg-white border-slate-200 rounded-xl h-9 px-3 text-sm ${className}`}>
          <Globe className="h-3.5 w-3.5 text-slate-500" />
          <SelectValue>
            <span className="font-medium">{currentCurrency?.symbol}</span>
            <span className="text-slate-500 ml-1">{selectedCurrency}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white min-w-[180px]">
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code} className="cursor-pointer">
              <div className="flex items-center justify-between w-full gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base">{currency.symbol}</span>
                  <span className="text-slate-700">{currency.code}</span>
                </div>
                {currency.code !== 'USD' && (
                  <span className="text-xs text-slate-400">1$ = {currency.rate}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'compact') {
    return (
      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
        <SelectTrigger className={`w-auto gap-1 bg-slate-50 border-slate-100 rounded-lg h-8 px-2 text-xs ${className}`}>
          <span className="font-bold">{currentCurrency?.symbol}</span>
          <span className="text-slate-500">{selectedCurrency}</span>
        </SelectTrigger>
        <SelectContent className="bg-white min-w-[160px]">
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code} className="cursor-pointer text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{currency.symbol}</span>
                <span>{currency.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Default variant
  return (
    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
      <SelectTrigger className={`w-[140px] bg-white border-slate-200 rounded-xl h-10 ${className}`}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-slate-500" />
          <SelectValue>
            <span className="font-semibold">{currentCurrency?.symbol}</span>
            <span className="text-slate-500 ml-1">{selectedCurrency}</span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-white">
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code} className="cursor-pointer">
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{currency.symbol}</span>
                <div>
                  <p className="font-medium">{currency.code}</p>
                  <p className="text-xs text-slate-500">{currency.name}</p>
                </div>
              </div>
              {currency.code !== 'USD' && (
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  1$ = {currency.rate}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector;
